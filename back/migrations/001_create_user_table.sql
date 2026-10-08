-- User accounts for website registration.
-- Store only a password hash in password_hash; never store a plaintext password.

BEGIN;

CREATE TABLE IF NOT EXISTS public."user" (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email VARCHAR(320) NOT NULL,
  password_hash TEXT NOT NULL,
  username VARCHAR(64),
  display_name VARCHAR(120),
  avatar_url TEXT,
  phone VARCHAR(32),
  role VARCHAR(32) NOT NULL DEFAULT 'user',
  status VARCHAR(24) NOT NULL DEFAULT 'pending',
  email_verified_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_email_not_blank CHECK (btrim(email) <> ''),
  CONSTRAINT user_role_check CHECK (role IN ('user', 'admin')),
  CONSTRAINT user_status_check CHECK (status IN ('pending', 'active', 'disabled')),
  CONSTRAINT user_failed_login_attempts_check CHECK (failed_login_attempts >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS user_email_lower_unique
  ON public."user" (lower(email));

CREATE UNIQUE INDEX IF NOT EXISTS user_username_lower_unique
  ON public."user" (lower(username))
  WHERE username IS NOT NULL;

CREATE INDEX IF NOT EXISTS user_status_index
  ON public."user" (status);

CREATE OR REPLACE FUNCTION public.user_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_set_updated_at_trigger ON public."user";

CREATE TRIGGER user_set_updated_at_trigger
BEFORE UPDATE ON public."user"
FOR EACH ROW
EXECUTE FUNCTION public.user_set_updated_at();

COMMIT;
