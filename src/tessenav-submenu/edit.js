/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import { displayShortcut, isKeyboardEvent } from '@wordpress/keycodes';
import { __ } from '@wordpress/i18n';
import {
	BlockControls,
	InnerBlocks,
	useInnerBlocksProps,
	InspectorControls,
	RichText,
	useBlockProps,
	store as blockEditorStore,
	getColorClassName,
} from '@wordpress/block-editor';
import { isURL, prependHTTP } from '@wordpress/url';
import { useState, useEffect, useRef } from '@wordpress/element';
import { link as linkIcon, removeSubmenu } from '@wordpress/icons';
import { speak } from '@wordpress/a11y';
import { createBlock } from '@wordpress/blocks';
import { useMergeRefs, usePrevious, useResizeObserver } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { ItemSubmenuIcon } from './icons';
import { LinkUI } from '../tessenav-link/link-ui';
import { updateAttributes } from '../update-attributes';
import { Controls } from '../controls';
import {
	getColors,
	getSubmenuChildBlockProps,
} from '../utils';
import { DEFAULT_BLOCK } from '../constants';

const ALLOWED_BLOCKS = [
	'sagiriswd/tessenav-link',
	'core/group',
	'core/row',
	'core/stack',
	'core/columns',
	'core/grid',
	'core/paragraph'
];

/**
 * A React hook to determine if it's dragging within the target element.
 *
 * @typedef {import('@wordpress/element').RefObject} RefObject
 *
 * @param {RefObject<HTMLElement>} elementRef The target elementRef object.
 *
 * @return {boolean} Is dragging within the target element.
 */
const useIsDraggingWithin = ( elementRef ) => {
	const [ isDraggingWithin, setIsDraggingWithin ] = useState( false );

	useEffect( () => {
		const { ownerDocument } = elementRef.current;

		function handleDragStart( event ) {
			// Check the first time when the dragging starts.
			handleDragEnter( event );
		}

		// Set to false whenever the user cancel the drag event by either releasing the mouse or press Escape.
		function handleDragEnd() {
			setIsDraggingWithin( false );
		}

		function handleDragEnter( event ) {
			// Check if the current target is inside the item element.
			if ( elementRef.current.contains( event.target ) ) {
				setIsDraggingWithin( true );
			} else {
				setIsDraggingWithin( false );
			}
		}

		// Bind these events to the document to catch all drag events.
		// Ideally, we can also use `event.relatedTarget`, but sadly that
		// doesn't work in Safari.
		ownerDocument.addEventListener( 'dragstart', handleDragStart );
		ownerDocument.addEventListener( 'dragend', handleDragEnd );
		ownerDocument.addEventListener( 'dragenter', handleDragEnter );

		return () => {
			ownerDocument.removeEventListener( 'dragstart', handleDragStart );
			ownerDocument.removeEventListener( 'dragend', handleDragEnd );
			ownerDocument.removeEventListener( 'dragenter', handleDragEnter );
		};
	}, [] );

	return isDraggingWithin;
};

/**
 * @typedef {'post-type'|'custom'|'taxonomy'|'post-type-archive'} WPNavigationLinkKind
 */

/**
 * Navigation Link Block Attributes
 *
 * @typedef {Object} WPNavigationLinkBlockAttributes
 *
 * @property {string}               [label]         Link text.
 * @property {WPNavigationLinkKind} [kind]          Kind is used to differentiate between term and post ids to check post draft status.
 * @property {string}               [type]          The type such as post, page, tag, category and other custom types.
 * @property {string}               [rel]           The relationship of the linked URL.
 * @property {number}               [id]            A post or term id.
 * @property {boolean}              [opensInNewTab] Sets link target to _blank when true.
 * @property {string}               [url]           Link href.
 */

