-- Answers from answers.json at a particular date and commit

PRAGMA foreign_keys = ON;

-- Answers per student, date, commit
drop table if exists answers;
create table answers (
  github TEXT NOT NULL,
  sha TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL
);

-- Rubric items per question
drop table if exists rubric;
create table rubric (
  question TEXT NOT NULL,
  criteria TEXT NOT NULL,
  weight NUMBER
);

drop table if exists scores;
create table scores (
  github TEXT NOT NULL,
  date TEXT NOT NULL,
  sha TEXT NOT NULL,
  question TEXT NOT NULL,
  criteria TEXT NOT NULL,
  score INTEGER NOT NULL
);
