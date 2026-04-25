import { config } from '../config/index.js';
import { prisma } from '../lib/prisma.js';

function buildPrompt({ userName, scores, responses, adminNotes }) {
  return `Você é uma mentora especialista em metas, execução, PNL aplicada, comportamento humano e transformação pessoal.

Ferramenta: Mapa de Metas e Execução.
Objetivo: transformar uma meta desejada em plano de execução claro, realista e emocionalmente sustentável.

Regras:
- Não trate como diagnóstico psicológico.
- Fale diretamente com a pessoa usando "você".
- Seja prática, profunda e clara.
- Não crie metas novas; refine a meta informada.
- Use os dados determinísticos como base.
- Se a meta estiver vaga, torne-a mais específica sem distorcer a intenção.
- O plano deve ser executável por uma pessoa comum, com rotina real.

Nome: ${userName}
Dados calculados:
${JSON.stringify(scores, null, 2)}

Respostas completas:
${JSON.stringify(responses, null, 2)}

${adminNotes ? `Contexto adicional da mentora:\n${adminNotes}\n` : ''}

Retorne SOMENTE JSON válido:
{
  "metaRefinada": "meta clara, específica e humana",
  "resumoExecutivo": "3 a 5 frases sobre a meta, prontidão e principal ajuste",
  "leituraDoMomento": "2 a 4 parágrafos sobre o ponto de partida, energia, obstáculos e motivação",
  "diagnosticoDeExecucao": {
    "nivelDeProntidao": "texto curto",
    "principalRisco": "risco mais relevante",
    "principalForca": "força mais relevante",
    "ajusteEssencial": "ajuste principal antes de executar"
  },
  "metaSMART": {
    "especifica": "...",
    "mensuravel": "...",
    "alcancavel": "...",
    "relevante": "...",
    "temporal": "..."
  },
  "plano30Dias": [
    {"semana":1,"foco":"...","acoes":["...","...","..."],"indicador":"..."},
    {"semana":2,"foco":"...","acoes":["...","...","..."],"indicador":"..."},
    {"semana":3,"foco":"...","acoes":["...","...","..."],"indicador":"..."},
    {"semana":4,"foco":"...","acoes":["...","...","..."],"indicador":"..."}
  ],
  "primeiras24Horas": ["ação 1", "ação 2", "ação 3"],
  "rotinaMinima": "rotina simples para manter constância",
  "planoAntiSabotagem": [
    {"obstaculo":"...","respostaPratica":"..."}
  ],
  "fraseFinal": "frase final forte, elegante e memorável"
}`;
}

function assertShape(n) {
  const required = ['metaRefinada','resumoExecutivo','leituraDoMomento','diagnosticoDeExecucao','metaSMART','plano30Dias','primeiras24Horas','rotinaMinima','planoAntiSabotagem','fraseFinal'];
  for (const key of required) if (!(key in n)) throw new Error('Resposta da IA sem campo obrigatorio: ' + key);
  return n;
}

export async function generateGoalsExecutionReport(assessmentId) {
  const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId }, include: { user: { select: { name: true } } } });
  if (!assessment) throw new Error('Assessment nao encontrado');
  if (!assessment.scoresRaw?.goal) throw new Error('Assessment sem dados de meta');
  if (!config.anthropicApiKey) throw new Error('ANTHROPIC_API_KEY nao configurada');
  const prompt = buildPrompt({ userName: assessment.user.name, scores: assessment.scoresRaw, responses: assessment.responses, adminNotes: assessment.adminNotes });
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': config.anthropicApiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 7000, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!response.ok) { const err = await response.text(); console.error('Anthropic API error:', err); throw new Error('Erro na API Anthropic: ' + response.status); }
  const data = await response.json();
  const rawText = data.content?.[0]?.text || '';
  let narrative;
  try { narrative = assertShape(JSON.parse(rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())); }
  catch (e) { console.error('Failed to parse goals AI response:', rawText.substring(0, 700)); throw new Error('Erro ao processar resposta da IA'); }
  const report = await prisma.report.create({ data: { assessmentId, narrative, promptUsed: prompt, modelUsed: 'claude-sonnet-4-20250514' } });
  await prisma.assessment.update({ where: { id: assessmentId }, data: { status: 'REPORT_GENERATED' } });
  return report;
}
