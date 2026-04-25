import { config } from '../config/index.js';
import { prisma } from '../lib/prisma.js';
import { sabotagerTypes } from '../data/sabotadores-questions.js';

function buildPrompt({ userName, scores, responses, adminNotes }) {
  return `Você é uma mentora especialista em autoconhecimento, PNL aplicada, análise comportamental e padrões de auto-sabotagem.

Ferramenta: Mapa de Sabotadores Internos.
Objetivo: identificar padrões automáticos que sabotam execução, presença, decisões e relacionamentos, e criar um plano prático de neutralização.

Tipos mapeados:
${sabotagerTypes.map(t => `- ${t.id}: ${t.name} — ${t.description}`).join('\n')}

Regras:
- Não trate como diagnóstico psicológico ou psiquiátrico.
- Não use linguagem patologizante.
- Fale diretamente com a pessoa usando "você".
- Seja profunda, prática e humana.
- Use os dados determinísticos como base.
- Não invente sabotadores fora da lista.
- Explique o sabotador como proteção antiga que perdeu eficiência, não como defeito de caráter.

Nome: ${userName}
Dados calculados:
${JSON.stringify(scores, null, 2)}

Respostas completas:
${JSON.stringify(responses, null, 2)}

${adminNotes ? `Contexto adicional da mentora:\n${adminNotes}\n` : ''}

Retorne SOMENTE JSON válido:
{
  "resumoExecutivo": "3 a 5 frases com a leitura principal",
  "sabotadorPrincipal": {"nome":"...", "leitura":"...", "comoProtege":"...", "comoSabota":"..."},
  "sabotadorSecundario": {"nome":"...", "leitura":"..."},
  "cicloDeSabotagem": {
    "gatilho":"...",
    "fraseInterna":"...",
    "comportamentoAutomatico":"...",
    "custo":"..."
  },
  "mapaDeGatilhos": [
    {"gatilho":"...", "comoAparece":"...", "respostaConsciente":"..."}
  ],
  "planoDeNeutralizacao": [
    {"situacao":"...", "antidoto":"...", "acaoPratica":"..."}
  ],
  "primeiras24Horas": ["ação 1", "ação 2", "ação 3"],
  "roteiroDeInterrupcao": "frase curta que a pessoa pode usar quando perceber o padrão",
  "plano7Dias": [
    {"dia":1,"acao":"...","indicador":"..."},
    {"dia":2,"acao":"...","indicador":"..."},
    {"dia":3,"acao":"...","indicador":"..."},
    {"dia":4,"acao":"...","indicador":"..."},
    {"dia":5,"acao":"...","indicador":"..."},
    {"dia":6,"acao":"...","indicador":"..."},
    {"dia":7,"acao":"...","indicador":"..."}
  ],
  "fraseFinal": "frase final forte, elegante e memorável"
}`;
}

function assertShape(n) {
  const required = ['resumoExecutivo','sabotadorPrincipal','sabotadorSecundario','cicloDeSabotagem','mapaDeGatilhos','planoDeNeutralizacao','primeiras24Horas','roteiroDeInterrupcao','plano7Dias','fraseFinal'];
  for (const key of required) if (!(key in n)) throw new Error('Resposta da IA sem campo obrigatorio: ' + key);
  return n;
}

export async function generateSabotagersReport(assessmentId) {
  const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId }, include: { user: { select: { name: true } } } });
  if (!assessment) throw new Error('Assessment nao encontrado');
  if (!assessment.scoresRaw?.primarySabotager) throw new Error('Assessment sem dados de sabotadores');
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
  catch (e) { console.error('Failed to parse sabotagers AI response:', rawText.substring(0, 700)); throw new Error('Erro ao processar resposta da IA'); }
  const report = await prisma.report.create({ data: { assessmentId, narrative, promptUsed: prompt, modelUsed: 'claude-sonnet-4-20250514' } });
  await prisma.assessment.update({ where: { id: assessmentId }, data: { status: 'REPORT_GENERATED' } });
  return report;
}
