import puppeteer from 'puppeteer';

const discColors = { D: '#E63946', I: '#F4A261', S: '#2A9D8F', C: '#264653' };
const discNames = { D: 'Executor', I: 'Comunicador', S: 'Planejador', C: 'Analista' };
const ieDimensionColors = { autoconsciencia: '#E63946', autorregulacao: '#F4A261', motivacao: '#d4a853', empatia: '#2A9D8F', habilidades_sociais: '#4c6ef5' };
const valoresDimensionColors = { identidade: '#E63946', familia_relacionamentos: '#ec4899', crescimento: '#4c6ef5', contribuicao: '#2A9D8F', prosperidade: '#F4A261', espiritualidade_proposito: '#d4a853' };
const rodaAreaColors = { saude: '#E63946', intelectual: '#4c6ef5', emocional: '#7c3aed', proposito: '#F4A261', financas: '#059669', contribuicao: '#2A9D8F', familia: '#ec4899', relacionamento: '#f472b6', social: '#f59e0b', diversao: '#8b5cf6', plenitude: '#d4a853', espiritualidade: '#a78bfa' };
const rodaAreaLabels = { saude: 'Saúde e Disposição', intelectual: 'Desenvolvimento Intelectual', emocional: 'Equilíbrio Emocional', proposito: 'Realização e Propósito', financas: 'Recursos Financeiros', contribuicao: 'Contribuição Social', familia: 'Família', relacionamento: 'Relacionamento Amoroso', social: 'Vida Social', diversao: 'Criatividade e Diversão', plenitude: 'Plenitude e Felicidade', espiritualidade: 'Espiritualidade' };
const dimensionToProfileKey = { executor: 'D', comunicador: 'I', planejador: 'S', analista: 'C' };
const dimensionDisplayLabels = { executor: 'Executor', comunicador: 'Comunicador', planejador: 'Planejador', analista: 'Analista' };
const dimensionOrderList = ['executor', 'comunicador', 'planejador', 'analista'];

function esc(value) { return String(value ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c])); }
function paragraph(value) { return '<p class="text">' + esc(value) + '</p>'; }
function buildBars(items) { return items.map(item => { const score = Number(item.score || 0); const color = item.color || '#d4a853'; return '<div class="bar-row"><div class="bar-head"><span>' + esc(item.label) + '</span><strong style="color:' + color + '">' + score + '</strong></div><div class="bar-track"><div class="bar-fill" style="width:' + score + '%;background:' + color + '"></div></div></div>'; }).join(''); }

