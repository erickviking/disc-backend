import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('Iniciando seed...');

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@disc.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminPassword || adminPassword.length < 12) {
    throw new Error('Defina SEED_ADMIN_PASSWORD com pelo menos 12 caracteres antes de rodar o seed.');
  }

  // Admin user
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { name: 'Administrador', email: adminEmail, passwordHash, role: 'ADMIN' },
  });
  console.log('Admin:', admin.email);

  // Tools
  const tools = [
    {
      slug: 'disc',
      name: 'Analise Comportamental DISC',
      description: 'Descubra seu perfil comportamental atraves dos 4 fatores: Executor, Comunicador, Planejador e Analista.',
      icon: 'Users',
      color: '#4c6ef5',
      category: 'comportamental',
      isActive: true,
      isDefault: true,
      sortOrder: 1,
      config: { questionCount: 28, scoringMethod: 'disc_classic' },
    },
    {
      slug: 'roda-da-vida',
      name: 'Roda da Vida',
      description: 'Avalie sua satisfação em 12 áreas fundamentais da vida e identifique prioridades de desenvolvimento.',
      icon: 'Target',
      color: '#2A9D8F',
      category: 'desenvolvimento',
      isActive: false,
      isDefault: false,
      sortOrder: 2,
      config: { areas: 12, scoringMethod: 'roda_da_vida', questionsPerArea: 3 },
    },
    {
      slug: 'inteligencia-emocional',
      name: 'Inteligencia Emocional',
      description: 'Avalie seus 5 pilares de inteligencia emocional e receba um plano de desenvolvimento personalizado.',
      icon: 'Heart',
      color: '#E63946',
      category: 'comportamental',
      isActive: false,
      isDefault: false,
      sortOrder: 3,
      config: { pillars: 5 },
    },
    {
      slug: 'valores-pessoais',
      name: 'Valores Pessoais',
      description: 'Identifique e priorize seus valores fundamentais para tomar decisoes mais alinhadas.',
      icon: 'Compass',
      color: '#F4A261',
      category: 'desenvolvimento',
      isActive: false,
      isDefault: false,
      sortOrder: 4,
      config: {},
    },
    {
      slug: 'metas-smart',
      name: 'Metas SMART',
      description: 'Defina metas claras com apoio de IA e acompanhe seu progresso com plano de acao personalizado.',
      icon: 'Rocket',
      color: '#7c3aed',
      category: 'planejamento',
      isActive: false,
      isDefault: false,
      sortOrder: 5,
      config: {},
    },
    {
      slug: 'sabotadores',
      name: 'Sabotadores Internos',
      description: 'Identifique seus sabotadores internos e aprenda estrategias para neutraliza-los.',
      icon: 'Shield',
      color: '#264653',
      category: 'comportamental',
      isActive: false,
      isDefault: false,
      sortOrder: 6,
      config: {},
    },
    {
      slug: 'diario',
      name: 'Diario de Autoconhecimento',
      description: 'Journaling guiado com analise de padroes por IA para acelerar seu autoconhecimento.',
      icon: 'BookOpen',
      color: '#059669',
      category: 'desenvolvimento',
      isActive: false,
      isDefault: false,
      sortOrder: 7,
      config: {},
    },
  ];

  for (const tool of tools) {
    await prisma.tool.upsert({
      where: { slug: tool.slug },
      update: { name: tool.name, description: tool.description, icon: tool.icon, color: tool.color, category: tool.category, sortOrder: tool.sortOrder, config: tool.config },
      create: tool,
    });
    console.log('Tool:', tool.slug, tool.isActive ? '(ativo)' : '(inativo)');
  }

  // Link existing assessments to DISC tool
  const discTool = await prisma.tool.findUnique({ where: { slug: 'disc' } });
  if (discTool) {
    const updated = await prisma.assessment.updateMany({
      where: { toolId: null },
      data: { toolId: discTool.id },
    });
    console.log('Assessments migrados para DISC:', updated.count);

    // Grant DISC access to all existing users
    const users = await prisma.user.findMany({ select: { id: true } });
    for (const user of users) {
      await prisma.userToolAccess.upsert({
        where: { userId_toolId: { userId: user.id, toolId: discTool.id } },
        update: {},
        create: { userId: user.id, toolId: discTool.id, grantedBy: admin.id },
      });
    }
    console.log('Acesso DISC concedido a', users.length, 'usuarios');
  }

  // Prompt template for DISC
  await prisma.promptTemplate.upsert({
    where: { name: 'disc_analysis_default' },
    update: { toolId: discTool?.id },
    create: {
      name: 'disc_analysis_default',
      toolId: discTool?.id,
      template: 'Especialista DISC. Gere analise personalizada baseada nos scores fornecidos. Retorne em JSON.',
    },
  });

  console.log('Seed completo!');
  await prisma.$disconnect();
}

seed().catch((e) => { console.error(e); process.exit(1); });
