import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { sendReportReadyEmail } from '../services/email.js';
import { config } from '../config/index.js';
import { prisma } from '../lib/prisma.js';
import { getDefaultToolSlug, getToolHandler } from '../tools/registry.js';

const userAssessmentRouter = Router();
userAssessmentRouter.use(authenticate);

async function resolveToolSlugById(toolId) {
  if (!toolId) return getDefaultToolSlug();
  const tool = await prisma.tool.findUnique({ where: { id: toolId }, select: { slug: true } });
  return tool?.slug || getDefaultToolSlug();
}

userAssessmentRouter.get('/questions', (req, res) => {
  const toolSlug = req.query.tool || getDefaultToolSlug();
  const handler = getToolHandler(toolSlug);
  return res.json(handler.getQuestionsPayload());
});

userAssessmentRouter.post('/', async (req, res) => {
  try {
    const { toolSlug } = req.body;
    let toolId = null;
    if (toolSlug) {
      const tool = await prisma.tool.findUnique({ where: { slug: toolSlug } });
      if (tool) toolId = tool.id;
    }
    const inProgress = await prisma.assessment.findFirst({ where: { userId: req.user.id, status: 'IN_PROGRESS', ...(toolId ? { toolId } : {}) } });
    if (inProgress) return res.json({ assessment: inProgress, resumed: true });
    const assessment = await prisma.assessment.create({ data: { userId: req.user.id, status: 'IN_PROGRESS', ...(toolId ? { toolId } : {}) } });
    return res.status(201).json({ assessment, resumed: false });
  } catch (err) {
    console.error('Create assessment error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

userAssessmentRouter.post('/:id/submit', async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({ where: { id: req.params.id } });
    if (!assessment) return res.status(404).json({ error: 'Assessment nao encontrado' });
    if (assessment.userId !== req.user.id) return res.status(403).json({ error: 'Sem permissao' });
    if (assessment.status !== 'IN_PROGRESS') return res.status(400).json({ error: 'Assessment ja foi submetido' });

    const { responses } = req.body;
    const toolSlug = await resolveToolSlugById(assessment.toolId);
    const handler = getToolHandler(toolSlug);
    const validationError = handler.validateResponses(responses);
    if (validationError) return res.status(400).json({ error: validationError });

    const { scoresData, profilePrimary, profileSecondary } = handler.calculateScores(responses);
    const updated = await prisma.assessment.update({
      where: { id: assessment.id },
      data: { responses, scoresRaw: scoresData, profilePrimary, profileSecondary, status: 'COMPLETED', completedAt: new Date() },
    });
    return res.json({ assessment: updated, message: 'Assessment concluido!' });
  } catch (err) {
    console.error('Submit assessment error:', err);
    return res.status(500).json({ error: err.message || 'Erro interno' });
  }
});

userAssessmentRouter.get('/mine', async (req, res) => {
  try {
    const assessments = await prisma.assessment.findMany({
      where: { userId: req.user.id },
      select: { id: true, status: true, profilePrimary: true, profileSecondary: true, scoresRaw: true, completedAt: true, releasedAt: true, createdAt: true, tool: { select: { slug: true, name: true } }, report: { select: { id: true, generatedAt: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ assessments });
  } catch (err) {
    console.error('List my assessments error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

userAssessmentRouter.get('/:id/report', async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { name: true, email: true } }, report: true },
    });
    if (!assessment) return res.status(404).json({ error: 'Assessment nao encontrado' });
    if (assessment.userId !== req.user.id) return res.status(403).json({ error: 'Sem permissao' });
    if (!assessment.report) return res.status(404).json({ error: 'Relatorio ainda nao foi gerado' });
    return res.json({ report: assessment.report, scores: assessment.scoresRaw?.normalized || assessment.scoresRaw?.scores, scoresRaw: assessment.scoresRaw, profilePrimary: assessment.profilePrimary, profileSecondary: assessment.profileSecondary, userName: assessment.user.name });
  } catch (err) {
    console.error('Get report error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

userAssessmentRouter.get('/evolution', async (req, res) => {
  try {
    const assessments = await prisma.assessment.findMany({
      where: { userId: req.user.id, status: { in: ['COMPLETED', 'REVIEWED', 'RELEASED', 'REPORT_GENERATED'] } },
      select: { id: true, scoresRaw: true, profilePrimary: true, profileSecondary: true, completedAt: true, createdAt: true },
      orderBy: { completedAt: 'asc' },
    });
    return res.json({ assessments });
  } catch (err) {
    console.error('Evolution error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// ---- Admin ----
const adminAssessmentRouter = Router();
adminAssessmentRouter.use(authenticate, requireAdmin);

adminAssessmentRouter.get('/', async (req, res) => {
  try {
    const { status, toolSlug, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;
    const where = {};
    if (status) where.status = status;
    if (toolSlug) {
      const toolRecord = await prisma.tool.findUnique({ where: { slug: toolSlug } });
      if (toolRecord) where.toolId = toolRecord.id;
    }
    const [assessments, total] = await Promise.all([
      prisma.assessment.findMany({
        where,
        select: { id: true, status: true, profilePrimary: true, profileSecondary: true, scoresRaw: true, adminNotes: true, completedAt: true, releasedAt: true, createdAt: true, tool: { select: { slug: true, name: true } }, user: { select: { id: true, name: true, email: true } }, report: { select: { id: true, generatedAt: true } } },
        orderBy: { createdAt: 'desc' }, skip, take: limitNum,
      }),
      prisma.assessment.count({ where }),
    ]);
    return res.json({ assessments, pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) } });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro interno' }); }
});

adminAssessmentRouter.get('/:id', async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({ where: { id: req.params.id }, include: { user: { select: { id: true, name: true, email: true, phone: true } }, report: true } });
    if (!assessment) return res.status(404).json({ error: 'Assessment nao encontrado' });
    return res.json({ assessment });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro interno' }); }
});

adminAssessmentRouter.patch('/:id/release', async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      include: { report: true, user: { select: { name: true, email: true } } },
    });
    if (!assessment) return res.status(404).json({ error: 'Assessment nao encontrado' });
    if (assessment.status === 'IN_PROGRESS') return res.status(400).json({ error: 'Assessment ainda nao foi completado' });
    const { adminNotes } = req.body || {};
    const updated = await prisma.assessment.update({
      where: { id: assessment.id },
      data: { status: 'RELEASED', releasedAt: new Date(), adminNotes: adminNotes || assessment.adminNotes },
      include: { report: true, user: { select: { name: true, email: true } } },
    });
    return res.json({ assessment: updated, message: 'Assessment liberado! Agora gere o relatorio.' });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro interno' }); }
});

adminAssessmentRouter.post('/:id/generate-report', async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      include: { report: true, user: { select: { name: true, email: true } } },
    });
    if (!assessment) return res.status(404).json({ error: 'Assessment nao encontrado' });
    if (assessment.report) return res.status(400).json({ error: 'Relatorio ja existe' });
    if (assessment.status === 'IN_PROGRESS') return res.status(400).json({ error: 'Assessment ainda nao foi completado' });

    const toolSlug = await resolveToolSlugById(assessment.toolId);
    const handler = getToolHandler(toolSlug);
    await handler.generateReport(assessment.id);

    try { await sendReportReadyEmail(assessment.user.email, assessment.user.name, config.appUrl); }
    catch (emailErr) { console.error('Email failed:', emailErr.message); }

    const updated = await prisma.assessment.findUnique({ where: { id: assessment.id }, include: { report: true, user: { select: { name: true, email: true } } } });
    return res.json({ assessment: updated, message: 'Relatorio gerado e email enviado!' });
  } catch (err) {
    console.error('Generate report error:', err);
    return res.status(500).json({ error: 'Erro ao gerar relatorio: ' + err.message });
  }
});

adminAssessmentRouter.delete('/:id', async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({ where: { id: req.params.id }, include: { report: true } });
    if (!assessment) return res.status(404).json({ error: 'Assessment nao encontrado' });
    if (assessment.report) await prisma.report.delete({ where: { id: assessment.report.id } });
    await prisma.assessment.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Assessment deletado' });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro interno' }); }
});

adminAssessmentRouter.get('/:id/report', async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({ where: { id: req.params.id }, include: { user: { select: { name: true, email: true } }, report: true } });
    if (!assessment) return res.status(404).json({ error: 'Assessment nao encontrado' });
    if (!assessment.report) return res.status(404).json({ error: 'Relatorio nao gerado' });
    return res.json({ report: assessment.report, scores: assessment.scoresRaw?.normalized || assessment.scoresRaw?.scores, scoresRaw: assessment.scoresRaw, profilePrimary: assessment.profilePrimary, profileSecondary: assessment.profileSecondary, userName: assessment.user.name });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro interno' }); }
});

export { userAssessmentRouter, adminAssessmentRouter };
