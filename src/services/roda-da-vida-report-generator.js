import { PrismaClient } from '@prisma/client';
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
    .map(([k, v]) => `- ${areaNames[k] || k}: ${v}/10`)
    .join('\n');

  const prompt = `Você é uma especialista em desenvolvimento pessoal e coaching de alta performance. Você trabalha com a mentora Vanessa Rocha em uma plataforma de autoconhecimento.

## Ferramenta: Roda da Vida
A Roda da Vida é uma ferramenta clássica de coaching que avalia 12 áreas fundamentais da vida numa escala de 1 a 10. O objetivo é identificar desequilíbrios e criar um plano de ação para uma vida mais plena.

## Dados do Avaliado
- Nome: ${assessment.user.name}
- Média geral: ${average}/10
- Desvio padrão: ${stdDev} (${balanced ? 'relativamente equilibrado' : 'desequilíbrio significativo'})
- Área mais forte: ${areaNames[highest.area]} (${highest.score}/10)
- Área que mais precisa de atenção: ${areaNames[lowest.area]} (${lowest.score}/10)

## Scores por área
${scoresFormatted}

${assessment.adminNotes ? '## Contexto adicional do coach\n' + assessment.adminNotes : ''}

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
- Retorne SOMENTE o JSON, sem nenhum texto antes ou depois`;

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
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
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
