import { $, $$, byId } from './dom.js';
import { rawScore, percentGraded, fps } from './scoring.js';

const doc = byId();

const mod = (a, b) => ((a % b) + b) % b;

const shas = await fetch('/a/answers/').then(r => r.json());
const num = shas.length;

doc.num.innerText = num;

doc.sha.onclick = () => {
  if (doc.who.style.display === 'block') {
    doc.who.style.display = 'none';
  } else {
    doc.who.style.display = 'block';
    setTimeout(() => doc.who.style.display = 'none', 1000);
  }
};

/*
 * Show the answers and score for a given numbered commit.
 */
const show = async (which) => {
  window.location.hash = `#${which}`;
  doc.n.innerText = which;
  doc.who.style.display = 'none';

  const current = await fetch(`/a/submission/${which}`).then(r => r.json());
  doc.sha.innerText = current.sha;
  doc.who.innerText = current.github + ' (' + current.date + ')';
  //doc.score.innerText = scoreString(current.scores);

  doc.questions.replaceChildren();
  fillAnswers(current);

  doc.prev.onclick = () => show(mod(which - 1, shas.length));
  doc.next.onclick = () => show(mod(which + 1, shas.length));
}

const fillAnswers = (current) => {

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
          current.scores[q][k] = '';
        } else {
          current.scores[q][k] = 'yes';
          yesButton.classList.add('selected');
          noButton.classList.remove('selected');
        }
        saveScores(current);
      }

      noButton.onclick = () => {
        if (noButton.classList.contains('selected')) {
          noButton.classList.remove('selected');
          current.scores[q][k] = '';
        } else {
          current.scores[q][k] = 'no';
          noButton.classList.add('selected');
          yesButton.classList.remove('selected');
        }
        saveScores(current);
      }

      label.querySelector('.description').append(k);
      rubric.append(label);
      });
    doc.questions.append(temp);
  });

  $$('code.language-java').forEach(e => Prism.highlightElement(e));
}

const scoreString = (scores) => {
  const s = rawScore(scores);
  const done = percentGraded(scores) === 1.0 ? '✅' : '';
  return `Score: ${(100 * s).toFixed(1)}; Grade: ${fps(s)}; Done? ${done}`;
};


const saveScores = (current) => {
  fetch(`/a/scores/${current.sha}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(current.scores),
  });
  doc.score.innerText = scoreString(current.scores);

};

show(parseInt((window.location.hash || "#1").substring(1)));
