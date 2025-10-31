/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const transforms = {
	from: [
		{
			type: 'block',
			blocks: [ 'core/site-logo' ],
			transform: () => {
				return createBlock( 'sagiriswd-tn-link' );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/spacer' ],
			transform: () => {
				return createBlock( 'sagiriswd-tn-link' );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/home-link' ],
			transform: () => {
				return createBlock( 'sagiriswd-tn-link' );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/social-links' ],
			transform: () => {
				return createBlock( 'sagiriswd-tn-link' );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/search' ],
			transform: () => {
				return createBlock( 'sagiriswd-tn-link' );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/page-list' ],
			transform: () => {
				return createBlock( 'sagiriswd-tn-link' );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/buttons' ],
			transform: () => {
				return createBlock( 'sagiriswd-tn-link' );
			},
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'sagiriswd-tn-submenu' ],
			transform: ( attributes, innerBlocks ) =>
				createBlock(
					'sagiriswd-tn-submenu',
					attributes,
					innerBlocks
				),
		},
		{
			type: 'block',
			blocks: [ 'core/spacer' ],
			transform: () => {
				return createBlock( 'core/spacer' );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/site-logo' ],
			transform: () => {
				return createBlock( 'core/site-logo' );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/home-link' ],
			transform: () => {
				return createBlock( 'core/home-link' );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/social-links' ],
			transform: () => {
				return createBlock( 'core/social-links' );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/search' ],
			transform: () => {
				return createBlock( 'core/search', {
					showLabel: false,
					buttonUseIcon: true,
					buttonPosition: 'button-inside',
				} );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/page-list' ],
			transform: () => {
				return createBlock( 'core/page-list' );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/buttons' ],
			transform: ( { label, url, rel, title, opensInNewTab } ) => {
				return createBlock( 'core/buttons', {}, [
					createBlock( 'core/button', {
						text: label,
						url,
						rel,
						title,
						linkTarget: opensInNewTab ? '_blank' : undefined,
					} ),
				] );
			},
		},
	],
};

export default transforms;
