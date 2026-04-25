import {
  personalValuesDimensions,
  personalValuesQuestions,
  personalValuesSubareas,
  personalValuesRecognitionQuestions,
  personalValuesPriorityQuestions,
  personalValuesDilemmaQuestions,
} from '../data/valores-pessoais-questions.js';

const dimensionIds = personalValuesDimensions.map(d => d.id);

export function validatePersonalValuesResponses(responses) {
  if (!responses || typeof responses !== 'object' || Array.isArray(responses)) return 'Respostas invalidas';
  for (const q of personalValuesQuestions) {
    const value = responses[q.id];
    if (q.type === 'likert') {
      if (!Number.isInteger(value) || value < 1 || value > 5) return 'Todas as perguntas de reconhecimento devem ser respondidas em uma escala de 1 a 5';
    } else {
      const allowed = new Set((q.options || []).map(o => o.value));
      if (typeof value !== 'string' || !allowed.has(value)) return 'Todas as escolhas e dilemas devem ser respondidos';
    }
  }
  return null;
}

const avg = values => values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0;
const normalize = value => Math.round(((value - 1) / 4) * 100);
const levelFromScore = score => score >= 82 ? 'muito_expressivo' : score >= 68 ? 'expressivo' : score >= 52 ? 'moderado' : score >= 36 ? 'pouco_sustentado' : 'desenvolvimento_prioritario';
const isHigh = score => score >= 72;
const isLow = score => score <= 48;
const isVeryHigh = score => score >= 82;
const isVeryLow = score => score <= 38;

function dimensionSubareas(dimensionId) {
  return Object.entries(personalValuesSubareas).filter(([, s]) => s.dimension === dimensionId).map(([id]) => id);
}

function scoreOf(id, dimensions, subareas) {
  return dimensions[id]?.score ?? subareas[id]?.score ?? 0;
}

function initCounts() {
  return Object.fromEntries(dimensionIds.map(id => [id, 0]));
}

function addChoiceScore(target, dimension, amount = 1) {
  if (dimensionIds.includes(dimension)) target[dimension] = (target[dimension] || 0) + amount;
}

function calculateRecognition(responses) {
  const subareas = {};
  const dimensions = {};
  for (const [subareaId, subarea] of Object.entries(personalValuesSubareas)) {
    const questions = personalValuesRecognitionQuestions.filter(q => q.subarea === subareaId);
    const average = avg(questions.map(q => responses[q.id]).filter(v => typeof v === 'number'));
    const score = questions.length ? normalize(average) : 0;
    subareas[subareaId] = { name: subarea.name, dimension: subarea.dimension, average: Number(average.toFixed(2)), score, level: levelFromScore(score) };
  }
  for (const dimension of personalValuesDimensions) {
    const ids = dimensionSubareas(dimension.id);
    const present = ids.map(id => subareas[id]).filter(s => s.score > 0);
    const average = avg(present.map(s => s.average));
    const score = present.length ? normalize(average) : 0;
    dimensions[dimension.id] = { name: dimension.name, description: dimension.description, average: Number(average.toFixed(2)), score, level: levelFromScore(score), subareas: ids };
  }
  return { dimensions, subareas };
}

function calculateChoiceLayers(responses) {
  const priorityCounts = initCounts();
  const pressureCounts = initCounts();
  const pressureContexts = {};
  for (const q of personalValuesPriorityQuestions) addChoiceScore(priorityCounts, responses[q.id]);
  for (const q of personalValuesDilemmaQuestions) {
    addChoiceScore(pressureCounts, responses[q.id]);
    pressureContexts[q.pressureContext] = responses[q.id];
  }
  const priorityRanking = Object.entries(priorityCounts).sort((a, b) => b[1] - a[1]).map(([id, count], index) => ({ id, name: personalValuesDimensions.find(d => d.id === id)?.name || id, count, rank: index + 1 }));
  const pressureRanking = Object.entries(pressureCounts).sort((a, b) => b[1] - a[1]).map(([id, count], index) => ({ id, name: personalValuesDimensions.find(d => d.id === id)?.name || id, count, rank: index + 1 }));
  return { priorityCounts, pressureCounts, priorityRanking, pressureRanking, pressureContexts };
}

