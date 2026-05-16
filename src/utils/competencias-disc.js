// =============================================================================
// AVISO: ESTE ARQUIVO É ESPELHADO EM frontend/src/utils/competencias-disc.js
// Qualquer alteração de fórmula/constante DEVE ser aplicada nos DOIS lados.
// Sincronia manual (sem teste automatizado — dívida técnica documentada).
// =============================================================================

// 9 competências derivadas das 4 dimensões DISC.
// Pesos somam 1.0 em cada fórmula. Entrada: scores 0-100. Saída: 0-100.
export const COMPETENCIAS = [
  { key: 'assertividade',  nome: 'Assertividade',       abbr: 'Ass.',  formula: (s) => s.D * 0.7 + s.I * 0.3 },
  { key: 'comunicacao',    nome: 'Comunicação',         abbr: 'Com.',  formula: (s) => s.I * 0.7 + s.D * 0.2 + s.S * 0.1 },
  { key: 'empatia',        nome: 'Empatia',             abbr: 'Emp.',  formula: (s) => s.S * 0.6 + s.I * 0.4 },
  { key: 'precisao',       nome: 'Precisão',            abbr: 'Prec.', formula: (s) => s.C * 0.8 + s.S * 0.2 },
  { key: 'iniciativa',     nome: 'Iniciativa',          abbr: 'Ini.',  formula: (s) => s.D * 0.6 + s.I * 0.3 + s.C * 0.1 },
  { key: 'diplomacia',     nome: 'Diplomacia',          abbr: 'Dipl.', formula: (s) => s.S * 0.5 + s.I * 0.3 + s.C * 0.2 },
  { key: 'analiseCritica', nome: 'Análise Crítica',     abbr: 'Anál.', formula: (s) => s.C * 0.7 + s.D * 0.2 + s.S * 0.1 },
  { key: 'adaptabilidade', nome: 'Adaptabilidade',      abbr: 'Adap.', formula: (s) => s.I * 0.4 + s.D * 0.3 + s.S * 0.3 },
  { key: 'focoResultados', nome: 'Foco em Resultados',  abbr: 'Foco',  formula: (s) => s.D * 0.5 + s.C * 0.5 },
];

export const QUADRANTES_LABELS = {
  Q1: 'Executor-Comunicador',   // x>=0, y>=0 (D e I dominantes)
  Q2: 'Planejador-Comunicador', // x<0,  y>=0 (S e I dominantes)
  Q3: 'Planejador-Analista',    // x<0,  y<0  (S e C dominantes)
  Q4: 'Executor-Analista',      // x>=0, y<0  (D e C dominantes)
};

function safeScores(scores) {
  return {
    D: Number(scores?.D) || 0,
    I: Number(scores?.I) || 0,
    S: Number(scores?.S) || 0,
    C: Number(scores?.C) || 0,
  };
}

export function calcularCompetencias(scores) {
  const s = safeScores(scores);
  return COMPETENCIAS.map(({ key, nome, abbr, formula }) => ({
    key,
    nome,
    abbr,
    score: Math.round(formula(s) * 10) / 10,
  }));
}

export function calcularQuadrante(scores) {
  const s = safeScores(scores);
  const x = s.D - s.S;
  const y = s.I - s.C;
  let quadrante;
  if (x >= 0 && y >= 0) quadrante = 'Q1';
  else if (x < 0 && y >= 0) quadrante = 'Q2';
  else if (x < 0 && y < 0) quadrante = 'Q3';
  else quadrante = 'Q4';
  return {
    x,
    y,
    quadrante,
    quadranteLabel: QUADRANTES_LABELS[quadrante],
  };
}
