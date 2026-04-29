-- Fixes three issues flagged by the Supabase security/performance advisor:
-- 1. Enable RLS on courses and modules (omitted from 0003_rls.sql)
-- 2. Recreate all policies with (SELECT auth.fn()) to prevent per-row re-evaluation
-- 3. Add missing FK indexes on courses.generated_by and module_progress.module_id

-- ── 1. Enable RLS on the two tables missed in 0003 ───────────────────────────
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules  ENABLE ROW LEVEL SECURITY;

-- ── 2. Recreate all policies with optimised auth calls ────────────────────────

-- users
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (supabase_id = (SELECT auth.uid()));
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (supabase_id = (SELECT auth.uid()));

-- courses (now actually enforced)
DROP POLICY IF EXISTS "courses_select_public" ON courses;
CREATE POLICY "courses_select_public" ON courses
  FOR SELECT USING (is_public = TRUE AND (SELECT auth.role()) = 'authenticated');

-- modules (new — readable when course is public and user is authenticated)
CREATE POLICY "modules_select_public_course" ON modules
  FOR SELECT USING (
    (SELECT auth.role()) = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = modules.course_id AND courses.is_public = TRUE
    )
  );

-- enrollments
DROP POLICY IF EXISTS "enrollments_select_own" ON enrollments;
DROP POLICY IF EXISTS "enrollments_insert_own" ON enrollments;
DROP POLICY IF EXISTS "enrollments_update_own" ON enrollments;
CREATE POLICY "enrollments_select_own" ON enrollments
  FOR SELECT USING (user_id = (SELECT id FROM users WHERE supabase_id = (SELECT auth.uid()) LIMIT 1));
CREATE POLICY "enrollments_insert_own" ON enrollments
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE supabase_id = (SELECT auth.uid()) LIMIT 1));
CREATE POLICY "enrollments_update_own" ON enrollments
  FOR UPDATE USING (user_id = (SELECT id FROM users WHERE supabase_id = (SELECT auth.uid()) LIMIT 1));

-- module_progress
DROP POLICY IF EXISTS "module_progress_select_own" ON module_progress;
DROP POLICY IF EXISTS "module_progress_insert_own" ON module_progress;
DROP POLICY IF EXISTS "module_progress_update_own" ON module_progress;
CREATE POLICY "module_progress_select_own" ON module_progress
  FOR SELECT USING (user_id = (SELECT id FROM users WHERE supabase_id = (SELECT auth.uid()) LIMIT 1));
CREATE POLICY "module_progress_insert_own" ON module_progress
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE supabase_id = (SELECT auth.uid()) LIMIT 1));
CREATE POLICY "module_progress_update_own" ON module_progress
  FOR UPDATE USING (user_id = (SELECT id FROM users WHERE supabase_id = (SELECT auth.uid()) LIMIT 1));

-- chat_sessions
DROP POLICY IF EXISTS "chat_sessions_select_own" ON chat_sessions;
DROP POLICY IF EXISTS "chat_sessions_insert_own" ON chat_sessions;
DROP POLICY IF EXISTS "chat_sessions_update_own" ON chat_sessions;
CREATE POLICY "chat_sessions_select_own" ON chat_sessions
  FOR SELECT USING (user_id = (SELECT id FROM users WHERE supabase_id = (SELECT auth.uid()) LIMIT 1));
CREATE POLICY "chat_sessions_insert_own" ON chat_sessions
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE supabase_id = (SELECT auth.uid()) LIMIT 1));
CREATE POLICY "chat_sessions_update_own" ON chat_sessions
  FOR UPDATE USING (user_id = (SELECT id FROM users WHERE supabase_id = (SELECT auth.uid()) LIMIT 1));

-- ── 3. Missing FK indexes ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS courses_generated_by_idx      ON courses(generated_by);
CREATE INDEX IF NOT EXISTS module_progress_module_id_idx ON module_progress(module_id);