function buildDiscRadar(scores = {}) {
  const size = 300, center = size / 2, radius = 110, factors = ['D', 'I', 'S', 'C'];
  const angles = factors.map((_, i) => (Math.PI * 2 * i) / 4 - Math.PI / 2);
  const getPoint = (angle, value) => ({ x: center + Math.cos(angle) * (radius * value / 100), y: center + Math.sin(angle) * (radius * value / 100) });
  let svg = '<svg viewBox="0 0 ' + size + ' ' + size + '" xmlns="http://www.w3.org/2000/svg" width="300" height="300">';
  [25, 50, 75, 100].forEach(v => { const pts = factors.map((_, i) => { const p = getPoint(angles[i], v); return p.x + ',' + p.y; }).join(' '); svg += '<polygon points="' + pts + '" fill="none" stroke="#e5e7eb" stroke-width="1"/>'; });
  factors.forEach((_, i) => { const p = getPoint(angles[i], 100); svg += '<line x1="' + center + '" y1="' + center + '" x2="' + p.x + '" y2="' + p.y + '" stroke="#e5e7eb" stroke-width="1"/>'; });
  const dataPoints = factors.map((f, i) => getPoint(angles[i], scores[f] || 0));
  svg += '<polygon points="' + dataPoints.map(p => p.x + ',' + p.y).join(' ') + '" fill="rgba(212,168,83,0.18)" stroke="#d4a853" stroke-width="2.5"/>';
  factors.forEach((f, i) => { const p = dataPoints[i], lp = getPoint(angles[i], 125); svg += '<circle cx="' + p.x + '" cy="' + p.y + '" r="5" fill="' + discColors[f] + '"/>'; svg += '<text x="' + lp.x + '" y="' + lp.y + '" text-anchor="middle" dominant-baseline="middle" font-size="11" font-weight="700" fill="' + discColors[f] + '">' + discNames[f] + '</text>'; svg += '<text x="' + lp.x + '" y="' + (lp.y + 14) + '" text-anchor="middle" font-size="10" fill="#6b7280">' + (scores[f] || 0) + '%</text>'; });
  return svg + '</svg>';
}
function buildRodaBars(scores = {}) { return buildBars(Object.entries(scores).map(([id, score]) => ({ label: rodaAreaLabels[id] || id, score: Math.round(Number(score || 0) * 10), color: rodaAreaColors[id] || '#d4a853' }))); }
function buildIEBars(dimensions = {}) { return buildBars(Object.entries(dimensions).map(([id, d]) => ({ label: d.name || id, score: d.score || 0, color: ieDimensionColors[id] || '#d4a853' }))); }
function buildValoresBars(dimensions = {}) { return buildBars(Object.entries(dimensions).map(([id, d]) => ({ label: d.name || id, score: d.score || 0, color: valoresDimensionColors[id] || '#d4a853' }))); }
function baseHTML({ title, subtitle, userName, body, footer }) { return '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#111827;line-height:1.6;padding:40px;max-width:820px;margin:0 auto;}h1{font-size:26px;margin-bottom:4px;}h2{font-size:18px;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #e5e7eb;}h3{font-size:15px;margin-bottom:8px;}.header{text-align:center;margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid #e5e7eb;}.eyebrow{font-size:11px;text-transform:uppercase;letter-spacing:.15em;color:#9ca3af;margin-bottom:8px;font-weight:700;}.section{margin-bottom:30px;page-break-inside:avoid;}.text{font-size:13px;color:#374151;line-height:1.75;white-space:pre-line;}.label{font-size:11px;text-transform:uppercase;letter-spacing:.05em;font-weight:700;color:#6b7280;margin-bottom:4px;}.card{border:1px solid #e5e7eb;border-radius:12px;padding:14px 16px;margin-bottom:10px;background:#fff;}.bar-row{margin-bottom:12px;}.bar-head{display:flex;justify-content:space-between;margin-bottom:4px;font-size:12px;color:#374151;font-weight:700;}.bar-track{height:8px;background:#e5e7eb;border-radius:4px;overflow:hidden;}.bar-fill{height:100%;border-radius:4px;}.card-keep-together{page-break-inside:avoid;break-inside:avoid;}.footer{text-align:center;padding-top:24px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:11px;}</style></head><body><div class="header"><p class="eyebrow">' + esc(subtitle) + '</p><h1>' + esc(userName) + '</h1><p style="font-size:14px;color:#6b7280;">' + esc(title) + '</p></div>' + body + '<div class="footer">' + esc(footer) + '</div></body></html>'; }

function buildDiscHTML(payload) {
  const n = payload.report?.narrative || {};
  const isLegacyShape = !n.dimensoes || !n.planoDeDesenvolvimento30Dias;
  return isLegacyShape ? buildDiscLegacyHTML(payload) : buildDiscNewHTML(payload);
}

