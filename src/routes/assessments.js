import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { calculateDiscScores, validateResponses } from '../services/disc-scoring.js';
import { discQuestions } from '../data/disc-questions.js';
import { generateReport } from '../services/report-generator.js';
import { sendReportReadyEmail } from '../services/email.js';
import { config } from '../config/index.js';

const prisma = new PrismaClient();

const userAssessmentRouter = Router();
userAssessmentRouter.use(authenticate);

userAssessmentRouter.get('/questions', (req, res) => {
  return res.json({ questions: discQuestions, totalGroups: discQuestions.length });
});

userAssessmentRouter.post('/', async (req, res) => {
  try {
    const existing = await prisma.assessment.findFirst({ where: { userId: req.user.id, status: 'IN_PROGRESS' } });
    if (existing) return res.json({ assessment: existing, resumed: true });
    const assessment = await prisma.assessment.create({ data: { userId: req.user.id, status: 'IN_PROGRESS' } });
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
    const validationError = validateResponses(responses);
    if (validationError) return res.status(400).json({ error: validationError });
    const { scores, rawScores, profilePrimary, profileSecondary } = calculateDiscScores(responses);
    const updated = await prisma.assessment.update({
      where: { id: assessment.id },
      data: { responses, scoresRaw: { normalized: scores, raw: rawScores }, profilePrimary, profileSecondary, status: 'COMPLETED', completedAt: new Date() },
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
      select: { id: true, status: true, profilePrimary: true, profileSecondary: true, scoresRaw: true, completedAt: true, releasedAt: true, createdAt: true, report: { select: { id: true, generatedAt: true } } },
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
    return res.json({ report: assessment.report, scores: assessment.scoresRaw?.normalized, profilePrimary: assessment.profilePrimary, profileSecondary: assessment.profileSecondary, userName: assessment.user.name });
  } catch (err) {
    console.error('Get report error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// ---- Admin ----
const adminAssessmentRouter = Router();
adminAssessmentRouter.use(authenticate, requireAdmin);

adminAssessmentRouter.get('/', async (req, res) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;
    const where = {};
    if (status) where.status = status;
    const [assessments, total] = await Promise.all([
      prisma.assessment.findMany({
        where, select: { id: true, status: true, profilePrimary: true, profileSecondary: true, scoresRaw: true, adminNotes: true, completedAt: true, releasedAt: true, createdAt: true, user: { select: { id: true, name: true, email: true } }, report: { select: { id: true, generatedAt: true } } },
        orderBy: { createdAt: 'desc' }, skip, take: limitNum,
      }),
      prisma.assessment.count({ where }),
    ]);
    return res.json({ assessments, pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) } });
  } catch (err) {
    console.error('List assessments error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

adminAssessmentRouter.get('/:id', async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({ where: { id: req.params.id }, include: { user: { select: { id: true, name: true, email: true, phone: true } }, report: true } });
    if (!assessment) return res.status(404).json({ error: 'Assessment nao encontrado' });
    return res.json({ assessment });
  } catch (err) {
    console.error('Get assessment error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// Release + generate report + send email
adminAssessmentRouter.patch('/:id/release', async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      include: { report: true, user: { select: { name: true, email: true } } },
    });
    if (!assessment) return res.status(404).json({ error: 'Assessment nao encontrado' });
    if (assessment.status === 'IN_PROGRESS') return res.status(400).json({ error: 'Assessment ainda nao foi completado' });

    const { adminNotes } = req.body || {};
    await prisma.assessment.update({
      where: { id: assessment.id },
      data: { status: 'RELEASED', releasedAt: new Date(), adminNotes: adminNotes || assessment.adminNotes },
    });

    let report = assessment.report;
    if (!report) {
      try {
        report = await generateReport(assessment.id);
      } catch (genErr) {
        console.error('Report generation failed:', genErr.message);
        return res.json({ assessment: { ...assessment, status: 'RELEASED' }, message: 'Liberado, mas falha ao gerar relatorio: ' + genErr.message, reportError: genErr.message });
      }
    }

    // Send email notification
    try {
      await sendReportReadyEmail(assessment.user.email, assessment.user.name, config.appUrl);
    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message);
    }

    const updated = await prisma.assessment.findUnique({ where: { id: assessment.id }, include: { report: true, user: { select: { name: true, email: true } } } });
    return res.json({ assessment: updated, message: 'Assessment liberado, relatorio gerado e email enviado!' });
  } catch (err) {
    console.error('Release assessment error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

adminAssessmentRouter.get('/:id/report', async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({ where: { id: req.params.id }, include: { user: { select: { name: true, email: true } }, report: true } });
    if (!assessment) return res.status(404).json({ error: 'Assessment nao encontrado' });
    if (!assessment.report) return res.status(404).json({ error: 'Relatorio nao gerado' });
    return res.json({ report: assessment.report, scores: assessment.scoresRaw?.normalized, profilePrimary: assessment.profilePrimary, profileSecondary: assessment.profileSecondary, userName: assessment.user.name });
  } catch (err) {
    console.error('Get admin report error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

export { userAssessmentRouter, adminAssessmentRouter };
