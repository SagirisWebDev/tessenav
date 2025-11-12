<?php
/**
 * PHP file to use when rendering the block type on the server to show on the front end.
 *
 * The following variables are exposed to the file:
 *     $attributes (array): The block attributes.
 *     $content (string): The block default content.
 *     $block (WP_Block): The block instance.
 *
 * @see https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/block-api/block-metadata.md#render
 */


if ( ! function_exists( 'sagiriswd_tessenav_build_css_font_sizes') ) {
	function sagiriswd_tessenav_build_css_font_sizes( $attributes ) {
	// CSS classes.
	$font_sizes = array(
		'css_classes'   => array(),
		'inline_styles' => '',
	);

	$has_named_font_size  = array_key_exists( 'fontSize', $attributes );
	$has_custom_font_size = array_key_exists( 'customFontSize', $attributes );

	if ( $has_named_font_size ) {
		// Add the font size class.
		$font_sizes['css_classes'][] = sprintf( 'has-%s-font-size', $attributes['fontSize'] );
	} elseif ( $has_custom_font_size ) {
		// Add the custom font size inline style.
		$font_sizes['inline_styles'] = sprintf( 'font-size: %spx;', $attributes['customFontSize'] );
	}

	return $font_sizes;
	}
}
if ( ! function_exists( 'sagiriswd_tessenav_build_css_colors') ) {
	function sagiriswd_tessenav_build_css_colors( $attributes ) {
	$colors = array(
		'css_classes'           => array(),
		'inline_styles'         => '',
		'overlay_css_classes'   => array(),
		'overlay_inline_styles' => '',
	);

	// Text color.
	$has_named_text_color  = array_key_exists( 'textColor', $attributes );
	$has_custom_text_color = array_key_exists( 'customTextColor', $attributes );

	// If has text color.
	if ( $has_custom_text_color || $has_named_text_color ) {
		// Add has-text-color class.
		$colors['css_classes'][] = 'has-text-color';
	}

	if ( $has_named_text_color ) {
		// Add the color class.
		$colors['css_classes'][] = sprintf( 'has-%s-color', $attributes['textColor'] );
	} elseif ( $has_custom_text_color ) {
		// Add the custom color inline style.
		$colors['inline_styles'] .= sprintf( 'color: %s;', $attributes['customTextColor'] );
	}

	// Background color.
	$has_named_background_color  = array_key_exists( 'backgroundColor', $attributes );
	$has_custom_background_color = array_key_exists( 'customBackgroundColor', $attributes );

	// If has background color.
	if ( $has_custom_background_color || $has_named_background_color ) {
		// Add has-background class.
		$colors['css_classes'][] = 'has-background';
	}

	if ( $has_named_background_color ) {
		// Add the background-color class.
		$colors['css_classes'][] = sprintf( 'has-%s-background-color', $attributes['backgroundColor'] );
	} elseif ( $has_custom_background_color ) {
		// Add the custom background-color inline style.
		$colors['inline_styles'] .= sprintf( 'background-color: %s;', $attributes['customBackgroundColor'] );
	}

	// Overlay text color.
	$has_named_overlay_text_color  = array_key_exists( 'overlayTextColor', $attributes );
	$has_custom_overlay_text_color = array_key_exists( 'customOverlayTextColor', $attributes );

	// If has overlay text color.
	if ( $has_custom_overlay_text_color || $has_named_overlay_text_color ) {
		// Add has-text-color class.
		$colors['overlay_css_classes'][] = 'has-text-color';
	}

	if ( $has_named_overlay_text_color ) {
		// Add the overlay color class.
		$colors['overlay_css_classes'][] = sprintf( 'has-%s-color', $attributes['overlayTextColor'] );
	} elseif ( $has_custom_overlay_text_color ) {
		// Add the custom overlay color inline style.
		$colors['overlay_inline_styles'] .= sprintf( 'color: %s;', $attributes['customOverlayTextColor'] );
	}

	// Overlay background color.
	$has_named_overlay_background_color  = array_key_exists( 'overlayBackgroundColor', $attributes );
	$has_custom_overlay_background_color = array_key_exists( 'customOverlayBackgroundColor', $attributes );

	// If has overlay background color.
	if ( $has_custom_overlay_background_color || $has_named_overlay_background_color ) {
		// Add has-background class.
		$colors['overlay_css_classes'][] = 'has-background';
	}

	if ( $has_named_overlay_background_color ) {
		// Add the overlay background-color class.
		$colors['overlay_css_classes'][] = sprintf( 'has-%s-background-color', $attributes['overlayBackgroundColor'] );
	} elseif ( $has_custom_overlay_background_color ) {
		// Add the custom overlay background-color inline style.
		$colors['overlay_inline_styles'] .= sprintf( 'background-color: %s;', $attributes['customOverlayBackgroundColor'] );
	}

	return $colors;
	}
}

