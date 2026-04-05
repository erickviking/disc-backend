import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { generatePDF } from '../services/pdf-generator.js';

const prisma = new PrismaClient();
const router = Router();
router.use(authenticate);

// GET /api/reports/:assessmentId/pdf
router.get('/:assessmentId/pdf', async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.assessmentId },
      include: {
        user: { select: { id: true, name: true } },
        report: true,
      },
    });

    if (!assessment) return res.status(404).json({ error: 'Assessment nao encontrado' });
    if (!assessment.report) return res.status(404).json({ error: 'Relatorio nao gerado' });

    // Allow user to see own report or admin to see any
    if (assessment.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Sem permissao' });
    }

    const scores = assessment.scoresRaw?.normalized;
    const pdfBuffer = await generatePDF(
      assessment.report,
      scores,
      assessment.profilePrimary,
      assessment.profileSecondary,
      assessment.user.name
    );

    const filename = 'relatorio-disc-' + assessment.user.name.toLowerCase().replace(/\s+/g, '-') + '.pdf';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
    res.send(Buffer.from(pdfBuffer));
  } catch (err) {
    console.error('PDF generation error:', err);
    return res.status(500).json({ error: 'Erro ao gerar PDF: ' + err.message });
  }
});

export default router;
