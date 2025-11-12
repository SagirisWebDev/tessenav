/**
 * WordPress dependencies
 */
// import { InnerBlocks } from '@wordpress/block-editor';

// export default function save( { attributes } ) {
// 	if ( attributes.ref ) {
// 		// Avoid rendering inner blocks when a ref is defined.
// 		// When this id is defined the inner blocks are loaded from the
// 		// `wp_navigation` entity rather than the hard-coded block html.
// 		return;
// 	}
// 	return <InnerBlocks.Content />;
// }
// src/tessenav/save.js
// import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

// export default function save( { attributes } ) {
// 	const {
// 		// purely for styling hints; none of these are required
// 		maxPanelWidth,     // e.g., number (px) or empty
// 		panelWidthMode,    // 'auto' | 'match' | 'custom'
// 		stackAt,           // 'mobile' | 'tablet' | 'never'
// 		classNameSuffix,   // optional extra class like 'is-header'
// 	} = attributes;

// 	// Expose a couple of CSS custom properties so your stylesheet
// 	// can lay out “mega menu” panels without any runtime JS.
// 	const styleVars = {
// 		'--tn-panel-width-mode': panelWidthMode || 'auto',
// 		...( panelWidthMode === 'custom' && maxPanelWidth
// 			? { '--tn-panel-max-width': `${ maxPanelWidth }px` }
// 			: null ),
// 		'--tn-stack-at': stackAt || 'mobile',
// 	};

// 	const blockProps = useBlockProps.save( {
// 		className: [
// 			'sagiriswd-tn',
// 			classNameSuffix ? `sagiriswd-tn--${ classNameSuffix }` : null,
// 		].filter( Boolean ).join( ' ' ),
// 		style: styleVars,
// 		'data-wp-interactive': 'core/navigation',
// 		'data-wp-class--is-open': 'state.isMenuOpen',
// 	} );

// 	const innerBlockProps = useInnerBlocksProps.save( blockProps );
// 	return (
// 		<div { ...innerBlockProps } />
// 	);
// }
// src/tessenav/save.js
/**
 * External deps
 */
import clsx from 'clsx';

/**
 * WordPress deps
 */
import {
	InnerBlocks,
	useBlockProps,
	getColorClassName,
} from '@wordpress/block-editor';

export default function save( { attributes } ) {
	// const {
	// 	// layout
	// 	layout = {},
	// 	// color slugs set by withColors (e.g. "vivid-red", "pale-pink") if chosen
	// 	textColor,
	// 	backgroundColor,
	// 	// styles object for custom (non-palette) colors / typography
	// 	style = {},
	// } = attributes;

	// const {
	// 	justifyContent,
	// 	orientation = 'horizontal',
	// 	flexWrap = 'wrap',
	// } = layout;

	// const textDecoration = style?.typography?.textDecoration;

	// // Recreate the same classes you applied in Edit:
	// const classes = clsx(
	// 	'sagiriswd-tn',
	// 	{
	// 		'items-justified-right': justifyContent === 'right',
	// 		'items-justified-space-between': justifyContent === 'space-between',
	// 		'items-justified-left': justifyContent === 'left',
	// 		'items-justified-center': justifyContent === 'center',
	// 		'is-vertical': orientation === 'vertical',
	// 		'no-wrap': flexWrap === 'nowrap',

	// 		// color support mirrors Edit.js:
	// 		'has-text-color': !!textColor || !!style?.color?.text,
	// 		[ getColorClassName( 'color', textColor ) ]: !!textColor,

	// 		'has-background': !!backgroundColor || !!style?.color?.background,
	// 		[ getColorClassName( 'background-color', backgroundColor ) ]:
	// 			!!backgroundColor,

	// 		[ `has-text-decoration-${ textDecoration }` ]: !!textDecoration,
	// 	}
	// );

	// // If a palette slug was chosen, the class handles it.
	// // If NOT, fall back to inline styles (custom colors).
	// const inlineStyle = {
	// 	color:
	// 		!textColor && style?.color?.text
	// 			? style.color.text
	// 			: undefined,
	// 	backgroundColor:
	// 		!backgroundColor && style?.color?.background
	// 			? style.color.background
	// 			: undefined,
	// };

	// const blockProps = useBlockProps.save( {
	// 	className: classes,
	// 	style: inlineStyle,
	// 	// Add any data-* you actually use on the front-end here.
	// } );

	return (
		<InnerBlocks.Content />
	);
}


