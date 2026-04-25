import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

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
