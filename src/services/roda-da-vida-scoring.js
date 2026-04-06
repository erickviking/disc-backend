import { rodaDaVidaAreas } from '../data/roda-da-vida-questions.js';

/**
 * Calcula os scores da Roda da Vida.
 * 
 * @param {Object} responses - { questionId: score (1-10) }
 *   Ex: { saude_1: 7, saude_2: 5, saude_3: 8, ... }
 * @returns {{ scores, average, highest, lowest, balanced }}
 */
export function calculateRodaDaVidaScores(responses) {
  if (!responses || typeof responses !== 'object') {
    throw new Error('Respostas devem ser um objeto { questionId: score }');
  }

  const scores = {};
  let totalAnswered = 0;

  for (const area of rodaDaVidaAreas) {
    const areaScores = [];
    for (const q of area.questions) {
      const val = responses[q.id];
      if (val === undefined || val === null) {
        throw new Error('Pergunta não respondida: ' + q.id);
      }
      const num = Number(val);
      if (isNaN(num) || num < 1 || num > 10) {
        throw new Error('Score deve ser entre 1 e 10 para: ' + q.id);
      }
      areaScores.push(num);
      totalAnswered++;
    }
    // Média da área arredondada para 1 casa decimal
    scores[area.id] = Math.round((areaScores.reduce((a, b) => a + b, 0) / areaScores.length) * 10) / 10;
  }

  const allScores = Object.values(scores);
  const average = Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10;
  
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const highest = { area: sorted[0][0], score: sorted[0][1] };
  const lowest = { area: sorted[sorted.length - 1][0], score: sorted[sorted.length - 1][1] };
  
  // Balanced = desvio padrão baixo (< 1.5 = equilibrado, > 2.5 = desequilibrado)
  const mean = allScores.reduce((a, b) => a + b, 0) / allScores.length;
  const variance = allScores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / allScores.length;
  const stdDev = Math.round(Math.sqrt(variance) * 10) / 10;
  const balanced = stdDev < 1.5;

  return {
    scores,       // { saude: 7.3, intelectual: 5.0, ... }
    average,      // média geral
    highest,      // { area: 'saude', score: 7.3 }
    lowest,       // { area: 'financas', score: 3.0 }
    balanced,     // true/false
    stdDev,       // desvio padrão
    totalAnswered,
  };
}

export function validateRodaDaVidaResponses(responses) {
  if (!responses || typeof responses !== 'object') return 'Respostas devem ser um objeto';
  
  const allQuestionIds = rodaDaVidaAreas.flatMap(a => a.questions.map(q => q.id));
  
  for (const qId of allQuestionIds) {
    if (responses[qId] === undefined || responses[qId] === null) {
      return 'Pergunta não respondida: ' + qId;
    }
    const val = Number(responses[qId]);
    if (isNaN(val) || val < 1 || val > 10) {
      return 'Score deve ser entre 1 e 10 para: ' + qId;
    }
  }
  
  return null; // sem erro
}
