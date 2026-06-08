/**
 * Jest unit tests — deriveDrillStack (issue #9 red phase).
 *
 * Tests the pure function that derives the drill stack from WP block
 * selection state. See:
 *   docs/adr/0004-drill-state-from-block-selection.md
 *
 * Function signature:
 *   deriveDrillStack({ selectedClientId, tessenavClientId, getBlockParents, getBlockName })
 *   → string[] | null
 *
 * Return contract (from ADR 0004 + issue #9):
 *   - null   → selection is outside the TesseNav tree; caller preserves last state.
 *   - []     → TesseNav block itself is selected.
 *   - [id…]  → ordered array of Submenu clientIds, outermost first (direct child
 *               of TesseNav → innermost), with the selected block appended when
 *               it IS a Submenu.
 *
 * The source file lives at src/tessenav/edit/derive-drill-stack.js —
 * the implementer will create it. Until then, every test here fails with
 * Cannot find module, satisfying the red phase requirement.
 */

import { deriveDrillStack } from '../../src/tessenav/edit/derive-drill-stack.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const TESSENAV    = 'sagiriswd/tessenav';
const SUBMENU     = 'sagiriswd/tessenav-submenu';
const PARAGRAPH   = 'core/paragraph';
const ROW         = 'core/row';

// ─── Test helpers ─────────────────────────────────────────────────────────────

/**
 * Build a minimal `getBlockName` lookup from a clientId→blockName map.
 * @param {Record<string, string>} map
 * @returns {(clientId: string) => string}
 */
function makeGetBlockName( map ) {
	return ( clientId ) => map[ clientId ] ?? null;
}

/**
 * Build a minimal `getBlockParents` from a child→[...ancestors outermost-first] map.
 * WP's `getBlockParents(clientId)` returns ancestors outermost-first.
 * @param {Record<string, string[]>} ancestorMap
 * @returns {(clientId: string) => string[]}
 */
function makeGetBlockParents( ancestorMap ) {
	return ( clientId ) => ancestorMap[ clientId ] ?? [];
}

// ─── describe: TesseNav itself selected ──────────────────────────────────────

describe( 'deriveDrillStack — TesseNav block is selected', () => {
	it( 'returns [] when the TesseNav block itself is selected', () => {
		const tessenavClientId = 'tn-1';
		const getBlockName = makeGetBlockName( { 'tn-1': TESSENAV } );
		// TesseNav has no parents in the tree we care about.
		const getBlockParents = makeGetBlockParents( { 'tn-1': [] } );

		const result = deriveDrillStack( {
			selectedClientId: tessenavClientId,
			tessenavClientId,
			getBlockParents,
			getBlockName,
		} );

		expect( result ).toEqual( [] );
	} );
} );

// ─── describe: top-level Submenu selected ────────────────────────────────────

describe( 'deriveDrillStack — top-level Submenu is selected', () => {
	it( 'returns [submenuId] when a direct-child Submenu of TesseNav is selected', () => {
		const tessenavClientId = 'tn-1';
		const submenuId = 'sm-a';

		const getBlockName = makeGetBlockName( {
			'tn-1': TESSENAV,
			'sm-a': SUBMENU,
		} );
		// Ancestors of sm-a outermost-first: [tn-1]
		const getBlockParents = makeGetBlockParents( {
			'sm-a': [ 'tn-1' ],
		} );

		const result = deriveDrillStack( {
			selectedClientId: submenuId,
			tessenavClientId,
			getBlockParents,
			getBlockName,
		} );

		expect( result ).toEqual( [ submenuId ] );
	} );
} );

// ─── describe: non-Submenu block nested inside one Submenu ───────────────────

