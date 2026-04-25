import { emotionalIntelligenceDimensions, emotionalIntelligenceQuestions, emotionalIntelligenceSubareas } from '../data/inteligencia-emocional-questions.js';

export function validateEmotionalIntelligenceResponses(responses) {
  if (!responses || typeof responses !== 'object' || Array.isArray(responses)) {
    return 'Respostas invalidas';
  }

  const expectedIds = new Set(emotionalIntelligenceQuestions.map(q => q.id));

  for (const id of expectedIds) {
    const value = responses[id];
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      return 'Todas as perguntas devem ser respondidas em uma escala de 1 a 5';
    }
  }

  return null;
}

function normalizeLikertAverage(avg) {
  return Math.round(((avg - 1) / 4) * 100);
}

function levelFromScore(score) {
  if (score >= 80) return 'alto';
  if (score >= 60) return 'bom';
  if (score >= 40) return 'moderado';
  return 'desenvolvimento_prioritario';
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function calculateEmotionalIntelligenceScores(responses) {
  const dimensionScores = {};
  const subareaScores = {};

  for (const [subareaId, subarea] of Object.entries(emotionalIntelligenceSubareas)) {
    const questions = emotionalIntelligenceQuestions.filter(q => q.subarea === subareaId);
    const values = questions.map(q => responses[q.id]);
    const avg = average(values);
    subareaScores[subareaId] = {
      name: subarea.name,
      dimension: subarea.dimension,
      average: Number(avg.toFixed(2)),
      score: normalizeLikertAverage(avg),
      level: levelFromScore(normalizeLikertAverage(avg)),
    };
  }

  for (const dimension of emotionalIntelligenceDimensions) {
    const subareas = dimension.subareas.map(id => subareaScores[id]);
    const avg = average(subareas.map(s => s.average));
    const score = normalizeLikertAverage(avg);
    dimensionScores[dimension.id] = {
      name: dimension.name,
      description: dimension.description,
      average: Number(avg.toFixed(2)),
      score,
      level: levelFromScore(score),
      subareas: dimension.subareas,
    };
  }

  const overallAverage = average(Object.values(dimensionScores).map(d => d.average));
  const overallScore = normalizeLikertAverage(overallAverage);
  const strongestDimension = Object.entries(dimensionScores).sort((a, b) => b[1].score - a[1].score)[0];
  const weakestDimension = Object.entries(dimensionScores).sort((a, b) => a[1].score - b[1].score)[0];
  const strongestSubarea = Object.entries(subareaScores).sort((a, b) => b[1].score - a[1].score)[0];
  const weakestSubarea = Object.entries(subareaScores).sort((a, b) => a[1].score - b[1].score)[0];

  return {
    model: 'IE-5',
    scale: 'Likert 1-5 normalized to 0-100',
    overall: {
      average: Number(overallAverage.toFixed(2)),
      score: overallScore,
      level: levelFromScore(overallScore),
    },
    dimensions: dimensionScores,
    subareas: subareaScores,
    highlights: {
      strongestDimension: { id: strongestDimension[0], ...strongestDimension[1] },
      weakestDimension: { id: weakestDimension[0], ...weakestDimension[1] },
      strongestSubarea: { id: strongestSubarea[0], ...strongestSubarea[1] },
      weakestSubarea: { id: weakestSubarea[0], ...weakestSubarea[1] },
    },
  };
}
