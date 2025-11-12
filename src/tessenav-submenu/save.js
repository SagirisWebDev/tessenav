/**
 * WordPress dependencies
 */
// import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

// export default function save() {
// 	const blockProps = useBlockProps.save({
// 		className: 'sagiriswd-tn-submenu',
// 	});

// 	const innerProps = useInnerBlocksProps.save( blockProps );

// 	return (
// 		<div { ...innerProps } />
// 	)
// }

/**
 * WordPress dependencies
 */
import { useBlockProps, RichText, InnerBlocks } from '@wordpress/block-editor';

/**
 * Save
 */
export default function save( { attributes } ) {
	// const {
	// 	label = '',
	// 	description = '',
	// 	openSubmenusOnClick = false, // keep parity with edit UI
	// } = attributes;

	// // Match edit: wrapper carries the generic “item” class so color supports apply as expected.
	// const blockProps = useBlockProps.save( {
	// 	className: [
	// 		'sagiriswd-tn-submenu',  // block-specific root
	// 		'sagiriswd-tn-item',     // matches edit for color/spacing states
	// 		openSubmenusOnClick ? 'open-on-click' : null,
	// 	]
	// 		.filter( Boolean )
	// 		.join( ' ' ),
	// } );

	// // Match edit: button when open-on-click, otherwise a simple anchor (no href)
	// const ParentElement = openSubmenusOnClick ? 'button' : 'a';

	return <InnerBlocks.Content />
	// (
	// 	<div { ...blockProps }>
	// 		<ParentElement className="sagiriswd-tn-item__content" aria-haspopup="true" aria-expanded="false">
	// 			<RichText.Content
	// 				tagName="span"
	// 				className="sagiriswd-tn-item__label"
	// 				value={ label }
	// 			/>
	// 			{ !!description && (
	// 				<span className="sagiriswd-tn-item__description">{ description }</span>
	// 			) }
	// 		</ParentElement>

	// 		{/* Keep an icon hook; you can style or inject SVG via CSS if you prefer */}
	// 		<span className="sagiriswd-tn__submenu-icon" aria-hidden="true"></span>

	// 		{/* The submenu panel that contains nested blocks */}
	// 		<div className="sagiriswd-tn-submenu__container" hidden>
	// 			<InnerBlocks.Content />
	// 		</div>
	// 	</div>
	// );
}
