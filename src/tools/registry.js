import { calculateDiscScores, validateResponses } from '../services/disc-scoring.js';
import { calculateRodaDaVidaScores, validateRodaDaVidaResponses } from '../services/roda-da-vida-scoring.js';
import { rodaDaVidaAreas } from '../data/roda-da-vida-questions.js';
import { discQuestions } from '../data/disc-questions.js';
import { generateReport } from '../services/report-generator.js';
import { generateRodaDaVidaReport } from '../services/roda-da-vida-report-generator.js';

const defaultToolSlug = 'disc';

const toolHandlers = {
  disc: {
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
  },
  'roda-da-vida': {
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
  },
};

export function getToolHandler(slug) {
  return toolHandlers[slug] || toolHandlers[defaultToolSlug];
}

export function getDefaultToolSlug() {
  return defaultToolSlug;
}

export function getSupportedToolSlugs() {
  return Object.keys(toolHandlers);
}
