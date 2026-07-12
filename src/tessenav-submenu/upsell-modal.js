/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Modal, Button } from '@wordpress/components';

/**
 * @param {Object}   props
 * @param {string}   props.upgradeUrl URL opened by the CTA button.
 * @param {Function} props.onClose    Called when the user dismisses the modal.
 */
export function UpsellModal( { upgradeUrl, onClose } ) {
	return (
		<Modal
			title={ __( 'Upgrade to TesseNav Premium', 'tessenav-rich-submenus' ) }
			onRequestClose={ onClose }
		>
			<p>
				{ __(
					'The free tier supports up to 3 top-level submenus. Upgrade to TesseNav Premium to add unlimited top-level submenus and unlock all features.',
					'tessenav-rich-submenus'
				) }
			</p>
			<div style={ { display: 'flex', gap: '8px', marginTop: '16px' } }>
				<Button
					variant="primary"
					href={ upgradeUrl || '#' }
					target="_blank"
					rel="noopener noreferrer"
				>
					{ __( 'Upgrade to Premium', 'tessenav-rich-submenus' ) }
				</Button>
				<Button variant="secondary" onClick={ onClose }>
					{ __( 'Dismiss', 'tessenav-rich-submenus' ) }
				</Button>
			</div>
		</Modal>
	);
}
