/**
 * Registers a new block provided a unique name and an object defining its behavior.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-registration/
 */
import { registerBlockType } from '@wordpress/blocks';
import { SVG, Path } from '@wordpress/components';

/**
 * Lets webpack process CSS, SASS or SCSS files referenced in JavaScript files.
 * All files containing `style` keyword are bundled together. The code used
 * gets applied both to the front of your site and to the editor.
 *
 * @see https://www.npmjs.com/package/@wordpress/scripts#using-css
 */
import './style.scss';
import './editor.scss';

/**
 * Internal dependencies
 */
import Edit from './edit';
import save from './save';
import metadata from './block.json';

/**
 * Block Editor Icon
 */
const icon = (
	<SVG version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><Path fill-rule="evenodd" class="a" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m18.3 23.8l14-8.4z"/><Path fill-rule="evenodd" class="a" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m32.3 15.4l13.4 8.2z"/><Path fill-rule="evenodd" class="a" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m45.7 23.6l0.5 16.6z"/><Path fill-rule="evenodd" class="a" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m46.2 40.2l-13.9 7.9z"/><Path fill-rule="evenodd" class="a" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m32.3 48.1l-13.9-8z"/><Path fill-rule="evenodd" class="a" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m18.4 40.1l-0.2-15.7z"/><Path fill-rule="evenodd" class="a" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m18.2 23.5l-10.5-6.5z"/><Path fill-rule="evenodd" class="a" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m31.7 3l0.3 12.5z"/><Path fill-rule="evenodd" class="a" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m45.6 23.6l11.2-6.5z"/><Path fill-rule="evenodd" class="a" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m46.2 40.4l9.6 5.9z"/><Path fill-rule="evenodd" class="a" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m32.3 48.1v13.1z"/><Path fill-rule="evenodd" class="a" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m18.6 40l-10.8 6.7z"/><Path fill-rule="evenodd" class="a" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m7.2 46.4l-0.2-29.8z"/><Path fill-rule="evenodd" class="a" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m7.2 16.3l24.4-13.9z"/><Path fill-rule="evenodd" class="a" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m31.8 2.3l25 14.8z"/><Path fill-rule="evenodd" class="a" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m56.8 17.1l-0.2 28.9z"/><Path fill-rule="evenodd" class="a" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m56.3 46.5l-24 14.7z"/><Path fill-rule="evenodd" class="a" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m32.3 61.2l-24.7-14.6z"/><Path fill-rule="evenodd" class="a" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 24l5.9 4.1z"/><Path fill-rule="evenodd" class="a" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m45.7 23.7l-6.1 3.7z"/><Path fill-rule="evenodd" class="a" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m32.3 47.9l-0.1-7.9z"/><Path fill-rule="evenodd" d="m38.1 23.2q0.1-0.3 0-0.6-0.1-0.2-0.4-0.4-0.2-0.2-0.5-0.2-0.3 0-0.5 0.2l-9.2 5.6q-0.1 0.1-0.3 0.3-0.1 0.1-0.2 0.3-0.1 0.1-0.2 0.3-0.1 0.2-0.1 0.4l-2.3 10.5q0 0.3 0.1 0.6 0.1 0.2 0.3 0.4 0.3 0.2 0.6 0.2 0.3 0 0.5-0.2l9.1-5.6q0.2-0.1 0.4-0.3 0.1-0.1 0.2-0.3 0.1-0.1 0.2-0.3 0.1-0.2 0.1-0.4zm-9.4 6.4q0 0 0 0-0.1-0.1-0.1-0.1 0 0 0.1 0 0-0.1 0-0.1l7-4.4-1.7 8.2q0 0 0 0 0 0 0 0 0 0.1-0.1 0.1 0 0 0-0.1z"/></SVG>
)
/**
 * Every block starts by registering a new block type definition.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-registration/
 */
registerBlockType( metadata.name, {
	icon: {
		src: icon
	},
	/**
	 * @see ./edit.js
	 */
	edit: Edit,

	/**
	 * @see ./save.js
	 */
	save,
} );
