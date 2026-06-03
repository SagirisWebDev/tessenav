<?php
/**
 * PHPUnit bootstrap for TesseNav.
 *
 * Requires WP_TESTS_DIR to point to a WordPress test suite checkout, e.g.:
 *   WP_TESTS_DIR=/tmp/wordpress-tests-lib vendor/bin/phpunit
 */

$_tests_dir = getenv( 'WP_TESTS_DIR' );
if ( ! $_tests_dir ) {
	$_tests_dir = rtrim( sys_get_temp_dir(), '/\\' ) . '/wordpress-tests-lib';
}

if ( ! file_exists( "$_tests_dir/includes/functions.php" ) ) {
	echo "Could not find WordPress test suite at {$_tests_dir}." . PHP_EOL;
	echo 'Set WP_TESTS_DIR to the path of your wordpress-develop/tests/phpunit directory.' . PHP_EOL;
	exit( 1 );
}

require_once "$_tests_dir/includes/functions.php";

function _tessenav_load_plugin() {
	require dirname( __DIR__ ) . '/tessenav.php';
}
tests_add_filter( 'muplugins_loaded', '_tessenav_load_plugin' );

require "$_tests_dir/includes/bootstrap.php";
