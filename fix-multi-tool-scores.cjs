/**
 * Fix dois crashes:
 * 1. AdminAssessmentsPage: proteger scores DISC contra dados da Roda da Vida
 * 2. Backend /report endpoint: retornar scoresRaw inteiro (não só .normalized)
 * 
 * Execução (2 repos):
 *   cd C:\disc-system\frontend && node fix-multi-tool-scores.cjs
 *   cd C:\disc-system\backend && node fix-multi-tool-scores.cjs
 */

const fs = require('fs');
const path = require('path');

// Detectar se estamos no frontend ou backend
const isFrontend = fs.existsSync(path.join(__dirname, 'src', 'pages'));
const isBackend = fs.existsSync(path.join(__dirname, 'src', 'routes'));

if (isFrontend) {
  console.log('=== FRONTEND ===\n');

  // 1. Fix AdminAssessmentsPage — proteger contra scores não-DISC
  const adminPath = path.join(__dirname, 'src', 'pages', 'AdminAssessmentsPage.jsx');
  let admin = fs.readFileSync(adminPath, 'utf-8');
  fs.copyFileSync(adminPath, adminPath + '.bak-' + Date.now());

  // Substituir: const scores = a.scoresRaw?.normalized;
  // Por: detecção de tipo de scores
  const oldScores = "const scores = a.scoresRaw?.normalized;";
  const newScores = "const scores = a.scoresRaw?.normalized;\n          const isDisc = scores?.D !== undefined;";

  if (admin.includes(oldScores)) {
    admin = admin.replace(oldScores, newScores);
    console.log('✓ Adicionado flag isDisc');
  }

  // Proteger o bloco de scores no header do assessment
  const oldScoreBlock = "{scores&&<div className=\"flex gap-2\">{['D','I','S','C'].map(f=>(<div key={f} className=\"text-center\">";
  const newScoreBlock = "{scores&&isDisc&&<div className=\"flex gap-2\">{['D','I','S','C'].map(f=>(<div key={f} className=\"text-center\">";

  if (admin.includes(oldScoreBlock)) {
    admin = admin.replace(oldScoreBlock, newScoreBlock);
    console.log('✓ Protegido scores header (isDisc guard)');
  }

  // Proteger o bloco expandido de scores
  const oldExpanded = "{scores&&(<div className=\"mb-5\"><h4 className=\"text-sm font-semibold text-on-surface mb-3\">Perfil Comportamental</h4>";
  const newExpanded = "{scores&&isDisc&&(<div className=\"mb-5\"><h4 className=\"text-sm font-semibold text-on-surface mb-3\">Perfil Comportamental</h4>";

  if (admin.includes(oldExpanded)) {
    admin = admin.replace(oldExpanded, newExpanded);
    console.log('✓ Protegido scores expandido (isDisc guard)');
  }

  fs.writeFileSync(adminPath, admin);

  // 2. Fix RodaDaVidaReportPage — aceitar scores do scoresRaw completo
  const reportPath = path.join(__dirname, 'src', 'pages', 'RodaDaVidaReportPage.jsx');
  let report = fs.readFileSync(reportPath, 'utf-8');
  fs.copyFileSync(reportPath, reportPath + '.bak-' + Date.now());

  // O endpoint retorna scores: assessment.scoresRaw?.normalized
  // Para Roda da Vida, normalized é undefined, então scores é undefined
  // Preciso que a page aceite scoresRaw direto também
  const oldDataDestruct = "const { report, scores, userName } = data;";
  const newDataDestruct = "const { report, scores: rawScores, scoresRaw, userName } = data;\n  const scores = rawScores || scoresRaw?.scores || {};";

  if (report.includes(oldDataDestruct)) {
    report = report.replace(oldDataDestruct, newDataDestruct);
    console.log('✓ RodaDaVidaReportPage: aceitar scores de múltiplas fontes');
  }

  fs.writeFileSync(reportPath, report);

  console.log('\n✓ Frontend corrigido');
  console.log('git add . && git commit -m "fix: multi-tool scores admin + report" && git push');
}

if (isBackend) {
  console.log('=== BACKEND ===\n');

  const routesPath = path.join(__dirname, 'src', 'routes', 'assessments.js');
  let routes = fs.readFileSync(routesPath, 'utf-8');
  fs.copyFileSync(routesPath, routesPath + '.bak-' + Date.now());

  // Fix ambos os endpoints /report (user e admin) para retornar scoresRaw inteiro
  const oldReturn = "scores: assessment.scoresRaw?.normalized, profilePrimary";
  const newReturn = "scores: assessment.scoresRaw?.normalized || assessment.scoresRaw?.scores, scoresRaw: assessment.scoresRaw, profilePrimary";

  const count = (routes.match(new RegExp(oldReturn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  routes = routes.replaceAll(oldReturn, newReturn);
  console.log('✓ Endpoint /report atualizado (' + count + ' ocorrências)');

  fs.writeFileSync(routesPath, routes);

  console.log('\n✓ Backend corrigido');
  console.log('git add . && git commit -m "fix: report endpoint retorna scoresRaw completo" && git push');
}

if (!isFrontend && !isBackend) {
  console.log('ERRO: Execute este script dentro de C:\\disc-system\\frontend ou C:\\disc-system\\backend');
}
