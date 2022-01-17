CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT,
  age INT,
  gender Text,
  password TEXT,
  hashed_password TEXT,
  photo TEXT
);

CREATE TABLE IF NOT EXISTS activity (
  id SERIAL PRIMARY KEY,
  user_id INT,
  date TEXT,
  activity_type INT,
  free_text TEXT
);

CREATE TABLE IF NOT EXISTS activity_type (
  id SERIAL PRIMARY KEY,
  name TEXT,
  category INT,
  icon TEXT
);

CREATE TABLE IF NOT EXISTS activity_mood (
  id SERIAL PRIMARY KEY,
  activity_id INT,
  mood_id INT
);

CREATE TABLE IF NOT EXISTS mood (
  id SERIAL PRIMARY KEY,
  name TEXT,
  rating INT
);

CREATE TABLE IF NOT EXISTS quotes (
  id SERIAL PRIMARY KEY,
  quote TEXT,
  type INT
);