if ( ! function_exists( 'sagiriswd_tessenav_get_layout_class') ) {
	function sagiriswd_tessenav_get_layout_class( $attributes ) {
		$layout_justification = array(
			'left'          => 'items-justified-left',
			'right'         => 'items-justified-right',
			'center'        => 'items-justified-center',
			'space-between' => 'items-justified-space-between',
		);

		$layout_class = '';
		if (
			isset( $attributes['layout']['justifyContent'] ) &&
			isset( $layout_justification[ $attributes['layout']['justifyContent'] ] )
		) {
			$layout_class .= $layout_justification[ $attributes['layout']['justifyContent'] ];
		}
		if ( isset( $attributes['layout']['orientation'] ) && 'vertical' === $attributes['layout']['orientation'] ) {
			$layout_class .= ' is-vertical';
		}

		if ( isset( $attributes['layout']['flexWrap'] ) && 'nowrap' === $attributes['layout']['flexWrap'] ) {
			$layout_class .= ' no-wrap';
		}
		return $layout_class;
	}
}

if ( ! function_exists( 'sagiriswd_tessenav_is_responsive') ) {
	function sagiriswd_tessenav_is_responsive( $attributes ) {
		/**
		 * This is for backwards compatibility after the `isResponsive` attribute was been removed.
		*/
		
		$has_old_responsive_attribute = ! empty( $attributes['isResponsive'] ) && $attributes['isResponsive'];
		return isset( $attributes['overlayMenu'] ) && 'never' !== $attributes['overlayMenu'] || $has_old_responsive_attribute;
	}
}

if ( ! function_exists( 'sagiriswd_tessenav_has_submenus') ) {
	function sagiriswd_tessenav_has_submenus( $block ) {
		$has_submenus = false;
		if ( true === $has_submenus ) {
			return $has_submenus;
		}

		foreach ( $block->inner_blocks as $inner_block ) {
			// If this is a page list then work out if any of the pages have children.
			if ( 'core/page-list' === $inner_block->name ) {
				$all_pages = get_pages(
					array(
						'sort_column' => 'menu_order,post_title',
						'order'       => 'asc',
					)
				);
				foreach ( (array) $all_pages as $page ) {
					if ( $page->post_parent ) {
						$has_submenus = true;
						break;
					}
				}
			}
			// If this is a navigation submenu then we know we have submenus.
			if ( 'sagiriswd/tessenav-submenu' === $inner_block->name ) {
				$has_submenus = true;
				break;
			}
		}

		return $has_submenus;
	}
}

if ( ! function_exists( 'sagiriswd_tessenav_is_interactive') ) {
	function sagiriswd_tessenav_is_interactive( $attributes, $block ) {
		$has_submenus       = sagiriswd_tessenav_has_submenus( $block );
		$is_responsive_menu = sagiriswd_tessenav_is_responsive( $attributes );
		return ( $has_submenus && ( $attributes['openSubmenusOnClick'] || $attributes['showSubmenuIcon'] ) ) || $is_responsive_menu;
	}
}

if ( ! function_exists( 'sagiriswd_tessenav_get_classes') ) {
	function sagiriswd_tessenav_get_classes( $attributes ) {
		// Restore legacy classnames for submenu positioning.
		$layout_class       = sagiriswd_tessenav_get_layout_class( $attributes );
		$colors             = block_core_navigation_build_css_colors( $attributes );
		$font_sizes         = block_core_navigation_build_css_font_sizes( $attributes );
		$is_responsive_menu = sagiriswd_tessenav_is_responsive( $attributes );

		// Manually add block support text decoration as CSS class.
		$text_decoration       = $attributes['style']['typography']['textDecoration'] ?? null;
		$text_decoration_class = sprintf( 'has-text-decoration-%s', $text_decoration );

		$classes = array_merge(
			$colors['css_classes'],
			$font_sizes['css_classes'],
			$is_responsive_menu ? array( 'is-responsive' ) : array(),
			$layout_class ? array( $layout_class ) : array(),
			$text_decoration ? array( $text_decoration_class ) : array()
		);

		array_unshift( $classes, 'sagiriswd-tn');
		return implode( ' ', $classes );
	}
}

