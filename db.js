import fs from 'fs';
import Database from 'better-sqlite3';

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
  insertAnswer: {
    action: run,
    sql: `insert into answers (github, sha, question, answer) values ($github, $sha, $question, $answer)`,
  },

  insertRubricItem: {
    action: run,
    sql: `insert into rubric (question, criteria, weight) values ($question, $criteria, $weight)`,
  },
};


class DB {
  constructor(filename) {
    this.db = new Database(filename, {});
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.db.exec(fs.readFileSync('schema.sql', 'utf8'));

    // Dynamically create methods for each bit of sql
    Object.entries(sql).forEach(([name, spec]) => {
      const stmt = this.db.prepare(spec.sql);
      this[name] = spec.action(stmt);
    });
  }
}

export { DB };
