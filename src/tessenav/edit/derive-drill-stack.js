/**
 * Pure derivation of the editor drill stack from WP block selection state.
 *
 * @see docs/adr/0004-drill-state-from-block-selection.md
 */

export const TESSENAV_BLOCK = 'sagiriswd/tessenav';
export const SUBMENU_BLOCK = 'sagiriswd/tessenav-submenu';

/**
 * Derive the drill stack — an ordered list of Submenu clientIds, outermost
 * first, ending with the selected Submenu when one is selected.
 *
 * @param {Object}                       args
 * @param {?string}                      args.selectedClientId  Currently selected block's clientId.
 * @param {string}                       args.tessenavClientId  This TesseNav block's clientId.
 * @param {(clientId: string) => string[]} args.getBlockParents Returns ancestors outermost-first.
 * @param {(clientId: string) => string}   args.getBlockName    Returns block name for a clientId.
 * @return {?string[]}                                          Stack, [] for TesseNav itself,
 *                                                              or null when selection is outside the tree.
 */
export function deriveDrillStack( {
	selectedClientId,
	tessenavClientId,
	getBlockParents,
	getBlockName,
} ) {
	if ( ! selectedClientId ) {
		return null;
	}
	if ( selectedClientId === tessenavClientId ) {
		return [];
	}

	const ancestors = getBlockParents( selectedClientId ) || [];
	const tessenavIdx = ancestors.indexOf( tessenavClientId );
	if ( tessenavIdx === -1 ) {
		return null;
	}

	const subtreeAncestors = ancestors.slice( tessenavIdx + 1 );
	const submenusInPath = subtreeAncestors.filter(
		( id ) => getBlockName( id ) === SUBMENU_BLOCK
	);

	if ( getBlockName( selectedClientId ) === SUBMENU_BLOCK ) {
		return [ ...submenusInPath, selectedClientId ];
	}
	return submenusInPath;
}
