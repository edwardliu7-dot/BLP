-- BLP Harian — SMP TISA Islamic School
-- Database schema. Apply once to a fresh database.
-- The app's ensureSchema() in server/index.ts also creates blp_periods at startup.

CREATE TABLE IF NOT EXISTS students (
  id text PRIMARY KEY,
  username text UNIQUE NOT NULL,
  name text NOT NULL,
  kelas text NOT NULL,
  email text NOT NULL DEFAULT '',
  whatsapp text NOT NULL DEFAULT '',
  password text,
  photo_url text,
  bio text,
  quran_bookmark jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gurus (
  id text PRIMARY KEY,
  username text UNIQUE NOT NULL,
  name text NOT NULL,
  jabatan text[],
  wali_kelas_kelas text,
  kelas_diampu text,
  password text,
  photo_url text,
  bio text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS daily_records (
  student_id text NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  record_date date NOT NULL,
  completed_activities text[] NOT NULL DEFAULT '{}',
  score integer,
  submissions jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, record_date)
);

CREATE TABLE IF NOT EXISTS nilai (
  id serial PRIMARY KEY,
  student_id text NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  label text NOT NULL,
  score numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blp_periods (
  kelas text NOT NULL,
  year integer NOT NULL,
  month integer NOT NULL,
  start_day integer NOT NULL,
  end_day integer NOT NULL,
  updated_by text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (kelas, year, month)
);
