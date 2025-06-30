document.addEventListener('DOMContentLoaded', function() {
    const containers = document.querySelectorAll('.pdf-frame-container');

    containers.forEach(container => {
        const pdfUrl = container.querySelector('.pdf-url').value;
        const viewMode = container.getAttribute('data-view-mode') || 'horizontal';
        const viewToggles = container.querySelectorAll('.view-toggle');
        const splitView = container.querySelector('.pdf-split-view');
        const pane1 = splitView.querySelector('.pane-1');
        const pane2 = splitView.querySelector('.pane-2');
        const resizer = splitView.querySelector('.resizer');

        // Remove flex: 1 from panes (must be done in CSS as well!)
        pane1.style.flex = 'none';
        pane2.style.flex = 'none';

        // Set initial view mode
        splitView.classList.remove('horizontal', 'vertical');
        splitView.classList.add(viewMode);

        // --- RESIZABLE SPLIT PANE LOGIC ---
        let isHorizontal = splitView.classList.contains('horizontal');
        let isDragging = false;

        function setInitialSizes() {
            if (isHorizontal) {
                pane1.style.width = '50%';
                pane2.style.width = '50%';
                pane1.style.height = '';
                pane2.style.height = '';
                resizer.style.left = '50%';
                resizer.style.top = 0;
                resizer.style.bottom = 0;
                resizer.style.width = '8px';
                resizer.style.height = '';
            } else {
                pane1.style.height = '50%';
                pane2.style.height = '50%';
                pane1.style.width = '';
                pane2.style.width = '';
                resizer.style.top = '50%';
                resizer.style.left = 0;
                resizer.style.right = 0;
                resizer.style.height = '8px';
                resizer.style.width = '';
            }
        }
        setInitialSizes();

        // Listen for mode changes (if user toggles view)
        const observer = new MutationObserver(function() {
            isHorizontal = splitView.classList.contains('horizontal');
            setInitialSizes();
        });
        observer.observe(splitView, { attributes: true, attributeFilter: ['class'] });

        resizer.addEventListener('mousedown', function(e) {
            e.preventDefault();
            isDragging = true;
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            const rect = splitView.getBoundingClientRect();
            if (isHorizontal) {
                let offsetX = e.clientX - rect.left;
                let min = rect.width * 0.1;
                let max = rect.width * 0.9;
                offsetX = Math.max(min, Math.min(max, offsetX));
                let percent = (offsetX / rect.width) * 100;
                pane1.style.width = percent + '%';
                pane2.style.width = (100 - percent) + '%';
                resizer.style.left = percent + '%';
            } else {
                let offsetY = e.clientY - rect.top;
                let min = rect.height * 0.1;
                let max = rect.height * 0.9;
                offsetY = Math.max(min, Math.min(max, offsetY));
                let percent = (offsetY / rect.height) * 100;
                pane1.style.height = percent + '%';
                pane2.style.height = (100 - percent) + '%';
                resizer.style.top = percent + '%';
            }
        });

        document.addEventListener('mouseup', function() {
            if (isDragging) {
                isDragging = false;
                document.body.style.userSelect = '';
            }
        });

        // View mode toggling
        viewToggles.forEach(button => {
            button.addEventListener('click', () => {
                const mode = button.getAttribute('data-mode');
                splitView.classList.remove('horizontal', 'vertical');
                splitView.classList.add(mode);
                isHorizontal = (mode === 'horizontal');
                setInitialSizes();
            });
        });

        // --- FRONTEND PDF SEARCH AND LOAD ---
        const urlInput = container.querySelector('#pdf-input-url');
        const loadButton = container.querySelector('#pdf-load-button');
        const errorDiv = container.querySelector('#pdf-url-error');
        const searchInput = container.querySelector('#pdf-search-input');
        const searchResults = container.querySelector('#pdf-search-results');

        function loadNewPDF(url) {
            const leftViewer = container.querySelector('.pane-1 .pdf-viewer-container');
            const rightViewer = container.querySelector('.pane-2 .pdf-viewer-container');
            if (errorDiv) errorDiv.style.display = 'none';

            // Show loading indicators
            const loadingMsg = '<div style="text-align:center;padding:20px;">Loading PDF...</div>';
            leftViewer.innerHTML = loadingMsg;
            rightViewer.innerHTML = loadingMsg;

            const pdfjsLib = window['pdfjs-dist/build/pdf'];
            pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_FRAME_VIEWER.pluginUrl + 'lib/pdfjs/build/pdf.worker.js';

            pdfjsLib.getDocument(url).promise.then(function(pdfDoc) {
                const leftToolbar = container.querySelector('.pane-1 .pdf-toolbar');
                const rightToolbar = container.querySelector('.pane-2 .pdf-toolbar');
                renderAllPages(pdfDoc, leftViewer, leftToolbar);
                renderAllPages(pdfDoc, rightViewer, rightToolbar);
                container.querySelector('.pdf-url').value = url;
            }).catch(function(error) {
                console.error("PDF load error:", error);
                leftViewer.innerHTML = `<p>Error loading PDF: ${error.message}</p>`;
                rightViewer.innerHTML = `<p>Error loading PDF: ${error.message}</p>`;
                if (errorDiv) errorDiv.style.display = 'block';
            });
        }

        if (loadButton && urlInput) {
            loadButton.addEventListener('click', function() {
                const url = urlInput.value.trim();
                if (url.match(/\.pdf(\?.*)?$/i)) {
                    if (errorDiv) errorDiv.style.display = 'none';
                    loadNewPDF(url);
                } else {
                    if (errorDiv) errorDiv.style.display = 'block';
                }
            });
            urlInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    loadButton.click();
                }
            });
        }

        // --- AJAX Search Logic ---
        if (searchInput && searchResults) {
            searchInput.addEventListener('focus', () => {
                searchResults.style.display = 'block';
            });

            document.addEventListener('click', (e) => {
                if (!container.querySelector('.pdf-media-library-select').contains(e.target)) {
                    searchResults.style.display = 'none';
                }
            });

            searchInput.addEventListener('keyup', function() {
                const searchTerm = this.value.trim();

                const data = new FormData();
                data.append('action', 'search_pdfs');
                data.append('nonce', PDF_FRAME_VIEWER.nonce);
                data.append('search_term', searchTerm);

                fetch(PDF_FRAME_VIEWER.ajaxUrl, {
                    method: 'POST',
                    body: data
                })
                .then(response => response.json())
                .then(response => {
                    if (response.success) {
                        renderSearchResults(response.data);
                    } else {
                        searchResults.innerHTML = '<div class="pdf-search-result-item">Error searching.</div>';
                    }
                });
            });

            searchResults.addEventListener('click', function(e) {
                const item = e.target.closest('.pdf-search-result-item');
                if (item && item.dataset.url) {
                    const url = item.dataset.url;
                    urlInput.value = url;
                    loadNewPDF(url);
                    searchResults.style.display = 'none';
                }
            });
        }

        function renderSearchResults(pdfs) {
            searchResults.innerHTML = ''; // Clear previous results
            const header = '<div class="pdf-search-results-header"><span class="result-name">Name</span><span class="result-date">Uploaded</span></div>';
            searchResults.insertAdjacentHTML('beforeend', header);

            if (pdfs && pdfs.length > 0) {
                pdfs.forEach(pdf => {
                    const item = document.createElement('div');
                    item.className = 'pdf-search-result-item';
                    item.dataset.url = pdf.url;
                    item.innerHTML = `
                        <span class="result-name">${pdf.title}</span>
                        <span class="result-date">${pdf.date}</span>
                    `;
                    searchResults.appendChild(item);
                });
            } else {
                searchResults.innerHTML += '<div class="pdf-search-result-item">No PDFs found.</div>';
            }
        }

        // --- PDF RENDERING AND PAGINATION ---
        function renderAllPages(pdfDoc, viewerContainer, toolbarElem) {
            viewerContainer.innerHTML = '';
            let scale = 1;
            let pageCanvases = [];
            let pageWrappers = [];
            let totalPages = pdfDoc.numPages;

            // Helper to update current page number based on scroll
            function updateCurrentPageDisplay() {
                let scrollTop = viewerContainer.scrollTop;
                let bestIdx = 0;
                let minDist = Infinity;
                pageWrappers.forEach((wrapper, idx) => {
                    let dist = Math.abs(wrapper.getBoundingClientRect().top - viewerContainer.getBoundingClientRect().top);
                    if (dist < minDist) {
                        minDist = dist;
                        bestIdx = idx;
                    }
                });
                if (toolbarElem && toolbarElem.querySelector('.current-page')) {
                    toolbarElem.querySelector('.current-page').textContent = bestIdx + 1;
                }
            }

            // Render all pages and build arrays
            let renderPromises = [];
            for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                renderPromises.push(
                    pdfDoc.getPage(pageNum).then(function(page) {
                        let viewport = page.getViewport({ scale: scale });

                        let pageWrapper = document.createElement('div');
                        pageWrapper.className = 'pdf-page-wrapper';
                        pageWrapper.style.position = 'relative';
                        pageWrapper.style.width = viewport.width + 'px';
                        pageWrapper.style.height = viewport.height + 'px';

                        let canvas = document.createElement('canvas');
                        canvas.className = 'pdf-page-canvas';
                        canvas.width = viewport.width;
                        canvas.height = viewport.height;
                        pageWrapper.appendChild(canvas);

                        pageWrappers[pageNum - 1] = pageWrapper;
                        pageCanvases[pageNum - 1] = canvas;

                        page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport });

                        page.getAnnotations().then(function(annotations) {
                            annotations.forEach(function(annotation) {
                                if (annotation.subtype === 'Link') {
                                    let rect = pdfjsLib.Util.normalizeRect(annotation.rect);
                                    let x = rect[0];
                                    let y = viewport.height - rect[3];
                                    let width = rect[2] - rect[0];
                                    let height = rect[3] - rect[1];

                                    let link = document.createElement('a');
                                    link.className = 'pdf-link-annotation';
                                    link.style.left = x + 'px';
                                    link.style.top = y + 'px';
                                    link.style.width = width + 'px';
                                    link.style.height = height + 'px';
                                    link.style.display = 'block';

                                    if (annotation.url) {
                                        link.href = annotation.url;
                                        link.target = '_blank';
                                    } else if (annotation.dest) {
                                        link.href = '#';
                                        link.onclick = function(e) {
                                            e.preventDefault();
                                            let rightPane = viewerContainer.closest('.pdf-frame-container').querySelector('.pane-2 .pdf-viewer-container');
                                            let rightWrappers = Array.from(rightPane.querySelectorAll('.pdf-page-wrapper'));
                                            pdfDoc.getDestination(annotation.dest).then(function(dest) {
                                                pdfDoc.getPageIndex(dest[0]).then(function(pageIndex) {
                                                    scrollToPage(rightPane, rightWrappers, pageIndex + 1);
                                                });
                                            });
                                        };
                                    }
                                    pageWrapper.appendChild(link);
                                }
                            });
                        });

                        viewerContainer.appendChild(pageWrapper);
                    })
                );
            }

            // After all pages are rendered, set up controls
            Promise.all(renderPromises).then(function() {
                if (toolbarElem && toolbarElem.querySelector('.total-pages')) {
                    toolbarElem.querySelector('.total-pages').textContent = totalPages;
                }
                if (toolbarElem && toolbarElem.querySelector('.current-page')) {
                    toolbarElem.querySelector('.current-page').textContent = 1;
                }

                // Navigation controls
                if (toolbarElem) {
                    const prevBtn = toolbarElem.querySelector('.prev-page');
                    const nextBtn = toolbarElem.querySelector('.next-page');
                    const zoomInBtn = toolbarElem.querySelector('.zoom-in');
                    const zoomOutBtn = toolbarElem.querySelector('.zoom-out');
                    const fitPageBtn = toolbarElem.querySelector('.fit-page');
                    const fitWidthBtn = toolbarElem.querySelector('.fit-width');

                    function scrollToPageNum(pageNum) {
                        if (pageWrappers[pageNum - 1]) {
                            viewerContainer.scrollTo({
                                top: pageWrappers[pageNum - 1].offsetTop,
                                behavior: 'smooth'
                            });
                        }
                    }

                    if (prevBtn) prevBtn.onclick = function() {
                        let current = parseInt(toolbarElem.querySelector('.current-page').textContent, 10);
                        if (current > 1) scrollToPageNum(current - 1);
                    };
                    if (nextBtn) nextBtn.onclick = function() {
                        let current = parseInt(toolbarElem.querySelector('.current-page').textContent, 10);
                        if (current < totalPages) scrollToPageNum(current + 1);
                    };
                    if (zoomInBtn) zoomInBtn.onclick = function() {
                        scale *= 1.1;
                        rerenderAllPages(pdfDoc, pageCanvases, pageWrappers, scale);
                    };
                    if (zoomOutBtn) zoomOutBtn.onclick = function() {
                        scale /= 1.1;
                        rerenderAllPages(pdfDoc, pageCanvases, pageWrappers, scale);
                    };
                    if (fitPageBtn) fitPageBtn.onclick = function() {
                        let containerStyle = window.getComputedStyle(viewerContainer);
                        let paddingTop = parseFloat(containerStyle.paddingTop);
                        let paddingBottom = parseFloat(containerStyle.paddingBottom);
                        let containerHeight = viewerContainer.clientHeight - paddingTop - paddingBottom;
                        pdfDoc.getPage(1).then(function(page) {
                            let viewport = page.getViewport({ scale: 1 });
                            scale = containerHeight / viewport.height;
                            rerenderAllPages(pdfDoc, pageCanvases, pageWrappers, scale);
                        });
                    };
                    if (fitWidthBtn) fitWidthBtn.onclick = function() {
                        let containerStyle = window.getComputedStyle(viewerContainer);
                        let paddingLeft = parseFloat(containerStyle.paddingLeft);
                        let paddingRight = parseFloat(containerStyle.paddingRight);
                        let containerWidth = viewerContainer.clientWidth - paddingLeft - paddingRight;
                        pdfDoc.getPage(1).then(function(page) {
                            let viewport = page.getViewport({ scale: 1 });
                            scale = containerWidth / viewport.width;
                            rerenderAllPages(pdfDoc, pageCanvases, pageWrappers, scale);
                        });
                    };
                }

                // Update current page display on scroll
                viewerContainer.onscroll = updateCurrentPageDisplay;
                updateCurrentPageDisplay();
            });
        }

        // Helper for rerendering all pages at a new scale
        function rerenderAllPages(pdfDoc, canvases, pageWrappers, scale) {
            canvases.forEach((canvas, idx) => {
                pdfDoc.getPage(idx + 1).then(function(page) {
                    let viewport = page.getViewport({ scale: scale });
                    let wrapper = pageWrappers[idx];

                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    wrapper.style.width = viewport.width + 'px';
                    wrapper.style.height = viewport.height + 'px';

                    page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport });
                });
            });
        }

        // Helper for scrolling to a page
        function scrollToPage(viewerContainer, wrappers, pageNum) {
            if (wrappers[pageNum - 1]) {
                viewerContainer.scrollTo({
                    top: wrappers[pageNum - 1].offsetTop,
                    behavior: 'smooth'
                });
            }
        }

        // Load initial PDF
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_FRAME_VIEWER.pluginUrl + 'lib/pdfjs/build/pdf.worker.js';

        if (pdfUrl) {
            pdfjsLib.getDocument(pdfUrl).promise.then(function(pdfDoc) {
                let leftPane = container.querySelector('.pane-1');
                let leftViewer = leftPane.querySelector('.pdf-viewer-container');
                let leftToolbar = leftPane.querySelector('.pdf-toolbar');
                renderAllPages(pdfDoc, leftViewer, leftToolbar);

                let rightPane = container.querySelector('.pane-2');
                let rightViewer = rightPane.querySelector('.pdf-viewer-container');
                let rightToolbar = rightPane.querySelector('.pdf-toolbar');
                renderAllPages(pdfDoc, rightViewer, rightToolbar);
            }).catch(function(error) {
                console.error("PDF load error:", error);
                container.querySelector('.pane-1 .pdf-viewer-container').innerHTML = `<p>Error loading PDF: ${error.message}</p>`;
                container.querySelector('.pane-2 .pdf-viewer-container').innerHTML = `<p>Error loading PDF: ${error.message}</p>`;
            });
        }
    });
});