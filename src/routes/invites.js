import { Router } from 'express';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { config } from '../config/index.js';

const prisma = new PrismaClient();

const adminInviteRouter = Router();
adminInviteRouter.use(authenticate, requireAdmin);

adminInviteRouter.post('/', async (req, res) => {
  try {
    const schema = z.object({
      maxUses: z.number().int().min(1).max(100).default(1),
      expiresInDays: z.number().int().min(1).max(90).optional(),
      sendEmail: z.boolean().optional(),
      emailTo: z.string().email().optional(),
      emailName: z.string().optional(),
    });
    const data = schema.parse(req.body);
    const code = nanoid(12);
    const invite = await prisma.inviteLink.create({
      data: {
        code, createdById: req.user.id, maxUses: data.maxUses,
        expiresAt: data.expiresInDays ? new Date(Date.now() + data.expiresInDays * 86400000) : null,
      },
    });
    const origin = config.appUrl || req.headers.origin || 'http://localhost:5173';
    const inviteUrl = origin + '/register?invite=' + code;

    // Send email if requested
    let emailSent = false;
    if (data.sendEmail && data.emailTo && config.resendApiKey) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(config.resendApiKey);
        const name = data.emailName || 'Voce';
        await resend.emails.send({
          from: config.emailFrom,
          to: [data.emailTo],
          subject: 'Convite para Analise Comportamental - Vanessa Rocha',
          html: '<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">'
            + '<div style="text-align:center;margin-bottom:32px;">'
            + '<div style="display:inline-block;background:#4c6ef5;color:white;font-size:14px;font-weight:700;padding:8px 12px;border-radius:8px;margin-bottom:12px;">VR</div>'
            + '<h2 style="color:#111827;font-size:20px;margin:0;">Vanessa Rocha</h2>'
            + '<p style="color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;margin-top:4px;">Analise Comportamental</p>'
            + '</div>'
            + '<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:32px;text-align:center;">'
            + '<h1 style="color:#111827;font-size:22px;margin:0 0 12px 0;">Ola, ' + name.split(' ')[0] + '!</h1>'
            + '<p style="color:#4b5563;font-size:15px;line-height:1.6;margin:0 0 24px 0;">'
            + 'Voce foi convidado(a) para realizar sua analise de perfil comportamental. Clique no botao abaixo para criar sua conta e iniciar o questionario.</p>'
            + '<a href="' + inviteUrl + '" style="display:inline-block;background:#4c6ef5;color:white;font-size:14px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;">Criar Minha Conta</a>'
            + '</div>'
            + '<p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:24px;">Vanessa Rocha - Analise Comportamental</p>'
            + '</div>',
        });
        emailSent = true;
        console.log('Invite email sent to:', data.emailTo);
      } catch (emailErr) {
        console.error('Invite email failed:', emailErr.message);
      }
    }

    return res.status(201).json({
      invite: { id: invite.id, code: invite.code, maxUses: invite.maxUses, expiresAt: invite.expiresAt, url: inviteUrl },
      emailSent,
    });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    console.error('Create invite error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

adminInviteRouter.get('/', async (req, res) => {
  try {
    const invites = await prisma.inviteLink.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
    const now = new Date();
    return res.json({
      invites: invites.map(inv => ({ ...inv, isExpired: inv.expiresAt ? inv.expiresAt < now : false, isExhausted: inv.usedCount >= inv.maxUses })),
    });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro interno' }); }
});

adminInviteRouter.delete('/:id', async (req, res) => {
  try {
    await prisma.inviteLink.update({ where: { id: req.params.id }, data: { isActive: false } });
    return res.json({ message: 'Convite desativado' });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro interno' }); }
});

const publicInviteRouter = Router();
publicInviteRouter.get('/:code/validate', async (req, res) => {
  try {
    const invite = await prisma.inviteLink.findUnique({ where: { code: req.params.code } });
    if (!invite || !invite.isActive) return res.json({ valid: false, reason: 'Convite nao encontrado' });
    if (invite.expiresAt && invite.expiresAt < new Date()) return res.json({ valid: false, reason: 'Convite expirado' });
    if (invite.usedCount >= invite.maxUses) return res.json({ valid: false, reason: 'Convite esgotado' });
    return res.json({ valid: true });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro interno' }); }
});

export { adminInviteRouter, publicInviteRouter };
