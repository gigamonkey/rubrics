import { DB } from './db.js';
import fs from 'fs';

const db = new DB('db.db');

const dumpAll = () => {
  db.allSubmissions().forEach(s => {
    const sub = submission(s.sha);
    const filename = `rubrics/${sub.github}.json`;
    console.log(`Writing ${filename}`);
    fs.writeFileSync(filename, JSON.stringify(sub));
  });
}

const submission = (sha) => {
  return {
    ...db.getSubmission({sha}),
    answers: JSON.parse(db.getAnswers({sha}).value),
    scores: JSON.parse(db.getScores({sha}).value),
    comments: JSON.parse(db.getComments({sha}).value),
    stats: db.gradeStats({sha}),
  };
}

dumpAll();
