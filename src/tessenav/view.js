/**
 * WordPress dependencies
 */
import {
	store,
	getContext,
	getElement,
	withSyncEvent,
} from '@wordpress/interactivity';

const focusableSelectors = [
	'a[href]',
	'input:not([disabled]):not([type="hidden"]):not([aria-hidden])',
	'select:not([disabled]):not([aria-hidden])',
	'textarea:not([disabled]):not([aria-hidden])',
	'button:not([disabled]):not([aria-hidden])',
	'[contenteditable]',
	'[tabindex]:not([tabindex^="-"])',
];
// This is a fix for Safari in iOS/iPadOS. Without it, Safari doesn't focus out
// when the user taps in the body. It can be removed once we add an overlay to
// capture the clicks, instead of relying on the focusout event.
document.addEventListener( 'click', () => {} );

// ─── Desktop nested submenu positioning ──────────────────────────────────────
//
// A nested submenu (level 2+) must render inside the horizontal bounds of the
// root `.sagiriswd-tn` block. The level-2 submenu picks `right` (default) or
// `left` of its parent based on whichever side keeps it inside the root. Each
// deeper level alternates — so a grandchild lands on the opposite side of its
// parent, which is the side the grandparent occupies, producing a visual
// stack-over-grandparent effect that keeps the chain within bounds.
//
// CSS gives us `left: 100%` (right of parent) for nested submenus at
// `min-width: 782px`. To flip, we write inline `left/right` with `!important`
// so the inline declaration beats the stylesheet rule.

const TN_DESKTOP_MQ = '(min-width: 782px)';
// The TesseNav block wrapper renders as <nav class="sagiriswd-tn …">. An inner
// <div class="sagiriswd-tn__container sagiriswd-tn …"> ALSO carries the bare
// `sagiriswd-tn` class — using that selector alone would pick up the inner
// container (which is narrower than the actual block) and lead the positioner
// to flip nested submenus against the wrong horizontal bounds.
const TN_ROOT_SELECTOR = 'nav.sagiriswd-tn';
const TN_SUBMENU_CONTAINER = '.sagiriswd-tn__submenu-container';

function tnGetSubmenuAncestors( container, root ) {
	const ancestors = [];
	let el = container.parentElement;
	while ( el && el !== root ) {
		if ( el.matches?.( TN_SUBMENU_CONTAINER ) ) {
			ancestors.push( el );
		}
		el = el.parentElement;
	}
	return ancestors;
}

function tnClearSubmenuSide( container ) {
	container.style.removeProperty( 'left' );
	container.style.removeProperty( 'right' );
	delete container.dataset.tnSide;
	const wrapper = container.parentElement;
	wrapper?.style?.removeProperty( '--tn-hover-bridge-self' );
}

function tnApplySide( container, side, parentSubmenuBox, wrapperBox, width ) {
	// Place the flyout flush with the parent submenu container's outer edge.
	// No clamping — pulling the flyout inward to keep it inside the inline
	// TesseNav block re-introduces the parent-overlap that the side picker just
	// chose a side to avoid (issue #14). If neither side truly fits, the
	// flyout overflows the viewport on the chosen side; that's the lesser
	// evil per the spec: parent-overlap is the hard invariant, viewport bound
	// is soft.
	const leftPx =
		side === 'right'
			? parentSubmenuBox.right - wrapperBox.left
			: parentSubmenuBox.left - width - wrapperBox.left;
	container.style.setProperty( 'left', `${ Math.round( leftPx ) }px`, 'important' );
	container.style.setProperty( 'right', 'auto', 'important' );
	container.dataset.tnSide = side;

	// Hover-bridge width: distance from the wrapper's outer edge to the
	// flyout's inner edge. The wrapper's CSS ::after pseudo reads this
	// variable to size its hover surface across the gap, so the cursor
	// doesn't land in dead space mid-traverse.
	const bridgePx =
		side === 'right'
			? Math.max( 0, leftPx - wrapperBox.width )
			: Math.max( 0, -leftPx );
	const wrapper = container.parentElement;
	wrapper?.style?.setProperty( '--tn-hover-bridge-self', `${ Math.round( bridgePx ) }px` );
}

