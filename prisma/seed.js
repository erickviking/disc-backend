import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('Iniciando seed...');
  const passwordHash = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@disc.com' },
    update: {},
    create: { name: 'Administrador', email: 'admin@disc.com', passwordHash, role: 'ADMIN' },
  });
  console.log('Admin criado:', admin.email);
  await prisma.promptTemplate.upsert({
    where: { name: 'disc_analysis_default' },
    update: {},
    create: { name: 'disc_analysis_default', template: 'Especialista DISC. Gere analise personalizada em JSON.' },
  });
  console.log('Seed completo!');
  await prisma.$disconnect();
}

seed().catch((e) => { console.error(e); process.exit(1); });
