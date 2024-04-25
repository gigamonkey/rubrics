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

let current = null;

/*
 * Show the answers and score for a given numbered commit.
 */
const show = async (which) => {
  window.location.hash = `#${which + 1}`;
  doc.n.innerText = (which + 1);
  doc.who.style.display = 'none';

  current = await fetch(`/a/answers/${shas[which]}`).then(r => r.json());
  doc.sha.innerText = current.sha;
  doc.who.innerText = current.who + ' (' + current.date + ')';
  doc.score.innerText = scoreString(current.scores);

  doc.questions.replaceChildren();
  fillAnswers(current);

  doc.prev.onclick = () => show(mod(which - 1, shas.length));
  doc.next.onclick = () => show(mod(which + 1, shas.length));
}

const fillAnswers = (current) => {

  console.log(current);
  console.log(current.scores);

  current.answers.forEach((a, i) => {
    const temp = doc.q.content.cloneNode(true);
    temp.querySelector('code.language-java').append(a);

    const rubric = temp.querySelector('.rubric');

    console.log(`i: ${i}`);

    Object.entries(current.scores[i]).forEach(([k, v]) => {
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
          current.scores[i][k] = '';
        } else {
          current.scores[i][k] = 'yes';
          yesButton.classList.add('selected');
          noButton.classList.remove('selected');
        }
        saveScores();
      }

      noButton.onclick = () => {
        if (noButton.classList.contains('selected')) {
          noButton.classList.remove('selected');
          current.scores[i][k] = '';
        } else {
          current.scores[i][k] = 'no';
          noButton.classList.add('selected');
          yesButton.classList.remove('selected');
        }
        saveScores();
      }

      label.querySelector('.description').append(k);
      rubric.append(label);
    });
    doc.questions.append(temp);
  });

  $$('code.language-java').forEach(e => Prism.highlightElement(e));
}

const scoreString = (scores) => {
  const s = rawScore(current.scores);
  const done = percentGraded(current.scores) === 1.0 ? '✅' : '';
  return `Score: ${(100 * s).toFixed(1)}; Grade: ${fps(s)}; Done? ${done}`;
};


const saveScores = () => {
  fetch(`/a/scores/${current.sha}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(current.scores),
  });
  doc.score.innerText = scoreString(current.scores);

};

show(parseInt((window.location.hash || "#1").substring(1)) - 1);
