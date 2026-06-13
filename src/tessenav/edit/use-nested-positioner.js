/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

const TN_DESKTOP_MQ = '(min-width: 782px)';
const SUBMENU_CONTAINER = '.sagiriswd-tn__submenu-container';

function getContainerAncestors( container, root ) {
	const ancestors = [];
	let el = container.parentElement;
	while ( el && el !== root ) {
		if ( el.matches?.( SUBMENU_CONTAINER ) ) {
			ancestors.push( el );
		}
		el = el.parentElement;
	}
	return ancestors;
}

// Force a measurable width on the nested container without permanently
// disturbing its layout state. The editor's static CSS pins closed containers
// to `width:0; height:0` so `offsetWidth` reads 0 even after the test or the
// `.is-selected` state has flipped visibility on. Briefly setting `auto`
// dimensions lets the flyout report its natural size for the fit decision; the
// caller restores whatever was there afterwards.
function measureContainerWidth( container ) {
	const prevWidth = container.style.width;
	const prevHeight = container.style.height;
	const prevMaxWidth = container.style.maxWidth;
	if ( container.offsetWidth === 0 ) {
		container.style.setProperty( 'width', 'auto', 'important' );
		container.style.setProperty( 'height', 'auto', 'important' );
		container.style.setProperty( 'max-width', '1440px', 'important' );
	}
	const width = container.offsetWidth;
	container.style.width = prevWidth;
	container.style.height = prevHeight;
	container.style.maxWidth = prevMaxWidth;
	return width;
}

function pickSide( {
	parentBox,
	blockBox,
	viewportRight,
	viewportLeft,
	width,
} ) {
	const rightFitsBlock = parentBox.right + width <= blockBox.right + 1;
	const leftFitsBlock = parentBox.left - width >= blockBox.left - 1;
	if ( rightFitsBlock ) {
		return 'right';
	}
	if ( leftFitsBlock ) {
		return 'left';
	}
	const rightFitsViewport = parentBox.right + width <= viewportRight + 1;
	const leftFitsViewport = parentBox.left - width >= viewportLeft - 1;
	if ( rightFitsViewport ) {
		return 'right';
	}
	if ( leftFitsViewport ) {
		return 'left';
	}
	const rightRoom = viewportRight - parentBox.right;
	const leftRoom = parentBox.left - viewportLeft;
	return rightRoom >= leftRoom ? 'right' : 'left';
}

function positionContainer( container, root ) {
	const ancestors = getContainerAncestors( container, root );
	if ( ancestors.length === 0 ) {
		return;
	}
	if (
		typeof window !== 'undefined' &&
		typeof window.matchMedia === 'function' &&
		! window.matchMedia( TN_DESKTOP_MQ ).matches
	) {
		delete container.dataset.tnSide;
		return;
	}

	let side;
	if ( ancestors.length >= 2 ) {
		const enclosingSide = ancestors[ 0 ].dataset.tnSide || 'right';
		side = enclosingSide === 'right' ? 'left' : 'right';
	} else {
		const parentBox = ancestors[ 0 ].getBoundingClientRect();
		const blockBox = root.getBoundingClientRect();
		const width = measureContainerWidth( container );
		side = pickSide( {
			parentBox,
			blockBox,
			viewportRight: window.innerWidth,
			viewportLeft: 0,
			width,
		} );
	}

	container.dataset.tnSide = side;
}

function positionChain( leafContainer, root ) {
	const chain = [ leafContainer ];
	let curr = leafContainer.parentElement;
	while ( curr && curr !== root ) {
		if ( curr.matches?.( SUBMENU_CONTAINER ) ) {
			chain.unshift( curr );
		}
		curr = curr.parentElement;
	}
	for ( const c of chain ) {
		positionContainer( c, root );
	}
}

export function useNestedPositioner( navRef ) {
	useEffect( () => {
		const root = navRef.current;
		if ( ! root ) {
			return undefined;
		}

		const handle = ( event ) => {
			const target = event.target;
			if ( ! target || typeof target.closest !== 'function' ) {
				return;
			}
			const hasChild = target.closest( '.has-child' );
			if ( ! hasChild || ! root.contains( hasChild ) ) {
				return;
			}
			const container = hasChild.querySelector(
				`:scope > ${ SUBMENU_CONTAINER }`
			);
			if ( ! container ) {
				return;
			}
			positionChain( container, root );
		};

		root.addEventListener( 'mouseover', handle );
		root.addEventListener( 'focusin', handle );

		const observers = [];
		if ( typeof window.ResizeObserver !== 'undefined' ) {
			root.querySelectorAll( SUBMENU_CONTAINER ).forEach(
				( container ) => {
					const ro = new window.ResizeObserver( () => {
						if ( container.offsetHeight === 0 ) {
							return;
						}
						positionContainer( container, root );
					} );
					ro.observe( container );
					observers.push( ro );
				}
			);
		}

		return () => {
			root.removeEventListener( 'mouseover', handle );
			root.removeEventListener( 'focusin', handle );
			observers.forEach( ( ro ) => ro.disconnect() );
		};
	}, [ navRef ] );
}
