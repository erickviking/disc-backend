import { PrismaClient } from '@prisma/client';
import { config } from '../config/index.js';
import { profileLabels } from '../data/disc-profiles.js';

const prisma = new PrismaClient();

export async function generateReport(assessmentId) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: { user: { select: { name: true } } },
  });

  if (!assessment) throw new Error('Assessment nao encontrado');
  if (!assessment.scoresRaw?.normalized) throw new Error('Assessment sem scores');

  const scores = assessment.scoresRaw.normalized;
  const raw = assessment.scoresRaw.raw;

  // Buscar template do prompt
  const template = await prisma.promptTemplate.findUnique({
    where: { name: 'disc_analysis_default' },
  });

  const profilePLabel = profileLabels[assessment.profilePrimary]?.name || assessment.profilePrimary;
  const profileSLabel = profileLabels[assessment.profileSecondary]?.name || assessment.profileSecondary;

  const prompt = `Voce e um especialista em analise comportamental DISC com ampla experiencia em coaching, desenvolvimento humano e mentoria profissional. Voce trabalha com a mentora Vanessa Rocha.

Os perfis DISC sao nomeados assim:
- D = Executor (focado em resultados, decisivo, direto)
- I = Comunicador (sociavel, entusiasmado, persuasivo)
- S = Planejador (estavel, paciente, colaborativo)
- C = Analista (preciso, analitico, criterioso)

## Dados do Avaliado
- Nome: ${assessment.user.name}
- Perfil Primario: ${profilePLabel} (${assessment.profilePrimary})
- Perfil Secundario: ${profileSLabel} (${assessment.profileSecondary})
- Scores normalizados: Executor=${scores.D}%, Comunicador=${scores.I}%, Planejador=${scores.S}%, Analista=${scores.C}%
- Scores brutos: D=${raw.D}, I=${raw.I}, S=${raw.S}, C=${raw.C}

${assessment.adminNotes ? '## Contexto adicional do coach\n' + assessment.adminNotes : ''}

## Instrucoes
Gere uma analise comportamental completa e personalizada. Retorne SOMENTE um JSON valido (sem markdown, sem backticks) com esta estrutura:

{
  "resumoExecutivo": "Paragrafo de 3-4 frases resumindo o perfil geral de forma acolhedora e precisa",
  "perfilDetalhado": {
    "descricao": "Descricao detalhada de 2-3 paragrafos do perfil comportamental, considerando a combinacao dos fatores",
    "palavrasChave": ["5-8 palavras que definem este perfil"]
  },
  "pontosFortes": [
    {"titulo": "Nome do ponto forte", "descricao": "Explicacao pratica de 1-2 frases"}
  ],
  "areasAtencao": [
    {"titulo": "Nome da area", "descricao": "Explicacao construtiva de 1-2 frases"}
  ],
  "estiloComunicacao": {
    "comoSeExprime": "Como essa pessoa tende a se comunicar (2-3 frases)",
    "comoPrefereceber": "Como prefere receber informacoes (2-3 frases)",
    "dicasParaOutros": "Dicas para quem se comunica com esse perfil (2-3 frases)"
  },
  "ambiente": {
    "idealDeTrabalho": "Descricao do ambiente ideal (2-3 frases)",
    "fatoresEstresse": "O que causa estresse nesse perfil (2-3 frases)",
    "comoLidaComMudancas": "Como reage a mudancas (1-2 frases)"
  },
  "lideranca": {
    "estilo": "Estilo de lideranca natural (2-3 frases)",
    "comoMotiva": "Como motiva outras pessoas (1-2 frases)"
  },
  "desenvolvimento": {
    "recomendacoes": ["3-5 recomendacoes especificas de desenvolvimento"],
    "acoesPraticas": ["3 acoes praticas que pode implementar imediatamente"]
  }
}

REGRAS IMPORTANTES:
- Use linguagem acolhedora, construtiva e profissional
- DISC e ferramenta comportamental, NAO faca diagnosticos psicologicos
- Seja especifico e pratico, evite generalidades
- Considere a COMBINACAO dos fatores, nao cada score isoladamente
- Fale diretamente com a pessoa usando "voce"
- Gere exatamente 5 pontos fortes e 3-4 areas de atencao
- Retorne SOMENTE o JSON, sem nenhum texto antes ou depois`;

  if (!config.anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY nao configurada no .env');
  }

  console.log('Gerando relatorio para assessment:', assessmentId);

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

  // Parse JSON (remove possíveis backticks)
  let narrative;
  try {
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    narrative = JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse AI response:', rawText.substring(0, 500));
    throw new Error('Erro ao processar resposta da IA');
  }

  // Salvar relatório
  const report = await prisma.report.create({
    data: {
      assessmentId,
      narrative,
      promptUsed: prompt,
      modelUsed: 'claude-sonnet-4-20250514',
    },
  });

  // Atualizar status do assessment
  await prisma.assessment.update({
    where: { id: assessmentId },
    data: { status: 'REPORT_GENERATED' },
  });

  console.log('Relatorio gerado:', report.id);
  return report;
}
