-- Save answers from answers.json at a particular date and commit

--PRAGMA foreign_keys = ON;

-- Questions for ordering
drop table if exists questions;
create table questions (
  question TEXT PRIMARY_KEY,
  sequence INTEGER
);

-- Rubric items per question
drop table if exists rubric;
create table rubric (
  rubric_id INTEGER PRIMARY KEY,
  question TEXT NOT NULL,
  criteria TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  weight NUMBER NOT NULL
);

-- Submissions per student, date commit
drop table if exists submissions;
create table submissions (
  submission_id INTEGER PRIMARY KEY,
  github TEXT NOT NULL,
  date TEXT NOT NULL,
  sha TEXT NOT NULL
);

-- Answers per student, date, commit
drop table if exists answers;
create table answers (
  submission_id INTEGER,
  question TEXT NOT NULL,
  answer TEXT NOT NULL
);

drop table if exists scores;
create table scores (
  submission_id INTEGER,
  question TEXT NOT NULL,
  criteria TEXT NOT NULL,
  score INTEGER NOT NULL
);