export default function Edit( {
	attributes,
	isSelected,
	setAttributes,
	mergeBlocks,
	onReplace,
	context,
	clientId,
} ) {
	const {
		label,
		url,
		description,
		title,
		id,
		kind,
		type,
		rel,
		opensInNewTab,
		isTopLevelLink
	} = attributes;

	const { showSubmenuIcon, maxNestingLevel, openSubmenusOnClick } = context;

	const {
		__unstableMarkNextChangeAsNotPersistent,
		replaceBlock,
		selectBlock,
	} = useDispatch( blockEditorStore );
	const [ isSubmenuOpen, setIsSubmenuOpen ] = useState( false );
	const [ isLinkUIOpen, setIsLinkUIOpen ] = useState( false );
	// Store what element opened the popover, so we know where to return focus to (toolbar button vs navigation link text)
	const [ openedBy, setOpenedBy ] = useState( null );
	// Use internal state instead of a ref to make sure that the component
	// re-renders when the popover's anchor updates.
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );
	const listItemRef = useRef( null );
	const isDraggingWithin = useIsDraggingWithin( listItemRef );
	const itemLabelPlaceholder = __( 'Add text…' );
	const ref = useRef();

	const {
		parentCount,
		isParentOfSelectedBlock,
		isImmediateParentOfSelectedBlock,
		hasChildren,
		selectedBlockHasChildren,
		onlyDescendantIsEmptyLink,
		isParentSelected,
		isInSecondHalf
	} = useSelect(
		( select ) => {
			const {
				hasSelectedInnerBlock,
				getSelectedBlockClientId,
				getBlockParentsByBlockName,
				getBlock,
				getBlockIndex,
				getBlockCount,
				getBlockOrder
			} = select( blockEditorStore );

			let _onlyDescendantIsEmptyLink;

			const selectedBlockId = getSelectedBlockClientId();

			const selectedBlockChildren = getBlockOrder( selectedBlockId );

			// Check for a single descendant in the submenu. If that block
			// is a paragraph block without content then
			// we can consider as an "empty" link.
			if ( selectedBlockChildren?.length === 1 ) {
				const singleBlock = getBlock( selectedBlockChildren[ 0 ] );

				_onlyDescendantIsEmptyLink =
					singleBlock?.name === 'core/paragraph' &&
					! singleBlock?.attributes?.content;
			}

			let isInSecondHalf = false;

			const parentBlock = getBlockParentsByBlockName(clientId, 'sagiriswd/tessenav');

			if ( parentBlock.length >= 1 ) {
				const desktop = window.innerWidth >= 600;
				const pid = parentBlock[0];
				const childCount = getBlockCount(pid);
				const index = getBlockIndex( clientId ) + 1;
				isInSecondHalf = desktop && childCount > 2  && ( childCount / index ) < 1.5 ? true : false;
			}

			return {
				parentCount: getBlockParentsByBlockName(
					clientId,
					'sagiriswd/tessenav-submenu'
				).length,
				isParentOfSelectedBlock: hasSelectedInnerBlock(
					clientId,
					true
				),
				isImmediateParentOfSelectedBlock: hasSelectedInnerBlock(
					clientId,
					true
				),
				hasChildren: !! getBlockCount( clientId ),
				selectedBlockHasChildren: !! selectedBlockChildren?.length,
				onlyDescendantIsEmptyLink: _onlyDescendantIsEmptyLink,
				isParentSelected: selectedBlockId === clientId,
				isInSecondHalf: isInSecondHalf
			};
		},
		[ clientId ]
	);
	useEffect( () => {
		setAttributes( { isInSecondHalf: isInSecondHalf } );
	}, [ attributes[ 'isInSecondHalf' ] ] )

	const prevHasChildren = usePrevious( hasChildren );

	/**
	 * Opens the submenu when an innerblock is selected in the List View, otherwise the block supports don't show.
	 */
	const { hasSelectedInnerBlock } = useSelect( ( select ) => {
		const s = select( blockEditorStore );
		return {
			hasSelectedInnerBlock: s.hasSelectedInnerBlock( clientId, true ),
		};
	}, [ clientId ] );

	useEffect( () => {
		if ( hasSelectedInnerBlock ) setIsSubmenuOpen( true );
	}, [ hasSelectedInnerBlock ]);

	/**
	 * Prevents the block supports of this block from appearing in nested core/navigation and core/navigation-submenu block supports
	 */
	useSelect( ( select ) => {
		const s = select( blockEditorStore );
		return { nestedNavSelected: s.getSelectedBlockClientId() === clientId };
  }, [ clientId ] );

	// Show the Submenu on mount if the URL is empty
	// ( When adding a new menu item)
	// This can't be done in the useState call because it conflicts
	// with the autofocus behavior of the BlockListBlock component.
	useEffect( () => {
		if ( ! openSubmenusOnClick && label ) {
			setIsSubmenuOpen( true );
		}
	}, [] );

	/**
	 * The hook shouldn't be necessary but due to a focus loss happening
	 * when selecting a block in the submenu popover, we force close on block unselection.
	 */
	useEffect( () => {
		if ( ! isSelected ) {
			setIsSubmenuOpen( true );
		}
	}, [ isSelected ] );

	// If the submenu popover is open and the label has changed, close the submenu and focus the label text.
	useEffect( () => {
		if ( isSubmenuOpen && url ) {
						// Does this look like a URL and have something TLD-ish?
			if (
				isURL( prependHTTP( label ) ) &&
				/^.+\.[a-z]+/.test( label )
			) {
				// Focus and select the label text.
				selectLabelText();
			}
		}
	}, [ url ] );

	/**
	 * Focus the Link label text and select it.
	 */
	function selectLabelText() {
		ref.current.focus();
		const { ownerDocument } = ref.current;
		const { defaultView } = ownerDocument;
		const selection = defaultView.getSelection();
		const range = ownerDocument.createRange();
		// Get the range of the current ref contents so we can add this range to the selection.
		range.selectNodeContents( ref.current );
		selection.removeAllRanges();
		selection.addRange( range );
	}

	const {
		textColor,
		customTextColor,
		backgroundColor,
		customBackgroundColor,
	} = getColors( context, parentCount > 0 );

	function onKeyDown( event ) {
		if ( isKeyboardEvent.primary( event, 'k' ) ) {
			// Required to prevent the command center from opening,
			// as it shares the CMD+K shortcut.
			// See https://github.com/WordPress/gutenberg/pull/59845.
			event.preventDefault();
			// If we don't stop propagation, this event bubbles up to the parent submenu item
			event.stopPropagation();
			setIsSubmenuOpen( true );
			setOpenedBy( ref.current );
		}
	}

	const blockProps = useBlockProps( {
		ref: useMergeRefs( [ setPopoverAnchor, listItemRef ] ),
		className: clsx( 'sagiriswd-tn-item', {
			'is-editing': isSelected || isParentOfSelectedBlock,
			'is-dragging-within': isDraggingWithin,
			'has-link': !! url,
			'has-child': hasChildren,
			'has-text-color': !! textColor || !! customTextColor,
			[ getColorClassName( 'color', textColor ) ]: !! textColor,
			'has-background': !! backgroundColor || customBackgroundColor,
			[ getColorClassName( 'background-color', backgroundColor ) ]:
				!! backgroundColor,
			'open-on-click': openSubmenusOnClick,
		} ),
		style: {
			color: ! textColor && customTextColor,
			backgroundColor: ! backgroundColor && customBackgroundColor,
		},
		onKeyDown,
	} );

	const btnStyles = {
		color: ! textColor && customTextColor,
		backgroundColor: ! backgroundColor && customBackgroundColor,
	};

	// Always use overlay colors for submenus.
	const innerBlocksColors = getColors( attributes, true );


	// Set anchor positions for submenus
	const pos = isInSecondHalf
							? {
								left: 'revert',
								right: '0px'
							} : {
								right: 'revert',
								left: '0px'
							};
	const innerProps = { innerBlocksColors, ...pos };
	const allowedBlocks =
		parentCount >= maxNestingLevel
			? ALLOWED_BLOCKS.filter(
					( blockName ) => blockName !== (
						'sagiriswd/tessenav-submenu' ||
						'core/group' ||
						'core/row' ||
						'core/stack' ||
						'core/columns' ||
						'core/grid'
					)
			  )
			: ALLOWED_BLOCKS;

	const submenuChildBlockProps =
		getSubmenuChildBlockProps( innerProps );
	const innerBlocksProps = useInnerBlocksProps(
		submenuChildBlockProps,
		{
		allowedBlocks,
		defaultBlock: DEFAULT_BLOCK,
		directInsert: true,

		// Ensure block toolbar is not too far removed from item
		// being edited.
		// see: https://github.com/WordPress/gutenberg/pull/34615.
		__experimentalCaptureToolbars: true,

		renderAppender:
			( ! isImmediateParentOfSelectedBlock &&
				isParentSelected )
				? InnerBlocks.ButtonBlockAppender
				: false,
	} );

	const ParentElement = openSubmenusOnClick ? 'button' : 'a';

	function transformToTesseNavLink() {
		const newLinkBlock = createBlock( 'sagiriswd/tessenav-link', {
			label: itemLabelPlaceholder,
			url: url,
			title: title,
			description: description,
			id: id,
			kind: kind,
			type: type,
			opensInNewTab: opensInNewTab,
			rel: rel,
			isTopLevelLink: isTopLevelLink
		} );
		replaceBlock( clientId, newLinkBlock );
		setIsLinkUIOpen( true );
	}

	useEffect( () => {
		// If block becomes empty, transform to TesseNavLink.
		if ( ! hasChildren && prevHasChildren ) {
			// This side-effect should not create an undo level as those should
			// only be created via user interactions.
			__unstableMarkNextChangeAsNotPersistent();
			transformToTesseNavLink();
		}
	}, [ hasChildren, prevHasChildren ] );

	const canConvertToLink =
		! selectedBlockHasChildren || onlyDescendantIsEmptyLink;

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					{ ! openSubmenusOnClick && (
						<ToolbarButton
							name="link"
							icon={ linkIcon }
							title={ __( 'Link' ) }
							shortcut={ displayShortcut.primary( 'k' ) }
							onClick={ ( event ) => {
								setIsLinkUIOpen( true );
								setOpenedBy( event.currentTarget );
							} }
						/>
					) }

					<ToolbarButton
						name="revert"
						icon={ removeSubmenu }
						title={ __( 'Convert to Link' ) }
						onClick={ transformToTesseNavLink }
						className="sagiriswd-tn-submenu__revert"
						disabled={ ! canConvertToLink }
					/>
				</ToolbarGroup>
			</BlockControls>
			<InspectorControls group="settings">
				<Controls
					attributes={ attributes }
					setAttributes={ setAttributes }
				/>
			</InspectorControls>
			<div { ...blockProps }>
				{ /* eslint-disable jsx-a11y/anchor-is-valid */ }
				<ParentElement className="sagiriswd-tn-item__content">
					{ /* eslint-enable */ }
					<RichText
						ref={ ref }
						identifier="label"
						className="sagiriswd-tn-item__label"
						value={ label }
						onChange={ ( labelValue ) =>
							setAttributes( { label: labelValue } )
						}
						onMerge={ mergeBlocks }
						onReplace={ onReplace }
						aria-label={ __( 'Tessenav submenu link text' ) }
						placeholder={ itemLabelPlaceholder }
						withoutInteractiveFormatting
						onClick={ () => {
							if ( ! openSubmenusOnClick && ! url ) {
								setIsSubmenuOpen( true );
								setOpenedBy( ref.current );
							}
						} }
						style={ btnStyles }
					/>
					{ description && (
						<span className="sagiriswd-tn-item__description">
							{ description }
						</span>
					) }
					{ ! openSubmenusOnClick && isLinkUIOpen && (
						<LinkUI
							clientId={ clientId }
							link={ attributes }
							onClose={ () => {
								setIsLinkUIOpen( false );
								if ( openedBy ) {
									openedBy.focus();
									setOpenedBy( null );
								} else {
									selectBlock( clientId );
								}
							} }
							anchor={ popoverAnchor }
							onRemove={ () => {
								setAttributes( { url: '' } );
								speak( __( 'Link removed.' ), 'assertive' );
							} }
							onChange={ ( updatedValue ) => {
								updateAttributes(
									updatedValue,
									setAttributes,
									attributes
								);
							} }
						/>
					) }
				</ParentElement>
				{ ( showSubmenuIcon || openSubmenusOnClick ) && (
					<span className="sagiriswd-tn__submenu-icon">
						<ItemSubmenuIcon />
					</span>
				) }
				<div { ...innerBlocksProps } />
			</div>
		</>
	);
}