function tnPositionNestedSubmenu( container, root ) {
	const ancestors = tnGetSubmenuAncestors( container, root );
	if ( ancestors.length === 0 ) {
		// Top-level submenu — positioned by its menu item, leave alone.
		return;
	}

	if ( ! window.matchMedia( TN_DESKTOP_MQ ).matches ) {
		// Mobile breakpoint uses accordion CSS; clear our inline overrides.
		tnClearSubmenuSide( container );
		return;
	}

	// Reset so we can measure natural width without our prior decision skewing it.
	tnClearSubmenuSide( container );

	const rootBox = root.getBoundingClientRect();
	const wrapper = container.parentElement;
	if ( ! wrapper?.classList?.contains( 'has-child' ) ) {
		return;
	}
	const wrapperBox = wrapper.getBoundingClientRect();
	// The parent submenu container — the dropdown holding this wrapper — is the
	// bound we want the nested flyout to sit outside of. Using the wrapper's
	// box instead would let a content-sized wrapper land the flyout INSIDE the
	// parent dropdown area.
	const parentSubmenuBox = ancestors[ 0 ].getBoundingClientRect();
	const width = container.offsetWidth;

	let side;
	if ( ancestors.length === 1 ) {
		// Level 2 — first nested. Decision priority (issue #14):
		//   1. Right fits inside the inline TesseNav block → right.
		//   2. Left fits inside the block → left.
		//   3. Right fits inside the viewport (overflows block) → right.
		//   4. Left fits inside the viewport (overflows block) → left.
		//   5. Neither fits viewport → pick the side with more viewport room.
		// Parent-overlap is never the answer — picking a side that doesn't fit
		// either bound and overflowing the viewport is preferred over clamping
		// inward into the parent dropdown.
		const rightFitsBlock = parentSubmenuBox.right + width <= rootBox.right + 1;
		const leftFitsBlock = parentSubmenuBox.left - width >= rootBox.left - 1;
		const viewportRight = window.innerWidth;
		const rightFitsViewport = parentSubmenuBox.right + width <= viewportRight + 1;
		const leftFitsViewport = parentSubmenuBox.left - width >= -1;
		if ( rightFitsBlock ) {
			side = 'right';
		} else if ( leftFitsBlock ) {
			side = 'left';
		} else if ( rightFitsViewport ) {
			side = 'right';
		} else if ( leftFitsViewport ) {
			side = 'left';
		} else {
			const rightRoom = viewportRight - parentSubmenuBox.right;
			const leftRoom = parentSubmenuBox.left;
			side = rightRoom >= leftRoom ? 'right' : 'left';
		}
	} else {
		// Deeper levels alternate from the immediately enclosing container.
		const enclosingSide = ancestors[ 0 ].dataset.tnSide || 'right';
		side = enclosingSide === 'right' ? 'left' : 'right';
	}

	tnApplySide( container, side, parentSubmenuBox, wrapperBox, width );
}

// Observe size changes on each nested submenu container so that an externally-
// set width (inline style, dynamic content, etc.) triggers a re-evaluation.
const TN_OBSERVED = new WeakSet();
function tnObserveSize( container, root ) {
	if ( TN_OBSERVED.has( container ) ) {
		return;
	}
	TN_OBSERVED.add( container );
	if ( typeof ResizeObserver === 'undefined' ) {
		return;
	}
	const ro = new ResizeObserver( () => {
		// Only reposition if the container is currently visible (height > 0)
		// — avoids work for closed submenus whose width is 0.
		if ( container.offsetHeight === 0 ) {
			return;
		}
		tnPositionNestedSubmenu( container, root );
	} );
	ro.observe( container );
}

