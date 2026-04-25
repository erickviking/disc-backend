import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config/index.js';
import { authenticate } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/security.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Muitas tentativas de autenticacao. Tente novamente mais tarde.',
});

const loginSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'Senha deve ter no minimo 6 caracteres'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no minimo 2 caracteres'),
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'Senha deve ter no minimo 6 caracteres'),
  phone: z.string().optional(),
  inviteCode: z.string().optional(),
});

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

router.post('/login', authRateLimit, async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.isActive === false) return res.status(401).json({ error: 'Credenciais invalidas' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Credenciais invalidas' });
    const token = generateToken(user);
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

router.post('/register', authRateLimit, async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) return res.status(409).json({ error: 'Email ja cadastrado' });

    const passwordHash = await bcrypt.hash(data.password, 12);

    const { user } = await prisma.$transaction(async (tx) => {
      let invitedBy = null;
      let inviteToolIds = [];

      if (data.inviteCode) {
        const invite = await tx.inviteLink.findUnique({ where: { code: data.inviteCode } });
        if (!invite || !invite.isActive) throw new Error('Codigo de convite invalido');
        if (invite.expiresAt && invite.expiresAt < new Date()) throw new Error('Codigo de convite expirado');
        if (invite.usedCount >= invite.maxUses) throw new Error('Codigo de convite esgotado');

        await tx.inviteLink.update({ where: { id: invite.id }, data: { usedCount: { increment: 1 } } });
        invitedBy = invite.createdById;
        inviteToolIds = invite.toolIds || [];
      }

      const createdUser = await tx.user.create({
        data: { name: data.name, email: data.email, passwordHash, phone: data.phone || null, invitedBy, role: 'USER' },
      });

      const defaultTools = await tx.tool.findMany({ where: { isDefault: true, isActive: true } });
      const toolIdsToGrant = new Set([
        ...defaultTools.map(t => t.id),
        ...inviteToolIds,
      ]);

      for (const toolId of toolIdsToGrant) {
        await tx.userToolAccess.upsert({
          where: { userId_toolId: { userId: createdUser.id, toolId } },
          update: {},
          create: { userId: createdUser.id, toolId, grantedBy: invitedBy },
        });
      }

      return { user: createdUser };
    });

    const token = generateToken(user);
    return res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    const knownInviteErrors = ['Codigo de convite invalido', 'Codigo de convite expirado', 'Codigo de convite esgotado'];
    if (knownInviteErrors.includes(err.message)) return res.status(400).json({ error: err.message });
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'Usuario nao encontrado' });
    return res.json({ user });
  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
