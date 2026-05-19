CREATE TABLE books_read (
  id             SERIAL PRIMARY KEY,
  title          TEXT NOT NULL,
  started_date   DATE NOT NULL,
  finished_date  DATE,
  notes          TEXT
);
