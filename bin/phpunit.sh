#!/usr/bin/env bash
# Run PHPUnit against the WordPress test suite bundled with Local by Flywheel.
# Usage: npm run test:php [-- <phpunit-args>]

PHP_BIN=/tmp/local-php  # symlink → Local's php-8.2.27 binary (no spaces in path)
MYSQL_SOCK="/Users/tiegan/Library/Application Support/Local/run/CWuyRoKXq/mysql/mysqld.sock"

export WP_TESTS_DIR=/tmp/wordpress-tests-lib
export WP_TESTS_PHPUNIT_POLYFILLS_PATH=vendor/yoast/phpunit-polyfills

exec "$PHP_BIN" \
  -d "mysqli.default_socket=$MYSQL_SOCK" \
  -d "pdo_mysql.default_socket=$MYSQL_SOCK" \
  vendor/bin/phpunit --no-coverage "$@"
