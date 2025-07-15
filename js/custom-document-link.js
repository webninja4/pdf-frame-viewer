jQuery(document).ready(function($) {
    const $documentLinkSelect = $('#document_link');

    if ($documentLinkSelect.length) {
        // Hide the "A custom URL" option
        $documentLinkSelect.find('option[value="url"]').hide();

        // Remove the "None" option
        $documentLinkSelect.find('option[value="none"]').remove();

        // Set "File Upload" as selected
        $documentLinkSelect.val('file').trigger('change');

        // Check if "File Upload" is the only remaining option
        const $visibleOptions = $documentLinkSelect.find('option:not([style*="display: none"]):not([hidden])');

        if ($visibleOptions.length === 1 && $visibleOptions.val() === 'file') {
            // Hide the entire fieldset if "File Upload" is the only option
            $documentLinkSelect.closest('.fieldset-document_link').hide();
        }
    }
});