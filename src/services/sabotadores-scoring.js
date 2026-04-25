import { sabotagerQuestions, sabotagerTypes } from '../data/sabotadores-questions.js';

const typeIds = sabotagerTypes.map(t => t.id);

export function validateSabotagersResponses(responses) {
  if (!responses || typeof responses !== 'object' || Array.isArray(responses)) return 'Respostas invalidas';
  for (const q of sabotagerQuestions) {
    const value = responses[q.id];
    if (q.type === 'text' && q.required && (!value || String(value).trim().length < 3)) return 'Preencha todos os campos obrigatorios';
    if (q.type === 'scale' && (!Number.isInteger(value) || value < q.min || value > q.max)) return 'Responda a escala obrigatoria';
    if (q.type === 'multi_choice') {
      const valid = new Set((q.options || []).map(o => o.value));
      if (!Array.isArray(value) || value.length === 0 || value.some(v => !valid.has(v))) return 'Selecione pelo menos um gatilho valido';
    }
    if (q.type === 'single_choice' || q.type === 'scenario') {
      const valid = new Set((q.options || []).map(o => o.value));
      if (typeof value !== 'string' || !valid.has(value)) return 'Selecione uma opcao valida nas perguntas obrigatorias';
    }
  }
  return null;
}

function emptyScores() { return Object.fromEntries(typeIds.map(id => [id, 0])); }
function level(score) { return score >= 75 ? 'dominante' : score >= 50 ? 'expressivo' : score >= 25 ? 'situacional' : 'baixo'; }

const triggerWeights = {
  julgamento: ['perfeccionista', 'critico', 'comparador'],
  conflito: ['agradador', 'evitador'],
  controle: ['controlador', 'perfeccionista'],
  comparacao: ['comparador', 'critico'],
  sobrecarga: ['hiperresponsavel', 'procrastinador'],
  ambiguidade: ['procrastinador', 'evitador', 'perfeccionista'],
};

export function calculateSabotagersScores(responses) {
  const raw = emptyScores();
  const selected = {};
  for (const q of sabotagerQuestions) {
    const value = responses[q.id];
    if (!value) continue;
    selected[q.id] = value;
    if ((q.type === 'scenario' || q.type === 'single_choice') && raw[value] !== undefined) raw[value] += q.phase === 'pattern' ? 2 : 3;
    if (q.type === 'multi_choice') for (const trigger of value) for (const type of (triggerWeights[trigger] || [])) raw[type] += 1;
  }
  const maxRaw = Math.max(...Object.values(raw), 1);
  const scores = Object.fromEntries(Object.entries(raw).map(([id, value]) => [id, { id, name: sabotagerTypes.find(t => t.id === id)?.name || id, raw: value, score: Math.round((value / maxRaw) * 100), level: level(Math.round((value / maxRaw) * 100)) }]));
  const ranking = Object.values(scores).sort((a, b) => b.score - a.score);
  const impact = Number(responses.si06 || 0);
  const primary = ranking[0];
  const secondary = ranking[1];
  const triggers = Array.isArray(responses.si05) ? responses.si05 : [];
  return {
    model: 'Mapa de Sabotadores Internos',
    version: 'MSI-1',
    scores,
    ranking,
    primarySabotager: primary,
    secondarySabotager: secondary,
    impact: { score: impact, level: impact >= 8 ? 'alto' : impact >= 5 ? 'moderado' : 'baixo' },
    pattern: { triggers, internalPhrase: responses.si07, automaticBehavior: responses.si08, recentSituation: responses.si09, antidote: responses.si10, firstAction24h: responses.si11 },
    suggestedFocus: primary?.id || 'autoconhecimento',
  };
}
