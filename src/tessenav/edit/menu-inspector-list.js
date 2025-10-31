// MenuInspectorList.js
import { __ } from '@wordpress/i18n';
import { memo, useMemo, useState } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore, BlockIcon, Inserter } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import {
  __experimentalTreeGrid as TreeGrid,
  __experimentalTreeGridRow as TreeGridRow,
  __experimentalTreeGridCell as TreeGridCell,
  Button,
  VisuallyHidden,
  Flex,
  FlexItem,
  DropdownMenu
} from '@wordpress/components';

function useNavChildren( rootClientId ) {
	return useSelect( ( s ) => {
		const be = s( blockEditorStore );
		// Get direct children of the navigation block
		const children = be.getBlocks( rootClientId ) || [];
		// Build a simple tree (id, name, attributes, innerBlocks)
		const mapNode = ( b ) => ({
			clientId: b.clientId,
			name: b.name,
			attributes: b.attributes,
			innerBlocks: ( b.innerBlocks || [] ).map( mapNode ),
		});
		return children.map( mapNode );
	}, [ rootClientId ] );
}

function useSelectionHelpers() {
	const { selectBlock } = useDispatch( blockEditorStore );
	const select = ( clientId ) => selectBlock( clientId );
	return { select };
}

function BlockLabel( { name, attributes } ) {
	// Good-enough title extraction for nav items
	let title = attributes?.label || attributes?.title || attributes?.name || '';
	if ( name === 'core/page-list' && !title ) title = __( 'Page List', 'default' );
	if ( name === 'core/navigation-submenu' && !title ) title = __( 'Submenu', 'default' );
	if ( name === 'core/navigation-link' && !title ) title = attributes?.url || __( 'Link', 'default' );
	return <span className="block-editor-list-view-block-select-button__title">{ title }</span>;
}

function NodeRow( {
	node,
	level,
	rowIndex,
	onToggleExpand,
	expandedSet,
	onSelect,
} ) {
	const { clientId, name, attributes, innerBlocks } = node;
	const hasChildren = !!innerBlocks?.length && name !== 'core/page-list';
	const isExpanded = hasChildren && expandedSet.has( clientId );

	const expander = hasChildren ? (
		<span className="block-editor-list-view__expander" aria-hidden="true">
			<svg viewBox="0 0 24 24" width="24" height="24" focusable="false" aria-hidden="true">
				<path d="M10.8622 8.04053L14.2805 12.0286L10.8622 16.0167L9.72327 15.0405L12.3049 12.0286L9.72327 9.01672L10.8622 8.04053Z" />
			</svg>
		</span>
	) : <span className="block-editor-list-view__expander" aria-hidden="true" />;

	return (
		<>
			<TreeGridRow
				role="row"
				aria-level={ level }
				aria-posinset={ rowIndex.posinset }
				aria-setsize={ rowIndex.setsize }
				aria-expanded={ hasChildren ? String( !!isExpanded ) : undefined }
				id={ `list-view-row-${ clientId }` }
			>
				<TreeGridCell role="gridcell" className="block-editor-list-view-block__contents-cell" onClick={ () => onSelect( clientId ) }>
					<div className="block-editor-list-view-block__contents-container">
						<a
							className="block-editor-list-view-block-select-button block-editor-list-view-block-contents"
							href={ `#block-${ clientId }` }
							onClick={ (e) => { e.preventDefault(); onSelect( clientId ); } }
						>
							<Button
								variant="tertiary"
								onClick={ (e) => { e.preventDefault(); if (hasChildren) onToggleExpand(clientId, !isExpanded); } }
								className="block-editor-list-view__expander"
								aria-hidden="true"
								label={ isExpanded ? __( 'Collapse','default' ) : __( 'Expand', 'default' ) }
							>
								{ expander }
							</Button>
							<span className="block-editor-block-icon has-colors">
								<BlockIcon icon={ name } showColors />
							</span>
							<Flex className="block-editor-list-view-block-select-button__label-wrapper" align="center" gap={2}>
								<FlexItem>
									<BlockLabel name={ name } attributes={ attributes } />
								</FlexItem>
							</Flex>
						</a>
					</div>
				</TreeGridCell>

				<TreeGridCell role="gridcell" className="block-editor-list-view-block__menu-cell">
					<DropdownMenu
						icon="more"
						label={ __( 'Options', 'default' ) }
						className="block-editor-list-view-block__menu"
					>
						{ ( { onClose } ) => (
							<>
								<Button
									onClick={ () => { onSelect( clientId ); onClose(); } }
									variant="tertiary"
								>
									{ __( 'Select', 'default' ) }
								</Button>
								{/* You can add more actions here (remove, duplicate) via blockEditor actions */}
							</>
						) }
					</DropdownMenu>
				</TreeGridCell>
			</TreeGridRow>

			{ hasChildren && isExpanded && innerBlocks.map( ( child, i ) => (
				<NodeRow
					key={ child.clientId }
					node={ child }
					level={ level + 1 }
					rowIndex={ { posinset: i + 1, setsize: innerBlocks.length } }
					onToggleExpand={ onToggleExpand }
					expandedSet={ expandedSet }
					onSelect={ onSelect }
				/>
			) ) }
		</>
	);
}

