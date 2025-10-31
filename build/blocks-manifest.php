<?php
// This file is generated. Do not modify it manually.
return array(
	'tessenav' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'sagiriswd/tessenav',
		'version' => '0.1.0',
		'title' => 'TesseNav',
		'category' => 'theme',
		'icon' => 'screenoptions',
		'description' => 'Add text, media, layout, design and theme blocks to the Navigation block.',
		'keywords' => array(
			'menu',
			'navigation',
			'links',
			'mega menu'
		),
		'example' => array(
			
		),
		'attributes' => array(
			'ref' => array(
				'type' => 'object'
			),
			'textColor' => array(
				'type' => 'string'
			),
			'customTextColor' => array(
				'type' => 'string'
			),
			'rgbTextColor' => array(
				'type' => 'string'
			),
			'backgroundColor' => array(
				'type' => 'string'
			),
			'customBackgroundColor' => array(
				'type' => 'string'
			),
			'rgbBackgroundColor' => array(
				'type' => 'string'
			),
			'showSubmenuIcon' => array(
				'type' => 'boolean',
				'default' => true
			),
			'openSubmenusOnClick' => array(
				'type' => 'boolean',
				'default' => false
			),
			'overlayMenu' => array(
				'type' => 'string',
				'default' => 'mobile'
			),
			'icon' => array(
				'type' => 'string',
				'default' => 'handle'
			),
			'hasIcon' => array(
				'type' => 'boolean',
				'default' => true
			),
			'__unstableLocation' => array(
				'type' => 'string'
			),
			'overlayBackgroundColor' => array(
				'type' => 'string'
			),
			'customOverlayBackgroundColor' => array(
				'type' => 'string'
			),
			'overlayTextColor' => array(
				'type' => 'string'
			),
			'customOverlayTextColor' => array(
				'type' => 'string'
			),
			'maxNestingLevel' => array(
				'type' => 'number',
				'default' => 5
			),
			'templateLock' => array(
				'type' => array(
					'string',
					'boolean'
				),
				'enum' => array(
					'all',
					'insert',
					'contentOnly',
					false
				)
			)
		),
		'providesContext' => array(
			'textColor' => 'textColor',
			'customTextColor' => 'customTextColor',
			'backgroundColor' => 'backgroundColor',
			'customBackgroundColor' => 'customBackgroundColor',
			'overlayTextColor' => 'overlayTextColor',
			'customOverlayTextColor' => 'customOverlayTextColor',
			'overlayBackgroundColor' => 'overlayBackgroundColor',
			'customOverlayBackgroundColor' => 'customOverlayBackgroundColor',
			'fontSize' => 'fontSize',
			'customFontSize' => 'customFontSize',
			'showSubmenuIcon' => 'showSubmenuIcon',
			'openSubmenusOnClick' => 'openSubmenusOnClick',
			'style' => 'style',
			'maxNestingLevel' => 'maxNestingLevel'
		),
		'supports' => array(
			'align' => array(
				'wide',
				'full'
			),
			'ariaLabel' => true,
			'html' => false,
			'inserter' => true,
			'typography' => array(
				'fontSize' => true,
				'lineHeight' => true,
				'__experimentalFontStyle' => true,
				'__experimentalFontWeight' => true,
				'__experimentalTextTransform' => true,
				'__experimentalFontFamily' => true,
				'__experimentalLetterSpacing' => true,
				'__experimentalTextDecoration' => true,
				'__experimentalSkipSerialization' => array(
					'textDecoration'
				),
				'__experimentalDefaultControls' => array(
					'fontSize' => true
				)
			),
			'spacing' => array(
				'blockGap' => true,
				'units' => array(
					'px',
					'em',
					'rem',
					'vh',
					'vw'
				),
				'__experimentalDefaultControls' => array(
					'blockGap' => true
				)
			),
			'layout' => array(
				'allowSwitching' => false,
				'allowInheriting' => false,
				'allowVerticalAlignment' => false,
				'allowSizingOnChildren' => true,
				'default' => array(
					'type' => 'flex'
				)
			),
			'interactivity' => true,
			'renaming' => false,
			'contentRole' => true
		),
		'textdomain' => 'sagiriswd',
		'editorScript' => 'file:./index.js',
		'editorStyle' => 'file:./index.css',
		'style' => 'file:./style-index.css',
		'viewScript' => 'file:./view.js'
	),
	'tessenav-link' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'sagiriswd/tessenav-link',
		'title' => 'TesseNav Link',
		'category' => 'design',
		'parent' => array(
			'sagiriswd/tessenav'
		),
		'allowedBlocks' => array(
			'sagiriswd/tessenav-link',
			'sagiriswd/tessenav-submenu'
		),
		'description' => 'Add a custom link to TesseNav.',
		'attributes' => array(
			'label' => array(
				'type' => 'string',
				'role' => 'content'
			),
			'type' => array(
				'type' => 'string'
			),
			'description' => array(
				'type' => 'string'
			),
			'rel' => array(
				'type' => 'string'
			),
			'id' => array(
				'type' => 'number'
			),
			'opensInNewTab' => array(
				'type' => 'boolean',
				'default' => false
			),
			'url' => array(
				'type' => 'string'
			),
			'title' => array(
				'type' => 'string'
			),
			'kind' => array(
				'type' => 'string'
			),
			'isTopLevelLink' => array(
				'type' => 'boolean'
			)
		),
		'usesContext' => array(
			'textColor',
			'customTextColor',
			'backgroundColor',
			'customBackgroundColor',
			'overlayTextColor',
			'customOverlayTextColor',
			'overlayBackgroundColor',
			'customOverlayBackgroundColor',
			'fontSize',
			'customFontSize',
			'showSubmenuIcon',
			'maxNestingLevel',
			'style'
		),
		'supports' => array(
			'reusable' => false,
			'html' => false,
			'__experimentalSlashInserter' => true,
			'typography' => array(
				'fontSize' => true,
				'lineHeight' => true,
				'__experimentalFontFamily' => true,
				'__experimentalFontWeight' => true,
				'__experimentalFontStyle' => true,
				'__experimentalTextTransform' => true,
				'__experimentalTextDecoration' => true,
				'__experimentalLetterSpacing' => true,
				'__experimentalDefaultControls' => array(
					'fontSize' => true
				)
			),
			'renaming' => false,
			'interactivity' => array(
				'clientNavigation' => true
			)
		),
		'textdomain' => 'sagiriswd',
		'editorScript' => 'file:./index.js',
		'editorStyle' => 'file:./index.css',
		'style' => 'file:./style-index.css',
		'viewScript' => 'file:./view.js'
	),
	'tessenav-submenu' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'sagiriswd/tessenav-submenu',
		'version' => '0.1.0',
		'title' => 'TesseNav Submenu',
		'category' => 'design',
		'icon' => 'smiley',
		'parent' => array(
			'sagiriswd/tessenav',
			'sagiriswd/tessenav-submenu'
		),
		'description' => 'Add a submenu to TesseNav.',
		'keywords' => array(
			'submenu',
			'navigation',
			'mega menu',
			'links'
		),
		'example' => array(
			
		),
		'attributes' => array(
			'label' => array(
				'type' => 'string',
				'default' => ''
			),
			'rel' => array(
				'type' => 'string'
			),
			'id' => array(
				'type' => 'number'
			),
			'type' => array(
				'type' => 'string'
			),
			'opensInNewTab' => array(
				'type' => 'boolean',
				'default' => false
			),
			'url' => array(
				'type' => 'string'
			),
			'title' => array(
				'type' => 'string'
			),
			'kind' => array(
				'type' => 'string'
			),
			'flyoutDirection' => array(
				'type' => 'string',
				'enum' => array(
					'right',
					'left'
				),
				'default' => 'right'
			),
			'panelWidth' => array(
				'type' => 'string',
				'enum' => array(
					'auto',
					'match',
					'custom'
				),
				'default' => 'auto'
			),
			'customPanelWidth' => array(
				'type' => 'number',
				'default' => 0
			),
			'columns' => array(
				'type' => 'number',
				'default' => 3
			),
			'stackAt' => array(
				'type' => 'string',
				'enum' => array(
					'mobile',
					'tablet',
					'never'
				),
				'default' => 'mobile'
			),
			'isTopLevelItem' => array(
				'type' => 'boolean'
			)
		),
		'usesContext' => array(
			'textColor',
			'customTextColor',
			'backgroundColor',
			'customBackgroundColor',
			'overlayTextColor',
			'customOverlayTextColor',
			'overlayBackgroundColor',
			'customOverlayBackgroundColor',
			'fontSize',
			'customFontSize',
			'showSubmenuIcon',
			'maxNestingLevel',
			'openSubmenusOnClick',
			'style'
		),
		'supports' => array(
			'reusable' => false,
			'html' => false,
			'typography' => array(
				'fontSize' => true,
				'lineHeight' => true,
				'__experimentalFontFamily' => true,
				'__experimentalFontWeight' => true,
				'__experimentalFontStyle' => true,
				'__experimentalTextTransform' => true,
				'__experimentalTextDecoration' => true,
				'__experimentalLetterSpacing' => true,
				'__experimentalDefaultControls' => array(
					'fontSize' => true
				)
			),
			'interactivity' => array(
				'clientNavigation' => true
			)
		),
		'textdomain' => 'sagiriswd',
		'editorScript' => 'file:./index.js',
		'editorStyle' => 'file:./index.css',
		'style' => 'file:./style-index.css',
		'viewScript' => 'file:./view.js'
	)
);