describe( 'deriveDrillStack — non-Submenu block nested inside a single Submenu', () => {
	it( 'returns [outerSubmenuId] — only the containing Submenu, no non-Submenu entries', () => {
		const tessenavClientId = 'tn-1';
		const submenuId = 'sm-a';
		const paragraphId = 'p-1';

		const getBlockName = makeGetBlockName( {
			'tn-1': TESSENAV,
			'sm-a': SUBMENU,
			'p-1':  PARAGRAPH,
		} );
		// Ancestors of p-1 outermost-first: [tn-1, sm-a]
		const getBlockParents = makeGetBlockParents( {
			'p-1': [ 'tn-1', 'sm-a' ],
		} );

		const result = deriveDrillStack( {
			selectedClientId: paragraphId,
			tessenavClientId,
			getBlockParents,
			getBlockName,
		} );

		// The stack must contain only Submenus — no paragraph entry.
		expect( result ).toEqual( [ submenuId ] );
	} );
} );

// ─── describe: non-Submenu nested several levels deep ────────────────────────

describe( 'deriveDrillStack — non-Submenu nested several levels deep', () => {
	it(
		'returns [outerSubmenuId, innerSubmenuId] for a paragraph inside a row ' +
		'inside an inner Submenu inside an outer Submenu',
		() => {
			const tessenavClientId = 'tn-1';
			const outerSubmenuId   = 'sm-outer';
			const innerSubmenuId   = 'sm-inner';
			const rowId            = 'row-1';
			const paragraphId      = 'p-1';

			const getBlockName = makeGetBlockName( {
				'tn-1':     TESSENAV,
				'sm-outer': SUBMENU,
				'sm-inner': SUBMENU,
				'row-1':    ROW,
				'p-1':      PARAGRAPH,
			} );
			// Ancestors of p-1 outermost-first: [tn-1, sm-outer, sm-inner, row-1]
			const getBlockParents = makeGetBlockParents( {
				'p-1': [ 'tn-1', 'sm-outer', 'sm-inner', 'row-1' ],
			} );

			const result = deriveDrillStack( {
				selectedClientId: paragraphId,
				tessenavClientId,
				getBlockParents,
				getBlockName,
			} );

			// Non-Submenu blocks (row-1, p-1) must not appear in the stack.
			expect( result ).toEqual( [ outerSubmenuId, innerSubmenuId ] );
		}
	);
} );

// ─── describe: nested Submenu selected (stack includes itself) ────────────────

describe( 'deriveDrillStack — nested Submenu selected', () => {
	it(
		'returns [outerSubmenuId, innerSubmenuId] when the selected block is ' +
		'itself a Submenu nested inside another Submenu',
		() => {
			const tessenavClientId = 'tn-1';
			const outerSubmenuId   = 'sm-outer';
			const innerSubmenuId   = 'sm-inner';

			const getBlockName = makeGetBlockName( {
				'tn-1':     TESSENAV,
				'sm-outer': SUBMENU,
				'sm-inner': SUBMENU,
			} );
			// Ancestors of sm-inner outermost-first: [tn-1, sm-outer]
			const getBlockParents = makeGetBlockParents( {
				'sm-inner': [ 'tn-1', 'sm-outer' ],
			} );

			const result = deriveDrillStack( {
				selectedClientId: innerSubmenuId,
				tessenavClientId,
				getBlockParents,
				getBlockName,
			} );

			// The selected Submenu must be appended to the ancestor chain.
			expect( result ).toEqual( [ outerSubmenuId, innerSubmenuId ] );
		}
	);

	it(
		'returns [sm-a, sm-b, sm-c] for a Submenu three levels deep',
		() => {
			const tessenavClientId = 'tn-1';

			const getBlockName = makeGetBlockName( {
				'tn-1': TESSENAV,
				'sm-a': SUBMENU,
				'sm-b': SUBMENU,
				'sm-c': SUBMENU,
			} );
			// Ancestors of sm-c outermost-first: [tn-1, sm-a, sm-b]
			const getBlockParents = makeGetBlockParents( {
				'sm-c': [ 'tn-1', 'sm-a', 'sm-b' ],
			} );

			const result = deriveDrillStack( {
				selectedClientId: 'sm-c',
				tessenavClientId,
				getBlockParents,
				getBlockName,
			} );

			expect( result ).toEqual( [ 'sm-a', 'sm-b', 'sm-c' ] );
		}
	);
} );

