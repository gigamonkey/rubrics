import YAML from 'yaml';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { DB } from './db.js';

const loadRubric = (rubric) => {
  Object.entries(rubric).forEach(([question, items], sequence) => {
    db.insertQuestion({sequence, question});
    Object.entries(items).forEach(([criteria, weight], sequence) => {
      db.insertRubricItem({question, criteria, sequence, weight});
    });
  });
};

const loadSubmissions = (files, questions) => {
  files.forEach(f => {
    const { sha, github, date, answers } = parseSubmission(f);
    db.insertSubmission({sha, github, date});
    answers.forEach((answer, i) => {
      const question = questions[i];
      db.insertAnswer({ sha, question, answer });
    });
  });
};

const parseSubmission = (f) => {
  const sha     = fs.readFileSync(path.join(path.dirname(f), "commit.txt"), { encoding: 'utf8' }).trim();
  const github  = path.basename(path.dirname(path.dirname(f)));
  const date    = path.basename(path.dirname(f));
  const answers = JSON.parse(fs.readFileSync(f, { encoding: 'utf8' })).map(a => a?.trim() ?? "");
  return { sha, github, date, answers };
}


const db = new DB('db.db', 'schema.sql');
const rubric = YAML.parse(fs.readFileSync('rubric.yml', 'utf8'));
const answerFiles = await glob("answers/**/answers.json", {});

loadRubric(rubric);
loadSubmissions(answerFiles, Object.keys(rubric));
