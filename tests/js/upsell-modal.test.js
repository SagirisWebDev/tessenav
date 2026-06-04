import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { UpsellModal } from '../../src/tessenav-submenu/upsell-modal';

jest.mock( '@wordpress/i18n', () => ( {
	__: ( str ) => str,
} ) );

jest.mock( '@wordpress/components', () => ( {
	Modal: ( { children, title, onRequestClose } ) => (
		<div role="dialog" aria-label={ title }>
			<h1>{ title }</h1>
			<button aria-label="Close dialog" onClick={ onRequestClose }>
				×
			</button>
			{ children }
		</div>
	),
	Button: ( { children, href, target, rel, onClick, variant } ) =>
		href ? (
			<a href={ href } target={ target } rel={ rel }>
				{ children }
			</a>
		) : (
			<button onClick={ onClick } data-variant={ variant }>
				{ children }
			</button>
		),
} ) );

describe( 'UpsellModal', () => {
	it( 'renders when mounted', () => {
		render(
			<UpsellModal upgradeUrl="https://example.com" onClose={ () => {} } />
		);
		expect( screen.getByRole( 'dialog' ) ).toBeInTheDocument();
	} );

	it( 'CTA button has correct href, target="_blank", and rel="noopener noreferrer"', () => {
		render(
			<UpsellModal
				upgradeUrl="https://example.com/upgrade"
				onClose={ () => {} }
			/>
		);
		const link = screen.getByRole( 'link' );
		expect( link ).toHaveAttribute( 'href', 'https://example.com/upgrade' );
		expect( link ).toHaveAttribute( 'target', '_blank' );
		expect( link ).toHaveAttribute( 'rel', 'noopener noreferrer' );
	} );

	it( 'dismiss button calls onClose', async () => {
		const onClose = jest.fn();
		render(
			<UpsellModal upgradeUrl="https://example.com" onClose={ onClose } />
		);
		const dismissButton = screen.getByRole( 'button', {
			name: /dismiss/i,
		} );
		await userEvent.click( dismissButton );
		expect( onClose ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'modal X-button calls onClose', async () => {
		const onClose = jest.fn();
		render(
			<UpsellModal upgradeUrl="https://example.com" onClose={ onClose } />
		);
		const closeButton = screen.getByRole( 'button', {
			name: /close dialog/i,
		} );
		await userEvent.click( closeButton );
		expect( onClose ).toHaveBeenCalledTimes( 1 );
	} );
} );
