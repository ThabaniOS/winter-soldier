CREATE TABLE running_logs (
  id           SERIAL PRIMARY KEY,
  week_id      INTEGER REFERENCES weeks(id),
  run_date     DATE NOT NULL,
  distance_km  NUMERIC NOT NULL,
  notes        TEXT
);
