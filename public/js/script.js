import { $, $$, byId } from './dom.js';
import { fps } from './scoring.js';

const doc = byId();

const mod = (a, b) => ((a % b) + b) % b;

const circles = {};

const fillProgress = (submissions) => {
  const p = $('#progress');
  submissions.forEach((s, i) => {
    const span = $('<span>');
    circles[s.sha] = span;
    span.onclick = () => {
      show(i + 1);
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
const show = async (which) => {
  window.location.hash = `#${which}`;

  const sha = submissions[which - 1].sha;

  const current = await fetch(`/a/submission/${sha}`).then(r => r.json());

  updateSummary(current.stats, sha);
  $$('#progress span.current').forEach(e => e.classList.remove('current'));
  circles[sha].classList.add('current');

  window.scrollTo(0, 0);
  fillAnswers(current);
};

const updateSummary = (stats, sha) => {
  doc.score.innerText = scoreString(stats) + `; sha: ${sha.slice(0, 7)}`;
};

const showNext = () => {
  const c = parseInt(window.location.hash.substring(1));
  show(mod(c, submissions.length) + 1);
};

const showPrevious = () => {
  const c = parseInt(window.location.hash.substring(1));
  show(mod(c - 2, submissions.length) + 1);
};

const fillAnswers = (current) => {

  doc.questions.replaceChildren();

  Object.entries(current.answers).forEach(([q, answer]) => {
    const temp = doc.q.content.cloneNode(true);
    temp.querySelector('code.language-java').append(answer);

    const rubric = temp.querySelector('.rubric');

    Object.entries(current.scores[q]).forEach(([k, v]) => {
      const label = doc.r.content.cloneNode(true);
      const yesButton = label.querySelector('button.yes');
      const noButton = label.querySelector('button.no');
      if (v === 'yes') {
          yesButton.classList.add('selected');
      } else if (v === 'no') {
          noButton.classList.add('selected');
      }

      yesButton.onclick = () => {
        if (yesButton.classList.contains('selected')) {
          yesButton.classList.remove('selected');
          current.scores[q][k] = null;
        } else {
          current.scores[q][k] = 'yes';
          yesButton.classList.add('selected');
          noButton.classList.remove('selected');
        }
        saveScore(current.sha, q, k, current.scores[q][k]);
      }

      noButton.onclick = () => {
        if (noButton.classList.contains('selected')) {
          noButton.classList.remove('selected');
          current.scores[q][k] = null;
        } else {
          current.scores[q][k] = 'no';
          noButton.classList.add('selected');
          yesButton.classList.remove('selected');
        }
        saveScore(current.sha, q, k, current.scores[q][k]);
      }

      label.querySelector('.description').append(k);
      rubric.append(label);
    });

    const commentBox = $('<textarea>');
    commentBox.value = current.comments[q] ?? ''
    commentBox.onchange = (e) => {
      saveComment(current.sha, q, e.target.value);
    };
    rubric.append(commentBox);


    doc.questions.append(temp);
  });

  $$('code.language-java').forEach(e => Prism.highlightElement(e));
}

const scoreString = (score) => {
  const done = score.done === 1.0 ? '✅' : `${(100 * score.done).toFixed(1)}%`;
  return `Score: ${(100 * score.grade).toFixed(1)}; Grade: ${fps(score.grade)}; Done: ${done}`;
};

const saveScore = async (sha, question, criteria, correct) => {
  const stats = await fetch(`/a/scores/${sha}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({question, criteria, correct }),
  }).then(r => r.json());
  updateSummary(stats, sha);
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

const submissions = await fetch('/a/submissions/').then(r => r.json());
const num = submissions.length;

fillProgress(submissions);

document.body.onkeydown = (e) => {
  if (e.target.tagName !== 'TEXTAREA') {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      showNext();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      showPrevious();
    }
  }
}

show(parseInt((window.location.hash || "#1").substring(1)));
