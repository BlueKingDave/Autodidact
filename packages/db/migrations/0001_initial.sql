-- Extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE course_status AS ENUM ('pending', 'generating', 'ready', 'failed');
CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE module_status AS ENUM ('locked', 'available', 'in_progress', 'completed');

-- Users
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_id   UUID NOT NULL UNIQUE,
  email         TEXT NOT NULL UNIQUE,
  display_name  TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Courses
CREATE TABLE courses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic            TEXT NOT NULL,
  slug             TEXT NOT NULL,
  title            TEXT NOT NULL,
  description      TEXT NOT NULL,
  difficulty       difficulty_level NOT NULL DEFAULT 'beginner',
  estimated_hours  INTEGER,
  status           course_status NOT NULL DEFAULT 'pending',
  blueprint        JSONB,
  topic_embedding  vector(1536),
  is_public        BOOLEAN NOT NULL DEFAULT TRUE,
  generated_by     UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Modules
CREATE TABLE modules (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id         UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  position          INTEGER NOT NULL,
  title             TEXT NOT NULL,
  description       TEXT NOT NULL,
  objectives        JSONB NOT NULL,
  content_outline   JSONB NOT NULL,
  estimated_minutes INTEGER NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enrollments
CREATE TABLE enrollments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id),
  course_id        UUID NOT NULL REFERENCES courses(id),
  enrolled_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at     TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Module Progress
CREATE TABLE module_progress (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id),
  module_id        UUID NOT NULL REFERENCES modules(id),
  course_id        UUID NOT NULL REFERENCES courses(id),
  status           module_status NOT NULL DEFAULT 'locked',
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  chat_session_id  UUID,
  completion_score INTEGER,
  UNIQUE(user_id, module_id)
);

-- Chat Sessions
CREATE TABLE chat_sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id),
  module_id  UUID NOT NULL REFERENCES modules(id),
  messages   JSONB NOT NULL DEFAULT '[]',
  thread_id  TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