function buildDiscNewHTML({ report, scores, profilePrimary, profileSecondary, userName }) {
  const n = report.narrative || {};
  const semanasOrdenadas = [...n.planoDeDesenvolvimento30Dias].sort((a, b) => a.semana - b.semana);

  const dimensionCards = dimensionOrderList.map(key => {
    const dim = n.dimensoes[key];
    if (!dim) return '';
    const color = discColors[dimensionToProfileKey[key]];
    return '<div class="card card-keep-together" style="border-left:4px solid ' + color + ';">'
      + '<div style="margin-bottom:8px;"><strong style="color:' + color + ';font-size:14px;">' + esc(dimensionDisplayLabels[key]) + '</strong></div>'
      + '<p class="text">' + esc(dim.analise) + '</p>'
      + '<div style="display:flex;gap:8px;margin-top:10px;">'
      +   '<div style="flex:1;padding:8px 10px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;">'
      +     '<p style="font-size:9px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px;">Padrão Forte</p>'
      +     '<p style="font-size:11px;color:#374151;line-height:1.6;">' + esc(dim.padraoForte) + '</p>'
      +   '</div>'
      +   '<div style="flex:1;padding:8px 10px;background:#fffbeb;border:1px solid #fde68a;border-radius:6px;">'
      +     '<p style="font-size:9px;font-weight:700;color:#a16207;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px;">Ponto de Atenção</p>'
      +     '<p style="font-size:11px;color:#374151;line-height:1.6;">' + esc(dim.pontoDeAtencao) + '</p>'
      +   '</div>'
      + '</div>'
      + '<div style="margin-top:8px;padding:8px 10px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;">'
      +   '<p style="font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px;">Comportamento Típico</p>'
      +   '<p style="font-size:11px;color:#374151;line-height:1.6;">' + esc(dim.comportamentoTipico) + '</p>'
      + '</div>'
      + '</div>';
  }).join('');

  const semanasCards = semanasOrdenadas.map(w =>
    '<div class="card card-keep-together" style="border-left:3px solid #d4a853;">'
    + '<div style="margin-bottom:6px;">'
    +   '<span style="background:#d4a853;color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;">Semana ' + esc(w.semana) + '</span>'
    +   ' <strong style="font-size:13px;color:#111827;">' + esc(w.foco) + '</strong>'
    + '</div>'
    + '<p class="text" style="margin-bottom:4px;"><strong>Prática:</strong> ' + esc(w.pratica) + '</p>'
    + '<p class="text"><strong>Indicador:</strong> ' + esc(w.indicador) + '</p>'
    + '</div>'
  ).join('');

  const pontosFortesHtml = (n.pontosFortes || []).map(p =>
    '<div class="card"><strong>' + esc(p.titulo || p) + '</strong>'
    + (p.descricao ? '<p class="text">' + esc(p.descricao) + '</p>' : '')
    + '</div>'
  ).join('');

  const areasAtencaoHtml = (n.areasAtencao || []).map(a =>
    '<div class="card"><strong>' + esc(a.titulo || a) + '</strong>'
    + (a.descricao ? '<p class="text">' + esc(a.descricao) + '</p>' : '')
    + '</div>'
  ).join('');

  const body = '<div class="section" style="text-align:center;">' + buildDiscRadar(scores || {}) + '</div>'
    + '<div class="section"><h2>Resumo do Perfil</h2>' + paragraph(n.resumoExecutivo) + '</div>'
    + '<div class="section"><h2>Leitura Central</h2>' + paragraph(n.leituraCentral) + '</div>'
    + '<div class="section"><h2>Perfil por Dimensão</h2>' + dimensionCards + '</div>'
    + '<div class="section"><h2>Scores</h2>' + buildBars(['D','I','S','C'].map(f => ({ label: discNames[f], score: scores?.[f] || 0, color: discColors[f] }))) + '</div>'
    + '<div class="section"><h2>Pontos Fortes</h2>' + pontosFortesHtml + '</div>'
    + '<div class="section"><h2>Áreas de Atenção</h2>' + areasAtencaoHtml + '</div>'
    + '<div class="section"><h2>Padrões em Pressão</h2>' + paragraph(n.padroesEmPressao) + '</div>'
    + '<div class="section"><h2>Impacto nos Relacionamentos</h2>' + paragraph(n.impactoNosRelacionamentos) + '</div>'
    + '<div class="section"><h2>Plano de Desenvolvimento (30 dias)</h2>' + semanasCards + '</div>'
    + '<div class="section card-keep-together" style="text-align:center;padding:20px;background:linear-gradient(135deg,#fef3c7,#fff);border:1px solid #fde68a;border-radius:12px;">'
    +   '<p style="font-size:14px;font-style:italic;color:#374151;line-height:1.7;">&ldquo;' + esc(n.fraseFinal) + '&rdquo;</p>'
    + '</div>';

  return baseHTML({
    title: 'Perfil: ' + (discNames[profilePrimary] || profilePrimary) + ' / ' + (discNames[profileSecondary] || profileSecondary),
    subtitle: 'Análise Comportamental',
    userName,
    body,
    footer: 'Vanessa Rocha - Análise Comportamental | Gerado em ' + new Date(report.generatedAt).toLocaleDateString('pt-BR')
  });
}

