import YAML from 'yaml';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { DB } from './db.js';

const db = new DB("db.db");

const rubric = YAML.parse(fs.readFileSync('rubric.yml', 'utf8'));

const questions = Object.keys(rubric);

const getGithub = (p) => path.basename(path.dirname(path.dirname(p)));

const getDate = (p) => path.basename(path.dirname(p));

const answerFiles = await glob("answers/**/answers.json", {});

// Load the rubric into the database
Object.entries(rubric).forEach(([question, items]) => {
  Object.entries(items).forEach(([criteria, weight]) => {
    db.insertRubricItem({question, criteria, weight});
  });
});

// Load answers into the database
answerFiles.forEach(f => {
  const github = getGithub(f);
  const sha = fs.readFileSync(path.join(path.dirname(f), "commit.txt"), { encoding: 'utf8' }).trim();
  const answers = JSON.parse(fs.readFileSync(f, { encoding: 'utf8' })).map(a => a?.trim() ?? "");
  answers.forEach((answer, i) => {
    const question = questions[i];
    db.insertAnswer({ github, sha, question, answer });
  });
});
