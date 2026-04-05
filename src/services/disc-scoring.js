import { discQuestions } from '../data/disc-questions.js';
import { profileLabels } from '../data/disc-profiles.js';

export function calculateDiscScores(responses) {
  if (!responses || responses.length !== 28) {
    throw new Error('Sao necessarias exatamente 28 respostas');
  }

  const rawScores = { D: 0, I: 0, S: 0, C: 0 };

  for (const response of responses) {
    const question = discQuestions[response.groupIndex];
    if (!question) throw new Error('Grupo invalido: ' + response.groupIndex);

    const mostWord = question.words.find(w => w.id === response.most);
    const leastWord = question.words.find(w => w.id === response.least);

    if (!mostWord || !leastWord) throw new Error('Palavra invalida no grupo ' + response.groupIndex);
    if (mostWord.id === leastWord.id) throw new Error('MAIS e MENOS nao podem ser a mesma palavra no grupo ' + response.groupIndex);

    rawScores[mostWord.factor] += 2;
    rawScores[leastWord.factor] -= 1;
  }

  const minPossible = -28;
  const maxPossible = 56;
  const range = maxPossible - minPossible;

  const scores = {};
  for (const factor of ['D', 'I', 'S', 'C']) {
    scores[factor] = Math.round(((rawScores[factor] - minPossible) / range) * 100);
    scores[factor] = Math.max(0, Math.min(100, scores[factor]));
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const profilePrimary = sorted[0][0];
  const profileSecondary = sorted[1][0];

  return {
    scores,
    rawScores,
    profilePrimary,
    profileSecondary,
    profilePrimaryLabel: profileLabels[profilePrimary].name,
    profileSecondaryLabel: profileLabels[profileSecondary].name,
  };
}

export function validateResponses(responses) {
  if (!Array.isArray(responses)) return 'Respostas devem ser um array';
  if (responses.length !== 28) return 'Sao necessarias exatamente 28 respostas';
  const seenGroups = new Set();
  for (let i = 0; i < responses.length; i++) {
    const r = responses[i];
    if (typeof r.groupIndex !== 'number' || r.groupIndex < 0 || r.groupIndex > 27) return 'groupIndex invalido na resposta ' + i;
    if (seenGroups.has(r.groupIndex)) return 'Grupo duplicado: ' + r.groupIndex;
    seenGroups.add(r.groupIndex);
    if (!r.most || !r.least) return 'most e least sao obrigatorios na resposta ' + i;
    if (r.most === r.least) return 'most e least nao podem ser iguais na resposta ' + i;
  }
  return null;
}