if ( ! function_exists( 'sagiriswd_tessenav_get_styles') ) {
	function sagiriswd_tessenav_get_styles( $attributes ) {
		$colors       = block_core_navigation_build_css_colors( $attributes );
		$font_sizes   = block_core_navigation_build_css_font_sizes( $attributes );
		$block_styles = isset( $attributes['styles'] ) ? $attributes['styles'] : '';
		return $block_styles . $colors['inline_styles'] . $font_sizes['inline_styles'];
	}
}

if ( ! function_exists( 'sagiriswd_tessenav_get_inner_blocks_html') ) {
	function sagiriswd_tessenav_get_inner_blocks_html( $attributes, $block ) {
		$has_submenus   = sagiriswd_tessenav_has_submenus( $block );
		$is_interactive = sagiriswd_tessenav_is_interactive( $attributes, $block );

		$style                = sagiriswd_tessenav_get_styles( $attributes );
		$class                = sagiriswd_tessenav_get_classes( $attributes );
		$container_attributes = get_block_wrapper_attributes(
			array(
				'class' => 'sagiriswd-tn__container ' . $class,
				'style' => $style,
			)
		);

		$inner_blocks_html = '';

		foreach ( $block->inner_blocks as $inner_block ) {
			$inner_block_markup = $inner_block->render();

			$inner_blocks_html .= $inner_block_markup;
		}

		// Add directives to the submenu if needed.
		if ( $has_submenus && $is_interactive ) {
			$tags              = new WP_HTML_Tag_Processor( $inner_blocks_html );
			$inner_blocks_html = sagiriswd_tessenav_add_directives_to_submenu( $tags, $attributes );
		}

		return $inner_blocks_html;
	}
}

if ( ! function_exists( 'sagiriswd_tessenav_add_directives_to_submenu'
) ) {
	function sagiriswd_tessenav_add_directives_to_submenu( $tags, $block_attributes ) {
	while ( $tags->next_tag(
		array(
			'tag_name' => 'DIV',
			'class_name' => 'wp-block-sagiriswd-tessenav-submenu'
		)
	) ) {
			// Add directives to the parent `<div>`.
			$tags->set_attribute( 'data-wp-interactive', 'sagiriswd/tessenav' );
			$tags->set_attribute( 'data-wp-context', '{ "submenuOpenedBy": { "click": false, "hover": false, "focus": false }, "type": "submenu", "modal": null, "previousFocus": null }' );
			$tags->set_attribute( 'data-wp-watch', 'callbacks.initMenu' );
			$tags->set_attribute( 'data-wp-on--focusout', 'actions.handleMenuFocusout' );
			$tags->set_attribute( 'data-wp-on--keydown', 'actions.handleMenuKeydown' );

			// This is a fix for Safari. Without it, Safari doesn't change the active
			// element when the user clicks on a button. It can be removed once we add
			// an overlay to capture the clicks, instead of relying on the focusout
			// event.
			$tags->set_attribute( 'tabindex', '-1' );

			if ( ! isset( $block_attributes['openSubmenusOnClick'] ) || false === $block_attributes['openSubmenusOnClick'] ) {
				$tags->set_attribute( 'data-wp-on-async--mouseenter', 'actions.openMenuOnHover' );
				$tags->set_attribute( 'data-wp-on-async--mouseleave', 'actions.closeMenuOnHover' );
			}

			// Add directives to the toggle submenu button.
			if ( $tags->next_tag(
				array(
					'tag_name'   => 'BUTTON',
					'class_name' => 'sagiriswd-tn-submenu__toggle',
				)
			) ) {
				$tags->set_attribute( 'data-wp-on-async--click', 'actions.toggleMenuOnClick' );
				$tags->set_attribute( 'data-wp-bind--aria-expanded', 'state.isMenuOpen' );
				// The `aria-expanded` attribute for SSR is already added in the submenu block.
			}
			// Add directives to the submenu.
			if ( $tags->next_tag(
				array(
					'tag_name'   => 'DIV',
					'class_name' => 'sagiriswd-tn__submenu-container',
				)
			) ) {
				$tags->set_attribute( 'data-wp-on-async--focus', 'actions.openMenuOnFocus' );
			}

			// Iterate through subitems if exist.
			sagiriswd_tessenav_add_directives_to_submenu( $tags, $block_attributes );
		}
		return $tags->get_updated_html();
	}
}

