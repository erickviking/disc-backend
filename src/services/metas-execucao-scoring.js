import { goalsExecutionQuestions } from '../data/metas-execucao-questions.js';

const requiredQuestions = goalsExecutionQuestions.filter(q => q.required);

export function validateGoalsExecutionResponses(responses) {
  if (!responses || typeof responses !== 'object' || Array.isArray(responses)) return 'Respostas invalidas';
  for (const q of requiredQuestions) {
    const value = responses[q.id];
    if (q.type === 'text' && (!value || String(value).trim().length < 3)) return 'Preencha todas as respostas obrigatorias em texto';
    if (q.type === 'scale' && (!Number.isInteger(value) || value < q.min || value > q.max)) return 'Responda todas as escalas obrigatorias';
    if (q.type === 'single_choice') {
      const valid = new Set((q.options || []).map(o => o.value));
      if (typeof value !== 'string' || !valid.has(value)) return 'Selecione uma opcao valida nas perguntas obrigatorias';
    }
    if (q.type === 'multi_choice') {
      const valid = new Set((q.options || []).map(o => o.value));
      if (!Array.isArray(value) || value.length === 0 || value.some(v => !valid.has(v))) return 'Selecione pelo menos um obstaculo valido';
    }
  }
  return null;
}

function riskLevel(score) { return score >= 75 ? 'baixo' : score >= 50 ? 'moderado' : 'alto'; }
function readinessLevel(score) { return score >= 75 ? 'pronto_para_executar' : score >= 50 ? 'precisa_de_ajuste' : 'precisa_de_base'; }
function textLen(value) { return String(value || '').trim().length; }

export function calculateGoalsExecutionScores(responses) {
  const currentState = Number(responses.me05 || 0);
  const energy = Number(responses.me06 || 0);
  const obstacles = Array.isArray(responses.me07) ? responses.me07 : [];
  const claritySignals = [responses.me01, responses.me03, responses.me09, responses.me12].map(textLen);
  const clarityScore = Math.min(100, Math.round((claritySignals.filter(n => n >= 20).length / claritySignals.length) * 100));
  const obstaclePenalty = Math.min(40, obstacles.length * 5);
  const readinessScore = Math.max(0, Math.round(((currentState + energy) / 20) * 70 + (clarityScore * 0.3) - obstaclePenalty));
  const executionRiskScore = Math.max(0, Math.min(100, 100 - readinessScore + obstaclePenalty));
  const actionQuality = textLen(responses.me12) >= 15 ? 'acao_concreta' : 'acao_a_definir';
  return {
    model: 'Mapa de Metas e Execução',
    version: 'MME-1',
    goal: {
      raw: responses.me01,
      area: responses.me02,
      why: responses.me03,
      costOfDelay: responses.me04,
      successDefinition: responses.me09,
      deadline: responses.me10,
      executionStyle: responses.me11,
      firstAction24h: responses.me12,
    },
    diagnosis: {
      currentState,
      energy,
      obstacles,
      resources: responses.me08,
      clarityScore,
      readinessScore,
      readinessLevel: readinessLevel(readinessScore),
      executionRiskScore,
      executionRiskLevel: riskLevel(100 - executionRiskScore),
      actionQuality,
    },
    suggestedFocus: readinessScore < 50 ? 'base_e_clareza' : obstacles.includes('constancia') ? 'constancia_e_rotina' : obstacles.includes('tempo') ? 'agenda_e_prioridade' : obstacles.includes('medo') ? 'seguranca_emocional' : 'execucao_direta',
  };
}
