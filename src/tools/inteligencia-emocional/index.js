import { emotionalIntelligenceQuestions, emotionalIntelligenceDimensions, emotionalIntelligenceSubareas } from '../../data/inteligencia-emocional-questions.js';
import { calculateEmotionalIntelligenceScores, validateEmotionalIntelligenceResponses } from '../../services/inteligencia-emocional-scoring.js';
import { generateEmotionalIntelligenceReport } from '../../services/inteligencia-emocional-report-generator.js';

export const emotionalIntelligenceTool = {
  slug: 'inteligencia-emocional',
  getQuestionsPayload() {
    return {
      questions: emotionalIntelligenceQuestions,
      dimensions: emotionalIntelligenceDimensions,
      subareas: emotionalIntelligenceSubareas,
      totalQuestions: emotionalIntelligenceQuestions.length,
      scale: { min: 1, max: 5, labels: { 1: 'Nunca ou quase nunca', 2: 'Raramente', 3: 'Às vezes', 4: 'Frequentemente', 5: 'Sempre ou quase sempre' } },
    };
  },
  validateResponses(responses) {
    return validateEmotionalIntelligenceResponses(responses);
  },
  calculateScores(responses) {
    const scoresData = calculateEmotionalIntelligenceScores(responses);
    return {
      scoresData,
      profilePrimary: scoresData.highlights.strongestDimension.id,
      profileSecondary: scoresData.highlights.weakestDimension.id,
    };
  },
  generateReport(assessmentId) {
    return generateEmotionalIntelligenceReport(assessmentId);
  },
};
