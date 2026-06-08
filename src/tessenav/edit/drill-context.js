/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

// Each block in this plugin is built as a separate webpack bundle, so
// duplicating this module per bundle would produce two distinct Context
// objects — TesseNav's Provider and Submenu's Consumer would never see each
// other. Pin the Context to a global so both bundles share one identity.
const GLOBAL_KEY = '__SAGIRISWD_TESSENAV_DRILL_CONTEXT__';

export const TesseNavDrillContext =
	window[ GLOBAL_KEY ] ||
	( window[ GLOBAL_KEY ] = createContext( null ) );
