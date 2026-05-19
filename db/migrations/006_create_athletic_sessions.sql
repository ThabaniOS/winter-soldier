CREATE TABLE athletic_sessions (
  id            SERIAL PRIMARY KEY,
  week_id       INTEGER REFERENCES weeks(id),
  session_date  DATE NOT NULL,
<parameter name="activity      TEXT,
  notes         TEXT
);