// ─── describe: selection is null ─────────────────────────────────────────────

describe( 'deriveDrillStack — null selection', () => {
	it( 'returns null when selectedClientId is null', () => {
		const tessenavClientId = 'tn-1';
		const getBlockName = makeGetBlockName( { 'tn-1': TESSENAV } );
		const getBlockParents = makeGetBlockParents( {} );

		const result = deriveDrillStack( {
			selectedClientId: null,
			tessenavClientId,
			getBlockParents,
			getBlockName,
		} );

		expect( result ).toBeNull();
	} );

	it( 'returns null when selectedClientId is an empty string', () => {
		const tessenavClientId = 'tn-1';
		const getBlockName = makeGetBlockName( {} );
		const getBlockParents = makeGetBlockParents( {} );

		const result = deriveDrillStack( {
			selectedClientId: '',
			tessenavClientId,
			getBlockParents,
			getBlockName,
		} );

		expect( result ).toBeNull();
	} );
} );

// ─── describe: selection is outside the TesseNav tree ────────────────────────

describe( 'deriveDrillStack — selection outside TesseNav tree', () => {
	it( 'returns null when the selected block has no ancestor matching tessenavClientId', () => {
		const tessenavClientId = 'tn-1';
		const outsideBlockId   = 'post-title';

		const getBlockName = makeGetBlockName( {
			'tn-1':       TESSENAV,
			'post-title': 'core/post-title',
		} );
		// post-title has no ancestors inside the TesseNav tree.
		const getBlockParents = makeGetBlockParents( {
			'post-title': [ 'page-root' ],
		} );

		const result = deriveDrillStack( {
			selectedClientId: outsideBlockId,
			tessenavClientId,
			getBlockParents,
			getBlockName,
		} );

		expect( result ).toBeNull();
	} );

	it(
		'returns null even when WP returns ancestors that include blocks above ' +
		'the TesseNav block — the function caps at tessenavClientId',
		() => {
			const tessenavClientId = 'tn-1';
			const submenuId        = 'sm-a';
			const paragraphId      = 'p-outside';

			const getBlockName = makeGetBlockName( {
				'page-root': 'core/post-content',
				'tn-1':      TESSENAV,
				'sm-a':      SUBMENU,
				// p-outside is NOT inside the TesseNav tree despite being listed
				// after tn-1 in the ancestor list (simulates a miscalled scenario).
				'p-outside': PARAGRAPH,
			} );
			// This block lives outside TesseNav — its ancestor list does NOT contain tn-1.
			const getBlockParents = makeGetBlockParents( {
				'p-outside': [ 'page-root' ],
			} );

			const result = deriveDrillStack( {
				selectedClientId: paragraphId,
				tessenavClientId,
				getBlockParents,
				getBlockName,
			} );

			expect( result ).toBeNull();
		}
	);

	it(
		'does not include ancestors above tessenavClientId even when WP returns ' +
		'them (caps at TesseNav, ignores blocks higher in the document tree)',
		() => {
			const tessenavClientId = 'tn-1';
			const submenuId        = 'sm-a';
			const paragraphId      = 'p-1';

			const getBlockName = makeGetBlockName( {
				'page-root': 'core/post-content',
				'col-1':     'core/column',
				'tn-1':      TESSENAV,
				'sm-a':      SUBMENU,
				'p-1':       PARAGRAPH,
			} );
			// WP returns ALL ancestors including those above TesseNav.
			// [page-root, col-1, tn-1, sm-a] — outermost first.
			const getBlockParents = makeGetBlockParents( {
				'p-1': [ 'page-root', 'col-1', 'tn-1', 'sm-a' ],
			} );

			const result = deriveDrillStack( {
				selectedClientId: paragraphId,
				tessenavClientId,
				getBlockParents,
				getBlockName,
			} );

			// Only blocks inside the TesseNav subtree count.
			// page-root and col-1 must be absent from the stack.
			expect( result ).toEqual( [ submenuId ] );
		}
	);
} );
