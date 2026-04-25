import { config } from '../config/index.js';
import { emotionalIntelligenceDimensions, emotionalIntelligenceSubareas } from '../data/inteligencia-emocional-questions.js';
import { prisma } from '../lib/prisma.js';

function buildPrompt({ userName, scores, adminNotes }) {
  return `Você é uma especialista em inteligência emocional, desenvolvimento humano, PNL aplicada ao autoconhecimento e análise comportamental para adultos.

IMPORTANTE:
- Esta ferramenta é de autoconhecimento e desenvolvimento, não diagnóstico psicológico.
- Não cite que é Bar-On, EQ-i ou qualquer instrumento proprietário.
- Use linguagem das 5 dimensões da inteligência emocional: autoconsciência, autorregulação, motivação, empatia e habilidades sociais.
- Seja específica usando subáreas operacionais como pressão de prazo, conflito, mudança, relações, autoconfiança, comunicação e tomada de decisão.
- Fale diretamente com a pessoa usando "você".
- Não use linguagem clínica, patológica ou determinista.

Nome da pessoa: ${userName}

Dimensões disponíveis:
${emotionalIntelligenceDimensions.map(d => `- ${d.id}: ${d.name} — ${d.description}`).join('\n')}

Subáreas disponíveis:
${Object.entries(emotionalIntelligenceSubareas).map(([id, s]) => `- ${id}: ${s.name} (${s.dimension})`).join('\n')}

Scores calculados deterministicamente pelo sistema:
${JSON.stringify(scores, null, 2)}

${adminNotes ? `Contexto adicional da mentora:\n${adminNotes}\n` : ''}

Retorne SOMENTE JSON válido, sem markdown, sem crases, sem comentário antes ou depois.

Estrutura obrigatória:
{
  "resumoExecutivo": "3 a 5 frases com leitura geral do perfil emocional",
  "leituraCentral": "2 a 4 parágrafos explicando o padrão dominante de funcionamento emocional",
  "dimensoes": {
    "autoconsciencia": {"titulo": "Autoconsciência", "analise": "2 a 3 parágrafos específicos", "forca": "frase curta", "pontoDeAtencao": "frase curta", "microAcao": "ação prática para 7 dias"},
    "autorregulacao": {"titulo": "Autorregulação", "analise": "2 a 3 parágrafos específicos", "forca": "frase curta", "pontoDeAtencao": "frase curta", "microAcao": "ação prática para 7 dias"},
    "motivacao": {"titulo": "Motivação", "analise": "2 a 3 parágrafos específicos", "forca": "frase curta", "pontoDeAtencao": "frase curta", "microAcao": "ação prática para 7 dias"},
    "empatia": {"titulo": "Empatia", "analise": "2 a 3 parágrafos específicos", "forca": "frase curta", "pontoDeAtencao": "frase curta", "microAcao": "ação prática para 7 dias"},
    "habilidades_sociais": {"titulo": "Habilidades Sociais", "analise": "2 a 3 parágrafos específicos", "forca": "frase curta", "pontoDeAtencao": "frase curta", "microAcao": "ação prática para 7 dias"}
  },
  "subareasCriticas": [
    {"subarea": "nome", "score": 0, "leitura": "explicação prática e específica", "riscoComportamental": "como isso aparece na vida real", "acao": "ação objetiva"}
  ],
  "subareasFortes": [
    {"subarea": "nome", "score": 0, "leitura": "explicação prática", "comoUsarMelhor": "orientação objetiva"}
  ],
  "padroesEmPressao": "Como a pessoa tende a funcionar sob pressão, prazo, crítica ou conflito",
  "impactoNosRelacionamentos": "Como esse perfil pode afetar conversas, vínculos, liderança e família",
  "planoDeDesenvolvimento30Dias": [
    {"semana": 1, "foco": "foco da semana", "pratica": "prática concreta", "indicador": "como perceber progresso"},
    {"semana": 2, "foco": "foco da semana", "pratica": "prática concreta", "indicador": "como perceber progresso"},
    {"semana": 3, "foco": "foco da semana", "pratica": "prática concreta", "indicador": "como perceber progresso"},
    {"semana": 4, "foco": "foco da semana", "pratica": "prática concreta", "indicador": "como perceber progresso"}
  ],
  "fraseFinal": "frase final forte, acolhedora e memorável"
}`;
}

function assertNarrativeShape(narrative) {
  const required = ['resumoExecutivo', 'leituraCentral', 'dimensoes', 'subareasCriticas', 'subareasFortes', 'padroesEmPressao', 'impactoNosRelacionamentos', 'planoDeDesenvolvimento30Dias', 'fraseFinal'];
  for (const key of required) {
    if (!(key in narrative)) throw new Error('Resposta da IA sem campo obrigatorio: ' + key);
  }
  return narrative;
}

export async function generateEmotionalIntelligenceReport(assessmentId) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: { user: { select: { name: true } } },
  });

  if (!assessment) throw new Error('Assessment nao encontrado');
  if (!assessment.scoresRaw?.dimensions) throw new Error('Assessment sem scores de inteligencia emocional');
  if (!config.anthropicApiKey) throw new Error('ANTHROPIC_API_KEY nao configurada');

  const prompt = buildPrompt({
    userName: assessment.user.name,
    scores: assessment.scoresRaw,
    adminNotes: assessment.adminNotes,
  });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.anthropicApiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 6000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Anthropic API error:', err);
    throw new Error('Erro na API Anthropic: ' + response.status);
  }

  const data = await response.json();
  const rawText = data.content?.[0]?.text || '';

  let narrative;
  try {
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    narrative = assertNarrativeShape(JSON.parse(cleaned));
  } catch (e) {
    console.error('Failed to parse emotional intelligence AI response:', rawText.substring(0, 700));
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

  return report;
}