function tnInitRoot( root ) {
	const reposition = ( triggerEl ) => {
		const hasChild = triggerEl?.closest?.( '.has-child' );
		if ( ! hasChild || ! root.contains( hasChild ) ) {
			return;
		}
		const container = hasChild.querySelector(
			`:scope > ${ TN_SUBMENU_CONTAINER }`
		);
		if ( ! container ) {
			return;
		}
		// Build the chain from outermost nested container down to this one, then
		// position each in turn so deeper levels see their parent's chosen side.
		const chain = [ container ];
		let curr = container.parentElement;
		while ( curr && curr !== root ) {
			if ( curr.matches?.( TN_SUBMENU_CONTAINER ) ) {
				chain.unshift( curr );
			}
			curr = curr.parentElement;
		}
		// Defer to next frame so CSS :hover / aria-expanded changes apply first.
		requestAnimationFrame( () => {
			for ( const c of chain ) {
				tnPositionNestedSubmenu( c, root );
				tnObserveSize( c, root );
			}
		} );
	};

	const handle = ( event ) => reposition( event.target );
	root.addEventListener( 'mouseover', handle );
	root.addEventListener( 'focusin', handle );
	root.addEventListener( 'click', handle );

	// Recompute on viewport resize — clear all overrides so the next interaction
	// recalculates against the new root width.
	let resizeTimer;
	window.addEventListener( 'resize', () => {
		clearTimeout( resizeTimer );
		resizeTimer = setTimeout( () => {
			root
				.querySelectorAll(
					`${ TN_SUBMENU_CONTAINER } ${ TN_SUBMENU_CONTAINER }`
				)
				.forEach( tnClearSubmenuSide );
		}, 100 );
	} );
}

function tnInitAllRoots() {
	document.querySelectorAll( TN_ROOT_SELECTOR ).forEach( tnInitRoot );
}

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', tnInitAllRoots );
} else {
	tnInitAllRoots();
}

