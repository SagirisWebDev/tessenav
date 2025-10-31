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
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const {
		// purely for styling hints; none of these are required
		maxPanelWidth,     // e.g., number (px) or empty
		panelWidthMode,    // 'auto' | 'match' | 'custom'
		stackAt,           // 'mobile' | 'tablet' | 'never'
		classNameSuffix,   // optional extra class like 'is-header'
	} = attributes;

	// Expose a couple of CSS custom properties so your stylesheet
	// can lay out “mega menu” panels without any runtime JS.
	const styleVars = {
		'--tn-panel-width-mode': panelWidthMode || 'auto',
		...( panelWidthMode === 'custom' && maxPanelWidth
			? { '--tn-panel-max-width': `${ maxPanelWidth }px` }
			: null ),
		'--tn-stack-at': stackAt || 'mobile',
	};

	const blockProps = useBlockProps.save( {
		className: [
			'sagiriswd-tn',
			classNameSuffix ? `sagiriswd-tn--${ classNameSuffix }` : null,
		].filter( Boolean ).join( ' ' ),
		style: styleVars,
		'data-wp-interactive': 'core/navigation',
		'data-wp-class--is-open': 'state.isMenuOpen',
	} );

	const innerBlockProps = useInnerBlocksProps.save( blockProps );
	return (
		<div { ...innerBlockProps } />
	);
}

