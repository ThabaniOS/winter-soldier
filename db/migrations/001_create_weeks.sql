CREATE TABLE weeks (
  id                   SERIAL PRIMARY KEY,
  week_number          INTEGER NOT NULL UNIQUE CHECK (week_number BETWEEN 1 AND 13),
  start_date           DATE NOT NULL,
  end_date             DATE NOT NULL,
  identity_score       INTEGER CHECK (identity_score BETWEEN 1 AND 10),
  identity_note        TEXT,
  sleep_note           TEXT,
  create_consume_note  TEXT,
  raiis_note           TEXT,
  blocker_note         TEXT,
  next_week_priorities TEXT,
  reviewed_at          TIMESTAMPTZ
);