const { state, actions } = store(
	'sagiriswd/tessenav',
	{
		state: {
			get roleAttribute() {
				const ctx = getContext();
				return ctx.type === 'overlay' && state.isMenuOpen
					? 'dialog'
					: null;
			},
			get ariaModal() {
				const ctx = getContext();
				return ctx.type === 'overlay' && state.isMenuOpen
					? 'true'
					: null;
			},
			get ariaLabel() {
				const ctx = getContext();
				return ctx.type === 'overlay' && state.isMenuOpen
					? ctx.ariaLabel
					: null;
			},
			get isMenuOpen() {
				// The menu is opened if either `click`, `hover` or `focus` is true.
				return (
					Object.values( state.menuOpenedBy ).filter( Boolean )
						.length > 0
				);
			},
			get menuOpenedBy() {
				const ctx = getContext();
				return ctx.type === 'overlay'
					? ctx.overlayOpenedBy
					: ctx.submenuOpenedBy;
			},
			// Navigator state.
			currentScreen: 'root',
			screenHistory: [],
			_navDirection: null,
			get isCurrentScreen() {
				const ctx = getContext();
				return state.currentScreen === ( ctx.screenId ?? 'root' );
			},
			get isNavigatingForward() {
				return state._navDirection === 'forward';
			},
			get isNavigatingBack() {
				return state._navDirection === 'back';
			},
		},
		actions: {
			openMenuOnHover() {
				const { type, overlayOpenedBy } = getContext();
				if (
					type === 'submenu' &&
					// Only open on hover if the overlay is closed.
					Object.values( overlayOpenedBy || {} ).filter( Boolean )
						.length === 0
				) {
					actions.openMenu( 'hover' );
				}
			},
			closeMenuOnHover() {
				const { type, overlayOpenedBy } = getContext();
				if (
					type === 'submenu' &&
					// Only close on hover if the overlay is closed.
					Object.values( overlayOpenedBy || {} ).filter( Boolean )
						.length === 0
				) {
					actions.closeMenu( 'hover' );
				}
			},
			openMenuOnClick() {
				const ctx = getContext();
				const { ref } = getElement();
				ctx.previousFocus = ref;
				actions.openMenu( 'click' );
			},
			closeMenuOnClick() {
				actions.closeMenu( 'click' );
				actions.closeMenu( 'focus' );
			},
			openMenuOnFocus() {
				actions.openMenu( 'focus' );
			},
			toggleMenuOnClick() {
				const ctx = getContext();
				const { ref } = getElement();
				// Safari won't send focus to the clicked element, so we need to manually place it: https://bugs.webkit.org/show_bug.cgi?id=22261
				if ( window.document.activeElement !== ref ) {
					ref.focus();
				}
				const { menuOpenedBy } = state;
				if ( menuOpenedBy.click || menuOpenedBy.focus ) {
					actions.closeMenu( 'click' );
					actions.closeMenu( 'focus' );
				} else {
					ctx.previousFocus = ref;
					actions.openMenu( 'click' );
				}
			},
			handleMenuKeydown: withSyncEvent( ( event ) => {
				const { type, firstFocusableElement, lastFocusableElement } =
					getContext();
				if ( state.menuOpenedBy.click ) {
					// If Escape close the menu.
					if ( event.key === 'Escape' ) {
						event.stopPropagation(); // Keeps ancestor menus open.
						actions.closeMenu( 'click' );
						actions.closeMenu( 'focus' );
						return;
					}

					// Trap focus if it is an overlay (main menu).
					if ( type === 'overlay' && event.key === 'Tab' ) {
						// If shift + tab it change the direction.
						if (
							event.shiftKey &&
							window.document.activeElement ===
								firstFocusableElement
						) {
							event.preventDefault();
							lastFocusableElement.focus();
						} else if (
							! event.shiftKey &&
							window.document.activeElement ===
								lastFocusableElement
						) {
							event.preventDefault();
							firstFocusableElement.focus();
						}
					}
				}
			} ),
			handleMenuFocusout( event ) {
				const { modal, type } = getContext();
				// If focus is outside modal, and in the document, close menu
				// event.target === The element losing focus
				// event.relatedTarget === The element receiving focus (if any)
				// When focusout is outside the document,
				// `window.document.activeElement` doesn't change.

				// The event.relatedTarget is null when something outside the navigation menu is clicked. This is only necessary for Safari.
				if (
					event.relatedTarget === null ||
					( ! modal?.contains( event.relatedTarget ) &&
						event.target !== window.document.activeElement &&
						type === 'submenu' )
				) {
					// When a navigator screen transition hides the focused element
					// (display:none on the parent screen), the browser drops focus
					// producing relatedTarget=null. Detect this by checking offsetParent:
					// a visible element has a non-null offsetParent; a hidden one does not.
					if (
						type === 'overlay' &&
						event.relatedTarget === null &&
						event.target?.offsetParent === null
					) {
						return;
					}
					actions.closeMenu( 'click' );
					actions.closeMenu( 'focus' );
				}
			},

			openMenu( menuOpenedOn = 'click' ) {
				const { type } = getContext();
				state.menuOpenedBy[ menuOpenedOn ] = true;
				if ( type === 'overlay' ) {
					// Add a `has-modal-open` class to the <html> root.
					document.documentElement.classList.add( 'has-modal-open' );
				}
			},

			closeMenu( menuClosedOn = 'click' ) {
				const ctx = getContext();
				state.menuOpenedBy[ menuClosedOn ] = false;
				// Check if the menu is still open or not.
				if ( ! state.isMenuOpen ) {
					if (
						ctx.modal?.contains( window.document.activeElement )
					) {
						ctx.previousFocus?.focus();
					}
					ctx.modal = null;
					ctx.previousFocus = null;
					if ( ctx.type === 'overlay' ) {
						document.documentElement.classList.remove(
							'has-modal-open'
						);
						// Reset navigator to root when overlay closes.
						state.currentScreen = 'root';
						state.screenHistory = [];
						state._navDirection = null;
					}
				}
			},
			navigateTo() {
				const { screenId } = getContext();
				state.screenHistory = [ ...state.screenHistory, state.currentScreen ];
				state._navDirection = 'forward';
				state.currentScreen = screenId;
			},
			navigateBack() {
				if ( state.screenHistory.length > 0 ) {
					const history = [ ...state.screenHistory ];
					const previous = history.pop();
					state._navDirection = 'back';
					state.screenHistory = history;
					state.currentScreen = previous;
				}
			},
		},
		callbacks: {
			initMenu() {
				const ctx = getContext();
				const { ref } = getElement();
				if ( state.isMenuOpen ) {
					const focusableElements =
						ref.querySelectorAll( focusableSelectors );
					ctx.modal = ref;
					ctx.firstFocusableElement = focusableElements[ 0 ];
					ctx.lastFocusableElement =
						focusableElements[ focusableElements.length - 1 ];
				}
			},
			focusFirstElement() {
				const { ref } = getElement();
				if ( state.isMenuOpen ) {
					const focusableElements =
						ref.querySelectorAll( focusableSelectors );
					focusableElements?.[ 0 ]?.focus();
				}
			},
		},
	},
	{ lock: true }
);
