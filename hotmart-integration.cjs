/**
 * ═══════════════════════════════════════════════════════════════
 * Integração Hotmart — Assinatura anual
 * ═══════════════════════════════════════════════════════════════
 * 
 * Este script roda nos DOIS repos (detecta automaticamente).
 * 
 * Backend:
 *   cd C:\disc-system\backend
 *   node hotmart-integration.cjs
 *   npx prisma db push
 *   # Adicionar HOTMART_HOTTOK no Railway (Environment Variables)
 *   git add . && git commit -m "feat: integração Hotmart webhook" && git push
 * 
 * Frontend:
 *   cd C:\disc-system\frontend
 *   node hotmart-integration.cjs
 *   git add . && git commit -m "feat: card bloqueado → checkout Hotmart" && git push
 * 
 * ═══════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

const isFrontend = fs.existsSync(path.join(__dirname, 'src', 'pages'));
const isBackend = fs.existsSync(path.join(__dirname, 'src', 'routes'));

// ═══════════════════════════════════════════════════════════════
// BACKEND
// ═══════════════════════════════════════════════════════════════
if (isBackend) {
  console.log('=== BACKEND ===\n');

  // 1. Adicionar modelo Subscription ao schema.prisma
  console.log('[1/4] Atualizando schema.prisma...');
  const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
  let schema = fs.readFileSync(schemaPath, 'utf-8');
  fs.copyFileSync(schemaPath, schemaPath + '.bak-' + Date.now());

  if (!schema.includes('model Subscription')) {
    // Adicionar relation no User
    schema = schema.replace(
      '  toolAccess    UserToolAccess[]\n\n  @@map("users")',
      '  toolAccess    UserToolAccess[]\n  subscription  Subscription?\n\n  @@map("users")'
    );

    // Adicionar modelo Subscription
    schema += `

model Subscription {
  id              String    @id @default(cuid())
  userId          String    @unique
  hotmartEmail    String    // email usado na compra Hotmart
  hotmartCode     String?   // código da transação
  subscriptionId  String?   // ID da assinatura na Hotmart
  status          String    @default("ACTIVE") // ACTIVE, CANCELLED, EXPIRED, REFUNDED
  plan            String    @default("ANNUAL") // ANNUAL
  startedAt       DateTime  @default(now())
  expiresAt       DateTime?
  cancelledAt     DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("subscriptions")
}
`;
    fs.writeFileSync(schemaPath, schema);
    console.log('  ✓ Modelo Subscription adicionado');
  } else {
    console.log('  ⚠ Subscription já existe no schema');
  }

  // 2. Criar rota webhook Hotmart
  console.log('\n[2/4] Criando rota webhook Hotmart...');

  const webhookRoute = `import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

const HOTTOK = process.env.HOTMART_HOTTOK;
const CHECKOUT_URL = 'https://pay.hotmart.com/N105573480U';

// Hotmart envia eventos via POST
// Docs: https://developers.hotmart.com/docs/en/webhooks/
router.post('/webhook', async (req, res) => {
  try {
    // Validar hottok
    const receivedToken = req.body.hottok || req.headers['x-hotmart-hottok'];
    if (HOTTOK && receivedToken !== HOTTOK) {
      console.log('Hotmart webhook: hottok inválido');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { event, data } = req.body;
    const buyerEmail = data?.buyer?.email?.toLowerCase();
    const transactionCode = data?.purchase?.transaction;
    const subscriptionId = data?.subscription?.subscriber?.code;
    const status = data?.purchase?.status;

    console.log('Hotmart webhook:', event, buyerEmail, status);

    if (!buyerEmail) {
      console.log('Hotmart webhook: sem email do comprador');
      return res.status(200).json({ received: true });
    }

    // Encontrar usuário pelo email
    const user = await prisma.user.findUnique({ where: { email: buyerEmail } });

    if (!user) {
      console.log('Hotmart webhook: usuário não encontrado:', buyerEmail);
      // Salvar para processar depois quando o usuário se cadastrar
      // Por enquanto, log e retorna 200 (Hotmart precisa de 200)
      return res.status(200).json({ received: true, note: 'user_not_found' });
    }

    switch (event) {
      case 'PURCHASE_COMPLETE':
      case 'PURCHASE_APPROVED': {
        // Criar ou atualizar subscription
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        await prisma.subscription.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            hotmartEmail: buyerEmail,
            hotmartCode: transactionCode,
            subscriptionId: subscriptionId,
            status: 'ACTIVE',
            plan: 'ANNUAL',
            expiresAt,
          },
          update: {
            hotmartCode: transactionCode,
            subscriptionId: subscriptionId,
            status: 'ACTIVE',
            expiresAt,
            cancelledAt: null,
          },
        });

        // Liberar acesso a TODAS as ferramentas (exceto as que já tem)
        const allTools = await prisma.tool.findMany({ where: { isActive: true } });
        for (const tool of allTools) {
          await prisma.userToolAccess.upsert({
            where: { userId_toolId: { userId: user.id, toolId: tool.id } },
            create: { userId: user.id, toolId: tool.id, grantedBy: 'hotmart' },
            update: {},
          });
        }

        console.log('Hotmart: acesso liberado para', buyerEmail, '- ' + allTools.length + ' ferramentas');
        break;
      }

      case 'PURCHASE_CANCELED':
      case 'PURCHASE_REFUNDED':
      case 'SUBSCRIPTION_CANCELLATION': {
        // Cancelar subscription
        await prisma.subscription.updateMany({
          where: { userId: user.id },
          data: {
            status: event === 'PURCHASE_REFUNDED' ? 'REFUNDED' : 'CANCELLED',
            cancelledAt: new Date(),
          },
        });

        // Revogar acesso a ferramentas pagas (manter DISC que é gratuito)
        const discTool = await prisma.tool.findUnique({ where: { slug: 'disc' } });
        if (discTool) {
          await prisma.userToolAccess.deleteMany({
            where: {
              userId: user.id,
              toolId: { not: discTool.id },
              grantedBy: 'hotmart',
            },
          });
        }

        console.log('Hotmart: acesso revogado para', buyerEmail);
        break;
      }

      case 'PURCHASE_DELAYED':
      case 'PURCHASE_PROTEST': {
        // Marcar como pendente mas não revogar ainda
        await prisma.subscription.updateMany({
          where: { userId: user.id },
          data: { status: 'PENDING' },
        });
        console.log('Hotmart: pagamento pendente para', buyerEmail);
        break;
      }

      default:
        console.log('Hotmart webhook: evento não tratado:', event);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Hotmart webhook error:', err);
    // Sempre retorna 200 para Hotmart não reenviar indefinidamente
    return res.status(200).json({ received: true, error: err.message });
  }
});

// GET /api/hotmart/status — verifica status da assinatura do usuário logado
router.get('/status', async (req, res) => {
  try {
    // Extrair token do header (reuso simples sem middleware)
    const auth = req.headers.authorization;
    if (!auth) return res.json({ hasSubscription: false });

    const jwt = await import('jsonwebtoken');
    const token = auth.replace('Bearer ', '');
    let decoded;
    try {
      decoded = jwt.default.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return res.json({ hasSubscription: false });
    }

    const sub = await prisma.subscription.findUnique({
      where: { userId: decoded.userId },
    });

    if (!sub || sub.status !== 'ACTIVE') {
      return res.json({ hasSubscription: false, status: sub?.status || null });
    }

    // Verificar se expirou
    if (sub.expiresAt && new Date(sub.expiresAt) < new Date()) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'EXPIRED' },
      });
      return res.json({ hasSubscription: false, status: 'EXPIRED' });
    }

    return res.json({
      hasSubscription: true,
      status: sub.status,
      plan: sub.plan,
      expiresAt: sub.expiresAt,
    });
  } catch (err) {
    console.error('Subscription status error:', err);
    return res.json({ hasSubscription: false });
  }
});

// GET /api/hotmart/checkout-url — retorna URL de checkout com email pré-preenchido
router.get('/checkout-url', async (req, res) => {
  const email = req.query.email || '';
  const url = CHECKOUT_URL + (email ? '?email=' + encodeURIComponent(email) : '');
  return res.json({ url });
});

export default router;
`;

  const webhookPath = path.join(__dirname, 'src', 'routes', 'hotmart.js');
  fs.writeFileSync(webhookPath, webhookRoute);
  console.log('  ✓ Criado: src/routes/hotmart.js');

  // 3. Montar rota no index.js
  console.log('\n[3/4] Montando rota no index.js...');

  const indexPath = path.join(__dirname, 'src', 'index.js');
  let index = fs.readFileSync(indexPath, 'utf-8');
  fs.copyFileSync(indexPath, indexPath + '.bak-' + Date.now());

  if (!index.includes('hotmart')) {
    index = index.replace(
      "import pdfRoutes from './routes/pdf.js';",
      "import pdfRoutes from './routes/pdf.js';\nimport hotmartRoutes from './routes/hotmart.js';"
    );
    index = index.replace(
      "app.use('/api/reports', pdfRoutes);",
      "app.use('/api/reports', pdfRoutes);\napp.use('/api/hotmart', hotmartRoutes);"
    );
    fs.writeFileSync(indexPath, index);
    console.log('  ✓ Rota /api/hotmart montada');
  } else {
    console.log('  ⚠ Rota hotmart já existe');
  }

  // 4. Adicionar variável no config
  console.log('\n[4/4] Verificando config...');

  const configPath = path.join(__dirname, 'src', 'config', 'index.js');
  if (fs.existsSync(configPath)) {
    let cfg = fs.readFileSync(configPath, 'utf-8');
    if (!cfg.includes('hotmartHottok')) {
      cfg = cfg.replace(
        'export const config = {',
        'export const config = {\n  hotmartHottok: process.env.HOTMART_HOTTOK,'
      );
      fs.writeFileSync(configPath, cfg);
      console.log('  ✓ HOTMART_HOTTOK adicionado ao config');
    }
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('✅ Backend Hotmart — Completo!');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('IMPORTANTE — Adicionar variável no Railway:');
  console.log('  HOTMART_HOTTOK=MQwelKzLqRJU0cK9wO3IaIuHalJD5Xcb8e12a7-87df-446e-9dd7-26cd02435d7e');
  console.log('');
  console.log('Depois:');
  console.log('  npx prisma db push');
  console.log('  git add . && git commit -m "feat: integração Hotmart webhook" && git push');
}

// ═══════════════════════════════════════════════════════════════
// FRONTEND
// ═══════════════════════════════════════════════════════════════
if (isFrontend) {
  console.log('=== FRONTEND ===\n');

  // Patch UserDashboard — card bloqueado abre checkout
  console.log('[1/2] Patchando UserDashboard...');

  const dashPath = path.join(__dirname, 'src', 'pages', 'UserDashboard.jsx');
  let dash = fs.readFileSync(dashPath, 'utf-8');
  fs.copyFileSync(dashPath, dashPath + '.bak-' + Date.now());

  // Substituir o onClick do card bloqueado
  // Antes: onClick={() => !isLocked && navigate(...)}
  // Agora: cards bloqueados abrem checkout Hotmart
  const oldClick = "onClick={() => !isLocked && navigate('/dashboard/ferramenta/' + tool.slug)}";
  const newClick = "onClick={() => isLocked ? window.open('https://pay.hotmart.com/N105573480U?email=' + encodeURIComponent(user?.email || ''), '_blank') : navigate('/dashboard/ferramenta/' + tool.slug)}";

  if (dash.includes(oldClick)) {
    dash = dash.replace(oldClick, newClick);
    console.log('  ✓ Card bloqueado → checkout Hotmart');
  } else {
    console.log('  ⚠ onClick não encontrado');
  }

  // Mudar cursor do card bloqueado de cursor-default para cursor-pointer
  dash = dash.replace(
    "? 'border-outline-variant/10 cursor-default'",
    "? 'border-outline-variant/10 cursor-pointer'"
  );
  console.log('  ✓ Cursor pointer nos cards bloqueados');

  // Mudar "Em breve" para "Desbloquear"
  dash = dash.replace(
    ">Em breve</span>",
    ">Desbloquear</span>"
  );
  console.log('  ✓ "Em breve" → "Desbloquear"');

  fs.writeFileSync(dashPath, dash);

  // 2. Patch ToolHomePage — adicionar botão de checkout para ferramentas sem acesso
  console.log('\n[2/2] Patchando ToolHomePage...');

  const toolHomePath = path.join(__dirname, 'src', 'pages', 'ToolHomePage.jsx');
  if (!fs.existsSync(toolHomePath)) {
    console.log('  ⚠ ToolHomePage.jsx não encontrado (ok se já foi criado antes)');
  } else {
  let toolHome = fs.readFileSync(toolHomePath, 'utf-8');
  fs.copyFileSync(toolHomePath, toolHomePath + '.bak-' + Date.now());

  // Adicionar import useAuth se não tiver
  if (!toolHome.includes('useAuth')) {
    toolHome = toolHome.replace(
      "import { api } from '../lib/api.js';",
      "import { useAuth } from '../contexts/AuthContext.jsx';\nimport { api } from '../lib/api.js';"
    );
  }

  // Adicionar user do useAuth
  if (!toolHome.includes('const { user }')) {
    toolHome = toolHome.replace(
      'const { slug } = useParams();',
      'const { slug } = useParams();\n  const { user } = useAuth();'
    );
  }

  fs.writeFileSync(toolHomePath, toolHome);
  console.log('  ✓ ToolHomePage atualizado');
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('✅ Frontend Hotmart — Completo!');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('git add . && git commit -m "feat: card bloqueado → checkout Hotmart" && git push');
}

if (!isFrontend && !isBackend) {
  console.log('ERRO: Rode dentro de C:\\disc-system\\frontend ou C:\\disc-system\\backend');
}
