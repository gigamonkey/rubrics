import YAML from 'yaml';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { DB } from './db.js';

const db = new DB('db.db', 'schema.sql');

const rubric = YAML.parse(fs.readFileSync('rubric.yml', 'utf8'));

const questions = Object.keys(rubric);

const getGithub = (p) => path.basename(path.dirname(path.dirname(p)));

const getDate = (p) => path.basename(path.dirname(p));

const answerFiles = await glob("answers/**/answers.json", {});

// Load the rubric into the database
Object.entries(rubric).forEach(([question, items], sequence) => {
  db.insertQuestion({sequence, question});
  Object.entries(items).forEach(([criteria, weight], sequence) => {
    db.insertRubricItem({question, criteria, sequence, weight});
  });
});

// Load answers into the database
answerFiles.forEach(f => {

  const github = getGithub(f);
  const date = getDate(f);
  const sha = fs.readFileSync(path.join(path.dirname(f), "commit.txt"), { encoding: 'utf8' }).trim();
  const answers = JSON.parse(fs.readFileSync(f, { encoding: 'utf8' })).map(a => a?.trim() ?? "");

  const submissionId = db.insertSubmission({github, date, sha}).lastInsertRowid;
  answers.forEach((answer, i) => {
    const question = questions[i];
    db.insertAnswer({ submissionId, question, answer });
  });
});