const tensionRules = [
  ['ambicao_travada', 'Ambição travada', ['crescimento'], ['seguranca'], 'Existe desejo de crescer, aprender e expandir, mas a necessidade de segurança pode gerar adiamento, medo de risco ou busca excessiva por garantia antes de agir.'],
  ['expansao_sem_eixo', 'Expansão sem eixo', ['prosperidade'], ['espiritualidade_proposito'], 'A energia de expansão pode estar mais forte do que a clareza de sentido, gerando movimento, ambição ou busca por resultados sem um eixo profundo de direção.'],
  ['lealdade_com_autoanulacao', 'Lealdade com autoanulação', ['familia_relacionamentos'], ['autenticidade'], 'O vínculo e a lealdade relacional aparecem fortes, mas podem vir acompanhados de dificuldade para expressar identidade, limites ou escolhas próprias.'],
  ['servico_com_sobrecarga', 'Serviço com sobrecarga', ['servico'], ['seguranca'], 'A disposição para servir pode ser alta, mas sem uma base de segurança e estrutura isso pode produzir excesso de entrega, desgaste ou dificuldade de sustentação.'],
  ['sentido_sem_estrutura', 'Sentido sem estrutura', ['espiritualidade_proposito'], ['prosperidade'], 'Há busca por sentido, princípios e propósito, mas a sustentação prática por recursos, organização ou estrutura pode estar menos desenvolvida.'],
  ['autonomia_isolada', 'Autonomia isolada', ['identidade'], ['vinculo'], 'A clareza de identidade pode estar mais forte do que o investimento em vínculos, criando risco de independência excessiva ou distanciamento relacional.'],
  ['estabilidade_limitante', 'Estabilidade limitante', ['seguranca'], ['crescimento'], 'A busca por segurança pode estar protegendo a pessoa, mas também pode reduzir abertura para aprendizado, expansão e movimentos de crescimento.'],
  ['avanco_com_desalinhamento_relacional', 'Avanço com desalinhamento relacional', ['expansao'], ['responsabilidade_afetiva'], 'Existe força de avanço e expansão, mas pode faltar atenção ao impacto emocional das decisões sobre pessoas próximas.'],
  ['rigidez_moral', 'Rigidez moral', ['principios_orientadores'], ['aprendizado'], 'Princípios fortes são uma base importante, mas com baixa abertura ao aprendizado podem se transformar em rigidez, julgamento ou dificuldade de revisão.'],
  ['cuidado_movido_por_aprovacao', 'Cuidado movido por aprovação', ['servico'], ['autenticidade'], 'A disposição para cuidar e servir pode estar misturada à dificuldade de se posicionar com autenticidade, gerando busca de aprovação ou autoabandono.'],
];

const synergyRules = [
  ['crescimento_com_impacto', 'Crescimento com impacto', ['crescimento', 'contribuicao'], 'O desenvolvimento pessoal tende a ganhar força quando está conectado a impacto positivo sobre outras pessoas.'],
  ['direcao_interna_forte', 'Direção interna forte', ['identidade', 'espiritualidade_proposito'], 'A clareza de identidade somada ao senso de propósito cria uma direção interna consistente para decisões importantes.'],
  ['vinculos_bem_cuidados', 'Vínculos bem cuidados', ['vinculo', 'responsabilidade_afetiva'], 'Há tendência de cuidar dos relacionamentos com presença, vínculo e responsabilidade pelo impacto emocional das atitudes.'],
  ['construcao_sustentavel', 'Construção sustentável', ['seguranca', 'expansao'], 'A pessoa tende a unir ambição e prudência, buscando crescimento com estrutura e sustentação.'],
  ['proposito_em_acao', 'Propósito em ação', ['espiritualidade_proposito', 'servico'], 'O sentido interno tende a se transformar em serviço prático, cuidado e contribuição real.'],
  ['coerencia_visivel', 'Coerência visível', ['autenticidade', 'coerencia_pessoal'], 'Existe tendência de viver de forma perceptivelmente alinhada entre identidade, discurso e comportamento.'],
  ['ambicao_com_limites', 'Ambição com limites', ['expansao', 'principios_orientadores'], 'A expansão tende a ser filtrada por princípios, reduzindo o risco de crescimento desalinhado da essência.'],
  ['evolucao_adaptativa', 'Evolução adaptativa', ['aprendizado', 'desenvolvimento_continuo'], 'A pessoa tende a aprender, revisar padrões e sustentar processos de amadurecimento ao longo do tempo.'],
];

