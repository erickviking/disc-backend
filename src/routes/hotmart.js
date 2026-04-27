import { Router } from 'express';
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
