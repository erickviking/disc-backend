import puppeteer from 'puppeteer';
import { profileLabels } from '../data/disc-profiles.js';

const profileColors = { D: '#E63946', I: '#F4A261', S: '#2A9D8F', C: '#264653' };
const profileNames = { D: 'Executor', I: 'Comunicador', S: 'Planejador', C: 'Analista' };

function buildHTML(report, scores, profilePrimary, profileSecondary, userName) {
  const n = report.narrative;
  const date = new Date(report.generatedAt).toLocaleDateString('pt-BR');

  const radarSVG = buildRadarSVG(scores);

  const pontosFortes = (n.pontosFortes || []).map(p => {
    const titulo = p.titulo || p;
    const desc = p.descricao ? '<p style="color:#4b5563;font-size:12px;margin:4px 0 0 0;">' + p.descricao + '</p>' : '';
    return '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;margin-bottom:8px;"><p style="font-weight:600;color:#111827;font-size:13px;margin:0;">' + titulo + '</p>' + desc + '</div>';
  }).join('');

  const areasAtencao = (n.areasAtencao || []).map(a => {
    const titulo = a.titulo || a;
    const desc = a.descricao ? '<p style="color:#4b5563;font-size:12px;margin:4px 0 0 0;">' + a.descricao + '</p>' : '';
    return '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin-bottom:8px;"><p style="font-weight:600;color:#111827;font-size:13px;margin:0;">' + titulo + '</p>' + desc + '</div>';
  }).join('');

  const recomendacoes = (n.desenvolvimento?.recomendacoes || []).map(r =>
    '<li style="margin-bottom:6px;color:#374151;font-size:13px;">' + r + '</li>'
  ).join('');

  const acoesPraticas = (n.desenvolvimento?.acoesPraticas || []).map((a, i) =>
    '<li style="margin-bottom:6px;color:#374151;font-size:13px;"><strong style="color:#059669;">' + (i+1) + '.</strong> ' + a + '</li>'
  ).join('');

  const scoreBars = ['D','I','S','C'].map(f =>
    '<div style="margin-bottom:12px;"><div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span style="font-size:12px;color:#4b5563;">' + profileNames[f] + '</span><span style="font-size:12px;font-weight:600;">' + scores[f] + '%</span></div><div style="height:8px;background:#e5e7eb;border-radius:4px;"><div style="height:100%;width:' + scores[f] + '%;background:' + profileColors[f] + ';border-radius:4px;"></div></div></div>'
  ).join('');

  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#111827;line-height:1.6;padding:40px;max-width:800px;margin:0 auto;}h1{font-size:24px;margin-bottom:4px;}h2{font-size:18px;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #e5e7eb;}h3{font-size:15px;margin-bottom:8px;}.section{margin-bottom:32px;}.label{font-size:11px;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;color:#6b7280;margin-bottom:4px;}.text{font-size:13px;color:#374151;line-height:1.7;}.tag{display:inline-block;background:#eff6ff;color:#3b82f6;font-size:11px;padding:4px 12px;border-radius:999px;margin:2px 4px 2px 0;font-weight:500;}</style></head><body>'
  + '<div style="text-align:center;margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid #e5e7eb;">'
  + '<p style="font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#9ca3af;margin-bottom:8px;">Analise Comportamental</p>'
  + '<h1>' + userName + '</h1>'
  + '<p style="font-size:14px;color:#6b7280;">Perfil: <span style="color:' + profileColors[profilePrimary] + ';font-weight:700;">' + profileNames[profilePrimary] + '</span> / <span style="color:' + profileColors[profileSecondary] + ';font-weight:700;">' + profileNames[profileSecondary] + '</span></p>'
  + '<div style="margin:24px auto;max-width:300px;">' + radarSVG + '</div>'
  + '</div>'

  + '<div class="section"><h2>Resumo do Perfil</h2><p class="text">' + (n.resumoExecutivo || '') + '</p></div>'

  + '<div class="section"><h2>Perfil Detalhado</h2><p class="text" style="white-space:pre-line;">' + (n.perfilDetalhado?.descricao || '') + '</p>'
  + (n.perfilDetalhado?.palavrasChave ? '<div style="margin-top:12px;">' + n.perfilDetalhado.palavrasChave.map(p => '<span class="tag">' + p + '</span>').join('') + '</div>' : '')
  + '</div>'

  + '<div class="section"><h2>Scores</h2>' + scoreBars + '</div>'

  + '<div class="section"><h2>Pontos Fortes</h2>' + pontosFortes + '</div>'
  + '<div class="section"><h2>Areas de Atencao</h2>' + areasAtencao + '</div>'

  + (n.estiloComunicacao ? '<div class="section"><h2>Estilo de Comunicacao</h2>'
    + '<div style="margin-bottom:12px;"><p class="label">Como se expressa</p><p class="text">' + (n.estiloComunicacao.comoSeExprime || '') + '</p></div>'
    + '<div style="margin-bottom:12px;"><p class="label">Como prefere receber informacoes</p><p class="text">' + (n.estiloComunicacao.comoPrefereceber || '') + '</p></div>'
    + (n.estiloComunicacao.dicasParaOutros ? '<div><p class="label">Dicas para quem convive</p><p class="text">' + n.estiloComunicacao.dicasParaOutros + '</p></div>' : '')
    + '</div>' : '')

  + (n.ambiente ? '<div class="section"><h2>Ambiente e Trabalho</h2>'
    + '<div style="margin-bottom:12px;"><p class="label">Ambiente ideal</p><p class="text">' + (n.ambiente.idealDeTrabalho || '') + '</p></div>'
    + '<div style="margin-bottom:12px;"><p class="label">Fatores de estresse</p><p class="text">' + (n.ambiente.fatoresEstresse || '') + '</p></div>'
    + (n.ambiente.comoLidaComMudancas ? '<div><p class="label">Relacao com mudancas</p><p class="text">' + n.ambiente.comoLidaComMudancas + '</p></div>' : '')
    + '</div>' : '')

  + (n.lideranca ? '<div class="section"><h2>Lideranca</h2>'
    + '<div style="margin-bottom:12px;"><p class="label">Estilo</p><p class="text">' + (n.lideranca.estilo || '') + '</p></div>'
    + (n.lideranca.comoMotiva ? '<div><p class="label">Como motiva outros</p><p class="text">' + n.lideranca.comoMotiva + '</p></div>' : '')
    + '</div>' : '')

  + (n.desenvolvimento ? '<div class="section"><h2>Desenvolvimento</h2>'
    + (recomendacoes ? '<p class="label">Recomendacoes</p><ul style="margin:8px 0 16px 16px;">' + recomendacoes + '</ul>' : '')
    + (acoesPraticas ? '<p class="label">Acoes praticas</p><ul style="margin:8px 0 0 16px;list-style:none;">' + acoesPraticas + '</ul>' : '')
    + '</div>' : '')

  + '<div style="text-align:center;padding-top:24px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:11px;"><p>Vanessa Rocha - Analise Comportamental</p><p>Gerado em ' + date + '</p></div>'
  + '</body></html>';
}

