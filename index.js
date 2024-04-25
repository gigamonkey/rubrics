import express from 'express';
import fs from 'fs/promises';
import nunjucks from 'nunjucks';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import { tsv } from './express-tsv.js';
import { rawScore, percentGraded, fps } from './public/js/scoring.js';

// Convert the URL to a file path for the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mod = (a, b) => ((a % b) + b) % b

const rubric = JSON.parse(await fs.readFile("rubric.json"));

const answers = await glob("answers/**/answers.json", {});

const who = (p) => path.basename(path.dirname(path.dirname(p)));

const date = (p) => path.basename(path.dirname(p));

const emptyScores = (rubric) => {
  return rubric.problems.map(p => {
    return Object.fromEntries(rubric[p].map(d => [d, ""]));
  });
};

const filledScores = (rubric, existing) => {
  return rubric.problems.map((p, i) => {
    return Object.fromEntries(rubric[p].map(d => [d, existing[i][d] ?? ""]));
  });
}

const commitsList = await Promise.all(
  answers.map(async f => {
    const directory = path.dirname(f);
    const sha = await fs.readFile(path.join(directory, "commit.txt"), { encoding: 'utf8' });
    const scores = await fs.readFile(path.join(directory, "scores.json"), { encoding: 'utf8' })
          .then(text => filledScores(rubric, JSON.parse(text)))
          .catch(e => {
            return emptyScores(rubric);
          });
    const answers = await fs.readFile(f, { encoding: 'utf8' });
    return {
      directory,
      sha: sha.trim(),
      answers: Array.from({length: rubric.problems.length, ...JSON.parse(answers)}).map(a => a?.trim() ?? ""),
      who: who(f),
      date: date(f),
      scores,
    };
  }));

commitsList.sort((a, b) => a.sha.localeCompare(b.sha));

const commits = Object.fromEntries(commitsList.map((c, i, a) => {
  const next = a[mod(i + 1, a.length)].sha;
  const previous = a[mod(i - 1, a.length)].sha;
  return [ c.sha, { ...c, next, previous, i } ];
}));

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

// 1. Fetch list of shas

// 2. Request the data for one sha and display it. Includes questions and
// current score file.

// 3. On changes to the scoring, PUT the score back by sha. Server maps sha to
// correct directory and saves score as .json file.

/*
 * Get list of shas in order.
 */
app.get('/a/answers', (req, res) => {
  res.json(commitsList.map(c => c.sha));
});

app.get('/a/commits', (req, res) => {
  res.json(commitsList);
});

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


/*
 * Get the answers and current store for the given commit.
 */
app.get('/a/answers/:commit', (req, res) => {
  const { commit } = req.params;
  res.json(commits[commit]);
});

/*
 * Store the updated scores for the given commit.
 */
app.put('/a/scores/:commit', (req, res) => {
  const { commit } = req.params;
  const file = path.join(commits[commit].directory, "scores.json");
  console.log(req.body);
  fs.writeFile(file, JSON.stringify(req.body, null, 2)).then(() => console.log(`Saved to ${file}`));
  res.send('yo');
});

app.listen(port, function () {
  console.log(`http://localhost:${this.address().port}`);
})
