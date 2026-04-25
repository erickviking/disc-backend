import { calculateRodaDaVidaScores, validateRodaDaVidaResponses } from '../../services/roda-da-vida-scoring.js';
import { rodaDaVidaAreas } from '../../data/roda-da-vida-questions.js';
import { generateRodaDaVidaReport } from '../../services/roda-da-vida-report-generator.js';

export const rodaDaVidaTool = {
  slug: 'roda-da-vida',
  getQuestionsPayload() {
    return {
      areas: rodaDaVidaAreas,
      totalQuestions: rodaDaVidaAreas.reduce((sum, area) => sum + area.questions.length, 0),
    };
  },
  validateResponses(responses) {
    return validateRodaDaVidaResponses(responses);
  },
  calculateScores(responses) {
    const result = calculateRodaDaVidaScores(responses);
    return {
      scoresData: result,
      profilePrimary: result.highest.area,
      profileSecondary: result.lowest.area,
    };
  },
  generateReport(assessmentId) {
    return generateRodaDaVidaReport(assessmentId);
  },
};
