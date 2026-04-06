/**
 * ═══════════════════════════════════════════════════════════════
 * Admin Tool Home — Página dedicada por ferramenta no admin
 * ═══════════════════════════════════════════════════════════════
 * 
 * Este script deve ser rodado no FRONTEND.
 * Roda separado no backend (ver instruções abaixo).
 * 
 * Frontend:
 *   cd C:\disc-system\frontend
 *   node admin-tool-home.cjs
 * 
 * Backend (manual — um único patch):
 *   No arquivo src/routes/assessments.js, no admin GET /,
 *   adicionar suporte a filtro ?toolSlug=xxx
 * ═══════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

const isFrontend = fs.existsSync(path.join(__dirname, 'src', 'pages'));
const isBackend = fs.existsSync(path.join(__dirname, 'src', 'routes'));

if (isBackend) {
  console.log('=== BACKEND ===\n');
  
  const routesPath = path.join(__dirname, 'src', 'routes', 'assessments.js');
  let routes = fs.readFileSync(routesPath, 'utf-8');
  fs.copyFileSync(routesPath, routesPath + '.bak-' + Date.now());
  
  // Adicionar filtro toolSlug no admin GET /
  const oldWhere = "const { status, page = '1', limit = '20' } = req.query;";
  const newWhere = "const { status, toolSlug, page = '1', limit = '20' } = req.query;";
  
  if (routes.includes(oldWhere)) {
    routes = routes.replace(oldWhere, newWhere);
    console.log('✓ Extrair toolSlug do query');
  }
  
  const oldWhereObj = "const where = {};\n    if (status) where.status = status;";
  const newWhereObj = `const where = {};
    if (status) where.status = status;
    if (toolSlug) {
      const toolRecord = await prisma.tool.findUnique({ where: { slug: toolSlug } });
      if (toolRecord) where.toolId = toolRecord.id;
    }`;
  
  if (routes.includes(oldWhereObj)) {
    routes = routes.replace(oldWhereObj, newWhereObj);
    console.log('✓ Filtro toolSlug no admin GET /assessments');
  }
  
  // Adicionar tool no select do admin assessments
  const oldAdminSelect = "user: { select: { id: true, name: true, email: true } }, report: { select: { id: true, generatedAt: true } }";
  const newAdminSelect = "tool: { select: { slug: true, name: true } }, user: { select: { id: true, name: true, email: true } }, report: { select: { id: true, generatedAt: true } }";
  
  if (routes.includes(oldAdminSelect)) {
    routes = routes.replace(oldAdminSelect, newAdminSelect);
    console.log('✓ Incluir tool no select admin assessments');
  }
  
  fs.writeFileSync(routesPath, routes);
  console.log('\n✓ Backend atualizado');
  console.log('git add . && git commit -m "feat: admin assessments filtro por toolSlug" && git push');
}

if (isFrontend) {
  console.log('=== FRONTEND ===\n');
  
  // 1. Criar AdminToolHomePage
  console.log('[1/3] Criando AdminToolHomePage...');
  
  const adminToolHome = `import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import {
  ArrowLeft, Users, Target, Heart, Compass, Rocket, Shield, BookOpen,
  ToggleLeft, ToggleRight, Star, UserPlus, UserMinus,
  Eye, FileText, Unlock, Trash2, Loader2, ChevronDown, ChevronUp, Clock
} from 'lucide-react';

const iconMap = { Users, Target, Heart, Compass, Rocket, Shield, BookOpen };
const profileNames = { D: 'Executor', I: 'Comunicador', S: 'Planejador', C: 'Analista' };

const cardImages = {
  'disc': '/card-disc.jpg', 'roda-da-vida': '/card-roda.jpg', 'inteligencia-emocional': '/card-ie.jpg',
  'valores-pessoais': '/card-valores.jpg', 'metas-smart': '/card-metas.jpg',
  'sabotadores': '/card-sabotadores.jpg', 'diario': '/card-diario.jpg',
};
const cardFocusPoint = {
  'disc': 'center 15%', 'roda-da-vida': 'center 0%', 'inteligencia-emocional': 'center 40%',
  'valores-pessoais': 'center 45%', 'metas-smart': 'center 15%',
  'sabotadores': 'center 20%', 'diario': 'center 42%',
};

const statusLabels = {
  IN_PROGRESS: { text: 'Em andamento', color: 'bg-amber-500/15 text-amber-400' },
  COMPLETED: { text: 'Completado', color: 'bg-blue-500/15 text-blue-400' },
  REVIEWED: { text: 'Revisado', color: 'bg-purple-500/15 text-purple-400' },
  RELEASED: { text: 'Liberado', color: 'bg-emerald-500/15 text-emerald-400' },
  REPORT_GENERATED: { text: 'Relatório gerado', color: 'bg-primary/15 text-primary' },
};

export default function AdminToolHomePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [tool, setTool] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [toolUsers, setToolUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [toggling, setToggling] = useState(false);
  const [releasing, setReleasing] = useState(null);
  const [generating, setGenerating] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [showAccess, setShowAccess] = useState(false);

  const load = async () => {
    try {
      const [toolsData, assessData, usersData] = await Promise.all([
        api.get('/admin/tools'),
        api.get('/admin/assessments?toolSlug=' + slug + '&limit=100'),
        api.get('/admin/users?limit=100'),
      ]);
      const found = (toolsData.tools || []).find(t => t.slug === slug);
      setTool(found || null);
      setAssessments(assessData.assessments || []);
      setAllUsers(usersData.users || []);
      
      if (found) {
        try {
          const td = await api.get('/admin/tools/' + found.id + '/users');
          setToolUsers(td.users || []);
        } catch (e) {}
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [slug]);

  const toggleTool = async () => {
    if (!tool) return;
    setToggling(true);
    try { await api.patch('/admin/tools/' + tool.id, { isActive: !tool.isActive }); await load(); }
    catch (e) { alert(e.message); }
    finally { setToggling(false); }
  };

  const toggleDefault = async () => {
    if (!tool) return;
    try { await api.patch('/admin/tools/' + tool.id, { isDefault: !tool.isDefault }); await load(); }
    catch (e) { alert(e.message); }
  };

  const grantAccess = async (userId) => {
    try { await api.post('/admin/tools/' + tool.id + '/grant/' + userId, {}); await load(); }
    catch (e) { alert(e.message); }
  };

  const revokeAccess = async (userId) => {
    try { await api.delete('/admin/tools/' + tool.id + '/revoke/' + userId); await load(); }
    catch (e) { alert(e.message); }
  };

  const grantAll = async () => {
    try { const r = await api.post('/admin/tools/' + tool.id + '/grant-all', {}); alert(r.message); await load(); }
    catch (e) { alert(e.message); }
  };

  const release = async (id) => {
    setReleasing(id);
    try { await api.patch('/admin/assessments/' + id + '/release', { adminNotes: adminNotes || undefined }); setAdminNotes(''); await load(); }
    catch (e) { alert(e.message); }
    finally { setReleasing(null); }
  };

  const generateReport = async (id) => {
    setGenerating(id);
    try { const r = await api.post('/admin/assessments/' + id + '/generate-report', {}); alert(r.message || 'Relatório gerado!'); await load(); }
    catch (e) { alert('Erro: ' + e.message); }
    finally { setGenerating(null); }
  };

  const deleteAssessment = async (id) => {
    if (!confirm('Deletar este assessment?')) return;
    setDeleting(id);
    try { await api.delete('/admin/assessments/' + id); setExpanded(null); await load(); }
    catch (e) { alert(e.message); }
    finally { setDeleting(null); }
  };

  const getReportPath = (a) => {
    if (slug === 'disc') return '/report/' + a.id;
    if (slug === 'roda-da-vida') return '/roda-da-vida/report/' + a.id;
    return null;
  };

  const fmtDate = (d) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  if (!tool) return <div className="card text-center py-16"><p className="text-on-surface-variant mb-4">Ferramenta não encontrada.</p><button onClick={() => navigate('/admin/tools')} className="btn-secondary gap-2"><ArrowLeft size={14} /> Voltar</button></div>;

  const Icon = iconMap[tool.icon] || Target;
  const bgImage = cardImages[slug];
  const focusPoint = tool.config?.imagePosition || cardFocusPoint[slug] || 'center 20%';
  const usersWithout = allUsers.filter(u => !u.isAdmin && !toolUsers.find(tu => tu.id === u.id));

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/admin/tools')} className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors">
        <ArrowLeft size={14} /> Voltar às ferramentas
      </button>

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden border border-outline-variant/20">
        <div className="relative h-48 md:h-56">
          {bgImage && <img src={bgImage} alt="" style={{ objectPosition: focusPoint }} className="absolute inset-0 w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-surface-container from-10% via-surface-container/80 via-50% to-surface-container/30" />
          <div className="absolute bottom-6 left-6 right-6 z-10 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl shadow-lg backdrop-blur-sm" style={{ backgroundColor: (tool.color || '#d4a853') + '44' }}>
                  <Icon size={22} style={{ color: tool.color || '#d4a853' }} />
                </div>
                <span className={"inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest " + (tool.isActive ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400')}>
                  {tool.isActive ? 'Ativa' : 'Inativa'}
                </span>
                {tool.isDefault && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold"><Star size={10} /> Padrão</span>}
              </div>
              <h1 className="text-2xl md:text-3xl font-headline font-bold text-on-surface tracking-tight">{tool.name}</h1>
            </div>
            <div className="flex gap-2">
              <button onClick={toggleTool} disabled={toggling} className={"btn-secondary !py-2 !px-4 !text-xs gap-1.5 " + (tool.isActive ? '' : 'opacity-70')}>
                {toggling ? <Loader2 size={14} className="animate-spin" /> : tool.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                {tool.isActive ? 'Desativar' : 'Ativar'}
              </button>
              <button onClick={toggleDefault} className={"btn-secondary !py-2 !px-4 !text-xs gap-1.5 " + (tool.isDefault ? 'text-primary' : '')}>
                <Star size={14} /> {tool.isDefault ? 'Padrão' : 'Tornar padrão'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main: Assessments */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-lg font-semibold text-on-surface">Assessments ({assessments.length})</h2>
          </div>

          {assessments.length === 0 ? (
            <div className="card text-center py-12"><p className="text-on-surface-variant/50">Nenhum assessment para esta ferramenta.</p></div>
          ) : (
            <div className="space-y-3">
              {assessments.map(a => {
                const st = statusLabels[a.status] || statusLabels.IN_PROGRESS;
                const isExpanded2 = expanded === a.id;
                const canRelease = a.status === 'COMPLETED' || a.status === 'REVIEWED';
                const canGenerate = (a.status === 'RELEASED' || a.status === 'COMPLETED' || a.status === 'REVIEWED') && !a.report;
                const hasReport = !!a.report;
                const reportPath = getReportPath(a);

                return (
                  <div key={a.id} className="card !p-0 overflow-hidden">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-5 cursor-pointer hover:bg-surface-container-high/50 transition-colors" onClick={() => setExpanded(isExpanded2 ? null : a.id)}>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-semibold text-on-surface">{a.user?.name}</span>
                          <span className={"rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider " + st.color}>{st.text}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 text-xs text-on-surface-variant/40">
                          <span>{a.user?.email}</span>
                          <span>Criado: {fmtDate(a.createdAt)}</span>
                          {a.completedAt && <span>Completado: {fmtDate(a.completedAt)}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasReport && <span className="text-xs text-primary font-medium">Relatório pronto</span>}
                        {isExpanded2 ? <ChevronUp size={16} className="text-on-surface-variant/40" /> : <ChevronDown size={16} className="text-on-surface-variant/40" />}
                      </div>
                    </div>

                    {isExpanded2 && (
                      <div className="border-t border-outline-variant/10 p-5 bg-surface-container-low/50 space-y-4">
                        <div className="flex flex-wrap gap-3">
                          {hasReport && reportPath && <button onClick={() => navigate(reportPath)} className="btn-primary gap-2"><Eye size={14} />Ver Relatório</button>}
                          {canGenerate && <button onClick={() => generateReport(a.id)} disabled={generating === a.id} className="btn-primary gap-2">{generating === a.id ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}Gerar Relatório</button>}
                        </div>

                        {canRelease && (
                          <div className="border-t border-outline-variant/10 pt-4">
                            <h4 className="text-sm font-semibold text-on-surface mb-2">Liberar Assessment</h4>
                            <textarea className="input-field mb-3" rows={2} placeholder="Nota para a IA (opcional)..." value={adminNotes} onChange={e => setAdminNotes(e.target.value)} />
                            <button onClick={() => release(a.id)} disabled={releasing === a.id} className="btn-primary gap-2">{releasing === a.id ? <Loader2 size={14} className="animate-spin" /> : <Unlock size={14} />}Liberar</button>
                          </div>
                        )}

                        {a.releasedAt && <p className="text-xs text-emerald-400">Liberado em {fmtDate(a.releasedAt)}</p>}
                        {a.adminNotes && <p className="text-xs text-on-surface-variant/50">Nota: {a.adminNotes}</p>}

                        <div className="border-t border-outline-variant/10 pt-4">
                          <button onClick={() => deleteAssessment(a.id)} disabled={deleting === a.id} className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30">
                            {deleting === a.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}Deletar Assessment
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar: Tool info + Access */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-headline text-base font-semibold text-on-surface mb-2">Sobre</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">{tool.description}</p>
            <div className="flex gap-4 mt-4 text-xs text-on-surface-variant">
              <span><strong className="text-on-surface">{tool._count?.userAccess || toolUsers.length}</strong> usuários</span>
              <span><strong className="text-on-surface">{assessments.length}</strong> assessments</span>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-headline text-base font-semibold text-on-surface">Controle de acesso</h3>
              <button onClick={() => setShowAccess(!showAccess)} className="text-xs text-primary hover:text-gold-200">
                {showAccess ? 'Esconder' : 'Mostrar'}
              </button>
            </div>

            {showAccess && (
              <div className="space-y-4">
                <button onClick={grantAll} className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors w-full justify-center">
                  <UserPlus size={12} /> Liberar todos
                </button>

                {toolUsers.length > 0 && (
                  <div>
                    <p className="text-xs text-on-surface-variant mb-2">Com acesso ({toolUsers.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {toolUsers.map(u => (
                        <div key={u.id} className="flex items-center gap-2 rounded-lg bg-surface-container px-3 py-1.5 border border-outline-variant/20">
                          <span className="text-xs font-medium text-on-surface">{u.name}</span>
                          <button onClick={() => revokeAccess(u.id)} className="text-red-400 hover:text-red-300"><UserMinus size={12} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {usersWithout.length > 0 && (
                  <div>
                    <p className="text-xs text-on-surface-variant mb-2">Sem acesso ({usersWithout.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {usersWithout.map(u => (
                        <div key={u.id} className="flex items-center gap-2 rounded-lg bg-surface-container-lowest px-3 py-1.5 border border-outline-variant/10">
                          <span className="text-xs text-on-surface-variant">{u.name}</span>
                          <button onClick={() => grantAccess(u.id)} className="text-green-400 hover:text-green-300"><UserPlus size={12} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
`;

  const fp = path.join(__dirname, 'src', 'pages', 'AdminToolHomePage.jsx');
  fs.writeFileSync(fp, adminToolHome);
  console.log('  ✓ Criado: AdminToolHomePage.jsx');

  // 2. Patch App.jsx — adicionar rota admin/tools/:slug + remover assessments route
  console.log('\n[2/3] Patchando App.jsx...');
  
  const appPath = path.join(__dirname, 'src', 'App.jsx');
  let app = fs.readFileSync(appPath, 'utf-8');
  fs.copyFileSync(appPath, appPath + '.bak-' + Date.now());

  // Import
  if (!app.includes('AdminToolHomePage')) {
    app = app.replace(
      "import AdminToolsPage from './pages/AdminToolsPage.jsx';",
      "import AdminToolsPage from './pages/AdminToolsPage.jsx';\nimport AdminToolHomePage from './pages/AdminToolHomePage.jsx';"
    );
    console.log('  ✓ Import AdminToolHomePage');
  }

  // Adicionar rota
  if (!app.includes('tools/:slug')) {
    app = app.replace(
      '<Route path="tools" element={<AdminToolsPage />} />',
      '<Route path="tools" element={<AdminToolsPage />} />\n            <Route path="tools/:slug" element={<AdminToolHomePage />} />'
    );
    console.log('  ✓ Rota /admin/tools/:slug');
  }

  // Remover rota assessments
  app = app.replace(
    '\n            <Route path="assessments" element={<AdminAssessmentsPage />} />',
    ''
  );
  console.log('  ✓ Removida rota /admin/assessments');

  fs.writeFileSync(appPath, app);

  // 3. Patch AppLayout — remover Assessments da sidebar admin
  console.log('\n[3/3] Patchando sidebar admin...');
  
  const layoutPath = path.join(__dirname, 'src', 'components', 'AppLayout.jsx');
  let layout = fs.readFileSync(layoutPath, 'utf-8');
  fs.copyFileSync(layoutPath, layoutPath + '.bak-' + Date.now());

  layout = layout.replace(
    "  { to: '/admin/assessments', icon: ClipboardList, label: 'Assessments' },\n",
    ''
  );
  console.log('  ✓ Removido "Assessments" da sidebar');

  fs.writeFileSync(layoutPath, layout);

  // 4. Patch AdminToolsPage — cards navegam para /admin/tools/:slug
  console.log('\n[4/3] Patchando AdminToolsPage (navegação)...');
  
  const adminToolsPath = path.join(__dirname, 'src', 'pages', 'AdminToolsPage.jsx');
  let adminTools = fs.readFileSync(adminToolsPath, 'utf-8');
  fs.copyFileSync(adminToolsPath, adminToolsPath + '.bak-' + Date.now());

  // Adicionar import useNavigate se não existir
  if (!adminTools.includes('useNavigate')) {
    adminTools = adminTools.replace(
      "import { useState, useEffect } from 'react';",
      "import { useState, useEffect } from 'react';\nimport { useNavigate } from 'react-router-dom';"
    );
    console.log('  ✓ Import useNavigate');
  }

  // Adicionar navigate hook
  if (!adminTools.includes('const navigate = useNavigate()')) {
    adminTools = adminTools.replace(
      'const [tools, setTools] = useState([]);',
      'const navigate = useNavigate();\n  const [tools, setTools] = useState([]);'
    );
    console.log('  ✓ Hook useNavigate');
  }

  // Mudar onClick do card de handleExpand para navigate
  if (adminTools.includes("onClick={() => handleExpand(tool.id)}")) {
    adminTools = adminTools.replace(
      "onClick={() => handleExpand(tool.id)}",
      "onClick={() => navigate('/admin/tools/' + tool.slug)}"
    );
    console.log('  ✓ Cards navegam para /admin/tools/:slug');
  }

  fs.writeFileSync(adminToolsPath, adminTools);

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('✅ Admin Tool Home — Completo!');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('git add . && git commit -m "feat: AdminToolHomePage + remover aba Assessments" && git push');
}

if (!isFrontend && !isBackend) {
  console.log('ERRO: Rode dentro de C:\\disc-system\\frontend ou C:\\disc-system\\backend');
}
