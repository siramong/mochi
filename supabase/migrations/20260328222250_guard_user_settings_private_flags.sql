-- Blindaje de flags privados en user_settings
-- Fecha: 2026-03-28

CREATE OR REPLACE FUNCTION public.guard_user_settings_private_flags()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  jwt_role text := COALESCE(current_setting('request.jwt.claim.role', true), '');
  is_privileged boolean := (
    jwt_role = 'service_role'
    OR current_user IN ('postgres', 'supabase_admin')
  );
BEGIN
  -- Defensa en profundidad: si partner_features_enabled es false, vouchers_enabled debe ser false.
  IF COALESCE(NEW.partner_features_enabled, FALSE) = FALSE THEN
    NEW.vouchers_enabled := FALSE;
  END IF;

  -- Deny-by-default para roles no privilegiados sobre flags privadas.
  IF NOT is_privileged THEN
    IF TG_OP = 'INSERT' THEN
      IF COALESCE(NEW.partner_features_enabled, FALSE) IS DISTINCT FROM FALSE
         OR COALESCE(NEW.vouchers_enabled, FALSE) IS DISTINCT FROM FALSE THEN
        RAISE EXCEPTION 'No tienes permiso para establecer partner_features_enabled o vouchers_enabled.';
      END IF;
    ELSIF TG_OP = 'UPDATE' THEN
      IF NEW.partner_features_enabled IS DISTINCT FROM OLD.partner_features_enabled
         OR NEW.vouchers_enabled IS DISTINCT FROM OLD.vouchers_enabled THEN
        RAISE EXCEPTION 'No tienes permiso para modificar partner_features_enabled o vouchers_enabled.';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DO $$
DECLARE
  insert_columns text := 'user_id, study_enabled, exercise_enabled, habits_enabled, goals_enabled, mood_enabled, gratitude_enabled, cooking_enabled, notes_enabled';
  update_columns text := 'study_enabled, exercise_enabled, habits_enabled, goals_enabled, mood_enabled, gratitude_enabled, cooking_enabled, notes_enabled';
BEGIN
  IF to_regclass('public.user_settings') IS NULL THEN
    RAISE NOTICE 'La tabla public.user_settings no existe. Se omite el blindaje de flags privados.';
    RETURN;
  END IF;

  -- Saneamiento histórico: vouchers_enabled no puede quedar en true si partner_features_enabled es false.
  EXECUTE '
    UPDATE public.user_settings
       SET vouchers_enabled = FALSE
     WHERE COALESCE(partner_features_enabled, FALSE) = FALSE
       AND COALESCE(vouchers_enabled, FALSE) <> FALSE
  ';

  -- Revoca permisos amplios a nivel tabla para re-conceder solo columnas públicas editables.
  EXECUTE 'REVOKE INSERT, UPDATE ON TABLE public.user_settings FROM authenticated';

  -- Revoca permisos por columna para evitar inserts/updates directos de estas flags.
  EXECUTE 'REVOKE INSERT (partner_features_enabled, vouchers_enabled) ON TABLE public.user_settings FROM authenticated';
  EXECUTE 'REVOKE UPDATE (partner_features_enabled, vouchers_enabled) ON TABLE public.user_settings FROM authenticated';

  -- Si existe updated_at, se permite su actualización junto con columnas públicas editables.
  IF EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'user_settings'
       AND column_name = 'updated_at'
  ) THEN
    update_columns := update_columns || ', updated_at';
  END IF;

  -- Concede insert/update de forma explícita solo para columnas públicas editables.
  EXECUTE format(
    'GRANT INSERT (%s) ON TABLE public.user_settings TO authenticated',
    insert_columns
  );
  EXECUTE format(
    'GRANT UPDATE (%s) ON TABLE public.user_settings TO authenticated',
    update_columns
  );

  -- Recrea trigger de guardia en forma idempotente.
  EXECUTE 'DROP TRIGGER IF EXISTS trg_guard_user_settings_private_flags ON public.user_settings';
  EXECUTE '
    CREATE TRIGGER trg_guard_user_settings_private_flags
    BEFORE INSERT OR UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.guard_user_settings_private_flags()
  ';
END;
$$;
