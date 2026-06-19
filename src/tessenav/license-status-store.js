/**
 * Editor-side license status store.
 *
 * Holds a mutable snapshot of premium status so React can re-render the upsell
 * card and dim treatment when the author activates a license in another tab and
 * returns to the editor. Initial value comes from the localized
 * `window.tessenavSettings` snapshot enqueued by PHP.
 */
import { createReduxStore, register } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

const STORE_KEY = 'tessenav/license-status';

const initialSettings =
	( typeof window !== 'undefined' && window.tessenavSettings ) || {};

const DEFAULT_STATE = {
	isPremium: !! initialSettings.isPremium,
	inGracePeriod: !! initialSettings.inGracePeriod,
	graceDaysRemaining: Number( initialSettings.graceDaysRemaining || 0 ),
};

const actions = {
	setStatus( status ) {
		return { type: 'SET_STATUS', status };
	},
	refetch() {
		return async ( { dispatch } ) => {
			try {
				const status = await apiFetch( {
					path: '/tessenav/v1/license-status',
				} );
				dispatch.setStatus( {
					isPremium: !! status.isPremium,
					inGracePeriod: !! status.inGracePeriod,
					graceDaysRemaining: Number(
						status.graceDaysRemaining || 0
					),
				} );
			} catch ( err ) {
				// Network failure or permission denial — keep the existing
				// snapshot. The card stays as-is until the next focus tick.
			}
		};
	},
};

const reducer = ( state = DEFAULT_STATE, action ) => {
	switch ( action.type ) {
		case 'SET_STATUS':
			return { ...state, ...action.status };
		default:
			return state;
	}
};

const selectors = {
	getStatus( state ) {
		return state;
	},
	canRenderAll( state ) {
		return state.isPremium || state.inGracePeriod;
	},
};

const store = createReduxStore( STORE_KEY, {
	reducer,
	actions,
	selectors,
} );

let installed = false;
export function installLicenseStatusStore() {
	if ( installed ) {
		return;
	}
	installed = true;
	register( store );

	if ( typeof window !== 'undefined' ) {
		window.addEventListener( 'focus', () => {
			window.wp?.data?.dispatch( STORE_KEY )?.refetch();
		} );
	}
}

export { STORE_KEY };