function buildDiscLegacyHTML({ report, scores, profilePrimary, profileSecondary, userName }) {
  const n = report.narrative || {};
  const banner = '<div style="border-left:4px solid #d4a853;padding:10px 14px;margin-bottom:16px;background:#fef3c7;color:#92400e;font-size:12px;border-radius:6px;">'
    + 'Versão atualizada disponível mediante regeração.'
    + '</div>';
  const body = banner
    + '<div class="section" style="text-align:center;">' + buildDiscRadar(scores || {}) + '</div>'
    + '<div class="section"><h2>Resumo do Perfil</h2>' + paragraph(n.resumoExecutivo) + '</div>'
    + '<div class="section"><h2>Perfil Detalhado</h2>' + paragraph(n.perfilDetalhado?.descricao) + '</div>'
    + '<div class="section"><h2>Scores</h2>' + buildBars(['D','I','S','C'].map(f => ({ label: discNames[f], score: scores?.[f] || 0, color: discColors[f] }))) + '</div>'
    + '<div class="section"><h2>Pontos Fortes</h2>' + (n.pontosFortes || []).map(p => '<div class="card"><strong>' + esc(p.titulo || p) + '</strong>' + (p.descricao ? '<p class="text">' + esc(p.descricao) + '</p>' : '') + '</div>').join('') + '</div>'
    + '<div class="section"><h2>Áreas de Atenção</h2>' + (n.areasAtencao || []).map(a => '<div class="card"><strong>' + esc(a.titulo || a) + '</strong>' + (a.descricao ? '<p class="text">' + esc(a.descricao) + '</p>' : '') + '</div>').join('') + '</div>';
  return baseHTML({
    title: 'Perfil: ' + (discNames[profilePrimary] || profilePrimary) + ' / ' + (discNames[profileSecondary] || profileSecondary),
    subtitle: 'Análise Comportamental',
    userName,
    body,
    footer: 'Vanessa Rocha - Análise Comportamental | Gerado em ' + new Date(report.generatedAt).toLocaleDateString('pt-BR')
  });
}
function buildRodaHTML({ report, scoresRaw, userName }) { const n = report.narrative || {}; const scores = scoresRaw?.scores || {}; const body = '<div class="section"><h2>Scores por Área</h2>' + buildRodaBars(scores) + '</div>' + (n.resumoGeral ? '<div class="section"><h2>Visão Geral</h2>' + paragraph(n.resumoGeral) + '</div>' : '') + (n.areasAtencao ? '<div class="section"><h2>Áreas de Atenção</h2>' + n.areasAtencao.map(a => '<div class="card"><strong>' + esc(a.area) + ' — ' + esc(a.score) + '/10</strong><p class="text">' + esc(a.analise) + '</p></div>').join('') + '</div>' : '') + (n.reflexaoFinal ? '<div class="section"><h2>Reflexão Final</h2>' + paragraph(n.reflexaoFinal) + '</div>' : ''); return baseHTML({ title: 'Avaliação de Roda da Vida', subtitle: 'Roda da Vida', userName, body, footer: 'Vanessa Rocha - Roda da Vida | Gerado em ' + new Date(report.generatedAt).toLocaleDateString('pt-BR') }); }
function buildIEHTML({ report, scoresRaw, userName }) { const n = report.narrative || {}; const dimensions = scoresRaw?.dimensions || {}; const body = '<div class="section"><h2>Score Geral</h2><div class="card" style="text-align:center;"><p style="font-size:42px;font-weight:800;color:#d4a853;">' + esc(scoresRaw?.overall?.score) + '</p><p class="label">Score geral</p></div>' + buildIEBars(dimensions) + '</div>' + (n.resumoExecutivo ? '<div class="section"><h2>Resumo Executivo</h2>' + paragraph(n.resumoExecutivo) + '</div>' : '') + (n.leituraCentral ? '<div class="section"><h2>Leitura Central</h2>' + paragraph(n.leituraCentral) + '</div>' : '') + (n.dimensoes ? '<div class="section"><h2>Análise por Dimensão</h2>' + Object.entries(n.dimensoes).map(([id, d]) => '<div class="card"><strong style="color:' + (ieDimensionColors[id] || '#d4a853') + '">' + esc(d.titulo || dimensions[id]?.name || id) + ' — ' + esc(dimensions[id]?.score || '') + '/100</strong><p class="text">' + esc(d.analise) + '</p></div>').join('') + '</div>' : ''); return baseHTML({ title: 'Relatório IE-5', subtitle: 'Inteligência Emocional', userName, body, footer: 'Vanessa Rocha - Inteligência Emocional | Gerado em ' + new Date(report.generatedAt).toLocaleDateString('pt-BR') }); }
function buildValoresHTML({ report, scoresRaw, userName }) { const n = report.narrative || {}; const dimensions = scoresRaw?.dimensions || {}; const body = '<div class="section"><h2>Score Geral</h2><div class="card" style="text-align:center;"><p style="font-size:42px;font-weight:800;color:#d4a853;">' + esc(scoresRaw?.overall?.score) + '</p><p class="label">Score geral</p></div>' + buildValoresBars(dimensions) + '</div>' + (n.resumoExecutivo ? '<div class="section"><h2>Resumo Executivo</h2>' + paragraph(n.resumoExecutivo) + '</div>' : '') + (n.leituraCentral ? '<div class="section"><h2>Leitura Central</h2>' + paragraph(n.leituraCentral) + '</div>' : '') + (n.valoresDominantes ? '<div class="section"><h2>Valores Dominantes</h2>' + n.valoresDominantes.map(i => '<div class="card"><strong>' + esc(i.valor) + ' — ' + esc(i.score) + '</strong><p class="text">' + esc(i.leitura) + '</p><p class="text"><strong>Como usar melhor:</strong> ' + esc(i.comoUsarMelhor) + '</p></div>').join('') + '</div>' : '') + (n.valoresQuePedemAtencao ? '<div class="section"><h2>Valores que Pedem Atenção</h2>' + n.valoresQuePedemAtencao.map(i => '<div class="card"><strong>' + esc(i.valor) + ' — ' + esc(i.score) + '</strong><p class="text">' + esc(i.leitura) + '</p><p class="text"><strong>Ação:</strong> ' + esc(i.acao) + '</p></div>').join('') + '</div>' : '') + (n.tensoesInternas ? '<div class="section"><h2>Tensões Internas</h2>' + n.tensoesInternas.map(i => '<div class="card"><strong>' + esc(i.tensao) + ' — ' + esc(i.severidade) + '</strong><p class="text">' + esc(i.leitura) + '</p><p class="text"><strong>Ação:</strong> ' + esc(i.acaoDeAlinhamento) + '</p></div>').join('') + '</div>' : '') + (n.sinergias ? '<div class="section"><h2>Sinergias</h2>' + n.sinergias.map(i => '<div class="card"><strong>' + esc(i.sinergia) + ' — ' + esc(i.forca) + '</strong><p class="text">' + esc(i.leitura) + '</p></div>').join('') + '</div>' : '') + (n.impactoNasDecisoes ? '<div class="section"><h2>Impacto nas Decisões</h2>' + paragraph(n.impactoNasDecisoes) + '</div>' : '') + (n.impactoNosRelacionamentos ? '<div class="section"><h2>Impacto nos Relacionamentos</h2>' + paragraph(n.impactoNosRelacionamentos) + '</div>' : '') + (n.impactoNaProsperidade ? '<div class="section"><h2>Impacto na Prosperidade</h2>' + paragraph(n.impactoNaProsperidade) + '</div>' : '') + (n.impactoNoProposito ? '<div class="section"><h2>Impacto no Propósito</h2>' + paragraph(n.impactoNoProposito) + '</div>' : '') + (n.fraseFinal ? '<div class="section"><h2>Frase Final</h2>' + paragraph(n.fraseFinal) + '</div>' : ''); return baseHTML({ title: 'Relatório VP-6', subtitle: 'Valores Pessoais', userName, body, footer: 'Vanessa Rocha - Valores Pessoais | Gerado em ' + new Date(report.generatedAt).toLocaleDateString('pt-BR') }); }
function buildHTML(payload) { if (payload.toolSlug === 'roda-da-vida') return buildRodaHTML(payload); if (payload.toolSlug === 'inteligencia-emocional') return buildIEHTML(payload); if (payload.toolSlug === 'valores-pessoais') return buildValoresHTML(payload); return buildDiscHTML(payload); }
export async function generatePDF(...args) { const payload = args.length === 1 && typeof args[0] === 'object' ? args[0] : { report: args[0], scores: args[1], profilePrimary: args[2], profileSecondary: args[3], userName: args[4], toolSlug: 'disc' }; const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] }); const page = await browser.newPage(); await page.setContent(buildHTML(payload), { waitUntil: 'networkidle0' }); const pdfBuffer = await page.pdf({ format: 'A4', margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' }, printBackground: true }); await browser.close(); return pdfBuffer; }
