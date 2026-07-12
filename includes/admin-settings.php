<?php
/**
 * Individual TesseNav license key settings page.
 *
 * Registers as a submenu under the Sagiris top-level menu when sagiris-premium-blocks
 * is active. Falls back to a Settings submenu when it is not.
 *
 * @package Sagiriswd
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers the TesseNav license settings page. Runs at priority 20 so the
 * Sagiris top-level menu (registered at priority 10) is already present when we check.
 */
function sagiriswd_tessenav_register_admin_menu() {
	if ( sagiriswd_tessenav_sagiris_menu_exists() ) {
		add_submenu_page(
			'sagiris-premium-blocks',
			__( 'TesseNav License', 'tessenav-rich-submenus' ),
			__( 'TesseNav', 'tessenav-rich-submenus' ),
			'manage_options',
			'tessenav-license',
			'sagiriswd_tessenav_render_license_page'
		);
	} else {
		add_options_page(
			__( 'TesseNav License', 'tessenav-rich-submenus' ),
			__( 'TesseNav', 'tessenav-rich-submenus' ),
			'manage_options',
			'tessenav-license',
			'sagiriswd_tessenav_render_license_page'
		);
	}
}
add_action( 'admin_menu', 'sagiriswd_tessenav_register_admin_menu', 20 );

/**
 * Returns true if the Sagiris top-level admin menu is registered.
 *
 * @return bool
 */
function sagiriswd_tessenav_sagiris_menu_exists() {
	global $menu;
	if ( ! is_array( $menu ) ) {
		return false;
	}
	foreach ( $menu as $item ) {
		if ( isset( $item[2] ) && 'sagiris-premium-blocks' === $item[2] ) {
			return true;
		}
	}
	return false;
}

/**
 * Handles the individual license key form POST.
 */
function sagiriswd_tessenav_handle_settings_save() {
	if ( ! isset( $_POST['sagiriswd_tessenav_nonce'] ) ) {
		return;
	}

	if ( ! wp_verify_nonce( sanitize_key( $_POST['sagiriswd_tessenav_nonce'] ), 'sagiriswd_tessenav_settings' ) ) {
		wp_die( esc_html__( 'Security check failed.', 'tessenav-rich-submenus' ) );
	}

	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'Insufficient permissions.', 'tessenav-rich-submenus' ) );
	}

	$sagiris_action = isset( $_POST['sagiris_action'] ) ? sanitize_text_field( wp_unslash( $_POST['sagiris_action'] ) ) : '';

	if ( 'activate' === $sagiris_action ) {
		$key = isset( $_POST['tessenav_license_key'] ) ? sanitize_text_field( wp_unslash( $_POST['tessenav_license_key'] ) ) : '';

		if ( $key ) {
			$success   = sagiriswd_tessenav_activate_license( $key );
			$query_arg = $success ? 'activated' : 'activation_failed';
		} else {
			$query_arg = 'empty_key';
		}
	} elseif ( 'deactivate' === $sagiris_action ) {
		sagiriswd_tessenav_deactivate_license();
		$query_arg = 'deactivated';
	} else {
		return;
	}

	$redirect_base = menu_page_url( 'tessenav-license', false );

	wp_safe_redirect( add_query_arg( 'tessenav_msg', $query_arg, $redirect_base ) );
	exit;
}
add_action( 'admin_post_sagiriswd_tessenav_settings', 'sagiriswd_tessenav_handle_settings_save' );

/**
 * Renders the TesseNav individual license key settings page.
 */
function sagiriswd_tessenav_render_license_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	$status      = get_option( 'sagiriswd_tessenav_license_status', array( 'valid' => false, 'expiry' => null ) );
	$license_key = get_option( 'sagiriswd_tessenav_license_key', '' );
	$msg         = isset( $_GET['tessenav_msg'] ) ? sanitize_key( $_GET['tessenav_msg'] ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'TesseNav — Individual License', 'tessenav-rich-submenus' ); ?></h1>

		<?php if ( 'activated' === $msg ) : ?>
			<div class="notice notice-success is-dismissible"><p><?php esc_html_e( 'License activated successfully.', 'tessenav-rich-submenus' ); ?></p></div>
		<?php elseif ( 'activation_failed' === $msg ) : ?>
			<div class="notice notice-error is-dismissible"><p><?php esc_html_e( 'License activation failed. Check your key and try again.', 'tessenav-rich-submenus' ); ?></p></div>
		<?php elseif ( 'deactivated' === $msg ) : ?>
			<div class="notice notice-success is-dismissible"><p><?php esc_html_e( 'License key removed. Premium access ended immediately.', 'tessenav-rich-submenus' ); ?></p></div>
		<?php elseif ( 'empty_key' === $msg ) : ?>
			<div class="notice notice-error is-dismissible"><p><?php esc_html_e( 'Please enter a license key.', 'tessenav-rich-submenus' ); ?></p></div>
		<?php endif; ?>

		<?php if ( $license_key ) : ?>
			<p>
				<strong><?php esc_html_e( 'Status:', 'tessenav-rich-submenus' ); ?></strong>
				<?php if ( ! empty( $status['valid'] ) ) : ?>
					<span style="color:green"><?php esc_html_e( 'Active', 'tessenav-rich-submenus' ); ?></span>
				<?php else : ?>
					<span style="color:red"><?php esc_html_e( 'Inactive', 'tessenav-rich-submenus' ); ?></span>
				<?php endif; ?>
			</p>
			<p>
				<strong><?php esc_html_e( 'Key:', 'tessenav-rich-submenus' ); ?></strong>
				<?php
				$visible = substr( $license_key, 0, 8 );
				$masked  = str_repeat( '*', max( 0, strlen( $license_key ) - 8 ) );
				echo esc_html( $visible . $masked );
				?>
			</p>
			<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
				<?php wp_nonce_field( 'sagiriswd_tessenav_settings', 'sagiriswd_tessenav_nonce' ); ?>
				<input type="hidden" name="action" value="sagiriswd_tessenav_settings">
				<input type="hidden" name="sagiris_action" value="deactivate">
				<button type="submit" class="button button-secondary">
					<?php esc_html_e( 'Remove License Key', 'tessenav-rich-submenus' ); ?>
				</button>
			</form>
		<?php else : ?>
			<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
				<?php wp_nonce_field( 'sagiriswd_tessenav_settings', 'sagiriswd_tessenav_nonce' ); ?>
				<input type="hidden" name="action" value="sagiriswd_tessenav_settings">
				<input type="hidden" name="sagiris_action" value="activate">
				<table class="form-table" role="presentation">
					<tr>
						<th scope="row">
							<label for="tessenav_license_key">
								<?php esc_html_e( 'TesseNav License Key', 'tessenav-rich-submenus' ); ?>
							</label>
						</th>
						<td>
							<input
								type="text"
								name="tessenav_license_key"
								id="tessenav_license_key"
								class="regular-text"
								placeholder="XXXX-XXXX-XXXX-XXXX"
							>
							<p class="description">
								<?php esc_html_e( 'Activates TesseNav premium features on this site.', 'tessenav-rich-submenus' ); ?>
							</p>
						</td>
					</tr>
				</table>
				<?php submit_button( __( 'Activate License', 'tessenav-rich-submenus' ) ); ?>
			</form>
		<?php endif; ?>
	</div>
	<?php
}
