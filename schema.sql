-- Save answers from answers.json at a particular date and commit

--PRAGMA foreign_keys = ON;

-- Assignments
create table if not exists assignments (
  class TEXT NOT NULL,
  assignment TEXT NOT NULL
);

-- Questions for ordering
create table if not exists questions (
  class TEXT NOT NULL,
  assignment TEXT NOT NULL,
  question TEXT PRIMARY_KEY,
  sequence INTEGER
);

-- Rubric items per question
create table if not exists rubric (
  class TEXT NOT NULL,
  assignment TEXT NOT NULL,
  question TEXT NOT NULL,
  criteria TEXT NOT NULL,
  sequence INTEGER NOT NULL
);

-- Possibly results per rubric criteria, e.g. correct/incorrect or perfect/okay/almost
create table if not exists rubric_results (
  class TEXT NOT NULL,
  assignment TEXT NOT NULL,
  question TEXT NOT NULL,
  criteria TEXT NOT NULL,
  result TEXT NOT NULL,
  score NUMBER NOT NULL
);

-- Submissions per student, date commit
create table if not exists submissions (
  class TEXT NOT NULL,
  assignment TEXT NOT NULL,
  sha TEXT PRIMARY KEY,
  github TEXT NOT NULL,
  date TEXT NOT NULL
);

-- Answers per submission.
create table if not exists answers (
  class TEXT NOT NULL,
  assignment TEXT NOT NULL,
  sha TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL
);

create table if not exists scores (
  class TEXT NOT NULL,
  assignment TEXT NOT NULL,
  sha TEXT NOT NULL,
  question TEXT NOT NULL,
  criteria TEXT NOT NULL,
  result TEXT NOT NULL,
  primary key (class, question, sha, question, criteria)
);

create table if not exists comments (
  class TEXT NOT NULL,
  assignment TEXT NOT NULL,
  sha TEXT NOT NULL,
  question TEXT NOT NULL,
  comment TEXT NOT NULL,
  primary key (sha, question)
);

create table if not exists flags (
  class TEXT NOT NULL,
  assignment TEXT NOT NULL,
  sha TEXT NOT NULL,
  flag TEXT NOT NULL
);


create view if not exists rubric_weights (
  class,
  assignment,
  question,
  criteria,
  weight
) as
select class, assignment, question, criteria, max(score) from rubric_results
group by class, assignment, question, criteria;

create view if not exists zero_results (
  class,
  assignment,
  question,
  criteria,
  result
) as
select
  class,
  assignment,
  question,
  criteria,
  result
from rubric_results where score = 0.0;

create view if not exists submission_scores (
  class,
  assignment,
  sha,
  github,
  date,
  done,
  grade
) as
select
  class,
  assignment,
  sha,
  github,
  date,
  sum(case when scores.result is not null then 1.0 else 0.0 end) / count(sha) done,
  sum(coalesce(score, 0)) / sum(weight) grade
from submissions s
join rubric using (class, assignment)
join rubric_weights using (class, assignment, question, criteria)
left join scores using (class, assignment, sha, question, criteria)
left join rubric_results using (class, assignment, question, criteria, result)
group by class, assignment, sha;

create view if not exists rubric_json (
class, assignment, json
) as
with criteria_results as (
  select
    class,
    assignment,
    question,
    criteria,
    json_group_array(result) as results
  from rubric_results
  group by class, assignment, question, criteria
), by_question as (
  select
    class,
    assignment,
    question,
    json_group_object(criteria, json(results)) as criteria
  from criteria_results
  group by class, assignment, question
)
select
  class,
  assignment,
  json_group_object(question, json(criteria)) as rubric
from by_question
group by class, assignment;
