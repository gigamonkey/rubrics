const rawScore = (scores) => {
  let correct = 0;
  let total = 0;
  scores.forEach(s => {
    Object.values(s).forEach(v => {
      total++;
      correct += v === 'yes' ? 1 : 0;
    });
  });
  return correct/total;
};

const percentGraded = (scores) => {
  let total = 0;
  let graded = 0;
  scores.forEach(s => {
    Object.values(s).forEach(v => {
      total++;
      graded += v !== '' ? 1 : 0;
    });
  });
  return graded/total;
};

const fps = (score) => {
  if (score >= 0.85) return 4;
  else if (score >= 0.70) return 3;
  else if (score >= 0.45) return 2;
  else if (score >= 0.20) return 1;
  else return 0;
};

export { rawScore, percentGraded, fps };
