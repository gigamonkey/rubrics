import Database from 'better-sqlite3';
import fs from 'fs';

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

  insertQuestion: {
    action: run,
    sql: `insert into questions (question, sequence) values ($question, $sequence)`,
  },

  insertRubricItem: {
    action: run,
    sql: `insert into rubric (question, criteria, sequence, weight) values ($question, $criteria, $sequence, $weight)`,
  },

  insertSubmission: {
    action: run,
    sql: `insert into submissions (sha, github, date) values ($sha, $github, $date)`,
  },

  insertAnswer: {
    action: run,
    sql: `insert into answers (sha, question, answer) values ($sha, $question, $answer)`,
  },

  shas: {
    action: all,
    sql: `select distinct sha from submissions order by sha`,
  },

  getQuestions: {
    action: get,
    sql: `select json_group_array(question) value from questions order by sequence`,
  },

  getRubric: {
    action: get,
    sql: `with criteria as (
            select question, json_group_array(criteria) criteria
            from rubric r
            group by question
            order by r.question, sequence
          )
          select json_group_object(question, json(criteria)) value from criteria`,
  },

  getSubmission: {
    action: get,
    sql: `select sha, github, date from submissions where sha = $sha`,
  },

  allSubmissions: {
    action: all,
    sql: `select sha, github, sha, date from submissions`,
  },

  getAnswers: {
    action: get,
    sql: `select json_group_object(question, answer) as value
          from answers
          where sha = $sha`,
  },

  getScores: {
    action: get,
    sql: `with criteria as (
            select r.question, json_group_object(r.criteria, score) criteria
            from submissions
            join rubric as r
            left join scores using (sha, question, criteria)
            where sha = $sha
            group by question
          )
          select json_group_object(question, json(criteria)) value from criteria`,
  },

  getAllAnswers: {
    action: all,
    sql: `select sha, github, date, json_group_array(answer) as answers
          from submissions
          join answers using (sha)
          join questions using (question)
          group by sha, github, date
          order by sequence`,
  },

  amountGraded: {
    action: all,
    sql: `select
            sha,
            sum(case when score is null then 1 else 0 end) ungraded,
            sum(case when score is not null then 1 else 0 end) graded
          from submissions
          join rubric r
          left join scores using (sha, question, criteria)
          group by sha`,
  },
};


class DB {
  constructor(filename, schema) {
    this.db = new Database(filename, {});
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    if (schema) {
      this.db.exec(fs.readFileSync(schema, 'utf8'));
    }

    // Dynamically create methods for each bit of sql
    Object.entries(sql).forEach(([name, spec]) => {
      const stmt = this.db.prepare(spec.sql);
      this[name] = spec.action(stmt);
    });
  }

}

export { DB };
