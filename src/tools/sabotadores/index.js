import { sabotagerPhases, sabotagerQuestions, sabotagerTypes } from '../../data/sabotadores-questions.js';
import { calculateSabotagersScores, validateSabotagersResponses } from '../../services/sabotadores-scoring.js';
import { generateSabotagersReport } from '../../services/sabotadores-report-generator.js';

export const sabotagersTool = {
  slug: 'sabotadores',
  getQuestionsPayload() {
    return {
      questions: sabotagerQuestions,
      phases: sabotagerPhases,
      types: sabotagerTypes,
      totalQuestions: sabotagerQuestions.length,
      model: 'Mapa de Sabotadores Internos',
    };
  },
  validateResponses(responses) { return validateSabotagersResponses(responses); },
  calculateScores(responses) {
    const scoresData = calculateSabotagersScores(responses);
    return { scoresData, profilePrimary: scoresData.primarySabotager?.id, profileSecondary: scoresData.secondarySabotager?.id };
  },
  generateReport(assessmentId) { return generateSabotagersReport(assessmentId); },
};
