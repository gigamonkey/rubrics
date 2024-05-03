-- Save answers from answers.json at a particular date and commit

--PRAGMA foreign_keys = ON;

-- Assignments
create table if not exists assignments (class TEXT, assignment TEXT);

-- Questions for ordering
create table if not exists questions (
  class TEXT,
  assignment TEXT,
  question TEXT PRIMARY_KEY,
  sequence INTEGER
);

-- Rubric items per question
create table if not exists rubric (
  class TEXT,
  assignment TEXT,
  question TEXT NOT NULL,
  criteria TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  weight NUMBER NOT NULL
);

-- Submissions per student, date commit
create table if not exists submissions (
  class TEXT,
  assignment TEXT,
  sha TEXT PRIMARY KEY,
  github TEXT NOT NULL,
  date TEXT NOT NULL
);

-- Answers per submission.
create table if not exists answers (
  class TEXT,
  assignment TEXT,
  sha TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL
);

create table if not exists scores (
  class TEXT,
  assignment TEXT,
  sha TEXT NOT NULL,
  question TEXT NOT NULL,
  criteria TEXT NOT NULL,
  correct TEXT NOT NULL,
  primary key (sha, question, criteria)
);

create table if not exists comments (
  class TEXT,
  assignment TEXT,
  sha TEXT NOT NULL,
  question TEXT NOT NULL,
  comment TEXT NOT NULL,
  primary key (sha, question)
);

create table if not exists flags (
  class TEXT,
  assignment TEXT,
  sha TEXT NOT NULL,
  flag TEXT NOT NULL
);
