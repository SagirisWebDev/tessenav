/**
 * editor.BlockListBlock filter that injects the free-tier UpsellCard immediately
 * before the 4th top-level submenu inside a sagiriswd/tessenav block and adds a
 * screen-reader-only "hidden on live site" announcement to every gated submenu.
 *
 * Scope: only fires for sagiriswd/tessenav-submenu blocks whose parent is a
 * sagiriswd/tessenav block. Early-returns for everything else so the filter cost
 * to non-TesseNav blocks is a single store read.
 */
import { addFilter } from '@wordpress/hooks';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { createElement, Fragment } from '@wordpress/element';

import UpsellCard from './edit/upsell-card';
import { STORE_KEY as LICENSE_STORE_KEY } from './license-status-store';

const TARGET_BLOCK = 'sagiriswd/tessenav-submenu';
const PARENT_BLOCK = 'sagiriswd/tessenav';
const FREE_TIER_CAP = 3;

function withTessenavGate( BlockListBlock ) {
	return ( props ) => {
		const { block, rootClientId, clientId } = props;
		const isCandidate =
			!! block && block.name === TARGET_BLOCK && !! rootClientId;

		// useSelect is called unconditionally to satisfy the Rules of Hooks.
		// For non-candidate blocks the selector short-circuits to null.
		const gateState = useSelect(
			( select ) => {
				if ( ! isCandidate ) {
					return null;
				}
				const editor = select( blockEditorStore );
				const parentName = editor.getBlockName( rootClientId );
				if ( parentName !== PARENT_BLOCK ) {
					return null;
				}

				const canRenderAll =
					select( LICENSE_STORE_KEY ).canRenderAll();
				if ( canRenderAll ) {
					return null;
				}

				const siblings = editor.getBlockOrder( rootClientId );
				const submenuPositions = [];
				siblings.forEach( ( siblingClientId ) => {
					if (
						editor.getBlockName( siblingClientId ) === TARGET_BLOCK
					) {
						submenuPositions.push( {
							clientId: siblingClientId,
							submenuIndex: submenuPositions.length,
						} );
					}
				} );

				const entry = submenuPositions.find(
					( p ) => p.clientId === clientId
				);
				if ( ! entry ) {
					return null;
				}

				const totalSubmenus = submenuPositions.length;
				if ( totalSubmenus <= FREE_TIER_CAP ) {
					return null;
				}

				return {
					submenuIndex: entry.submenuIndex,
					gatedCount: totalSubmenus - FREE_TIER_CAP,
				};
			},
			[ isCandidate, rootClientId, clientId ]
		);

		if ( ! gateState ) {
			return createElement( BlockListBlock, props );
		}

		const { submenuIndex, gatedCount } = gateState;
		const isGated = submenuIndex >= FREE_TIER_CAP;
		const showCardHere = submenuIndex === FREE_TIER_CAP;

		if ( ! isGated && ! showCardHere ) {
			return createElement( BlockListBlock, props );
		}

		const gatedProps = isGated
			? {
					...props,
					className: [ props.className, 'is-tn-gated' ]
						.filter( Boolean )
						.join( ' ' ),
			  }
			: props;

		return createElement(
			Fragment,
			null,
			showCardHere
				? createElement( UpsellCard, { gatedCount } )
				: null,
			isGated
				? createElement(
						'span',
						{ className: 'screen-reader-text' },
						__(
							'Hidden on your live site — upgrade TesseNav to display this submenu.',
							'tessenav-rich-submenus'
						)
				  )
				: null,
			createElement( BlockListBlock, gatedProps )
		);
	};
}

let registered = false;
export function registerUpsellCardFilter() {
	if ( registered ) {
		return;
	}
	registered = true;
	addFilter(
		'editor.BlockListBlock',
		'tessenav/upsell-card',
		withTessenavGate
	);
}
