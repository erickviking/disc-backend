/**
 * ═══════════════════════════════════════════════════════════════
 * DISC Platform — E1: Backend Roda da Vida
 * ═══════════════════════════════════════════════════════════════
 * 
 * Cria toda a infraestrutura backend da Roda da Vida:
 *   1. Perguntas (12 áreas × 3 perguntas = 36)
 *   2. Scoring (média por área, escala 1-10)
 *   3. Gerador de relatório IA (prompt Claude)
 *   4. Patch nas rotas de assessment para multi-tool
 *   5. Update do seed com config da roda-da-vida
 * 
 * Execução:
 *   cd C:\disc-system\backend
 *   node roda-da-vida-backend.cjs
 * 
 * ═══════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src');

function writeNewFile(relPath, content, label) {
  const fp = path.join(SRC, relPath);
  const dir = path.dirname(fp);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fp, content, 'utf-8');
  console.log(`  ✓ Criado: src/${relPath} — ${label}`);
}

function patchFile(relPath, patches) {
  const fp = path.join(SRC, relPath);
  const bak = fp + '.bak-' + Date.now();
  fs.copyFileSync(fp, bak);
  let content = fs.readFileSync(fp, 'utf-8');
  let applied = 0;
  for (const [from, to, label] of patches) {
    if (content.includes(from)) {
      content = content.replace(from, to);
      applied++;
      console.log(`  ✓ ${label}`);
    } else {
      console.log(`  ⚠ Não encontrado: ${label}`);
    }
  }
  fs.writeFileSync(fp, content);
  return applied;
}

// ═══════════════════════════════════════════════════════════════
// 1. PERGUNTAS — 12 áreas × 3 perguntas reflexivas
// ═══════════════════════════════════════════════════════════════
console.log('\n[1/5] Criando perguntas da Roda da Vida...');

const questionsFile = `// Roda da Vida — 12 áreas com 3 perguntas reflexivas cada
// O usuário responde cada pergunta com nota de 1 a 10
// Score por área = média das 3 perguntas

export const rodaDaVidaAreas = [
  {
    id: 'saude',
    name: 'Saúde e Disposição',
    icon: 'Heart',
    color: '#E63946',
    questions: [
      { id: 'saude_1', text: 'Como você avalia sua saúde física atual (energia, sono, alimentação)?' },
      { id: 'saude_2', text: 'Com que frequência você pratica atividades físicas?' },
      { id: 'saude_3', text: 'Quão satisfeito você está com seus hábitos de autocuidado?' },
    ],
  },
  {
    id: 'intelectual',
    name: 'Desenvolvimento Intelectual',
    icon: 'BookOpen',
    color: '#4c6ef5',
    questions: [
      { id: 'intelectual_1', text: 'Quanto você tem investido em aprendizado e desenvolvimento pessoal?' },
      { id: 'intelectual_2', text: 'Quão estimulado intelectualmente você se sente no dia a dia?' },
      { id: 'intelectual_3', text: 'Como você avalia sua capacidade de aprender coisas novas atualmente?' },
    ],
  },
  {
    id: 'emocional',
    name: 'Equilíbrio Emocional',
    icon: 'Shield',
    color: '#7c3aed',
    questions: [
      { id: 'emocional_1', text: 'Quão bem você lida com suas emoções no dia a dia?' },
      { id: 'emocional_2', text: 'Com que frequência você se sente em paz consigo mesmo?' },
      { id: 'emocional_3', text: 'Como você avalia sua capacidade de lidar com situações de estresse?' },
    ],
  },
  {
    id: 'proposito',
    name: 'Realização e Propósito',
    icon: 'Compass',
    color: '#F4A261',
    questions: [
      { id: 'proposito_1', text: 'Quão conectado você se sente com seu propósito de vida?' },
      { id: 'proposito_2', text: 'Como você avalia seu senso de realização pessoal?' },
      { id: 'proposito_3', text: 'Quanto suas atividades diárias estão alinhadas com o que realmente importa para você?' },
    ],
  },
  {
    id: 'financas',
    name: 'Recursos Financeiros',
    icon: 'Target',
    color: '#059669',
    questions: [
      { id: 'financas_1', text: 'Quão satisfeito você está com sua situação financeira atual?' },
      { id: 'financas_2', text: 'Como você avalia seu controle sobre gastos e investimentos?' },
      { id: 'financas_3', text: 'Quão seguro financeiramente você se sente para o futuro?' },
    ],
  },
  {
    id: 'contribuicao',
    name: 'Contribuição Social',
    icon: 'Users',
    color: '#2A9D8F',
    questions: [
      { id: 'contribuicao_1', text: 'Quanto você sente que contribui positivamente para a vida de outras pessoas?' },
      { id: 'contribuicao_2', text: 'Quão envolvido você está em ações que geram impacto além de você?' },
      { id: 'contribuicao_3', text: 'Como você avalia o legado que está construindo?' },
    ],
  },
  {
    id: 'familia',
    name: 'Família',
    icon: 'Heart',
    color: '#E63946',
    questions: [
      { id: 'familia_1', text: 'Quão satisfeito você está com a qualidade do tempo que passa com sua família?' },
      { id: 'familia_2', text: 'Como você avalia a harmonia nos seus relacionamentos familiares?' },
      { id: 'familia_3', text: 'Quanto você sente que está presente e conectado com as pessoas que ama?' },
    ],
  },
  {
    id: 'relacionamento',
    name: 'Relacionamento Amoroso',
    icon: 'Heart',
    color: '#ec4899',
    questions: [
      { id: 'relacionamento_1', text: 'Quão satisfeito você está com sua vida afetiva/amorosa?' },
      { id: 'relacionamento_2', text: 'Como você avalia a qualidade da comunicação no seu relacionamento (ou consigo mesmo, se solteiro)?' },
      { id: 'relacionamento_3', text: 'Quanto você se sente valorizado e acolhido nas suas relações íntimas?' },
    ],
  },
  {
    id: 'social',
    name: 'Vida Social',
    icon: 'Users',
    color: '#f59e0b',
    questions: [
      { id: 'social_1', text: 'Quão satisfeito você está com suas amizades e vida social?' },
      { id: 'social_2', text: 'Com que frequência você se conecta com pessoas que te fazem bem?' },
      { id: 'social_3', text: 'Como você avalia a qualidade das suas conexões sociais?' },
    ],
  },
  {
    id: 'diversao',
    name: 'Criatividade e Diversão',
    icon: 'Rocket',
    color: '#8b5cf6',
    questions: [
      { id: 'diversao_1', text: 'Quanto tempo você dedica a atividades que te dão prazer e diversão?' },
      { id: 'diversao_2', text: 'Quão presente está a criatividade no seu dia a dia?' },
      { id: 'diversao_3', text: 'Como você avalia seu equilíbrio entre responsabilidades e lazer?' },
    ],
  },
  {
    id: 'plenitude',
    name: 'Plenitude e Felicidade',
    icon: 'Star',
    color: '#d4a853',
    questions: [
      { id: 'plenitude_1', text: 'De modo geral, quão feliz você se sente com sua vida?' },
      { id: 'plenitude_2', text: 'Com que frequência você experimenta momentos de gratidão genuína?' },
      { id: 'plenitude_3', text: 'Quanto você sente que está vivendo a vida que deseja?' },
    ],
  },
  {
    id: 'espiritualidade',
    name: 'Espiritualidade',
    icon: 'Compass',
    color: '#6366f1',
    questions: [
      { id: 'espiritualidade_1', text: 'Quão conectado você se sente com algo maior que você (fé, universo, natureza)?' },
      { id: 'espiritualidade_2', text: 'Com que frequência você pratica momentos de reflexão, meditação ou oração?' },
      { id: 'espiritualidade_3', text: 'Como você avalia sua paz interior e senso de transcendência?' },
    ],
  },
];

export const rodaDaVidaQuestionCount = rodaDaVidaAreas.reduce((sum, a) => sum + a.questions.length, 0);
`;

writeNewFile('data/roda-da-vida-questions.js', questionsFile, '12 áreas × 3 perguntas = 36');

// ═══════════════════════════════════════════════════════════════
// 2. SCORING — média por área
// ═══════════════════════════════════════════════════════════════
console.log('\n[2/5] Criando scoring da Roda da Vida...');

const scoringFile = `import { rodaDaVidaAreas } from '../data/roda-da-vida-questions.js';

/**
 * Calcula os scores da Roda da Vida.
 * 
 * @param {Object} responses - { questionId: score (1-10) }
 *   Ex: { saude_1: 7, saude_2: 5, saude_3: 8, ... }
 * @returns {{ scores, average, highest, lowest, balanced }}
 */
