/**
 * WordPress dependencies
 */
import { useInnerBlocksProps } from '@wordpress/block-editor';

export default function save() {
	return { ...useInnerBlocksProps.save() };
}
