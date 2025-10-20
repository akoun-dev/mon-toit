-- Migration de Sécurité Finale - Correction search_path
-- Ajout du search_path à toutes les fonctions SECURITY DEFINER

-- =====================================================
-- FONCTIONS TRIGGERS
-- =====================================================
ALTER FUNCTION public.prevent_admin_in_user_type() SET search_path = public;
ALTER FUNCTION public.update_property_alerts_updated_at() SET search_path = public;
ALTER FUNCTION public.create_property_alerts_preferences() SET search_path = public;
ALTER FUNCTION public.auto_expire_mandates() SET search_path = public;
ALTER FUNCTION public.generate_receipt_number() SET search_path = public;
ALTER FUNCTION public.notify_certification_status_change() SET search_path = public;
ALTER FUNCTION public.set_receipt_number() SET search_path = public;
ALTER FUNCTION public.log_lease_certification() SET search_path = public;
ALTER FUNCTION public.log_role_changes() SET search_path = public;
ALTER FUNCTION public.log_dispute_resolution() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.initialize_user_active_roles() SET search_path = public;
ALTER FUNCTION public.update_guest_message_updated_at() SET search_path = public;
ALTER FUNCTION public.cleanup_old_audit_logs() SET search_path = public;
ALTER FUNCTION public.log_title_deed_access() SET search_path = public;
ALTER FUNCTION public.notify_property_moderation() SET search_path = public;
ALTER FUNCTION public.update_electronic_signature_updated_at() SET search_path = public;
ALTER FUNCTION public.log_property_moderation() SET search_path = public;

-- =====================================================
-- FONCTIONS DE SÉCURITÉ ET VÉRIFICATION
-- =====================================================
ALTER FUNCTION public.can_access_maintenance(uuid) SET search_path = public;
ALTER FUNCTION public.detect_mass_actions() SET search_path = public;
ALTER FUNCTION public.get_failed_login_attempts(integer) SET search_path = public;
ALTER FUNCTION public.get_my_verification_status() SET search_path = public;
ALTER FUNCTION public.add_available_role(uuid, user_type) SET search_path = public;
ALTER FUNCTION public.check_guest_rate_limit(text, text, text) SET search_path = public;
ALTER FUNCTION public.cleanup_old_guest_messages() SET search_path = public;
ALTER FUNCTION public.get_public_profile_safe(uuid) SET search_path = public;
ALTER FUNCTION public.promote_to_super_admin(uuid) SET search_path = public;
ALTER FUNCTION public.get_property_with_title_deed(uuid) SET search_path = public;
ALTER FUNCTION public.detect_suspicious_sensitive_data_access() SET search_path = public;
ALTER FUNCTION public.get_verifications_for_admin_review() SET search_path = public;
ALTER FUNCTION public.get_user_payments(uuid) SET search_path = public;
ALTER FUNCTION public.approve_verification(uuid, text, text) SET search_path = public;
ALTER FUNCTION public.check_admin_mfa_compliance() SET search_path = public;
ALTER FUNCTION public.verify_backup_code(text) SET search_path = public;
ALTER FUNCTION public.check_mfa_rate_limit() SET search_path = public;
ALTER FUNCTION public.log_mfa_attempt(boolean, text) SET search_path = public;
ALTER FUNCTION public.get_mfa_metrics() SET search_path = public;
ALTER FUNCTION public.get_my_disputes() SET search_path = public;
ALTER FUNCTION public.check_login_rate_limit(text, text) SET search_path = public;
ALTER FUNCTION public.check_api_rate_limit(text, uuid, text, integer, integer) SET search_path = public;
ALTER FUNCTION public.detect_ddos_pattern() SET search_path = public;
ALTER FUNCTION public.block_ip(text, text, integer, text) SET search_path = public;
ALTER FUNCTION public.unblock_ip(text) SET search_path = public;
ALTER FUNCTION public.get_public_properties(text, text, numeric, numeric, integer, text) SET search_path = public;

-- =====================================================
-- DOCUMENTATION FINALE
-- =====================================================
COMMENT ON FUNCTION public.alert_suspicious_sensitive_access() IS
'Surveille les accès suspects aux données sensibles (> 50 refus/h).';

COMMENT ON FUNCTION public.check_login_rate_limit(text, text) IS
'Rate limiting anti-brute force: 5/email/15min, 10/IP/15min, 50/IP/5min=DDoS.';

COMMENT ON FUNCTION public.block_ip(text, text, integer, text) IS
'Blocage manuel d''IP par admins avec audit logging.';

COMMENT ON FUNCTION public.promote_to_super_admin(uuid) IS
'Promotion super_admin (réservé super_admins uniquement).';

-- ✅ Migration sécurité terminée avec succès