export function calculateRodaDaVidaScores(responses) {
  if (!responses || typeof responses !== 'object') {
    throw new Error('Respostas devem ser um objeto { questionId: score }');
  }

  const scores = {};
  let totalAnswered = 0;

  for (const area of rodaDaVidaAreas) {
    const areaScores = [];
    for (const q of area.questions) {
      const val = responses[q.id];
      if (val === undefined || val === null) {
        throw new Error('Pergunta não respondida: ' + q.id);
      }
      const num = Number(val);
      if (isNaN(num) || num < 1 || num > 10) {
        throw new Error('Score deve ser entre 1 e 10 para: ' + q.id);
      }
      areaScores.push(num);
      totalAnswered++;
    }
    // Média da área arredondada para 1 casa decimal
    scores[area.id] = Math.round((areaScores.reduce((a, b) => a + b, 0) / areaScores.length) * 10) / 10;
  }

  const allScores = Object.values(scores);
  const average = Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10;
  
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const highest = { area: sorted[0][0], score: sorted[0][1] };
  const lowest = { area: sorted[sorted.length - 1][0], score: sorted[sorted.length - 1][1] };
  
  // Balanced = desvio padrão baixo (< 1.5 = equilibrado, > 2.5 = desequilibrado)
  const mean = allScores.reduce((a, b) => a + b, 0) / allScores.length;
  const variance = allScores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / allScores.length;
  const stdDev = Math.round(Math.sqrt(variance) * 10) / 10;
  const balanced = stdDev < 1.5;

  return {
    scores,       // { saude: 7.3, intelectual: 5.0, ... }
    average,      // média geral
    highest,      // { area: 'saude', score: 7.3 }
    lowest,       // { area: 'financas', score: 3.0 }
    balanced,     // true/false
    stdDev,       // desvio padrão
    totalAnswered,
  };
}

