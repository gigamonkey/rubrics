import Database from 'better-sqlite3';
import fs from 'fs';
import { fps } from './public/js/scoring.js';

const run =
  (stmt) =>
  (...args) => {
    return stmt.run(...args);
  };

const all =
  (stmt) =>
  (...args) => {
    return stmt.all(...args);
  };

const get =
  (stmt) =>
  (...args) => {
    return stmt.get(...args);
  };

const getColumn = (column) => {
  return (stmt) =>
    (...args) => {
      return stmt.get(...args)?.[column];
    };
};

const allColumn = (column) => {
  return (stmt) =>
    (...args) => {
      return stmt.all(...args).map((r) => r[column]);
    };
};

const sql = {

  clearRubric: {
    action: run,
    sql: `delete from rubric where true`,
  },

  clearSubmissions: {
    action: run,
    sql: `delete from submissions where true`,
  },

  clearAnswers: {
    action: run,
    sql: `delete from answers where true`,
  },

  clearQuestions: {
    action: run,
    sql: `delete from questions where true`,
  },

  insertQuestion: {
    action: run,
    sql: `insert into questions (class, assignment, question, sequence) values ($clazz, $assignment, $question, $sequence)`,
  },

  insertRubricItem: {
    action: run,
    sql: `insert into rubric (class, assignment, question, criteria, sequence, weight) values ($clazz, $assignment, $question, $criteria, $sequence, $weight)`,
  },

  insertSubmission: {
    action: run,
    sql: `insert into submissions (class, assignment, sha, github, date) values ($clazz, $assignment, $sha, $github, $date)`,
  },

  insertAnswer: {
    action: run,
    sql: `insert into answers (class, assignment, sha, question, answer) values ($clazz, $assignment, $sha, $question, $answer)`,
  },

  updateScore: {
    action: run,
    sql: `insert into scores (class, assignment, sha, question, criteria, correct)
          values ($clazz, $assignment, $sha, $question, $criteria, $correct)
          on conflict (sha, question, criteria)
          do update set correct = $correct`,
  },

  updateComment: {
    action: run,
    sql: `insert into comments (class, assignment, sha, question, comment)
          values ($clazz, $assignment, $sha, $question, $comment)
          on conflict (sha, question)
          do update set comment = $comment`,
  },

  deleteScore: {
    action: run,
    sql: `delete from scores where sha = $sha and question = $question and criteria = $criteria`,
  },

  deleteComment: {
    action: run,
    sql: `delete from comments where sha = $sha and question = $question`,
  },

  shas: {
    action: all,
    sql: `select distinct sha from submissions order by sha`,
  },

  getQuestions: {
    action: get,
    sql: `select json_group_array(question) value
          from questions
          where class = $clazz and assignment = $assignment
          order by sequence`,
  },

  getRubric: {
    action: get,
    sql: `with criteria as (
            select question, json_group_array(criteria) criteria
            from rubric r
            where class = $clazz and assignment = $assignment
            group by question
            order by r.question, sequence
          )
          select json_group_object(question, json(criteria)) value from criteria`,
  },

  getSubmission: {
    action: get,
    sql: `select sha, github, date from submissions
          where class = $clazz and assignment = $assignment and sha = $sha`,
  },

  allSubmissions: {
    action: all,
    sql: `select
            sha,
            github,
            date,
            sum(case when correct is not null then 1.0 else 0.0 end) / count(sha) done,
            sum(case when correct = 'yes' then weight else 0 end) / sum(weight) grade
          from submissions s, rubric
          left join scores using (class, assignment, sha, question, criteria)
          where s.class = $clazz and s.assignment = $assignment
          group by sha`,
  },

  getAnswers: {
    action: get,
    sql: `select json_group_object(q.question, coalesce(answer, '')) value
          from questions q
          left join answers a on
            q.class = a.class and
            q.assignment = a.assignment and
            q.question = a.question and
            sha = $sha
          where q.class = $clazz and q.assignment = $assignment`,
  },

  getScores: {
    action: get,
    sql: `with criteria as (
            select r.question, json_group_object(r.criteria, correct) criteria
            from submissions as s
            join rubric as r
            left join scores using (class, assignment, sha, question, criteria)
            where r.class = $clazz and r.assignment = $assignment and sha = $sha
            group by question
          )
          select json_group_object(question, json(criteria)) value from criteria`,
  },

  getComments: {
    action: get,
    sql: `select json_group_object(question, comment) value from comments where sha = $sha`,
  },

  getAllAnswers: {
    action: all,
    sql: `select sha, github, date, json_group_array(answer) as answers
          from submissions
          join answers using (class, assignment, sha)
          join questions using (class, assignment, question)
          where class = $clazz and assignment = $assignment
          group by sha, github, date
          order by sequence`,
  },

  gradeStats: {
    action: get,
    sql: `select
            sha,
            sum(case when correct is not null then 1.0 else 0.0 end) / count(sha) done,
            sum(case when correct = 'yes' then weight else 0 end) / sum(weight) grade
          from submissions s, rubric
          left join scores using (class, assignment, sha, question, criteria)
          where s.class = $clazz and s.assignment = $assignment and sha = $sha`,
  },

  amountGraded: {
    action: all,
    sql: `select
            sha,
            sum(case when correct is null then 1 else 0 end) ungraded,
            sum(case when correct is not null then 1 else 0 end) graded
          from submissions s, rubric
          left join scores using (class, assignment, sha, question, criteria)
          where s.class = $clazz and s.assignment = $assignment
          group by sha`,
  },

  work: {
    action: all,
    sql: `select
            date,
            github,
            fps(sum(case when correct = 'yes' then weight else 0 end) / sum(weight)) grade
          from submissions s, rubric
          left join scores using (class, assignment, sha, question, criteria)
          where s.class = $clazz and s.assignment = $assignment
          group by sha`,
  },

  scoreMissing: {
    action: run,
    sql: `with missing as (
            select *
            from submissions s, questions
            left join answers  using (class, assignment, sha, question)
            where s.class = $clazz and s.assignment = $assignment and coalesce(answer, '') = ''
          )
          insert into scores
            select m.class, m.assignment, sha, question, criteria, 'no'
            from missing m
            join rubric using (question)
            where true
          on conflict do nothing`,
  },
};


class DB {
  constructor(filename, schema) {
    this.db = new Database(filename, {verbose: console.log});
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.db.function('fps', fps)
    if (schema) {
      this.db.exec(fs.readFileSync(schema, 'utf8'));
    }

    // Dynamically create methods for each bit of sql
    Object.entries(sql).forEach(([name, spec]) => {
      //console.log(spec.sql);
      const stmt = this.db.prepare(spec.sql);
      this[name] = spec.action(stmt);
    });
  }

}

export { DB };