if ( ! function_exists( 'sagiriswd_tessenav_get_nav_element_directives') ) {
	function sagiriswd_tessenav_get_nav_element_directives( $is_interactive ) {
		if ( ! $is_interactive ) {
			return '';
		}
		// When adding to this array be mindful of security concerns.
		$nav_element_context    = wp_interactivity_data_wp_context(
			array(
				'overlayOpenedBy' => array(
					'click' => false,
					'hover' => false,
					'focus' => false,
				),
				'type'            => 'overlay',
				'roleAttribute'   => '',
				'ariaLabel'       => __( 'Menu' ),
			)
		);
		$nav_element_directives = '
		 data-wp-interactive="sagiriswd/tessenav" '
		. $nav_element_context;

		return $nav_element_directives;
	}
}

if ( ! function_exists( 'sagiriswd_tessenav_get_nav_wrapper_attributes') ) {
	function sagiriswd_tessenav_get_nav_wrapper_attributes( $attributes, $block ) {
		$is_interactive     = sagiriswd_tessenav_is_interactive( $attributes, $block );
		$is_responsive_menu = sagiriswd_tessenav_is_responsive( $attributes );
		$style              = sagiriswd_tessenav_get_styles( $attributes );
		$class              = sagiriswd_tessenav_get_classes( $attributes );
		$extra_attributes   = array(
			'class' => $class,
			'style' => $style,
		);

		$wrapper_attributes = get_block_wrapper_attributes( $extra_attributes );
		
		if ( $is_responsive_menu ) {
			$nav_element_directives = sagiriswd_tessenav_get_nav_element_directives( $is_interactive );
			$wrapper_attributes    .= ' ' . $nav_element_directives;
		}

		// echo '<pre>';
		// var_dump($wrapper_attributes);
		// echo '</pre>';
		// wp_die();
		return $wrapper_attributes;
	}
}

if ( ! function_exists( 'sagiriswd_tessenav_get_responsive_container_markup') ) {
	function sagiriswd_tessenav_get_responsive_container_markup( $attributes, $block, $inner_blocks_html ) {
		$is_interactive  = sagiriswd_tessenav_is_interactive( $attributes, $block );
		$colors          = sagiriswd_tessenav_build_css_colors( $attributes );
		$modal_unique_id = wp_unique_id( 'modal-' );

		$is_hidden_by_default = isset( $attributes['overlayMenu'] ) && 'always' === $attributes['overlayMenu'];

		$responsive_container_classes = array(
			'sagiriswd-tn__responsive-container',
			$is_hidden_by_default ? 'hidden-by-default' : '',
			implode( ' ', $colors['overlay_css_classes'] ),
		);
		$open_button_classes          = array(
			'sagiriswd-tn__responsive-container-open',
			$is_hidden_by_default ? 'always-shown' : '',
		);

		$should_display_icon_label = isset( $attributes['hasIcon'] ) && true === $attributes['hasIcon'];
		$toggle_button_icon        = '<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7.5h16v1.5H4z"></path><path d="M4 15h16v1.5H4z"></path></svg>';
		if ( isset( $attributes['icon'] ) ) {
			if ( 'menu' === $attributes['icon'] ) {
				$toggle_button_icon = '<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5 5v1.5h14V5H5z"></path><path d="M5 12.8h14v-1.5H5v1.5z"></path><path d="M5 19h14v-1.5H5V19z"></path></svg>';
			}
		}
		$toggle_button_content       = $should_display_icon_label ? $toggle_button_icon : __( 'Menu' );
		$toggle_close_button_icon    = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path d="m13.06 12 6.47-6.47-1.06-1.06L12 10.94 5.53 4.47 4.47 5.53 10.94 12l-6.47 6.47 1.06 1.06L12 13.06l6.47 6.47 1.06-1.06L13.06 12Z"></path></svg>';
		$toggle_close_button_content = $should_display_icon_label ? $toggle_close_button_icon : __( 'Close' );
		$toggle_aria_label_open      = $should_display_icon_label ? 'aria-label="' . __( 'Open menu' ) . '"' : ''; // Open button label.
		$toggle_aria_label_close     = $should_display_icon_label ? 'aria-label="' . __( 'Close menu' ) . '"' : ''; // Close button label.

		// Add Interactivity API directives to the markup if needed.
		$open_button_directives          = '';
		$responsive_container_directives = '';
		$responsive_dialog_directives    = '';
		$close_button_directives         = '';
		if ( $is_interactive ) {
			$open_button_directives                  = '
				data-wp-on-async--click="actions.openMenuOnClick"
				data-wp-on--keydown="actions.handleMenuKeydown"
			';
			$responsive_container_directives         = '
				data-wp-class--has-modal-open="state.isMenuOpen"
				data-wp-class--is-menu-open="state.isMenuOpen"
				data-wp-watch="callbacks.initMenu"
				data-wp-on--keydown="actions.handleMenuKeydown"
				data-wp-on-async--focusout="actions.handleMenuFocusout"
				tabindex="-1"
			';
			$responsive_dialog_directives            = '
				data-wp-bind--aria-modal="state.ariaModal"
				data-wp-bind--aria-label="state.ariaLabel"
				data-wp-bind--role="state.roleAttribute"
			';
			$close_button_directives                 = '
				data-wp-on-async--click="actions.closeMenuOnClick"
			';
			$responsive_container_content_directives = '
				data-wp-watch="callbacks.focusFirstElement"
			';
		}

		$overlay_inline_styles = esc_attr( safecss_filter_attr( $colors['overlay_inline_styles'] ) );

		return sprintf(
			'<button aria-haspopup="dialog" %3$s class="%6$s" %10$s>%8$s</button>
				<div class="%5$s" %7$s id="%1$s" %11$s>
					<div class="sagiriswd-tn__responsive-close" tabindex="-1">
						<div class="sagiriswd-tn__responsive-dialog" %12$s>
							<button %4$s class="sagiriswd-tn__responsive-container-close" %13$s>%9$s</button>
							<div class="sagiriswd-tn__responsive-container-content" %14$s id="%1$s-content">
								%2$s
							</div>
						</div>
					</div>
				</div>',
			esc_attr( $modal_unique_id ),
			$inner_blocks_html,
			$toggle_aria_label_open,
			$toggle_aria_label_close,
			esc_attr( trim( implode( ' ', $responsive_container_classes ) ) ),
			esc_attr( trim( implode( ' ', $open_button_classes ) ) ),
			( ! empty( $overlay_inline_styles ) ) ? "style=\"$overlay_inline_styles\"" : '',
			$toggle_button_content,
			$toggle_close_button_content,
			$open_button_directives,
			$responsive_container_directives,
			$responsive_dialog_directives,
			$close_button_directives,
			$responsive_container_content_directives
		);
	}
}

