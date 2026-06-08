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

	const onBack = () => {
		const parentId =
			drillStack.length > 1
				? drillStack[ drillStack.length - 2 ]
				: tessenavClientId;
		selectBlock( parentId );
	};

	return (
		<div className="sagiriswd-tn__editor-drill-chrome">
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
