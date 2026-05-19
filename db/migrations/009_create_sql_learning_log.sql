CREATE TABLE sql_learning_log (
  id             SERIAL PRIMARY KEY,
  log_date       DATE NOT NULL,
  minutes_spent  INTEGER NOT NULL,
  resource       TEXT CHECK (resource IN ('mode', 'datalemur', 'supabase', 'other')),
  topic          TEXT,
  notes          TEXT
);
