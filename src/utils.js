/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * Wordpress Dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useState,
	useEffect,
	Platform
} from '@wordpress/element';
import {
		__experimentalColorGradientSettingsDropdown as ColorGradientSettingsDropdown,
		__experimentalUseMultipleOriginColorsAndGradients as useMultipleOriginColorsAndGradients,
		ContrastChecker
} from '@wordpress/block-editor';

function getComputedStyle( node ) {
	return node.ownerDocument.defaultView.getComputedStyle( node );
}

export function detectColors(
	colorsDetectionElement,
	setColor,
	setBackground
) {
	if ( ! colorsDetectionElement ) {
		return;
	}
	setColor( getComputedStyle( colorsDetectionElement ).color );

	let backgroundColorNode = colorsDetectionElement;
	let backgroundColor =
		getComputedStyle( backgroundColorNode ).backgroundColor;
	while (
		backgroundColor === 'rgba(0, 0, 0, 0)' &&
		backgroundColorNode.parentNode &&
		backgroundColorNode.parentNode.nodeType ===
			backgroundColorNode.parentNode.ELEMENT_NODE
	) {
		backgroundColorNode = backgroundColorNode.parentNode;
		backgroundColor =
			getComputedStyle( backgroundColorNode ).backgroundColor;
	}

	setBackground( backgroundColor );
}

/**
 * Determine the colors for a menu.
 *
 * Order of priority is:
 * 1: Overlay custom colors (if submenu)
 * 2: Overlay theme colors (if submenu)
 * 3: Custom colors
 * 4: Theme colors
 * 5: Global styles
 *
 * @param {Object}  context
 * @param {boolean} isSubMenu
 */
export function getColors( context, isSubMenu ) {
	const {
		textColor,
		customTextColor,
		backgroundColor,
		customBackgroundColor,
		overlayTextColor,
		customOverlayTextColor,
		overlayBackgroundColor,
		customOverlayBackgroundColor,
		style,
	} = context;

	const colors = {};

	if ( isSubMenu && !! customOverlayTextColor ) {
		colors.customTextColor = customOverlayTextColor;
	} else if ( isSubMenu && !! overlayTextColor ) {
		colors.textColor = overlayTextColor;
	} else if ( !! customTextColor ) {
		colors.customTextColor = customTextColor;
	} else if ( !! textColor ) {
		colors.textColor = textColor;
	} else if ( !! style?.color?.text ) {
		colors.customTextColor = style.color.text;
	}

	if ( isSubMenu && !! customOverlayBackgroundColor ) {
		colors.customBackgroundColor = customOverlayBackgroundColor;
	} else if ( isSubMenu && !! overlayBackgroundColor ) {
		colors.backgroundColor = overlayBackgroundColor;
	} else if ( !! customBackgroundColor ) {
		colors.customBackgroundColor = customBackgroundColor;
	} else if ( !! backgroundColor ) {
		colors.backgroundColor = backgroundColor;
	} else if ( !! style?.color?.background ) {
		colors.customTextColor = style.color.background;
	}

	return colors;
}

 export function ColorTools( {
	textColor,
	setTextColor,
	backgroundColor,
	setBackgroundColor,
	overlayTextColor,
	setOverlayTextColor,
	overlayBackgroundColor,
	setOverlayBackgroundColor,
	clientId,
	navRef,
} ) {
	const [ detectedBackgroundColor, setDetectedBackgroundColor ] = useState();
	const [ detectedColor, setDetectedColor ] = useState();
	const [
		detectedOverlayBackgroundColor,
		setDetectedOverlayBackgroundColor,
	] = useState();
	const [ detectedOverlayColor, setDetectedOverlayColor ] = useState();
	// Turn on contrast checker for web only since it's not supported on mobile yet.
	const enableContrastChecking = Platform.OS === 'web';
	useEffect( () => {
		if ( ! enableContrastChecking ) {
			return;
		}
		detectColors(
			navRef.current,
			setDetectedColor,
			setDetectedBackgroundColor
		);

		const subMenuElement = navRef.current?.querySelector(
			'[data-type="sagiriswd/tessenav-submenu"]'
		);

		if ( ! subMenuElement ) {
			return;
		}

		// Only detect submenu overlay colors if they have previously been explicitly set.
		// This avoids the contrast checker from reporting on inherited submenu colors and
		// showing the contrast warning twice.
		if ( overlayTextColor.color || overlayBackgroundColor.color ) {
			detectColors(
				subMenuElement,
				setDetectedOverlayColor,
				setDetectedOverlayBackgroundColor
			);
		}
	}, [
		enableContrastChecking,
		overlayTextColor.color,
		overlayBackgroundColor.color,
		navRef,
	] );
	const colorGradientSettings = useMultipleOriginColorsAndGradients();
	if ( ! colorGradientSettings.hasColorsOrGradients ) {
		return null;
	}
	return (
		<>
			<ColorGradientSettingsDropdown
				__experimentalIsRenderedInSidebar
				settings={ [
					{
						colorValue: textColor.color,
						label: __( 'Text' ),
						onColorChange: setTextColor,
						resetAllFilter: () => setTextColor(),
						clearable: true,
						enableAlpha: true,
					},
					{
						colorValue: backgroundColor.color,
						label: __( 'Background' ),
						onColorChange: setBackgroundColor,
						resetAllFilter: () => setBackgroundColor(),
						clearable: true,
						enableAlpha: true,
					},
					{
						colorValue: overlayTextColor.color,
						label: __( 'Submenu & overlay text' ),
						onColorChange: setOverlayTextColor,
						resetAllFilter: () => setOverlayTextColor(),
						clearable: true,
						enableAlpha: true,
					},
					{
						colorValue: overlayBackgroundColor.color,
						label: __( 'Submenu & overlay background' ),
						onColorChange: setOverlayBackgroundColor,
						resetAllFilter: () => setOverlayBackgroundColor(),
						clearable: true,
						enableAlpha: true,
					},
				] }
				panelId={ clientId }
				{ ...colorGradientSettings }
				gradients={ [] }
				disableCustomGradients
			/>
			{ enableContrastChecking && (
				<>
					<ContrastChecker
						backgroundColor={ detectedBackgroundColor }
						textColor={ detectedColor }
					/>
					<ContrastChecker
						backgroundColor={ detectedOverlayBackgroundColor }
						textColor={ detectedOverlayColor }
					/>
				</>
			) }
		</>
	);
}

export function getSubmenuChildBlockProps( innerProps ) {
	return {
		className: clsx( 'sagiriswd-tn__submenu-container', {
			'has-text-color': !! (
				innerProps.textColor || innerProps.customTextColor
			),
			[ `has-${ innerProps.textColor }-color` ]:
				!! innerProps.textColor,
			'has-background': !! (
				innerProps.backgroundColor ||
				innerProps.customBackgroundColor
			),
			[ `has-${ innerProps.backgroundColor }-background-color` ]:
				!! innerProps.backgroundColor,
		} ),
		style: {
			color: innerProps.customTextColor,
			backgroundColor: innerProps.customBackgroundColor,
			left: innerProps.left,
			right: innerProps.right
		},
	};
}
