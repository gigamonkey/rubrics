import YAML from 'yaml';
import express from 'express';
import fs from 'fs/promises';
import nunjucks from 'nunjucks';
import path from 'path';
import { DB } from './db.js';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import { tsv } from './express-tsv.js';
const __dirname = import.meta.dirname;

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
app.get('/a/submissions/:clazz/:assignment', (req, res) => {
  res.json(db.allSubmissions(req.params));
});

app.get('/a/rubrics/:clazz/:assignment', (req, res) => {
  res.type('json');
  res.send(db.getRubric(req.params).json);
});

/*
 * One fully hydrated submission with answers and scores.
 */
app.get('/a/submissions/:clazz/:assignment/:sha', (req, res) => {
  res.json({
    ...db.getSubmission(req.params),
    answers: JSON.parse(db.getAnswers(req.params).value),
    scores: JSON.parse(db.getScores(req.params).value),
    comments: JSON.parse(db.getComments(req.params).value),
    stats: db.gradeStats(req.params),
  });
});

/*
 * Full assignment spec.
 */
app.get('/a/assignment/:clazz/:assignment', async (req, res) => {
  const { clazz, assignment } = req.params;
  const assignmentFile = path.join('assignments', clazz, assignment, 'assignment.yml');
  res.json(YAML.parse(await fs.readFile(assignmentFile, 'utf8')));
});

/*
 * Update score for one rubric item for one submission.
 */
app.put('/a/:clazz/:assignment/scores/:sha', (req, res) => {
  const k = {...req.params, ...req.body};
  if (req.body.result) {
    db.updateScore(k);
  } else {
    db.deleteScore(k);
  }
  res.json(db.gradeStats(k));
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
 * TSV to make into the work file for this assignment.
 */
app.get('/work/:clazz/:assignment', async (req, res) => {
  const { clazz, assignment } = req.params;
  const assignmentFile = path.join('assignments', clazz, assignment, 'assignment.yml');
  const { kind, standard, weight } = YAML.parse(await fs.readFile(assignmentFile, 'utf8'));
  res.tsv(db.work().map(({date, assignment, github, grade}) =>
    [
      date,
      kind,
      assignment,
      standard,
      github,
      weight,
      grade
    ]
  ));
});

// FIXME: move html out of public
app.get('/grade/:clazz/:assignment', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, function () {
  console.log(`http://localhost:${this.address().port}`);
})