function buildRadarSVG(scores) {
  const size = 300;
  const center = size / 2;
  const radius = 110;
  const factors = ['D', 'I', 'S', 'C'];
  const angles = factors.map((_, i) => (Math.PI * 2 * i) / 4 - Math.PI / 2);
  const getPoint = (angle, value) => ({
    x: center + Math.cos(angle) * (radius * value / 100),
    y: center + Math.sin(angle) * (radius * value / 100),
  });

  let svg = '<svg viewBox="0 0 ' + size + ' ' + size + '" xmlns="http://www.w3.org/2000/svg" width="300" height="300">';

  // Grid
  [25, 50, 75, 100].forEach(v => {
    const pts = factors.map((_, i) => { const p = getPoint(angles[i], v); return p.x+','+p.y; }).join(' ');
    svg += '<polygon points="' + pts + '" fill="none" stroke="#e5e7eb" stroke-width="1"/>';
  });

  // Axes
  factors.forEach((_, i) => {
    const p = getPoint(angles[i], 100);
    svg += '<line x1="' + center + '" y1="' + center + '" x2="' + p.x + '" y2="' + p.y + '" stroke="#e5e7eb" stroke-width="1"/>';
  });

  // Data
  const dataPoints = factors.map((f, i) => getPoint(angles[i], scores[f]));
  const polygon = dataPoints.map(p => p.x+','+p.y).join(' ');
  svg += '<polygon points="' + polygon + '" fill="rgba(76,110,245,0.15)" stroke="#4c6ef5" stroke-width="2.5"/>';

  // Points + labels
  factors.forEach((f, i) => {
    const p = dataPoints[i];
    const lp = getPoint(angles[i], 125);
    svg += '<circle cx="' + p.x + '" cy="' + p.y + '" r="5" fill="' + profileColors[f] + '"/>';
    svg += '<text x="' + lp.x + '" y="' + lp.y + '" text-anchor="middle" dominant-baseline="middle" font-size="11" font-weight="700" fill="' + profileColors[f] + '">' + profileNames[f] + '</text>';
    svg += '<text x="' + lp.x + '" y="' + (lp.y + 14) + '" text-anchor="middle" font-size="10" fill="#6b7280">' + scores[f] + '%</text>';
  });

  svg += '</svg>';
  return svg;
}

export async function generatePDF(report, scores, profilePrimary, profileSecondary, userName) {
  const html = buildHTML(report, scores, profilePrimary, profileSecondary, userName);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    printBackground: true,
  });

  await browser.close();
  return pdfBuffer;
}
