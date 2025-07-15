jQuery(function($){
    function open_pdf_modal(callback) {
        var frame = wp.media({
            title: 'Select or Upload PDF',
            button: { text: 'Use this PDF' },
            library: { type: 'application/pdf' },
            multiple: false
        });
        frame.on('select', function() {
            var attachment = frame.state().get('selection').first().toJSON();
            var secure_url = attachment.url.replace(/^http:\/\//i, 'https://');
            callback(secure_url);
        });
        frame.open();
    }

    function prompt_split_mode(callback) {
        var mode = window.prompt('Enter split mode: "horizontal" or "vertical"', 'horizontal');
        if (mode && (mode === 'horizontal' || mode === 'vertical')) {
            callback(mode);
        } else if (mode !== null) {
            alert('Please enter "horizontal" or "vertical".');
            prompt_split_mode(callback);
        }
    }

    // For Classic Editor
    $('#insert-split-view-pdf').on('click', function(e){
        e.preventDefault();
        open_pdf_modal(function(pdf_url){
            prompt_split_mode(function(mode){
                var shortcode = '[pdf_frame_viewer url="' + pdf_url + '" mode="' + mode + '"]';
                if (typeof window.tinymce !== 'undefined' && tinymce.activeEditor) {
                    tinymce.activeEditor.execCommand('mceInsertContent', false, shortcode);
                } else {
                    // Fallback for plain textarea
                    var $textarea = $('#content');
                    var val = $textarea.val();
                    $textarea.val(val + '\n' + shortcode);
                }
            });
        });
    });

    // For Block Editor (Gutenberg)
    if (typeof wp !== 'undefined' && wp.data) {
        // Insert button above block editor
        if (!$('#insert-split-view-pdf').length) {
            var $btn = $('<button type="button" class="components-button is-secondary" id="insert-split-view-pdf" style="margin:10px 0;">Add Split View PDF</button>');
            $('.edit-post-header-toolbar').append($btn);
            $btn.on('click', function(e){
                e.preventDefault();
                open_pdf_modal(function(pdf_url){
                    prompt_split_mode(function(mode){
                        var shortcode = '[pdf_frame_viewer url="' + pdf_url + '" mode="' + mode + '"]';
                        wp.data.dispatch('core/editor').insertBlocks(wp.blocks.createBlock('core/shortcode', { text: shortcode }));
                    });
                });
            });
        }
    }
});
