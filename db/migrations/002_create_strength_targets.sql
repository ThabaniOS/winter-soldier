CREATE TABLE strength_targets (
  id               SERIAL PRIMARY KEY,
  lift_name        TEXT NOT NULL UNIQUE,
  baseline_weight  NUMERIC,
  baseline_reps    INTEGER,
  target_weight    NUMERIC,
  target_reps      INTEGER,
  target_type      TEXT CHECK (target_type IN ('weight_for_reps', 'reps_unbroken'))
);
