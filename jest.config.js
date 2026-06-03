const baseConfig = require( '@wordpress/scripts/config/jest-unit.config' );

module.exports = {
	...baseConfig,
	testMatch: [ '**/tests/js/**/*.test.[jt]s?(x)', '**/__tests__/**/*.[jt]s?(x)' ],
};
