<?php
/*
Plugin Name: PDF Frame Viewer
Description: Split-screen PDF viewer with dual-pane navigation, toolbar controls, resizable panes, and enhanced media library search.
Version: 1.3
Author: Project A, Inc. / Paul Steele
*/

function pdf_frame_viewer_enqueue_scripts() {
    $plugin_url = plugin_dir_url(__FILE__);

    // Enqueue pdf.js and viewer
    wp_enqueue_script('pdfjs', $plugin_url . 'lib/pdfjs/build/pdf.js', array(), null, true);
    wp_enqueue_script('pdfjs-viewer', $plugin_url . 'lib/pdfjs/web/pdf_viewer.js', array('pdfjs'), null, true);
    wp_enqueue_style('pdfjs-viewer-css', $plugin_url . 'lib/pdfjs/web/pdf_viewer.css');

    // Enqueue custom scripts and styles
    wp_enqueue_script('pdf-frame-viewer', $plugin_url . 'js/pdf-frame-viewer.js', array('pdfjs-viewer'), '1.2.0', true);
    wp_enqueue_style('pdf-frame-viewer-css', $plugin_url . 'css/pdf-frame-viewer.css');

    // Pass plugin URL and AJAX URL to JS
    wp_localize_script('pdf-frame-viewer', 'PDF_FRAME_VIEWER', array(
        'pluginUrl' => $plugin_url,
        'ajaxUrl'   => admin_url('admin-ajax.php'),
        'nonce'     => wp_create_nonce('pdf_frame_search')
    ));

    // Enqueue editor button script only on editor pages
    if (is_admin()) {
        wp_enqueue_script('pdf-frame-editor-btn', $plugin_url . 'js/pdf-frame-editor-btn.js', array('jquery'), '1.0', true);
    }
}
add_action('wp_enqueue_scripts', 'pdf_frame_viewer_enqueue_scripts');

function get_pdf_files_from_media_library() {
    $args = array(
        'post_type' => 'attachment',
        'post_mime_type' => 'application/pdf',
        'posts_per_page' => 10,
    );
    $attachments = get_posts($args);
    $pdf_files = array();
    if ($attachments) {
        foreach ($attachments as $post) {
            $pdf_files[] = array(
                'title' => get_the_title($post->ID),
                'url' => wp_get_attachment_url($post->ID),
                'date' => get_the_date('Y-m-d', $post->ID),
            );
        }
    }
    return $pdf_files;
}

function pdf_frame_search_pdfs() {
    check_ajax_referer('pdf_frame_search', 'nonce');

    $search_term = sanitize_text_field($_POST['search_term']);

    $args = array(
        'post_type' => 'attachment',
        'post_mime_type' => 'application/pdf',
        'posts_per_page' => -1,
        's' => $search_term,
    );
    $attachments = get_posts($args);
    $pdf_files = array();
    if ($attachments) {
        foreach ($attachments as $post) {
            $pdf_files[] = array(
                'title' => get_the_title($post->ID),
                'url' => wp_get_attachment_url($post->ID),
                'date' => get_the_date('Y-m-d', $post->ID),
            );
        }
    }
    wp_send_json_success($pdf_files);
}
add_action('wp_ajax_search_pdfs', 'pdf_frame_search_pdfs');
add_action('wp_ajax_nopriv_search_pdfs', 'pdf_frame_search_pdfs');

