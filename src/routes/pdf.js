import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { generatePDF } from '../services/pdf-generator.js';
import { prisma } from '../lib/prisma.js';

const router = Router();
router.use(authenticate);

function slugify(value) {
  return String(value || 'relatorio')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// GET /api/reports/:assessmentId/pdf
router.get('/:assessmentId/pdf', async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.assessmentId },
      include: {
        user: { select: { id: true, name: true } },
        report: true,
        tool: { select: { slug: true, name: true } },
      },
    });

    if (!assessment) return res.status(404).json({ error: 'Assessment nao encontrado' });
    if (!assessment.report) return res.status(404).json({ error: 'Relatorio nao gerado' });

    if (assessment.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Sem permissao' });
    }

    const toolSlug = assessment.tool?.slug || 'disc';
    const pdfBuffer = await generatePDF({
      report: assessment.report,
      scoresRaw: assessment.scoresRaw,
      scores: assessment.scoresRaw?.normalized || assessment.scoresRaw?.scores || assessment.scoresRaw?.dimensions || {},
      profilePrimary: assessment.profilePrimary,
      profileSecondary: assessment.profileSecondary,
      userName: assessment.user.name,
      toolSlug,
      toolName: assessment.tool?.name || 'Relatorio',
    });

    const filename = 'relatorio-' + slugify(toolSlug) + '-' + slugify(assessment.user.name) + '.pdf';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
    res.send(Buffer.from(pdfBuffer));
  } catch (err) {
    console.error('PDF generation error:', err);
    return res.status(500).json({ error: 'Erro ao gerar PDF: ' + err.message });
  }
});

export default router;