if ( ! function_exists( 'sagiriswd_tessenav_get_wrapper_markup') ) {
	function sagiriswd_tessenav_get_wrapper_markup( $attributes, $block ) {
		$inner_blocks_html = sagiriswd_tessenav_get_inner_blocks_html( $attributes, $block );
		if ( sagiriswd_tessenav_is_responsive( $attributes ) ) {
			return sagiriswd_tessenav_get_responsive_container_markup( $attributes, $block, $inner_blocks_html );
		}
		return $inner_blocks_html;
	}
}

// Unique ids for a11y and interactivity targets.
// $uid     = uniqid( 'tn-', false );
// $modalId = $uid . '-modal';
// $labelId = $uid . '-label';

// $overlay_mode = $attributes['overlayMenu'] ?? 'mobile'; // never|mobile|always
// $mode_class   = 'is-overlay-' . sanitize_html_class( $overlay_mode );
// $panel_width  = $attributes['panelWidthMode'] ?? 'auto';
// $stack_at     = $attributes['stackAt'] ?? 'mobile';
// $color        = $attributes['textColor'] ?? $attributes['customTextColor'] ?? $attributes['rgbTextColor'] ?? '#000';

// $wrapper_styles = sprintf(
// 	'--tn-panel-width-mode:%s;--tn-stack-at:%s',
// 	esc_attr( $panel_width ),
// 	esc_attr( $stack_at )
// );

/**
 * Deprecated:
 * The rgbTextColor and rgbBackgroundColor attributes
 * have been deprecated in favor of
 * customTextColor and customBackgroundColor ones.
 * Move the values from old attrs to the new ones.
 */
if ( isset( $attributes['rgbTextColor'] ) && empty( $attributes['textColor'] ) ) {
	$attributes['customTextColor'] = $attributes['rgbTextColor'];
}

if ( isset( $attributes['rgbBackgroundColor'] ) && empty( $attributes['backgroundColor'] ) ) {
	$attributes['customBackgroundColor'] = $attributes['rgbBackgroundColor'];
}

unset( $attributes['rgbTextColor'], $attributes['rgbBackgroundColor'] );

echo sprintf(
	'<nav %1$s>%2$s</nav>',
	sagiriswd_tessenav_get_nav_wrapper_attributes( $attributes, $block ),
	sagiriswd_tessenav_get_wrapper_markup( $attributes, $block )
);