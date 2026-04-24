-- Row Level Security
-- All tables default-deny; policies grant minimal required access.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- users: own row only
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (supabase_id = auth.uid());

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (supabase_id = auth.uid());

-- courses: public courses are readable by all authenticated users
CREATE POLICY "courses_select_public" ON courses
  FOR SELECT USING (is_public = TRUE AND auth.role() = 'authenticated');

-- enrollments: own rows only
CREATE POLICY "enrollments_select_own" ON enrollments
  FOR SELECT USING (
    user_id = (SELECT id FROM users WHERE supabase_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "enrollments_insert_own" ON enrollments
  FOR INSERT WITH CHECK (
    user_id = (SELECT id FROM users WHERE supabase_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "enrollments_update_own" ON enrollments
  FOR UPDATE USING (
    user_id = (SELECT id FROM users WHERE supabase_id = auth.uid() LIMIT 1)
  );

-- module_progress: own rows only
CREATE POLICY "module_progress_select_own" ON module_progress
  FOR SELECT USING (
    user_id = (SELECT id FROM users WHERE supabase_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "module_progress_insert_own" ON module_progress
  FOR INSERT WITH CHECK (
    user_id = (SELECT id FROM users WHERE supabase_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "module_progress_update_own" ON module_progress
  FOR UPDATE USING (
    user_id = (SELECT id FROM users WHERE supabase_id = auth.uid() LIMIT 1)
  );

-- chat_sessions: own rows only
CREATE POLICY "chat_sessions_select_own" ON chat_sessions
  FOR SELECT USING (
    user_id = (SELECT id FROM users WHERE supabase_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "chat_sessions_insert_own" ON chat_sessions
  FOR INSERT WITH CHECK (
    user_id = (SELECT id FROM users WHERE supabase_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "chat_sessions_update_own" ON chat_sessions
  FOR UPDATE USING (
    user_id = (SELECT id FROM users WHERE supabase_id = auth.uid() LIMIT 1)
  );
