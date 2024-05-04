import { $, $$, byId, html } from './dom.js';
import { fps } from './scoring.js';

const doc = byId();

const mod = (a, b) => ((a % b) + b) % b;

const circles = {};

const fillProgress = (clazz, assignment,submissions, rubric, lang) => {
  const p = $('#progress');
  submissions.forEach((s, i) => {
    const span = $('<span>');
    circles[s.sha] = span;
    span.onclick = () => {
      show(clazz, assignment, submissions, rubric, lang, i + 1);
    };
    if (s.done === 1.0) {
      span.classList.add('done');
    }
    p.append(span);
  });
};


/*
 * Show the answers and score for a given numbered commit.
 */
const show = async (clazz, assignment, submissions, spec, lang, which) => {
  window.location.hash = `#${which}`;

  const sha = submissions[which - 1].sha;

  const current = await fetch(`/a/submissions/${clazz}/${assignment}/${sha}`).then(r => r.json());

  updateSummary(current);
  $$('#progress span.current').forEach(e => e.classList.remove('current'));
  circles[sha].classList.add('current');

  window.scrollTo(0, 0);
  fillAnswers(clazz, assignment, current, rubric, lang);
};

const updateSummary = (current) => {
  const { stats, sha, date } = current;
  doc.score.replaceChildren();
  doc.score.append($('<span>', `${date} / ${sha.slice(0, 7)}`));
  doc.score.append($('<span>', `Score: ${(100 * stats.grade).toFixed(1)}`));
  doc.score.append($('<span>', `Grade: ${fps(stats.grade)}`));
  doc.score.append($('<span>', 'Done: ' + (stats.done === 1.0 ? '✅' : `${(100 * stats.done).toFixed(1)}%`)));
};

const currentNum = () => parseInt((window.location.hash || "#1").substring(1));

const showNext = (clazz, assignment, submissions, rubric, lang) => {
  show(clazz, assignment, submissions, rubric, lang, mod(currentNum(), submissions.length) + 1);
};

const showPrevious = (clazz, assignment, submissions, rubric, lang) => {
  show(clazz, assignment, submissions, rubric, lang, mod(currentNum() - 2, submissions.length) + 1);
};

const fillAnswers = (clazz, assignment, current, rubric, lang) => {

  doc.questions.replaceChildren();

  Object.entries(current.answers).forEach(([q, answer]) => {
    const temp = doc.q.content.cloneNode(true);
    const code = temp.querySelector('div.code code');
    code.classList.add(`language-${lang}`);
    code.append(answer);

    const rubricDiv = temp.querySelector('.rubric');

    Object.entries(current.scores[q]).forEach(([k, v]) => {
      const label = doc.r.content.cloneNode(true).firstElementChild;

      rubric[q][k].forEach(a => {
        const button = html(`<button value="${a}">${a}</button>`);
        if (v === a) {
          button.classList.add('selected');
        } else {
          button.classList.remove('selected');
        }

        button.onclick = () => {
          if (button.classList.contains('selected')) {
            button.classList.remove('selected');
            current.scores[q][k] = null;
          } else {
            current.scores[q][k] = a;
            label.querySelectorAll('.buttons > button').forEach(b => {
              b.classList.remove('selected');
            });
            button.classList.add('selected');
          }
          saveScore(clazz, assignment, current, q, k, current.scores[q][k]);
        };

        label.querySelector('.buttons').append(button);
      });

      label.querySelector('.description').append(k);
      rubricDiv.append(label);
    });
    const commentBox = $('<textarea>');
    commentBox.value = current.comments[q] ?? ''
    commentBox.onchange = (e) => {
      saveComment(current.sha, q, e.target.value);
    };
    rubricDiv.append(commentBox);


    doc.questions.append(temp);
  });

  $$('div.code code').forEach(e => Prism.highlightElement(e));
}

const scoreString = (score) => {
  const done = score.done === 1.0 ? '✅' : `${(100 * score.done).toFixed(1)}%`;
  return `Score: ${(100 * score.grade).toFixed(1)}; Grade: ${fps(score.grade)}; Done: ${done}`;
};

const saveScore = async (clazz, assignment, current, question, criteria, result) => {
  const { date, sha } = current;
  current.stats = await fetch(`/a/${clazz}/${assignment}/scores/${sha}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({question, criteria, result }),
  }).then(r => r.json());
  updateSummary(current);
  if (stats.done === 1.0) {
    circles[sha].classList.add('done');
  } else {
    circles[sha].classList.remove('done');
  }
};

const saveComment = async (sha, question, comment) => {
  fetch(`/a/comment/${sha}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({question, comment }),
  });
};

const [ clazz, assignment ] = window.location.pathname.split('/').slice(2);
const rubric = await fetch(`/a/rubrics/${clazz}/${assignment}`).then(r => r.json());
const submissions = await fetch(`/a/submissions/${clazz}/${assignment}`).then(r => r.json());
const spec = await fetch(`/a/assignment/${clazz}/${assignment}`).then(r => r.json());

fillProgress(clazz, assignment, submissions, rubric, spec.language);

document.body.onkeydown = (e) => {
  if (e.target.tagName !== 'TEXTAREA') {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      showNext(clazz, assignment, submissions, rubric, spec.language);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      showPrevious(clazz, assignment, submissions, rubric, spec.language);
    }
  }
}

show(clazz, assignment, submissions, rubric, spec.language, currentNum());
