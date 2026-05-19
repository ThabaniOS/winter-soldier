CREATE TABLE phase_markers (
  id               SERIAL PRIMARY KEY,
  day_number       INTEGER NOT NULL CHECK (day_number IN (0, 30, 45, 60, 90)),
  marker_date      DATE NOT NULL,
  reflection_text  TEXT,
  completed_at     TIMESTAMPTZ
);
