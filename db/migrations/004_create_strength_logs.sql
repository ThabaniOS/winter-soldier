CREATE TABLE strength_logs (
  id          SERIAL PRIMARY KEY,
  session_id  INTEGER REFERENCES strength_sessions(id) ON DELETE CASCADE,
  lift_name   TEXT NOT NULL,
  weight      NUMERIC,
  reps        INTEGER,
  set_number  INTEGER,
  notes       TEXT
);
