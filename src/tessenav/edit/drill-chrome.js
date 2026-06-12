/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { chevronLeft } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

export default function DrillChrome( {
	drillStack,
	tessenavClientId,
	activeSubmenuLabel,
	selectBlock,
} ) {
	if ( drillStack.length === 0 ) {
		return null;
	}

	// WP's block-list selects whichever block contains the currently focused
	// element. Clicking a non-focusable element (like our title <span>) transfers
	// focus to the nearest tabindex'd ancestor — here, the overlay's
	// `.sagiriswd-tn__responsive-close` div, which lives inside the TesseNav
	// block. WP sees focus enter TesseNav and dispatches selectBlock(tessenavId),
	// which empties the drill stack. Calling preventDefault() on mousedown
	// prevents that focus transfer entirely — focus stays where it was, no
	// WP selection fires. stopPropagation kills any additional listeners.
	const blockSelectionTrigger = ( event ) => {
		event.preventDefault();
		event.stopPropagation();
		event.nativeEvent?.stopImmediatePropagation?.();
	};

	// Back button needs to receive its own click — so don't preventDefault on
	// its mousedown. Stop the focus chain by calling preventDefault elsewhere
	// in the chrome, and have onBack itself stopPropagation + dispatch.
	const guardOutsideBack = ( event ) => {
		if ( event.target.closest?.( '.sagiriswd-tn__editor-drill-back' ) ) {
			return;
		}
		blockSelectionTrigger( event );
	};

	const onBack = ( event ) => {
		event.stopPropagation();
		event.nativeEvent?.stopImmediatePropagation?.();
		const parentId =
			drillStack.length > 1
				? drillStack[ drillStack.length - 2 ]
				: tessenavClientId;
		selectBlock( parentId );
	};

	return (
		<div
			className="sagiriswd-tn__editor-drill-chrome"
			onMouseDownCapture={ guardOutsideBack }
			onMouseDown={ guardOutsideBack }
			onClick={ ( event ) => {
				event.stopPropagation();
				event.nativeEvent?.stopImmediatePropagation?.();
			} }
		>
			<Button
				__next40pxDefaultSize
				className="sagiriswd-tn__editor-drill-back"
				icon={ chevronLeft }
				onClick={ onBack }
			>
				{ __( 'Back' ) }
			</Button>
			<span className="sagiriswd-tn__editor-drill-title">
				{ activeSubmenuLabel || __( 'Untitled' ) }
			</span>
		</div>
	);
}
