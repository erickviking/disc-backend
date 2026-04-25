import { goalsExecutionQuestions, goalsExecutionSteps } from '../../data/metas-execucao-questions.js';
import { calculateGoalsExecutionScores, validateGoalsExecutionResponses } from '../../services/metas-execucao-scoring.js';
import { generateGoalsExecutionReport } from '../../services/metas-execucao-report-generator.js';

export const goalsExecutionTool = {
  slug: 'metas-smart',
  getQuestionsPayload() {
    return {
      questions: goalsExecutionQuestions,
      steps: goalsExecutionSteps,
      totalQuestions: goalsExecutionQuestions.length,
      model: 'Mapa de Metas e Execução',
    };
  },
  validateResponses(responses) { return validateGoalsExecutionResponses(responses); },
  calculateScores(responses) {
    const scoresData = calculateGoalsExecutionScores(responses);
    return { scoresData, profilePrimary: scoresData.suggestedFocus, profileSecondary: scoresData.diagnosis.readinessLevel };
  },
  generateReport(assessmentId) { return generateGoalsExecutionReport(assessmentId); },
};
