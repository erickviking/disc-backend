import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

const userToolRouter = Router();
userToolRouter.use(authenticate);

userToolRouter.get('/', async (req, res) => {
  try {
    if (req.user.role === 'ADMIN') {
      const tools = await prisma.tool.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });
      return res.json({ tools });
    }
    const access = await prisma.userToolAccess.findMany({ where: { userId: req.user.id }, include: { tool: true } });
    const tools = access.map(a => a.tool).filter(t => t.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
    return res.json({ tools });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro interno' }); }
});

// Returns ALL tools regardless of active status (for showing locked cards)
userToolRouter.get('/all', async (req, res) => {
  try {
    const tools = await prisma.tool.findMany({
      select: { id: true, slug: true, name: true, description: true, icon: true, color: true, category: true, sortOrder: true, isActive: true, config: true },
      orderBy: { sortOrder: 'asc' },
    });
    return res.json({ tools });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro interno' }); }
});

const adminToolRouter = Router();
adminToolRouter.use(authenticate, requireAdmin);

adminToolRouter.get('/', async (req, res) => {
  try {
    const tools = await prisma.tool.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { assessments: true, userAccess: true } } },
    });
    return res.json({
      tools: tools.map(t => ({ ...t, assessmentCount: t._count.assessments, userCount: t._count.userAccess, _count: undefined })),
    });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro interno' }); }
});

adminToolRouter.patch('/:id', async (req, res) => {
  try {
    const schema = z.object({ isActive: z.boolean().optional(), isDefault: z.boolean().optional(), name: z.string().optional(), description: z.string().optional(), sortOrder: z.number().optional(), imagePosition: z.string().optional() });
    const { imagePosition, ...data } = schema.parse(req.body);
    
    // Se imagePosition foi enviado, merge no campo config (Json)
    if (imagePosition !== undefined) {
      const existing = await prisma.tool.findUnique({ where: { id: req.params.id }, select: { config: true } });
      data.config = { ...(existing?.config || {}), imagePosition };
    }
    
    const tool = await prisma.tool.update({ where: { id: req.params.id }, data });
    return res.json({ tool });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    console.error(err); return res.status(500).json({ error: 'Erro interno' });
  }
});

adminToolRouter.post('/:toolId/grant/:userId', async (req, res) => {
  try {
    const access = await prisma.userToolAccess.upsert({
      where: { userId_toolId: { userId: req.params.userId, toolId: req.params.toolId } },
      update: {}, create: { userId: req.params.userId, toolId: req.params.toolId, grantedBy: req.user.id },
    });
    return res.json({ access, message: 'Acesso concedido' });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro interno' }); }
});

adminToolRouter.delete('/:toolId/revoke/:userId', async (req, res) => {
  try {
    await prisma.userToolAccess.delete({ where: { userId_toolId: { userId: req.params.userId, toolId: req.params.toolId } } });
    return res.json({ message: 'Acesso revogado' });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro interno' }); }
});

adminToolRouter.get('/:toolId/users', async (req, res) => {
  try {
    const access = await prisma.userToolAccess.findMany({
      where: { toolId: req.params.toolId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { grantedAt: 'desc' },
    });
    return res.json({ users: access.map(a => ({ ...a.user, grantedAt: a.grantedAt })) });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro interno' }); }
});

adminToolRouter.post('/:toolId/grant-all', async (req, res) => {
  try {
    const users = await prisma.user.findMany({ where: { isActive: true }, select: { id: true } });
    let count = 0;
    for (const user of users) {
      await prisma.userToolAccess.upsert({
        where: { userId_toolId: { userId: user.id, toolId: req.params.toolId } },
        update: {}, create: { userId: user.id, toolId: req.params.toolId, grantedBy: req.user.id },
      });
      count++;
    }
    return res.json({ message: 'Acesso concedido a ' + count + ' usuarios' });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro interno' }); }
});

export { userToolRouter, adminToolRouter };
