import express from 'express';
import fs from 'fs/promises';
import nunjucks from 'nunjucks';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import { tsv } from './express-tsv.js';
import { rawScore, percentGraded, fps } from './public/js/scoring.js';
import { DB } from './db.js';

const mod = (a, b) => ((a % b) + b) % b

const db = new DB('db.db');
const port = 3000;
const app = express();

app.set('json spaces', 2);
app.use(express.json());
app.use(express.static('public'));
app.use(tsv);

const env = nunjucks.configure('views', {
  autoescape: true,
  express: app,
});

/*
 * All submissions.
 */
app.get('/a/submissions', (req, res) => {
  res.json(db.allSubmissions());
});

/*
 * One fully hydrated submission with answers and scores.
 */
app.get('/a/submission/:sha', (req, res) => {
  const { sha } = req.params;
  res.json({
    ...db.getSubmission({sha}),
    answers: JSON.parse(db.getAnswers({sha}).value),
    scores: JSON.parse(db.getScores({sha}).value),
    comments: JSON.parse(db.getComments({sha}).value),
    stats: db.gradeStats({sha}),
  });
});

/*
 * Update score for one rubric item for one submission.
 */
app.put('/a/scores/:sha', (req, res) => {
  const { sha } = req.params;
  const { question, criteria, correct } = req.body;
  console.log(`Saving score for ${JSON.stringify({sha, question, criteria, correct })}`);
  if (correct) {
    db.updateScore({sha, question, criteria, correct });
  } else {
    db.deleteScore({sha, question, criteria });
  }
  res.json(db.gradeStats({sha}));
});

/*
 * Update or delete per-question comment.
 */
app.put('/a/comment/:sha', (req, res) => {
  const { sha } = req.params;
  const { question, comment } = req.body;
  if (comment) {
    db.updateComment({sha, question, comment });
  } else {
    db.deleteComment({sha, question });
  }
  res.send('ok');
});


/*

app.get('/a/scores', (req, res) => {
  res.json(commitsList.map(c => {
    const score = rawScore(c.scores);
    return {
      who: c.who,
      score,
      fps: fps(score),
    }
  }));
});

app.get('/scores', (req, res) => {
  const header = [ 'num', 'github', 'date', 'sha', 'percent graded', 'score', 'grade'];
  const data = commitsList.map((c, i) => {
    const score = rawScore(c.scores);
    return [ i + 1, c.who, c.date, c.sha, percentGraded(c.scores), score, fps(score) ];
  });
  res.tsv([ header, ...data]);
});

app.get('/work', (req, res) => {
  const data = commitsList.map(c => {
    return [
      c.date,
      'form-coding-test',
      'Bank Inheritance',
      'Classes',
      c.who,
      2.0,
      fps(rawScore(c.scores)),
    ];
  })
  res.tsv(data);
});
*/


app.listen(port, function () {
  console.log(`http://localhost:${this.address().port}`);
})
