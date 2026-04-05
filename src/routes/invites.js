import { Router } from 'express';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const prisma = new PrismaClient();

const adminInviteRouter = Router();
adminInviteRouter.use(authenticate, requireAdmin);

adminInviteRouter.post('/', async (req, res) => {
  try {
    const schema = z.object({
      maxUses: z.number().int().min(1).max(100).default(1),
      expiresInDays: z.number().int().min(1).max(90).optional(),
    });
    const data = schema.parse(req.body);
    const code = nanoid(12);
    const invite = await prisma.inviteLink.create({
      data: {
        code, createdById: req.user.id, maxUses: data.maxUses,
        expiresAt: data.expiresInDays ? new Date(Date.now() + data.expiresInDays * 86400000) : null,
      },
    });
    const origin = req.headers.origin || 'http://localhost:5173';
    return res.status(201).json({
      invite: { id: invite.id, code: invite.code, maxUses: invite.maxUses,
        expiresAt: invite.expiresAt, url: origin + '/register?invite=' + code },
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
      invites: invites.map(inv => ({
        ...inv,
        isExpired: inv.expiresAt ? inv.expiresAt < now : false,
        isExhausted: inv.usedCount >= inv.maxUses,
      })),
    });
  } catch (err) {
    console.error('List invites error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

adminInviteRouter.delete('/:id', async (req, res) => {
  try {
    await prisma.inviteLink.update({ where: { id: req.params.id }, data: { isActive: false } });
    return res.json({ message: 'Convite desativado' });
  } catch (err) {
    console.error('Delete invite error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

const publicInviteRouter = Router();

publicInviteRouter.get('/:code/validate', async (req, res) => {
  try {
    const invite = await prisma.inviteLink.findUnique({ where: { code: req.params.code } });
    if (!invite || !invite.isActive) return res.json({ valid: false, reason: 'Convite nao encontrado' });
    if (invite.expiresAt && invite.expiresAt < new Date()) return res.json({ valid: false, reason: 'Convite expirado' });
    if (invite.usedCount >= invite.maxUses) return res.json({ valid: false, reason: 'Convite esgotado' });
    return res.json({ valid: true });
  } catch (err) {
    console.error('Validate invite error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

export { adminInviteRouter, publicInviteRouter };