function detectTensions(dimensions, subareas) {
  return tensionRules.map(([id, label, high, low, interpretation]) => {
    const highScores = high.map(k => [k, scoreOf(k, dimensions, subareas)]);
    const lowScores = low.map(k => [k, scoreOf(k, dimensions, subareas)]);
    if (!highScores.every(([, s]) => isHigh(s)) || !lowScores.every(([, s]) => isLow(s))) return null;
    const gap = Math.round(avg(highScores.map(([, s]) => s)) - avg(lowScores.map(([, s]) => s)));
    return { id, label, severity: gap >= 38 || lowScores.some(([, s]) => isVeryLow(s)) ? 'alta' : 'moderada', pattern: { high, low }, evidence: Object.fromEntries([...highScores, ...lowScores]), gap, interpretation };
  }).filter(Boolean).sort((a, b) => b.gap - a.gap);
}

function detectSynergies(dimensions, subareas) {
  return synergyRules.map(([id, label, high, interpretation]) => {
    const highScores = high.map(k => [k, scoreOf(k, dimensions, subareas)]);
    if (!highScores.every(([, s]) => isHigh(s))) return null;
    const average = Math.round(avg(highScores.map(([, s]) => s)));
    return { id, label, strength: highScores.some(([, s]) => isVeryHigh(s)) ? 'alta' : 'boa', pattern: { high }, evidence: Object.fromEntries(highScores), average, interpretation };
  }).filter(Boolean).sort((a, b) => b.average - a.average);
}

function detectCoherenceGaps(dimensions, choiceLayers) {
  return dimensionIds.map(id => {
    const declared = dimensions[id]?.score || 0;
    const prioritized = choiceLayers.priorityCounts[id] || 0;
    const pressure = choiceLayers.pressureCounts[id] || 0;
    const choiceWeight = prioritized + pressure;
    let type = 'alinhado';
    if (declared >= 72 && choiceWeight <= 1) type = 'declarado_mas_pouco_escolhido';
    if (declared <= 48 && choiceWeight >= 3) type = 'pouco_sustentado_mas_muito_escolhido';
    return { id, name: personalValuesDimensions.find(d => d.id === id)?.name || id, declaredScore: declared, priorityChoices: prioritized, pressureChoices: pressure, choiceWeight, type };
  }).filter(g => g.type !== 'alinhado').sort((a, b) => b.choiceWeight - a.choiceWeight || b.declaredScore - a.declaredScore);
}

export function calculatePersonalValuesScores(responses) {
  const { dimensions, subareas } = calculateRecognition(responses);
  const choiceLayers = calculateChoiceLayers(responses);
  const recognitionAverage = avg(Object.values(dimensions).map(d => d.average).filter(Boolean));
  const overallScore = recognitionAverage ? normalize(recognitionAverage) : 0;
  const strongestDimension = Object.entries(dimensions).sort((a, b) => b[1].score - a[1].score)[0];
  const weakestDimension = Object.entries(dimensions).sort((a, b) => a[1].score - b[1].score)[0];
  const strongestSubarea = Object.entries(subareas).sort((a, b) => b[1].score - a[1].score)[0];
  const weakestSubarea = Object.entries(subareas).sort((a, b) => a[1].score - b[1].score)[0];
  return {
    model: 'MVP-6',
    toolName: 'Mapa de Valores Pessoais',
    scale: 'Reconhecimento Likert 1-5 + escolhas forçadas + dilemas práticos',
    overall: { average: Number(recognitionAverage.toFixed(2)), score: overallScore, level: levelFromScore(overallScore) },
    dimensions,
    subareas,
    declaredValuesRanking: Object.entries(dimensions).sort((a, b) => b[1].score - a[1].score).map(([id, d], index) => ({ id, name: d.name, score: d.score, rank: index + 1 })),
    prioritizedValuesRanking: choiceLayers.priorityRanking,
    pressureValuesRanking: choiceLayers.pressureRanking,
    pressurePattern: choiceLayers.pressureContexts,
    tensions: detectTensions(dimensions, subareas),
    synergies: detectSynergies(dimensions, subareas),
    coherenceGaps: detectCoherenceGaps(dimensions, choiceLayers),
    highlights: {
      strongestDimension: { id: strongestDimension[0], ...strongestDimension[1] },
      weakestDimension: { id: weakestDimension[0], ...weakestDimension[1] },
      strongestSubarea: { id: strongestSubarea[0], ...strongestSubarea[1] },
      weakestSubarea: { id: weakestSubarea[0], ...weakestSubarea[1] },
      topPrioritizedValue: choiceLayers.priorityRanking[0],
      topPressureValue: choiceLayers.pressureRanking[0],
    },
  };
}
