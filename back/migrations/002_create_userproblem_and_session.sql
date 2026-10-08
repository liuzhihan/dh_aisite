-- User-submitted AI problems, binary attachments, and secure login sessions.
-- Run after 001_create_user_table.sql.

BEGIN;

CREATE TABLE IF NOT EXISTS public.userproblem (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public."user" (id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  purpose TEXT NOT NULL,
  status SMALLINT NOT NULL DEFAULT 1,
  other TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT userproblem_question_not_blank CHECK (btrim(question) <> ''),
  CONSTRAINT userproblem_purpose_not_blank CHECK (btrim(purpose) <> ''),
  CONSTRAINT userproblem_status_check CHECK (status IN (1, 2, 3))
);

CREATE INDEX IF NOT EXISTS userproblem_user_created_index
  ON public.userproblem (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.userproblem_attachment (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  problem_id BIGINT NOT NULL REFERENCES public.userproblem (id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(160) NOT NULL,
  size_bytes INTEGER NOT NULL,
  content BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT userproblem_attachment_size_check CHECK (size_bytes > 0 AND size_bytes <= 10485760)
);

CREATE INDEX IF NOT EXISTS userproblem_attachment_problem_index
  ON public.userproblem_attachment (problem_id);

CREATE TABLE IF NOT EXISTS public.user_session (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public."user" (id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS user_session_user_index
  ON public.user_session (user_id);

CREATE INDEX IF NOT EXISTS user_session_expiry_index
  ON public.user_session (expires_at);

COMMIT;
