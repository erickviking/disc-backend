import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import { adminInviteRouter, publicInviteRouter } from './routes/invites.js';
import { userAssessmentRouter, adminAssessmentRouter } from './routes/assessments.js';
import pdfRoutes from './routes/pdf.js';

const app = express();

app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public
app.use('/api/auth', authRoutes);
app.use('/api/invites', publicInviteRouter);

// User
app.use('/api/assessments', userAssessmentRouter);
app.use('/api/reports', pdfRoutes);

// Admin
app.use('/api/admin', adminRoutes);
app.use('/api/admin/invites', adminInviteRouter);
app.use('/api/admin/assessments', adminAssessmentRouter);

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(config.port, () => {
  console.log('DISC Backend rodando na porta ' + config.port);
});