export function validateRodaDaVidaResponses(responses) {
  if (!responses || typeof responses !== 'object') return 'Respostas devem ser um objeto';
  
  const allQuestionIds = rodaDaVidaAreas.flatMap(a => a.questions.map(q => q.id));
  
  for (const qId of allQuestionIds) {
    if (responses[qId] === undefined || responses[qId] === null) {
      return 'Pergunta não respondida: ' + qId;
    }
    const val = Number(responses[qId]);
    if (isNaN(val) || val < 1 || val > 10) {
      return 'Score deve ser entre 1 e 10 para: ' + qId;
    }
  }
  
  return null; // sem erro
}
`;

writeNewFile('services/roda-da-vida-scoring.js', scoringFile, 'Scoring por área');

// ═══════════════════════════════════════════════════════════════
// 3. GERADOR DE RELATÓRIO IA
// ═══════════════════════════════════════════════════════════════
console.log('\n[3/5] Criando gerador de relatório da Roda da Vida...');

const reportGenFile = `import { PrismaClient } from '@prisma/client';
import { config } from '../config/index.js';
import { rodaDaVidaAreas } from '../data/roda-da-vida-questions.js';

const prisma = new PrismaClient();

// Mapa de id → nome legível
const areaNames = {};
for (const a of rodaDaVidaAreas) {
  areaNames[a.id] = a.name;
}

