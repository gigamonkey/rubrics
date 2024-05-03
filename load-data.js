import YAML from 'yaml';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { DB } from './db.js';
import { argv } from 'process';

const loadRubric = (clazz, assignment, rubric) => {
  Object.entries(rubric).forEach(([question, items], sequence) => {
    db.insertQuestion({clazz, assignment, sequence, question});
    Object.entries(items).forEach(([criteria, weight], sequence) => {
      db.insertRubricItem({clazz, assignment, question, criteria, sequence, weight});
    });
  });
};

const loadAnswersJson = (clazz, assignment, files, questions) => {
  files.forEach(f => {
    const { sha, github, date, answers } = parseAnswersJson(f);
    db.insertSubmission({clazz, assignment, sha, github, date});
    answers.forEach((answer, i) => {
      const question = questions[i];
      db.insertAnswer({ clazz, assignment, sha, question, answer });
    });
  });
  db.scoreMissing({clazz, assignment});
};

const loadCodeJs = (clazz, assignment, files, questions) => {
  files.forEach(f => {
    const { sha, github, date, answer } = parseCodeJs(f);
    db.insertSubmission({clazz, assignment, sha, github, date});
    db.insertAnswer({ clazz, assignment, sha, question: 'all', answer });
  });
  db.scoreMissing({clazz, assignment});
};

const parseDirname = (d) => {
  const [ _, clazz, assignment ] = d.split(path.sep);
  return { clazz, assignment };
};


const parseAnswersJson = (f) => {
  const { answerText, ...rest } = parseSubmission(f);
  const answers = JSON.parse(answerText).map(a => a?.trim() ?? "");
  return { ...rest, answers };
};

const parseCodeJs = (f) => {
  const { answerText, ...rest } = parseSubmission(f);
  return { ...rest, answer: answerText };
};

const parseSubmission = (f) => {
  const sha     = fs.readFileSync(path.join(path.dirname(f), "commit.txt"), { encoding: 'utf8' }).trim();
  const github  = path.basename(path.dirname(path.dirname(f)));
  const date    = path.basename(path.dirname(f));
  const answerText = fs.readFileSync(f, { encoding: 'utf8' });
  return { sha, github, date, answerText };
};


const db = new DB('db.db', 'schema.sql');

const dir = argv[2];

const { clazz, assignment } = parseDirname(dir);

const spec = YAML.parse(fs.readFileSync(path.join(dir, 'assignment.yml'), 'utf8'));


const answerFiles = await glob(path.join(dir, '**', spec.file), {});

console.log(answerFiles);

loadRubric(clazz, assignment, spec.rubric);

if (spec.file === 'code.js') {
  loadCodeJs(clazz, assignment, answerFiles, Object.keys(spec.rubric));
} else if (spec.file === 'answers.json') {
  loadAnswersJson(clazz, assignment, answerFiles, Object.keys(spec.rubric));
} else {
  console.error(`Unknown answer file: ${spec.file}`);
}
