CREATE TABLE sport_sessions (
  id            SERIAL PRIMARY KEY,
  session_date  DATE NOT NULL,
  sport         TEXT CHECK (sport IN ('golf', 'padel')),
  notes         TEXT
);
