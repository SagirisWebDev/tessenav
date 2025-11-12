/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	useState,
	useEffect,
	useRef,
} from '@wordpress/element';
import {
	InspectorControls,
	useBlockProps,
	useInnerBlocksProps,
	InnerBlocks,
	store as blockEditorStore,
	withColors,
	getColorClassName,
	useBlockEditingMode,
} from '@wordpress/block-editor';

import { useSelect } from '@wordpress/data';
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalVStack as VStack,
	ToggleControl,
	Button,
	Notice,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';
import { close, Icon } from '@wordpress/icons';
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import ResponsiveWrapper from './responsive-wrapper';
import OverlayMenuIcon from './overlay-menu-icon';
import OverlayMenuPreview from './overlay-menu-preview';
import { useInnerBlocks } from './use-inner-blocks';
import { ColorTools } from '../../utils';
import AccessibleMenuDescription from './accessible-menu-description';
import { useToolsPanelDropdownMenuProps } from '../../hooks';



function Edit( {
	attributes,
	setAttributes,
	clientId,
	className,
	backgroundColor,
	setBackgroundColor,
	textColor,
	setTextColor,
	overlayBackgroundColor,
	setOverlayBackgroundColor,
	overlayTextColor,
	setOverlayTextColor,

	// These props are used by the navigation editor to override specific
	// navigation block settings.
	hasSubmenuIndicatorSetting = true,
	customPlaceholder: CustomPlaceholder = null,
	__unstableLayoutClassNames: layoutClassNames,
} ) {
	const {
		openSubmenusOnClick,
		overlayMenu,
		showSubmenuIcon,
		layout: {
			justifyContent,
			orientation = 'horizontal',
			flexWrap = 'wrap',
		} = {},
		hasIcon,
		icon = 'handle',
	} = attributes;

	const blockEditingMode = useBlockEditingMode();

	const { innerBlocks } = useInnerBlocks( clientId );

	const hasSubmenus = !! innerBlocks.find(
		( block ) => block.name === 'sagiriswd/tessenav-submenu'
	);

	const [ isResponsiveMenuOpen, setResponsiveMenuVisibility ] =
		useState( false );

	const [ overlayMenuPreview, setOverlayMenuPreview ] = useState( false );

	const navRef = useRef();

	// The standard HTML5 tag for the block wrapper.
	const TagName = 'nav';

	const textDecoration = attributes.style?.typography?.textDecoration;

	const hasBlockOverlay = useSelect(
		( select ) =>
			select( blockEditorStore ).__unstableHasActiveBlockOverlayActive(
				clientId
			),
		[ clientId ]
	);
	const isResponsive = 'never' !== overlayMenu;
	const blockProps = useBlockProps( {
		ref: navRef,
		className: clsx(
			`${className} sagiriswd-tn`,
			{
				'items-justified-right': justifyContent === 'right',
				'items-justified-space-between':
					justifyContent === 'space-between',
				'items-justified-left': justifyContent === 'left',
				'items-justified-center': justifyContent === 'center',
				'is-vertical': orientation === 'vertical',
				'no-wrap': flexWrap === 'nowrap',
				'is-responsive': isResponsive,
				'has-text-color': !! textColor.color || !! textColor?.class,
				[ getColorClassName( 'color', textColor?.slug ) ]:
					!! textColor?.slug,
				'has-background':
					!! backgroundColor.color || backgroundColor.class,
				[ getColorClassName(
					'background-color',
					backgroundColor?.slug
				) ]: !! backgroundColor?.slug,
				[ `has-text-decoration-${ textDecoration }` ]: textDecoration,
				'block-editor-block-content-overlay': hasBlockOverlay,
			},
			layoutClassNames
		),
		style: {
			color: ! textColor?.slug && textColor?.color,
			backgroundColor: ! backgroundColor?.slug && backgroundColor?.color,
		},
	} );

	const innerBlocksProps = useInnerBlocksProps(   {
    className: 'sagiriswd-tn__inner',   // (optional) your own class on the inner wrapper
  },
  {
    allowedBlocks: [ 'sagiriswd/tessenav-submenu', 'core/navigation', 'core/paragraph', 'core/row', 'core/stack', 'core/group', 'core/columns', 'core/grid' ],
    templateLock: false,
    renderAppender: InnerBlocks.ButtonBlockAppender,
  } )

	const overlayMenuPreviewClasses = clsx(
		'sagiriswd-tn__overlay-menu-preview',
		{ open: overlayMenuPreview }
	);

	const submenuAccessibilityNotice =
		! showSubmenuIcon && ! openSubmenusOnClick
			? __(
					'The current nav options offer reduced accessibility for users and are not recommended. Enabling either "Open on Click" or "Show arrow" offers enhanced accessibility by allowing keyboard users to browse submenus selectively.'
			  )
			: '';

	const isFirstRender = useRef( true ); // Don't speak on first render.
	useEffect( () => {
		if ( ! isFirstRender.current && submenuAccessibilityNotice ) {
			speak( submenuAccessibilityNotice );
		}
		isFirstRender.current = false;
	}, [ submenuAccessibilityNotice ] );

	const overlayMenuPreviewId = useInstanceId(
		OverlayMenuPreview,
		`overlay-menu-preview`
	);

	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const stylingInspectorControls = (
		<>
			<InspectorControls>
				{ hasSubmenuIndicatorSetting && (
					<ToolsPanel
						label={ __( 'Display' ) }
						resetAll={ () => {
							setAttributes( {
								showSubmenuIcon: true,
								openSubmenusOnClick: false,
								overlayMenu: 'mobile',
								hasIcon: true,
								icon: 'handle',
							} );
						} }
						dropdownMenuProps={ dropdownMenuProps }
					>
						{ isResponsive && (
							<>
								<Button
									__next40pxDefaultSize
									className={ overlayMenuPreviewClasses }
									onClick={ () => {
										setOverlayMenuPreview(
											! overlayMenuPreview
										);
									} }
									aria-label={ __( 'Overlay menu controls' ) }
									aria-controls={ overlayMenuPreviewId }
									aria-expanded={ overlayMenuPreview }
								>
									{ hasIcon && (
										<>
											<OverlayMenuIcon icon={ icon } />
											<Icon icon={ close } />
										</>
									) }
									{ ! hasIcon && (
										<>
											<span>{ __( 'Menu' ) }</span>
											<span>{ __( 'Close' ) }</span>
										</>
									) }
								</Button>
								{ overlayMenuPreview && (
									<VStack
										id={ overlayMenuPreviewId }
										spacing={ 4 }
										style={ {
											gridColumn: 'span 2',
										} }
									>
										<OverlayMenuPreview
											setAttributes={ setAttributes }
											hasIcon={ hasIcon }
											icon={ icon }
											hidden={ ! overlayMenuPreview }
										/>
									</VStack>
								) }
							</>
						) }

						<ToolsPanelItem
							hasValue={ () => overlayMenu !== 'mobile' }
							label={ __( 'Overlay Menu' ) }
							onDeselect={ () =>
								setAttributes( { overlayMenu: 'mobile' } )
							}
							isShownByDefault
						>
							<ToggleGroupControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Overlay Menu' ) }
								aria-label={ __( 'Configure overlay menu' ) }
								value={ overlayMenu }
								help={ __(
									'Collapses the navigation options in a menu icon opening an overlay.'
								) }
								onChange={ ( value ) =>
									setAttributes( { overlayMenu: value } )
								}
								isBlock
							>
								<ToggleGroupControlOption
									value="never"
									label={ __( 'Off' ) }
								/>
								<ToggleGroupControlOption
									value="mobile"
									label={ __( 'Mobile' ) }
								/>
								<ToggleGroupControlOption
									value="always"
									label={ __( 'Always' ) }
								/>
							</ToggleGroupControl>
						</ToolsPanelItem>

						{ hasSubmenus && (
							<>
								<h3 className="sagiriswd-tn__submenu-header">
									{ __( 'Submenus' ) }
								</h3>
								<ToolsPanelItem
									hasValue={ () => openSubmenusOnClick }
									label={ __( 'Open on click' ) }
									onDeselect={ () =>
										setAttributes( {
											openSubmenusOnClick: false,
											showSubmenuIcon: true,
										} )
									}
									isShownByDefault
								>
									<ToggleControl
										__nextHasNoMarginBottom
										checked={ openSubmenusOnClick }
										onChange={ ( value ) => {
											setAttributes( {
												openSubmenusOnClick: value,
												...( value && {
													showSubmenuIcon: true,
												} ), // Make sure arrows are shown when we toggle this on.
											} );
										} }
										label={ __( 'Open on click' ) }
									/>
								</ToolsPanelItem>

								<ToolsPanelItem
									hasValue={ () => ! showSubmenuIcon }
									label={ __( 'Show arrow' ) }
									onDeselect={ () =>
										setAttributes( {
											showSubmenuIcon: true,
										} )
									}
									isDisabled={
										attributes.openSubmenusOnClick
									}
									isShownByDefault
								>
									<ToggleControl
										__nextHasNoMarginBottom
										checked={ showSubmenuIcon }
										onChange={ ( value ) => {
											setAttributes( {
												showSubmenuIcon: value,
											} );
										} }
										disabled={
											attributes.openSubmenusOnClick
										}
										label={ __( 'Show arrow' ) }
									/>
								</ToolsPanelItem>

								{ submenuAccessibilityNotice && (
									<Notice
										spokenMessage={ null }
										status="warning"
										isDismissible={ false }
										className="sagiriswd-tn__submenu-accessibility-notice"
									>
										{ submenuAccessibilityNotice }
									</Notice>
								) }
							</>
						) }
					</ToolsPanel>
				) }
			</InspectorControls>
			<InspectorControls group="color">
				{ /*
				 * Avoid useMultipleOriginColorsAndGradients and detectColors
				 * on block mount. InspectorControls only mounts this component
				 * when the block is selected.
				 * */ }
				<ColorTools
					textColor={ textColor }
					setTextColor={ setTextColor }
					backgroundColor={ backgroundColor }
					setBackgroundColor={ setBackgroundColor }
					overlayTextColor={ overlayTextColor }
					setOverlayTextColor={ setOverlayTextColor }
					overlayBackgroundColor={ overlayBackgroundColor }
					setOverlayBackgroundColor={ setOverlayBackgroundColor }
					clientId={ clientId }
					navRef={ navRef }
				/>
			</InspectorControls>
		</>
	);

	const accessibleDescriptionId = `${ clientId }-desc`;
	const isHiddenByDefault = 'always' === overlayMenu;

	return (
		<>
			{ blockEditingMode === 'default' && stylingInspectorControls }
			<TagName
				{ ...blockProps }
				aria-describedby={ accessibleDescriptionId }
			>
				<AccessibleMenuDescription
					id={ accessibleDescriptionId }
				/>
				<ResponsiveWrapper
					id={ clientId }
					onToggle={ setResponsiveMenuVisibility }
					hasIcon={ hasIcon }
					icon={ icon }
					isOpen={ isResponsiveMenuOpen }
					isResponsive={ isResponsive }
					isHiddenByDefault={ isHiddenByDefault }
					overlayBackgroundColor={
						overlayBackgroundColor
					}
					overlayTextColor={ overlayTextColor }
				>
					<div { ...innerBlocksProps } />
				</ResponsiveWrapper>
			</TagName>
		</>
	);
}

export default withColors(
	{ textColor: 'color' },
	{ backgroundColor: 'color' },
	{ overlayBackgroundColor: 'color' },
	{ overlayTextColor: 'color' }
)( Edit );
