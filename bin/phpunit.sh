#!/usr/bin/env bash
# Run PHPUnit against the WordPress test suite bundled with Local by Flywheel.
# Usage: npm run test:php [-- <phpunit-args>]

PHP_BIN="/Users/tiegan/Library/Application Support/Local/lightning-services/php-8.2.27+1/bin/darwin-arm64/bin/php"

WP_TESTS_DIR=/tmp/wordpress-tests-lib \
WP_TESTS_PHPUNIT_POLYFILLS_PATH=vendor/yoast/phpunit-polyfills \
"$PHP_BIN" vendor/bin/phpunit --no-coverage "$@"