export async function generateRodaDaVidaReport(assessmentId) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: { user: { select: { name: true } } },
  });

  if (!assessment) throw new Error('Assessment não encontrado');
  if (!assessment.scoresRaw?.scores) throw new Error('Assessment sem scores');

  const scores = assessment.scoresRaw.scores;
  const average = assessment.scoresRaw.average;
  const highest = assessment.scoresRaw.highest;
  const lowest = assessment.scoresRaw.lowest;
  const balanced = assessment.scoresRaw.balanced;
  const stdDev = assessment.scoresRaw.stdDev;

  const scoresFormatted = Object.entries(scores)
    .map(([k, v]) => \`- \${areaNames[k] || k}: \${v}/10\`)
    .join('\\n');

  const prompt = \`Você é uma especialista em desenvolvimento pessoal e coaching de alta performance. Você trabalha com a mentora Vanessa Rocha em uma plataforma de autoconhecimento.

## Ferramenta: Roda da Vida
A Roda da Vida é uma ferramenta clássica de coaching que avalia 12 áreas fundamentais da vida numa escala de 1 a 10. O objetivo é identificar desequilíbrios e criar um plano de ação para uma vida mais plena.

## Dados do Avaliado
- Nome: \${assessment.user.name}
- Média geral: \${average}/10
- Desvio padrão: \${stdDev} (\${balanced ? 'relativamente equilibrado' : 'desequilíbrio significativo'})
- Área mais forte: \${areaNames[highest.area]} (\${highest.score}/10)
- Área que mais precisa de atenção: \${areaNames[lowest.area]} (\${lowest.score}/10)

## Scores por área
\${scoresFormatted}

\${assessment.adminNotes ? '## Contexto adicional do coach\\n' + assessment.adminNotes : ''}

## Instruções
Gere uma análise completa e personalizada da Roda da Vida. Retorne SOMENTE um JSON válido (sem markdown, sem backticks) com esta estrutura:

{
  "resumoGeral": "Parágrafo de 3-4 frases com visão geral do momento de vida da pessoa, tom acolhedor e motivador",
  "analiseEquilibrio": {
    "descricao": "2-3 parágrafos analisando o equilíbrio geral entre as áreas, padrões observados, e o que a distribuição dos scores revela sobre o momento de vida",
    "nivel": "equilibrado | moderado | desequilibrado"
  },
  "areasDestaquePositivo": [
    {"area": "nome da área", "score": 0.0, "analise": "2-3 frases sobre porque essa área está forte e como manter"}
  ],
  "areasAtencao": [
    {"area": "nome da área", "score": 0.0, "analise": "2-3 frases construtivas sobre porque essa área precisa de atenção e o impacto na vida geral", "microAcao": "1 ação prática e simples que pode ser feita esta semana"}
  ],
  "conexoesEntreAreas": "1-2 parágrafos explicando como as áreas se influenciam mutuamente (ex: saúde baixa pode impactar disposição para vida social)",
  "planoDeAcao": {
    "prioridade1": {"area": "nome", "meta": "meta específica para 30 dias", "acoes": ["3 ações práticas"]},
    "prioridade2": {"area": "nome", "meta": "meta específica para 30 dias", "acoes": ["3 ações práticas"]},
    "prioridade3": {"area": "nome", "meta": "meta específica para 30 dias", "acoes": ["3 ações práticas"]}
  },
  "reflexaoFinal": "Parágrafo motivador e personalizado, conectando o momento atual com o potencial de transformação"
}

REGRAS IMPORTANTES:
- Use linguagem acolhedora, construtiva e profissional
- Seja específico e prático — evite generalidades
- Considere as CONEXÕES entre áreas, não cada uma isoladamente
- Fale diretamente com a pessoa usando "você"
- Inclua as 3 áreas mais fortes em areasDestaquePositivo
- Inclua as 3 áreas mais baixas em areasAtencao
- As microAções devem ser realizáveis em 1 semana
- O plano de ação deve focar nas 3 áreas prioritárias
- Retorne SOMENTE o JSON, sem nenhum texto antes ou depois\`;

  if (!config.anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY não configurada');
  }

  console.log('Gerando relatório Roda da Vida para:', assessmentId);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.anthropicApiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Anthropic API error:', err);
    throw new Error('Erro na API Anthropic: ' + response.status);
  }

  const data = await response.json();
  const rawText = data.content[0]?.text || '';

  let narrative;
  try {
    const cleaned = rawText.replace(/\\\`\\\`\\\`json\\n?/g, '').replace(/\\\`\\\`\\\`\\n?/g, '').trim();
    narrative = JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse AI response:', rawText.substring(0, 500));
    throw new Error('Erro ao processar resposta da IA');
  }

  const report = await prisma.report.create({
    data: {
      assessmentId,
      narrative,
      promptUsed: prompt,
      modelUsed: 'claude-sonnet-4-20250514',
    },
  });

  await prisma.assessment.update({
    where: { id: assessmentId },
    data: { status: 'REPORT_GENERATED' },
  });

  console.log('Relatório Roda da Vida gerado:', report.id);
  return report;
}
`;

// Fix the backtick escaping issue — write raw
const reportGenFixed = reportGenFile
  .replace(/\\\`\\\`\\\`json\\n\?/g, '```json\\n?')
  .replace(/\\\`\\\`\\\`\\n\?/g, '```\\n?');

writeNewFile('services/roda-da-vida-report-generator.js', reportGenFixed, 'Gerador relatório IA');

// ═══════════════════════════════════════════════════════════════
// 4. PATCH nas rotas — suporte multi-tool
// ═══════════════════════════════════════════════════════════════
console.log('\n[4/5] Patchando rotas de assessment...');

patchFile('routes/assessments.js', [
  // A. Adicionar imports da Roda da Vida
  [
    "import { calculateDiscScores, validateResponses } from '../services/disc-scoring.js';",
    "import { calculateDiscScores, validateResponses } from '../services/disc-scoring.js';\nimport { calculateRodaDaVidaScores, validateRodaDaVidaResponses } from '../services/roda-da-vida-scoring.js';\nimport { rodaDaVidaAreas } from '../data/roda-da-vida-questions.js';",
    "Import scoring Roda da Vida"
  ],
  // B. Adicionar import do report generator da Roda da Vida
  [
    "import { generateReport } from '../services/report-generator.js';",
    "import { generateReport } from '../services/report-generator.js';\nimport { generateRodaDaVidaReport } from '../services/roda-da-vida-report-generator.js';",
    "Import report generator Roda da Vida"
  ],
  // C. Adicionar rota de perguntas da Roda da Vida
  [
    "userAssessmentRouter.get('/questions', (req, res) => {\n  return res.json({ questions: discQuestions, totalGroups: discQuestions.length });\n});",
    `userAssessmentRouter.get('/questions', (req, res) => {
  const { tool } = req.query;
  if (tool === 'roda-da-vida') {
    return res.json({ areas: rodaDaVidaAreas, totalQuestions: rodaDaVidaAreas.reduce((s, a) => s + a.questions.length, 0) });
  }
  return res.json({ questions: discQuestions, totalGroups: discQuestions.length });
});`,
    "Rota GET /questions com suporte multi-tool"
  ],
  // D. Adicionar toolId no POST de criação de assessment
  [
    "const inProgress = await prisma.assessment.findFirst({ where: { userId: req.user.id, status: 'IN_PROGRESS' } });",
    "const { toolSlug } = req.body;\n    let toolId = null;\n    if (toolSlug) {\n      const tool = await prisma.tool.findUnique({ where: { slug: toolSlug } });\n      if (tool) toolId = tool.id;\n    }\n    const inProgress = await prisma.assessment.findFirst({ where: { userId: req.user.id, status: 'IN_PROGRESS', ...(toolId ? { toolId } : {}) } });",
    "Suporte toolSlug no POST assessment"
  ],
  [
    "const assessment = await prisma.assessment.create({ data: { userId: req.user.id, status: 'IN_PROGRESS' } });",
    "const assessment = await prisma.assessment.create({ data: { userId: req.user.id, status: 'IN_PROGRESS', ...(toolId ? { toolId } : {}) } });",
    "Salvar toolId no assessment"
  ],
  // E. Patch no submit para suportar Roda da Vida
  [
    "const { responses } = req.body;\n    const validationError = validateResponses(responses);\n    if (validationError) return res.status(400).json({ error: validationError });\n    const { scores, rawScores, profilePrimary, profileSecondary } = calculateDiscScores(responses);",
    `const { responses } = req.body;
    
    // Detectar tipo de assessment pelo tool associado
    const tool = assessment.toolId ? await prisma.tool.findUnique({ where: { id: assessment.toolId } }) : null;
    const toolSlug = tool?.slug || 'disc';
    
    let scoresData, profilePrimary = null, profileSecondary = null;
    
    if (toolSlug === 'roda-da-vida') {
      // Roda da Vida: responses = { questionId: score(1-10) }
      const validationError = validateRodaDaVidaResponses(responses);
      if (validationError) return res.status(400).json({ error: validationError });
      const result = calculateRodaDaVidaScores(responses);
      scoresData = result;
      profilePrimary = result.highest.area;
      profileSecondary = result.lowest.area;
    } else {
      // DISC: responses = [{ groupIndex, most, least }]
      const validationError = validateResponses(responses);
      if (validationError) return res.status(400).json({ error: validationError });
      const { scores, rawScores, profilePrimary: pp, profileSecondary: ps } = calculateDiscScores(responses);
      scoresData = { normalized: scores, raw: rawScores };
      profilePrimary = pp;
      profileSecondary = ps;
    }`,
    "Submit multi-tool (DISC + Roda da Vida)"
  ],
  [
    "data: { responses, scoresRaw: { normalized: scores, raw: rawScores }, profilePrimary, profileSecondary, status: 'COMPLETED', completedAt: new Date() },",
    "data: { responses, scoresRaw: scoresData, profilePrimary, profileSecondary, status: 'COMPLETED', completedAt: new Date() },",
    "Usar scoresData genérico"
  ],
  // F. Patch no generate-report para suportar Roda da Vida
  [
    "const report = await generateReport(assessment.id);",
    `// Detectar tool para usar o gerador correto
    const tool = assessment.toolId ? await prisma.tool.findUnique({ where: { id: assessment.toolId } }) : null;
    let report;
    if (tool?.slug === 'roda-da-vida') {
      report = await generateRodaDaVidaReport(assessment.id);
    } else {
      report = await generateReport(assessment.id);
    }`,
    "Generate report multi-tool"
  ],
  // G. Adicionar tool info no GET /mine
  [
    "select: { id: true, status: true, profilePrimary: true, profileSecondary: true, scoresRaw: true, completedAt: true, releasedAt: true, createdAt: true, report: { select: { id: true, generatedAt: true } } },",
    "select: { id: true, status: true, profilePrimary: true, profileSecondary: true, scoresRaw: true, completedAt: true, releasedAt: true, createdAt: true, tool: { select: { slug: true, name: true } }, report: { select: { id: true, generatedAt: true } } },",
    "Incluir tool no GET /mine"
  ],
]);

// ═══════════════════════════════════════════════════════════════
// 5. UPDATE seed config
// ═══════════════════════════════════════════════════════════════
console.log('\n[5/5] Atualizando seed...');

const seedPath = path.join(__dirname, 'prisma', 'seed.js');
if (fs.existsSync(seedPath)) {
  let seed = fs.readFileSync(seedPath, 'utf-8');
  fs.copyFileSync(seedPath, seedPath + '.bak-' + Date.now());
  
  seed = seed.replace(
    "description: 'Avalie sua satisfacao em 8 areas fundamentais da vida e identifique onde focar sua energia.',",
    "description: 'Avalie sua satisfação em 12 áreas fundamentais da vida e identifique prioridades de desenvolvimento.',"
  );
  seed = seed.replace(
    "config: { areas: 8 },",
    "config: { areas: 12, scoringMethod: 'roda_da_vida', questionsPerArea: 3 },"
  );
  
  fs.writeFileSync(seedPath, seed);
  console.log('  ✓ Seed atualizado (12 áreas, config expandido)');
} else {
  console.log('  ⚠ seed.js não encontrado');
}

// ═══════════════════════════════════════════════════════════════
// Resumo
// ═══════════════════════════════════════════════════════════════
console.log('\n═══════════════════════════════════════════════════════');
console.log('✅ E1 Backend Roda da Vida — Completo!');
console.log('═══════════════════════════════════════════════════════');
console.log('');
console.log('Arquivos criados:');
console.log('  • src/data/roda-da-vida-questions.js (12 áreas × 3 = 36 perguntas)');
console.log('  • src/services/roda-da-vida-scoring.js (média por área 1-10)');
console.log('  • src/services/roda-da-vida-report-generator.js (prompt Claude)');
console.log('');
console.log('Arquivos modificados:');
console.log('  • src/routes/assessments.js (multi-tool: DISC + Roda da Vida)');
console.log('  • prisma/seed.js (config 12 áreas)');
console.log('');
console.log('Sem migration necessária — usa mesmas tabelas Assessment/Report/Tool.');
console.log('');
console.log('Próximos passos:');
console.log('  1. npx prisma db seed (atualizar config da tool no banco)');
console.log('  2. git add . && git commit -m "feat: E1 backend Roda da Vida" && git push');
console.log('  3. Aguardar E2 (frontend quiz) e E3 (frontend report + roda SVG)');
