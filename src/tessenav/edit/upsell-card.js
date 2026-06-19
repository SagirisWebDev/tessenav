/**
 * Free-tier gate marker rendered before the 4th top-level submenu in the editor canvas.
 *
 * Lives purely in the React tree — never enters block markup, never serializes,
 * never reaches the frontend. The card explains the cap and provides upgrade /
 * license-entry paths.
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import {
	Card,
	CardBody,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Button,
	ExternalLink,
} from '@wordpress/components';
import icon from '../icon';

const UTM_QUERY =
	'utm_source=tessenav-editor&utm_medium=upsell-card&utm_campaign=submenu-gate';

function appendQuery( url, query ) {
	if ( ! url ) {
		return '#';
	}
	const separator = url.includes( '?' ) ? '&' : '?';
	return `${ url }${ separator }${ query }`;
}

export default function UpsellCard( { gatedCount } ) {
	const settings =
		( typeof window !== 'undefined' && window.tessenavSettings ) || {};
	const upgradeHref = appendQuery( settings.upgradeUrl, UTM_QUERY );
	const licenseHref = settings.licensePageUrl || '#';

	const headline = __( 'Unlock more submenus', 'tessenav' );
	const body = sprintf(
		/* translators: %d: number of submenus hidden on the live site */
		_n(
			'Your TesseNav free plan shows the first 3 submenus. Upgrade to display all %d.',
			'Your TesseNav free plan shows the first 3 submenus. Upgrade to display all %d.',
			3 + gatedCount,
			'tessenav'
		),
		3 + gatedCount
	);

	return (
		<div
			className="sagiriswd-tn__upsell-card"
			contentEditable={ false }
			role="region"
			aria-label={ __(
				'TesseNav free-plan limit reached',
				'tessenav'
			) }
		>
			<Card size="small">
				<CardBody>
					<VStack spacing={ 3 }>
						<HStack
							spacing={ 2 }
							alignment="left"
							justify="flex-start"
						>
							<span
								className="sagiriswd-tn__upsell-card-mark"
								aria-hidden="true"
							>
								{ icon() }
							</span>
							<strong>{ headline }</strong>
						</HStack>
						<p className="sagiriswd-tn__upsell-card-body">
							{ body }
						</p>
						<VStack spacing={ 2 } alignment="left">
							<Button
								variant="primary"
								href={ upgradeHref }
								target="_blank"
								rel="noopener noreferrer"
							>
								{ __(
									'Upgrade to TesseNav Premium',
									'tessenav'
								) }
							</Button>
							<ExternalLink href={ licenseHref }>
								{ __(
									'Already have a key?',
									'tessenav'
								) }
							</ExternalLink>
						</VStack>
					</VStack>
				</CardBody>
			</Card>
		</div>
	);
}
