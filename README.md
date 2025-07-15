### Shortcode Attributes

*   `url` (optional): Specify an initial PDF URL to load in both panes.
*   Example: `[pdf_frame_viewer url="https://example.com/document.pdf"]`
*   `mode` (optional): Set the initial split view mode. Accepts `horizontal` (default) or `vertical`.
*   Example: `[pdf_frame_viewer mode="vertical"]`

### Frontend Controls

Once embedded, users will see:

*   **URL Input & Load Button:** To load PDFs from any valid URL.
*   **Media Library Dropdown:** To select PDFs already in your WordPress Media Library.
*   **View Toggles:** Buttons to switch between "Left/Right" (horizontal) and "Top/Bottom" (vertical) split views.
*   **Pane Toolbars:** Each PDF pane has its own set of controls for:
     *   Navigating pages (◀ ▶)  .
     *   Zooming in/out (+ -).
     *   Fitting the PDF to the page or width of the pane.

### Document Library Pro Integration

When used with the Document Library Pro plugin, this plugin provides seamless integration:

*   **Dynamic Viewer Links:** On Document CPT single pages, a "Open in PDF Frame View" button automatically appears for PDF documents.
*   **Dedicated Viewer Page:** Requires a page with slug `pdf-document-frame-viewer` containing the `[dynamic_pdf_viewer]` shortcode.
*   **Automatic PDF Detection:** Only shows the viewer button for documents with PDF file extensions.
*   **Secure URL Handling:** PDF URLs are properly sanitized and validated before being passed to the viewer.

## Development

 This plugin uses:
*   **PDF.js:** For rendering PDF documents in the browser.
*   **HTML, CSS, JavaScript:** For the frontend interface and interactivity.
*   **PHP:** For WordPress integration and Media Library interaction.

## Changelog

### 1.2.1 (Current Version)
*   **Fix:** Corrected "Fit Page" and "Fit Width" functionality to properly scale and align PDFs within resized panes.
*   **Fix:** Resolved issue with pagination buttons showing active state.
*   **Enhancement:** Modernized UI/UX with a cleaner design, updated color palette, and improved typography.
*   **Feature:** Added Media Library dropdown for easy selection of existing PDF files.
*   **Enhancement:** Adjusted layout of URL input and Media Library dropdown to be side-by-side.
*   **Feature:** Document Library Pro Integration - Added dynamic PDF Frame Viewer links on Document CPT single pages (implemented in theme).

### 1.2.0 (Previous Version)
*   Initial release with split-screen PDF viewing, toolbar controls, and resizable panes.

## Credits

*   **Author:** Project A (and Gemini CLI for recent enhancements and redesign)
*   **PDF.js Library:** Mozilla

---
