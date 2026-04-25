import { calculateDiscScores, validateResponses } from '../../services/disc-scoring.js';
import { discQuestions } from '../../data/disc-questions.js';
import { generateReport } from '../../services/report-generator.js';

export const discTool = {
  slug: 'disc',
  getQuestionsPayload() {
    return { questions: discQuestions, totalGroups: discQuestions.length };
  },
  validateResponses(responses) {
    return validateResponses(responses);
  },
  calculateScores(responses) {
    const { scores, rawScores, profilePrimary, profileSecondary } = calculateDiscScores(responses);
    return {
      scoresData: { normalized: scores, raw: rawScores },
      profilePrimary,
      profileSecondary,
    };
  },
  generateReport(assessmentId) {
    return generateReport(assessmentId);
  },
};
