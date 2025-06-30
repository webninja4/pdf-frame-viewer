(function(wp) {
    var el = wp.element.createElement;
    var registerPlugin = wp.plugins.registerPlugin;
    var PluginSidebar = wp.editPost.PluginSidebar;
    var PanelBody = wp.components.PanelBody;
    var Button = wp.components.Button;
    var RadioControl = wp.components.RadioControl;
    var dispatch = wp.data.dispatch;

    var SplitViewPDFSidebar = function() {
        var _wp$element$useState = wp.element.useState(''),
            pdfUrl = _wp$element$useState[0],
            setPdfUrl = _wp$element$useState[1];
        var _wp$element$useState2 = wp.element.useState('horizontal'),
            mode = _wp$element$useState2[0],
            setMode = _wp$element$useState2[1];

        function openMediaModal() {
            var frame = wp.media({
                title: 'Select or Upload PDF',
                button: { text: 'Use this PDF' },
                library: { type: 'application/pdf' },
                multiple: false
            });
            frame.on('select', function() {
                var attachment = frame.state().get('selection').first().toJSON();
                var secure_url = attachment.url.replace(/^http:\/\//i, 'https://');
                setPdfUrl(secure_url);
            });
            frame.open();
        }

        function insertShortcode() {
            if (!pdfUrl) {
                alert('Please select a PDF file.');
                return;
            }
            var shortcode = '[pdf_frame_viewer url="' + pdfUrl + '" mode="' + mode + '"]';
            dispatch('core/editor').insertBlocks(
                wp.blocks.createBlock('core/shortcode', { text: shortcode })
            );
        }

        return el(
            PluginSidebar,
            {
                name: 'split-view-pdf-sidebar',
                title: 'Split View PDF',
                icon: 'media-document'
            },
            el(
                PanelBody,
                { title: 'Insert Split View PDF', initialOpen: true },
                el(
                    Button,
                    {
                        isSecondary: true,
                        onClick: openMediaModal,
                        style: { marginBottom: '10px' }
                    },
                    pdfUrl ? 'Change PDF' : 'Select PDF'
                ),
                pdfUrl && el(
                    'div',
                    { style: { fontSize: '0.9em', marginBottom: '10px', wordBreak: 'break-all' } },
                    el('strong', null, 'Selected PDF:'), el('br'),
                    pdfUrl
                ),
                el(
                    RadioControl,
                    {
                        label: 'Split Mode',
                        selected: mode,
                        options: [
                            { label: 'Horizontal (Left/Right)', value: 'horizontal' },
                            { label: 'Vertical (Top/Bottom)', value: 'vertical' }
                        ],
                        onChange: setMode
                    }
                ),
                el(
                    Button,
                    {
                        isPrimary: true,
                        style: { marginTop: '15px' },
                        onClick: insertShortcode,
                        disabled: !pdfUrl
                    },
                    'Insert Split View PDF'
                )
            )
        );
    };

    registerPlugin('split-view-pdf-sidebar', {
        render: SplitViewPDFSidebar,
        icon: 'media-document'
    });
})(window.wp);
