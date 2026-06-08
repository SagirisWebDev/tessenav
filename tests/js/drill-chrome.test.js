import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import DrillChrome from '../../src/tessenav/edit/drill-chrome.js';

jest.mock( '@wordpress/i18n', () => ( {
	__: ( str ) => str,
} ) );

jest.mock( '@wordpress/components', () => ( {
	Button: ( { children, onClick, className } ) => (
		<button className={ className } onClick={ onClick }>
			{ children }
		</button>
	),
} ) );

jest.mock( '@wordpress/icons', () => ( {
	chevronLeft: null,
} ) );

describe( 'DrillChrome', () => {
	it( 'renders nothing when drillStack is empty', () => {
		const { container } = render(
			<DrillChrome
				drillStack={ [] }
				tessenavClientId="tn-1"
				activeSubmenuLabel="Products"
				selectBlock={ jest.fn() }
			/>
		);
		expect( container.firstChild ).toBeNull();
	} );

	it( 'renders Back button and title when drillStack is non-empty', () => {
		const { container } = render(
			<DrillChrome
				drillStack={ [ 'sm-a' ] }
				tessenavClientId="tn-1"
				activeSubmenuLabel="Products"
				selectBlock={ jest.fn() }
			/>
		);
		expect(
			container.querySelector( '.sagiriswd-tn__editor-drill-back' )
		).toBeInTheDocument();
		const title = container.querySelector(
			'.sagiriswd-tn__editor-drill-title'
		);
		expect( title ).toBeInTheDocument();
		expect( title ).toHaveTextContent( 'Products' );
	} );

	it( 'falls back to a non-empty string when activeSubmenuLabel is empty', () => {
		const { container } = render(
			<DrillChrome
				drillStack={ [ 'sm-a' ] }
				tessenavClientId="tn-1"
				activeSubmenuLabel=""
				selectBlock={ jest.fn() }
			/>
		);
		const title = container.querySelector(
			'.sagiriswd-tn__editor-drill-title'
		);
		expect( title ).toBeInTheDocument();
		expect( title.textContent ).toMatch( /\S/ );
	} );

	it( 'Back click at depth 1 calls selectBlock with tessenavClientId', async () => {
		const selectBlock = jest.fn();
		const { container } = render(
			<DrillChrome
				drillStack={ [ 'sm-a' ] }
				tessenavClientId="tn-1"
				activeSubmenuLabel="Products"
				selectBlock={ selectBlock }
			/>
		);
		const backBtn = container.querySelector(
			'.sagiriswd-tn__editor-drill-back'
		);
		await userEvent.click( backBtn );
		expect( selectBlock ).toHaveBeenCalledWith( 'tn-1' );
	} );

	it( 'Back click at depth 2+ calls selectBlock with parent submenu clientId', async () => {
		const selectBlock = jest.fn();
		const { container } = render(
			<DrillChrome
				drillStack={ [ 'sm-a', 'sm-b' ] }
				tessenavClientId="tn-1"
				activeSubmenuLabel="Sub Products"
				selectBlock={ selectBlock }
			/>
		);
		const backBtn = container.querySelector(
			'.sagiriswd-tn__editor-drill-back'
		);
		await userEvent.click( backBtn );
		expect( selectBlock ).toHaveBeenCalledWith( 'sm-a' );
	} );
} );
