import { personalValuesDimensions, personalValuesQuestions, personalValuesSubareas, personalValuesPhases } from '../../data/valores-pessoais-questions.js';
import { calculatePersonalValuesScores, validatePersonalValuesResponses } from '../../services/valores-pessoais-scoring.js';
import { generatePersonalValuesReport } from '../../services/valores-pessoais-report-generator.js';

export const personalValuesTool = {
  slug: 'valores-pessoais',
  getQuestionsPayload() {
    return {
      questions: personalValuesQuestions,
      dimensions: personalValuesDimensions,
      subareas: personalValuesSubareas,
      phases: personalValuesPhases,
      totalQuestions: personalValuesQuestions.length,
      model: 'MVP-6',
      displayName: 'Mapa de Valores Pessoais',
      scale: { min: 1, max: 5, labels: { 1: 'Nunca ou quase nunca', 2: 'Raramente', 3: 'Às vezes', 4: 'Frequentemente', 5: 'Sempre ou quase sempre' } },
    };
  },
  validateResponses(responses) { return validatePersonalValuesResponses(responses); },
  calculateScores(responses) {
    const scoresData = calculatePersonalValuesScores(responses);
    return { scoresData, profilePrimary: scoresData.highlights.strongestDimension.id, profileSecondary: scoresData.highlights.topPrioritizedValue.id };
  },
  generateReport(assessmentId) { return generatePersonalValuesReport(assessmentId); },
};
