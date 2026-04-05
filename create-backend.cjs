const fs = require('fs');
const path = require('path');

function w(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('OK:', filePath);
}

// src/config/index.js
w('src/config/index.js', `import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
};
`);

// src/middleware/auth.js
w('src/middleware/auth.js', `import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token nao fornecido' });
  }
  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalido ou expirado' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }
  next();
}
`);

// src/routes/auth.js
w('src/routes/auth.js', `import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { config } from '../config/index.js';
import { authenticate } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();

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

router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Credenciais invalidas' });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciais invalidas' });
    }
    const token = generateToken(user);
    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) {
      return res.status(409).json({ error: 'Email ja cadastrado' });
    }
    let invitedBy = null;
    if (data.inviteCode) {
      const invite = await prisma.inviteLink.findUnique({ where: { code: data.inviteCode } });
      if (!invite || !invite.isActive) {
        return res.status(400).json({ error: 'Codigo de convite invalido' });
      }
      if (invite.expiresAt && invite.expiresAt < new Date()) {
        return res.status(400).json({ error: 'Codigo de convite expirado' });
      }
      if (invite.usedCount >= invite.maxUses) {
        return res.status(400).json({ error: 'Codigo de convite esgotado' });
      }
      await prisma.inviteLink.update({
        where: { id: invite.id },
        data: { usedCount: { increment: 1 } },
      });
      invitedBy = invite.createdById;
    }
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: data.name, email: data.email, passwordHash,
        phone: data.phone || null, invitedBy, role: 'USER',
      },
    });
    const token = generateToken(user);
    return res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
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
`);

// src/routes/admin.js
w('src/routes/admin.js', `import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();
router.use(authenticate, requireAdmin);

router.get('/users', async (req, res) => {
  try {
    const { search, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, name: true, email: true, role: true, phone: true,
          isActive: true, createdAt: true,
          _count: { select: { assessments: true } },
        },
        orderBy: { createdAt: 'desc' }, skip, take: limitNum,
      }),
      prisma.user.count({ where }),
    ]);
    return res.json({
      users: users.map(u => ({
        id: u.id, name: u.name, email: u.email, role: u.role,
        phone: u.phone, isActive: u.isActive, createdAt: u.createdAt,
        assessmentCount: u._count.assessments,
      })),
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    console.error('List users error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, name: true, email: true, role: true, phone: true,
        notes: true, isActive: true, createdAt: true,
        assessments: {
          select: { id: true, status: true, scoresRaw: true, profilePrimary: true,
            profileSecondary: true, completedAt: true, releasedAt: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!user) return res.status(404).json({ error: 'Usuario nao encontrado' });
    return res.json({ user });
  } catch (err) {
    console.error('Get user error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

router.patch('/users/:id', async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().min(2).optional(),
      email: z.string().email().optional(),
      phone: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
      isActive: z.boolean().optional(),
      role: z.enum(['ADMIN', 'USER']).optional(),
    });
    const data = schema.parse(req.body);
    if (req.params.id === req.user.id && data.role === 'USER') {
      return res.status(400).json({ error: 'Nao e possivel remover seu proprio acesso admin' });
    }
    const user = await prisma.user.update({
      where: { id: req.params.id }, data,
      select: { id: true, name: true, email: true, role: true, phone: true, isActive: true },
    });
    return res.json({ user });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    console.error('Update user error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

router.post('/users', async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().min(2), email: z.string().email(),
      password: z.string().min(6), phone: z.string().optional(),
      role: z.enum(['ADMIN', 'USER']).default('USER'),
    });
    const data = schema.parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) return res.status(409).json({ error: 'Email ja cadastrado' });
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, passwordHash,
        phone: data.phone || null, role: data.role, invitedBy: req.user.id },
      select: { id: true, name: true, email: true, role: true },
    });
    return res.status(201).json({ user });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    console.error('Create user error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Nao e possivel desativar sua propria conta' });
    }
    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
    return res.json({ message: 'Usuario desativado' });
  } catch (err) {
    console.error('Delete user error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
`);

// src/routes/invites.js
w('src/routes/invites.js', `import { Router } from 'express';
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
`);

// src/index.js
w('src/index.js', `import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import { adminInviteRouter, publicInviteRouter } from './routes/invites.js';

const app = express();

app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/invites', publicInviteRouter);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/invites', adminInviteRouter);

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(config.port, () => {
  console.log('DISC Backend rodando na porta ' + config.port);
});
`);

console.log('\n✓ Todos os arquivos do backend criados com sucesso!');
console.log('Rode: npm run dev');