function pdf_frame_viewer_shortcode($atts) {
    $atts = shortcode_atts(array(
        'url' => '',
        'mode' => 'horizontal' // horizontal or vertical
    ), $atts);

    ob_start();
    ?>
    <div class="pdf-frame-container" data-view-mode="<?php echo esc_attr($atts['mode']); ?>">
        <div class="pdf-controls-container">
            <div class="pdf-url-input">
                <label for="pdf-input-url">Enter URL of a PDF:</label>
                <input type="url" id="pdf-input-url" placeholder="https://example.com/document.pdf" value="<?php echo esc_url($atts['url']); ?>">
                <button id="pdf-load-button">Load PDF</button>
                <div id="pdf-url-error" style="color: red; display: none;">Please enter a valid PDF URL.</div>
            </div>
            <div class="pdf-media-library-select">
                <label for="pdf-search-input">Or search for a PDF from the Media Library:</label>
                <input type="text" id="pdf-search-input" placeholder="Search by filename...">
                <div id="pdf-search-results">
                    <?php
                    $pdf_files = get_pdf_files_from_media_library();
                    if (!empty($pdf_files)) {
                        echo '<div class="pdf-search-results-header"><span class="result-name">Name</span><span class="result-date">Uploaded</span></div>';
                        foreach ($pdf_files as $pdf) {
                            echo '<div class="pdf-search-result-item" data-url="' . esc_url($pdf['url']) . '">';
                            echo '<span class="result-name">' . esc_html($pdf['title']) . '</span>';
                            echo '<span class="result-date">' . esc_html($pdf['date']) . '</span>';
                            echo '</div>';
                        }
                    }
                    ?>
                </div>
            </div>
        </div>
        <div class="view-controls">
            <button class="view-toggle" data-mode="horizontal">Left/Right</button>
            <button class="view-toggle" data-mode="vertical">Top/Bottom</button>
        </div>
        <div class="pdf-split-view <?php echo esc_attr($atts['mode']); ?>">
            <!-- Left/Top Pane -->
            <div class="pdf-pane pane-1">
                <div class="pdf-toolbar">
                    <div class="page-controls">
                        <button class="prev-page">◀</button>
                        <span class="page-info">Page: <span class="current-page">1</span>/<span class="total-pages">0</span></span>
                        <button class="next-page">▶</button>
                    </div>
                    <div class="zoom-controls">
                        <button class="zoom-in">+</button>
                        <button class="zoom-out">-</button>
                        <button class="fit-page">Fit Page</button>
                        <button class="fit-width">Fit Width</button>
                    </div>
                </div>
                <div class="pdf-viewer-container">
                    <canvas id="pdf-viewer-left"></canvas>
                </div>
            </div>
            <!-- Resizer -->
            <div class="resizer"></div>
            <!-- Right/Bottom Pane -->
            <div class="pdf-pane pane-2">
                <div class="pdf-toolbar">
                    <div class="page-controls">
                        <button class="prev-page">◀</button>
                        <span class="page-info">Page: <span class="current-page">1</span>/<span class="total-pages">0</span></span>
                        <button class="next-page">▶</button>
                    </div>
                    <div class="zoom-controls">
                        <button class="zoom-in">+</button>
                        <button class="zoom-out">-</button>
                        <button class="fit-page">Fit Page</button>
                        <button class="fit-width">Fit Width</button>
                    </div>
                </div>
                <div class="pdf-viewer-container">
                    <canvas id="pdf-viewer-right"></canvas>
                </div>
            </div>
        </div>
        <input type="hidden" class="pdf-url" value="<?php echo esc_url($atts['url']); ?>">
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode('pdf_frame_viewer', 'pdf_frame_viewer_shortcode');

// Enqueue admin scripts for editor button
function pdf_frame_admin_scripts($hook) {
    // Only enqueue for post.php or post-new.php screens, and only for 'page' post type
    if (($hook === 'post.php' || $hook === 'post-new.php') && get_post_type() === 'page') {
        wp_enqueue_media();
        wp_enqueue_script('pdf-frame-editor-btn', plugin_dir_url(__FILE__) . 'js/pdf-frame-editor-btn.js', array('jquery'), '1.0', true);
    }
}
add_action('admin_enqueue_scripts', 'pdf_frame_admin_scripts');

// Add button for Classic Editor
function pdf_frame_add_editor_buttons() {
    global $post_type;
    if ('page' === $post_type) {
        echo '<button type="button" id="insert-split-view-pdf" class="button" style="margin-left:5px;">Add Split View PDF</button>';
    }
}
add_action('media_buttons', 'pdf_frame_add_editor_buttons');

// Enqueue Block Editor sidebar script
function pdf_frame_enqueue_block_editor_assets() {
    $current_screen = get_current_screen();
    if ($current_screen && $current_screen->base === 'post' && $current_screen->post_type === 'page') {
        wp_enqueue_script(
            'pdf-frame-gutenberg-sidebar',
            plugin_dir_url(__FILE__) . 'js/pdf-frame-gutenberg-sidebar.js',
            array('wp-plugins', 'wp-edit-post', 'wp-element', 'wp-components', 'wp-data', 'wp-blocks', 'wp-editor'),
            '1.0',
            true
        );
    }
}
add_action('enqueue_block_editor_assets', 'pdf_frame_enqueue_block_editor_assets');

//======================================================================
// FUNCTIONS MOVED FROM THEME
//======================================================================

/**
 * PDF FRAME VIEWER INTEGRATION FOR DOCUMENTS LIBRARY PRO
 * ----------------------------------------------------
 */

/**
 * Renders the button to open a document in the PDF Frame Viewer.
 *
 * This function is hooked into the Documents Library Pro single document template
 * and generates a link that points to our dedicated viewer page.
 */
function bbpv_add_viewer_button_to_dlp() {
    // Ensure we are on a singular 'dlp_document' post and the necessary function exists.
    if ( ! is_singular( 'dlp_document' ) || ! function_exists( 'dlp_get_document' ) ) {
        return;
    }

    global $post;
    // Get the document object using the plugin's own function.
    $document = dlp_get_document( $post->ID );

    if ( ! $document ) {
        return;
    }

    // Get the URL using the correct method from the document object.
    $document_url = $document->get_download_url();

    // Only show the button if there is a URL and it ends with .pdf.
    if ( empty( $document_url ) || strtolower( pathinfo( $document_url, PATHINFO_EXTENSION ) ) !== 'pdf' ) {
        return;
    }

    // The slug of the page where [dynamic_pdf_viewer] is placed.
    $viewer_page_slug = 'pdf-document-frame-viewer';
    $viewer_page_url = get_permalink( get_page_by_path( $viewer_page_slug ) );

    if ( ! $viewer_page_url ) {
        echo '<!-- PDF Viewer Page not found. Please create a page with the slug "' . esc_attr($viewer_page_slug) . '". -->';
        return;
    }

    // Add the PDF URL as a query parameter to the viewer page link.
    $final_link = add_query_arg( 'pdf_url', urlencode( $document_url ), $viewer_page_url );

    // Output the button HTML.
    echo '<div class="dlp-document-info-button-wrapper" style="margin-top: 15px;">';
    echo '<a href="' . esc_url( $final_link ) . '" class="button pdf-frame-view-button" target="_blank">Open in PDF Frame View</a>';
    echo '</div>';
}
// Hook our function into the DLP template.
add_action( 'document_library_pro_single_document_details_list_after', 'bbpv_add_viewer_button_to_dlp' );

function enqueue_custom_document_link_script() {
    wp_enqueue_script(
        'custom-document-link',
        plugin_dir_url( __FILE__ ) . '/js/custom-document-link.js',
        array('jquery'), // Dependency on jQuery
        null, // Version (use null for development to prevent caching)
        true // Enqueue in the footer
    );
}
add_action('wp_enqueue_scripts', 'enqueue_custom_document_link_script');

/**
 * Displays the PDF viewer based on a URL from a query parameter.
 *
 * This shortcode should be placed on a dedicated page. It looks for a 'pdf_url'
 * query parameter in the URL and, if found, renders the [pdf_frame_viewer]
 * shortcode with that URL.
 *
 * @return string The HTML output of the [pdf_frame_viewer] shortcode.
 */
function bbpv_dynamic_viewer_shortcode() {
    if ( isset( $_GET['pdf_url'] ) ) {
        $pdf_url = urldecode( $_GET['pdf_url'] );

        // Validate that it's a URL.
        if ( filter_var( $pdf_url, FILTER_VALIDATE_URL ) ) {
            // Sanitize the URL for security.
            $sanitized_url = esc_url( $pdf_url );
            // Render the main plugin's shortcode.
            return do_shortcode( '[pdf_frame_viewer url="' . $sanitized_url . '" mode="horizontal"]' );
        } else {
            return '<p>Error: Invalid PDF URL provided.</p>';
        }
    }

    return '<p>No PDF specified. Please provide a valid ?pdf_url=... parameter.</p>';
}
add_shortcode( 'dynamic_pdf_viewer', 'bbpv_dynamic_viewer_shortcode' );