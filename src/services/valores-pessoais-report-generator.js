import { config } from '../config/index.js';
import { personalValuesDimensions, personalValuesSubareas } from '../data/valores-pessoais-questions.js';
import { prisma } from '../lib/prisma.js';

function buildPrompt({ userName, scores, adminNotes }) {
  return `Você é uma especialista em valores pessoais, autoconhecimento, PNL aplicada, análise comportamental e desenvolvimento humano.

IMPORTANTE:
- Esta ferramenta se chama Mapa de Valores Pessoais.
- Ela combina reconhecimento de valores, priorização forçada e dilemas práticos.
- É ferramenta de autoconhecimento e desenvolvimento, não diagnóstico psicológico.
- Fale diretamente com a pessoa usando "você".
- Use linguagem profunda, prática, humana e acessível.
- Não invente tensões ou conflitos que não estejam nos dados.
- Use obrigatoriamente hierarchy, choiceMap, coherenceMap, tensions e synergies fornecidos pelo sistema.
- Você pode humanizar, explicar e aplicar os dados à vida prática, mas não deve criar novas relações causais sem base nos scores.
- Evite dizer "baixo" no relatório final. Prefira: "menos expressivo", "pede atenção", "ainda pouco sustentado na prática", "precisa de estrutura".

Nome da pessoa: ${userName}
Modelo: Mapa de Valores Pessoais — MVP-3

Dimensões:
${personalValuesDimensions.map(d => `- ${d.id}: ${d.name} — ${d.description}`).join('\n')}

Subáreas:
${Object.entries(personalValuesSubareas).map(([id, s]) => `- ${id}: ${s.name} (${s.dimension})`).join('\n')}

Dados calculados deterministicamente pelo sistema:
${JSON.stringify(scores, null, 2)}

${adminNotes ? `Contexto adicional da mentora:\n${adminNotes}\n` : ''}

Regras de interpretação:
1. Diferencie claramente: valores reconhecidos, valores priorizados e valores sob pressão.
2. Use a hierarquia declarada, priorizada e sob pressão para explicar coerência ou desalinhamento.
3. Se coherenceMap.score for menor, explique com cuidado a distância entre ideal e decisão prática.
4. Use as tensões fornecidas; não crie novas tensões fora dos dados.
5. Mostre a ferramenta como mapa de decisão, não como simples pontuação.

Retorne SOMENTE JSON válido, sem markdown, sem crases, sem comentário antes ou depois.

Estrutura obrigatória:
{
  "resumoExecutivo": "3 a 5 frases com leitura geral do mapa de valores",
  "leituraCentral": "2 a 4 parágrafos explicando o padrão dominante entre valores reconhecidos, priorizados e sob pressão",
  "hierarquiaDeValores": [
    {"posicao":1,"valor":"nome","base":"reconhecido/priorizado/sob pressão","leitura":"explicação prática"}
  ],
  "mapaDeCoerencia": {
    "score": 0,
    "leitura": "explicação sobre alinhamento entre o que a pessoa reconhece, escolhe e sustenta sob pressão",
    "pontosDeCoerencia": ["lista"],
    "pontosDeDesalinhamento": ["lista"]
  },
  "valoresSobPressao": [
    {"contexto":"contexto de pressão", "valorAcionado":"valor", "leitura":"como aparece", "cuidado":"ponto de atenção"}
  ],
  "tensoesInternas": [
    {"tensao":"nome da tensão fornecida pelo sistema", "severidade":"moderada ou alta", "leitura":"explicação baseada nos dados", "comoAparece":"como aparece em decisões reais", "acaoDeAlinhamento":"ação prática"}
  ],
  "sinergias": [
    {"sinergia":"nome da sinergia fornecida pelo sistema", "forca":"boa ou alta", "leitura":"explicação baseada nos dados", "comoPotencializar":"ação prática"}
  ],
  "impactoNasDecisoes": "Como esse mapa de valores tende a influenciar decisões importantes",
  "impactoNosRelacionamentos": "Como aparece em família, casamento, filhos, amizades ou vínculos importantes",
  "impactoNaProsperidade": "Como influencia dinheiro, expansão, segurança e construção material",
  "impactoNoProposito": "Como influencia sentido, espiritualidade, missão e legado",
  "planoDeAlinhamento30Dias": [
    {"semana":1,"foco":"foco","pratica":"prática concreta","indicador":"como perceber progresso"},
    {"semana":2,"foco":"foco","pratica":"prática concreta","indicador":"como perceber progresso"},
    {"semana":3,"foco":"foco","pratica":"prática concreta","indicador":"como perceber progresso"},
    {"semana":4,"foco":"foco","pratica":"prática concreta","indicador":"como perceber progresso"}
  ],
  "fraseFinal": "frase final forte, elegante, acolhedora e memorável"
}`;
}

function assertNarrativeShape(narrative) {
  const required = ['resumoExecutivo','leituraCentral','hierarquiaDeValores','mapaDeCoerencia','valoresSobPressao','tensoesInternas','sinergias','impactoNasDecisoes','impactoNosRelacionamentos','impactoNaProsperidade','impactoNoProposito','planoDeAlinhamento30Dias','fraseFinal'];
  for (const key of required) if (!(key in narrative)) throw new Error('Resposta da IA sem campo obrigatorio: ' + key);
  return narrative;
}

export async function generatePersonalValuesReport(assessmentId) {
  const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId }, include: { user: { select: { name: true } } } });
  if (!assessment) throw new Error('Assessment nao encontrado');
  if (!assessment.scoresRaw?.dimensions) throw new Error('Assessment sem scores de valores pessoais');
  if (!config.anthropicApiKey) throw new Error('ANTHROPIC_API_KEY nao configurada');

  const prompt = buildPrompt({ userName: assessment.user.name, scores: assessment.scoresRaw, adminNotes: assessment.adminNotes });
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': config.anthropicApiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 7000, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!response.ok) { const err = await response.text(); console.error('Anthropic API error:', err); throw new Error('Erro na API Anthropic: ' + response.status); }
  const data = await response.json();
  const rawText = data.content?.[0]?.text || '';
  let narrative;
  try { narrative = assertNarrativeShape(JSON.parse(rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())); }
  catch (e) { console.error('Failed to parse personal values AI response:', rawText.substring(0, 700)); throw new Error('Erro ao processar resposta da IA'); }
  const report = await prisma.report.create({ data: { assessmentId, narrative, promptUsed: prompt, modelUsed: 'claude-sonnet-4-20250514' } });
  await prisma.assessment.update({ where: { id: assessmentId }, data: { status: 'REPORT_GENERATED' } });
  return report;
}
