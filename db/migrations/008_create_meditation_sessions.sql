CREATE TABLE meditation_sessions (
  id                SERIAL PRIMARY KEY,
  session_start     TIMESTAMPTZ NOT NULL,
  session_end       TIMESTAMPTZ NOT NULL,
  technique         TEXT CHECK (technique IN ('478', 'box', 'coherent', 'calm')),
  cycles_completed  INTEGER,
  duration_seconds  INTEGER
);
