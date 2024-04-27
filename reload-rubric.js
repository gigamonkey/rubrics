import YAML from 'yaml';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { DB } from './db.js';

const reloadRubric = (rubric) => {
  db.clearQuestions();
  db.clearRubric();
  Object.entries(rubric).forEach(([question, items], sequence) => {
    db.insertQuestion({sequence, question});
    Object.entries(items).forEach(([criteria, weight], sequence) => {
      db.insertRubricItem({question, criteria, sequence, weight});
    });
  });
};

const db = new DB('db.db');
const rubric = YAML.parse(fs.readFileSync('rubric.yml', 'utf8'));

reloadRubric(rubric);
