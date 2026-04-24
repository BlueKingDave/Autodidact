-- HNSW index for fast approximate nearest-neighbour search on course embeddings
-- Only created after embeddings are populated; CONCURRENTLY avoids table lock
CREATE INDEX CONCURRENTLY IF NOT EXISTS courses_topic_embedding_idx
  ON courses USING hnsw (topic_embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Standard query indexes
CREATE INDEX IF NOT EXISTS enrollments_user_id_idx        ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS enrollments_course_id_idx      ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS modules_course_id_position_idx ON modules(course_id, position);
CREATE INDEX IF NOT EXISTS module_progress_user_id_idx    ON module_progress(user_id);
CREATE INDEX IF NOT EXISTS module_progress_course_id_idx  ON module_progress(course_id);
CREATE INDEX IF NOT EXISTS chat_sessions_user_id_idx      ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS chat_sessions_module_id_idx    ON chat_sessions(module_id);
CREATE INDEX IF NOT EXISTS courses_status_idx             ON courses(status);
