const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();

  const updates = [
    { slug: 'disc', name: 'An\u00e1lise DISC', description: 'Descubra seu perfil comportamental DISC e entenda como voc\u00ea se comunica, lidera e toma decis\u00f5es.' },
    { slug: 'roda-da-vida', name: 'Roda da Vida', description: 'Avalie sua satisfa\u00e7\u00e3o em 8 \u00e1reas fundamentais da vida e identifique prioridades de desenvolvimento.' },
    { slug: 'inteligencia-emocional', name: 'Intelig\u00eancia Emocional', description: 'Avalie seus 5 pilares de intelig\u00eancia emocional e receba um plano de desenvolvimento personalizado.' },
    { slug: 'valores-pessoais', name: 'Valores Pessoais', description: 'Identifique e priorize seus valores fundamentais para tomar decis\u00f5es mais alinhadas.' },
    { slug: 'metas-smart', name: 'Metas SMART', description: 'Defina metas claras com apoio de IA e acompanhe seu progresso com plano de a\u00e7\u00e3o personalizado.' },
    { slug: 'sabotadores', name: 'Sabotadores Internos', description: 'Identifique seus sabotadores internos e aprenda estrat\u00e9gias para neutraliz\u00e1-los.' },
    { slug: 'diario', name: 'Di\u00e1rio de Autoconhecimento', description: 'Journaling guiado com an\u00e1lise de padr\u00f5es por IA para acelerar seu autoconhecimento.' },
  ];

  for (const u of updates) {
    try {
      await prisma.tool.update({
        where: { slug: u.slug },
        data: { name: u.name, description: u.description },
      });
      console.log('OK:', u.slug, '-', u.name);
    } catch (e) {
      console.log('FAIL:', u.slug, '-', e.message);
    }
  }

  await prisma.$disconnect();
  console.log('\nAcentuacao corrigida no banco!');
}

main();
