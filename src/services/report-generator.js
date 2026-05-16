import { config } from '../config/index.js';
import { profileLabels } from '../data/disc-profiles.js';
import { prisma } from '../lib/prisma.js';

const VALID_DISC = ['D', 'I', 'S', 'C'];
const REQUIRED_DIMENSIONS = ['executor', 'comunicador', 'planejador', 'analista'];
const DIMENSION_FIELDS = ['analise', 'padraoForte', 'pontoDeAtencao', 'comportamentoTipico'];

function isNonEmptyString(v) { return typeof v === 'string' && v.trim().length > 0; }

function validateDiscNarrative(n) {
  if (!n || typeof n !== 'object') return 'narrative ausente ou nao-objeto';
  if (!VALID_DISC.includes(n.perfilPrimario)) return 'perfilPrimario invalido';
  if (!VALID_DISC.includes(n.perfilSecundario)) return 'perfilSecundario invalido';
  if (!isNonEmptyString(n.resumoExecutivo)) return 'resumoExecutivo ausente/vazio';
  if (!isNonEmptyString(n.leituraCentral)) return 'leituraCentral ausente/vazio';

  if (!n.dimensoes || typeof n.dimensoes !== 'object') return 'dimensoes ausente';
  const dimKeys = Object.keys(n.dimensoes);
  if (dimKeys.length !== 4) return 'dimensoes precisa ter exatamente 4 chaves (tem ' + dimKeys.length + ')';
  for (const d of REQUIRED_DIMENSIONS) {
    if (!n.dimensoes[d]) return 'dimensao "' + d + '" ausente';
    for (const f of DIMENSION_FIELDS) {
      if (!isNonEmptyString(n.dimensoes[d][f])) return 'dimensoes.' + d + '.' + f + ' ausente/vazio';
    }
  }

  if (!Array.isArray(n.pontosFortes) || n.pontosFortes.length < 3) return 'pontosFortes deve ser array com >=3 itens';
  for (let i = 0; i < n.pontosFortes.length; i++) {
    const p = n.pontosFortes[i];
    if (!isNonEmptyString(p?.titulo) || !isNonEmptyString(p?.descricao)) return 'pontosFortes[' + i + '] sem titulo/descricao';
  }
  if (!Array.isArray(n.areasAtencao) || n.areasAtencao.length < 3) return 'areasAtencao deve ser array com >=3 itens';
  for (let i = 0; i < n.areasAtencao.length; i++) {
    const a = n.areasAtencao[i];
    if (!isNonEmptyString(a?.titulo) || !isNonEmptyString(a?.descricao)) return 'areasAtencao[' + i + '] sem titulo/descricao';
  }

  if (!isNonEmptyString(n.padroesEmPressao)) return 'padroesEmPressao ausente/vazio';
  if (!isNonEmptyString(n.impactoNosRelacionamentos)) return 'impactoNosRelacionamentos ausente/vazio';

  if (!Array.isArray(n.planoDeDesenvolvimento30Dias) || n.planoDeDesenvolvimento30Dias.length !== 4) {
    return 'planoDeDesenvolvimento30Dias deve ter exatamente 4 itens';
  }
  const semanas = n.planoDeDesenvolvimento30Dias.map(w => w?.semana).sort();
  if (JSON.stringify(semanas) !== '[1,2,3,4]') return 'planoDeDesenvolvimento30Dias precisa cobrir semanas 1-4';
  for (let i = 0; i < 4; i++) {
    const w = n.planoDeDesenvolvimento30Dias[i];
    if (!isNonEmptyString(w?.foco)) return 'planoDeDesenvolvimento30Dias[' + i + '].foco ausente';
    if (!isNonEmptyString(w?.pratica)) return 'planoDeDesenvolvimento30Dias[' + i + '].pratica ausente';
    if (!isNonEmptyString(w?.indicador)) return 'planoDeDesenvolvimento30Dias[' + i + '].indicador ausente';
  }

  if (!isNonEmptyString(n.fraseFinal)) return 'fraseFinal ausente/vazio';
  return null;
}

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

  const prompt = `Você é especialista em análise comportamental DISC. Trabalhe com tom TÉCNICO, OBJETIVO e COMPORTAMENTAL — sem psicologismo, sem warmth forçada, sem afirmações afetivas genéricas.

LINGUAGEM:
- USE: "Perfil indica padrão decisório orientado a dados", "Padrão observado: priorização de precisão sobre velocidade", "Em ambientes de pressão, perfis Executores tendem a..."
- NÃO USE: "Você é uma pessoa especial", "Sua jornada de autoconhecimento", "Cuide-se, você merece"

PERFIS DISC:
- D = Executor (foco em resultado, decisão rápida, direto)
- I = Comunicador (sociável, persuasivo, expressivo)
- S = Planejador (estável, paciente, colaborativo)
- C = Analista (preciso, analítico, criterioso)

DADOS DO AVALIADO:
- Nome: ${assessment.user.name}
- Perfil Primário: ${profilePLabel} (${assessment.profilePrimary})
- Perfil Secundário: ${profileSLabel} (${assessment.profileSecondary})
- Scores normalizados: D=${scores.D}%, I=${scores.I}%, S=${scores.S}%, C=${scores.C}%
- Scores brutos: D=${raw.D}, I=${raw.I}, S=${raw.S}, C=${raw.C}

${assessment.adminNotes ? '## Contexto adicional do coach\n' + assessment.adminNotes : ''}

INSTRUÇÕES:
Gere análise comportamental técnica e detalhada. Retorne SOMENTE JSON válido (sem markdown, sem backticks) com esta estrutura EXATA:

{
  "perfilPrimario": "D|I|S|C",
  "perfilSecundario": "D|I|S|C",
  "resumoExecutivo": "3-5 frases técnicas resumindo o perfil. Comece sempre com 'Perfil [Nome]/[Nome] indica...' ou 'Padrão observado:'",
  "leituraCentral": "2-3 parágrafos analíticos sobre o perfil dominante e como a combinação primário/secundário se manifesta comportamentalmente",
  "dimensoes": {
    "executor": {
      "analise": "2-3 parágrafos específicos sobre como esta dimensão se manifesta neste perfil",
      "padraoForte": "frase curta sobre força comportamental nesta dimensão",
      "pontoDeAtencao": "frase curta sobre risco/limitação nesta dimensão",
      "comportamentoTipico": "como esta dimensão se manifesta em situações cotidianas"
    },
    "comunicador": { "analise": "...", "padraoForte": "...", "pontoDeAtencao": "...", "comportamentoTipico": "..." },
    "planejador": { "analise": "...", "padraoForte": "...", "pontoDeAtencao": "...", "comportamentoTipico": "..." },
    "analista": { "analise": "...", "padraoForte": "...", "pontoDeAtencao": "...", "comportamentoTipico": "..." }
  },
  "pontosFortes": [
    {"titulo": "Nome do ponto forte", "descricao": "Explicação técnica de 1-2 frases"}
  ],
  "areasAtencao": [
    {"titulo": "Nome da área", "descricao": "Explicação construtiva de 1-2 frases"}
  ],
  "padroesEmPressao": "1-2 parágrafos analíticos sobre como este perfil reage sob pressão, prazo, crítica, conflito. Use linguagem comportamental, não psicológica.",
  "impactoNosRelacionamentos": "1-2 parágrafos sobre como este perfil afeta dinâmicas profissionais, lideranças, conversas difíceis, trabalho em equipe.",
  "planoDeDesenvolvimento30Dias": [
    {"semana": 1, "foco": "área de foco da semana", "pratica": "prática concreta", "indicador": "como medir progresso"},
    {"semana": 2, "foco": "...", "pratica": "...", "indicador": "..."},
    {"semana": 3, "foco": "...", "pratica": "...", "indicador": "..."},
    {"semana": 4, "foco": "...", "pratica": "...", "indicador": "..."}
  ],
  "fraseFinal": "aforismo memorável, técnico, não afetivo. Algo como: 'Padrões comportamentais não são prisão — são ponto de partida para escolhas conscientes.'"
}

REGRAS:
- Análises por dimensão devem ser DIFERENTES para cada uma (não copiar texto entre executor/comunicador/planejador/analista)
- Gere EXATAMENTE 5 pontos fortes e 4 áreas de atenção
- Mantenha tom técnico em todos os campos
- Considere a COMBINAÇÃO primário+secundário, não cada score isoladamente
- DISC é ferramenta comportamental — NÃO faça diagnóstico psicológico
- Retorne SOMENTE o JSON, sem texto antes ou depois`;

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
      max_tokens: 8000,
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

  // Validação de shape (aborta antes de salvar Report)
  const validationError = validateDiscNarrative(narrative);
  if (validationError) {
    console.error('Validação de shape falhou:', validationError, narrative);
    const err = new Error('A IA retornou um relatório incompleto e não pôde ser salvo (faltou: ' + validationError + '). Clique novamente em Regerar para tentar de novo.');
    err.statusCode = 422;
    throw err;
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