const MenuInspectorList = memo( function MenuInspectorList( { rootClientId, ariaLabel } ) {
	const nodes = useNavChildren( rootClientId );
	const { select } = useSelectionHelpers();
	const [ expandedSet, setExpandedSet ] = useState( () => new Set() );

	const onToggleExpand = ( id, next ) => {
		setExpandedSet( (prev) => {
			const copy = new Set( prev );
			if ( next ) copy.add( id );
			else copy.delete( id );
			return copy;
		} );
	};

	// Compute flat row count for aria-setsize on level 1
	const topCount = nodes.length;

	const descriptionId = useMemo( () => `block-editor-list-view-description-${ Math.random().toString(36).slice(2) }`, [] );

	return (
		<div className="sagiriswd-tn__menu-inspector-controls">
			<VisuallyHidden id={ descriptionId }>
				{ /* Example: “Structure for Navigation Menu: Primary menu” – adapt label if you have it */ }
				{ __( 'Structure for Navigation Menu', 'default' ) }
			</VisuallyHidden>

			<div role="application" aria-label={ ariaLabel || __( 'Block navigation structure', 'default' ) }>
				<TreeGrid
					className="block-editor-list-view-tree"
					role="treegrid"
					aria-label={ __( 'Block navigation structure', 'default' ) }
					aria-describedby={ descriptionId }
					data-is-drop-zone="true"
				>
					<tbody>
						{ nodes.map( ( node, i ) => (
							<NodeRow
								key={ node.clientId }
								node={ node }
								level={ 1 }
								rowIndex={ { posinset: i + 1, setsize: topCount } }
								onToggleExpand={ onToggleExpand }
								expandedSet={ expandedSet }
								onSelect={ select }
							/>
						) ) }

						{/* Appender row (uses Inserter targeting this Navigation as the root) */}
						<TreeGridRow role="row" aria-level={ 1 } aria-posinset={ topCount + 1 } aria-setsize={ topCount + 1 } aria-expanded="true">
							<TreeGridCell role="gridcell">
								<div className="list-view-appender">
									<Inserter
										rootClientId={ rootClientId }
										position="bottom"
										showInserterHelpPanel
										// Optional: restrict to nav item blocks
										// allowedBlocks={ [ 'core/navigation-link', 'core/navigation-submenu', 'core/page-list' ] }
									/>
									<VisuallyHidden id={ `list-view-appender__${ rootClientId }` }>
										{ __( 'Append to Navigation at end, Level 1', 'default' ) }
									</VisuallyHidden>
								</div>
							</TreeGridCell>
						</TreeGridRow>
					</tbody>
				</TreeGrid>
			</div>
		</div>
	);
} );

export default MenuInspectorList;
