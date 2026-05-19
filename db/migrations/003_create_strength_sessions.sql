CREATE TABLE strength_sessions (
  id            SERIAL PRIMARY KEY,
  week_id       INTEGER REFERENCES weeks(id),
  session_date  DATE NOT NULL,
  session_type  TEXT CHECK (session_type IN ('push','pull','legs','upper','lower','full')),
  notes         TEXT
);
