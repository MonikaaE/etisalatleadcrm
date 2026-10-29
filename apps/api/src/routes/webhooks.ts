import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { getEnv } from '../lib/env';
import { logger } from '../lib/logger';

const router = Router();

// WhatsApp webhook verification (GET)
router.get('/whatsapp', (req: Request, res: Response) => {
  const env = getEnv();
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === env.WHATSAPP_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.status(403).json({ error: 'Forbidden' });
  }
});

// WhatsApp webhook events (POST)
router.post('/whatsapp', async (req: Request, res: Response) => {
  const env = getEnv();
  res.sendStatus(200); // Always ack first per Meta requirements

  try {
    // Verify signature
    if (env.WHATSAPP_APP_SECRET) {
      const signature = req.headers['x-hub-signature-256'] as string;
      const expectedSig = `sha256=${crypto.createHmac('sha256', env.WHATSAPP_APP_SECRET).update(JSON.stringify(req.body)).digest('hex')}`;
      if (!signature || signature !== expectedSig) {
        logger.warn('WhatsApp webhook signature mismatch');
        return;
      }
    }

    const payload = req.body;
    const idempotencyKey = `wa_${JSON.stringify(payload).slice(0, 100)}`;

    // Idempotency check
    const existing = await prisma.webhookEvent.findUnique({ where: { idempotencyKey } });
    if (existing) return;

    await prisma.webhookEvent.create({
      data: { provider: 'whatsapp', eventType: 'incoming', payload, idempotencyKey },
    });

    // Process messages
    const entry = payload?.entry?.[0];
    const changes = entry?.changes?.[0];
    const messages = changes?.value?.messages;

    if (messages?.length) {
      for (const msg of messages) {
        const phoneNumber = msg.from;
        let conv = await prisma.conversation.findFirst({ where: { phoneNumber } });
        if (!conv) {
          conv = await prisma.conversation.create({ data: { phoneNumber, lastMessageAt: new Date() } });
        }
        await prisma.conversationMessage.create({
          data: {
            conversationId: conv.id,
            direction: 'inbound',
            type: msg.type || 'text',
            body: msg.text?.body || msg.caption || '',
            providerMsgId: msg.id,
            sentAt: new Date(),
            status: 'DELIVERED',
          },
        });
        await prisma.conversation.update({ where: { id: conv.id }, data: { isOpen: true, lastMessageAt: new Date() } });
      }
    }

    // Update delivery status
    const statuses = changes?.value?.statuses;
    if (statuses?.length) {
      for (const s of statuses) {
        await prisma.campaignMessage.updateMany({
          where: { providerMessageId: s.id },
          data: {
            status: s.status === 'delivered' ? 'DELIVERED' : s.status === 'read' ? 'READ' : s.status === 'failed' ? 'FAILED' : undefined,
            deliveredAt: s.status === 'delivered' ? new Date(s.timestamp * 1000) : undefined,
          },
        });
      }
    }

    await prisma.webhookEvent.updateMany({ where: { idempotencyKey }, data: { processed: true, processedAt: new Date() } });
  } catch (err) {
    logger.error({ err }, 'WhatsApp webhook processing error');
  }
});

// Email webhook (generic)
router.post('/email', async (req: Request, res: Response) => {
  const env = getEnv();
  res.sendStatus(200);

  try {
    // Verify webhook secret if set
    if (env.EMAIL_WEBHOOK_SECRET) {
      const providedSecret = req.headers['x-webhook-secret'] || req.headers['authorization'];
      if (providedSecret !== env.EMAIL_WEBHOOK_SECRET) {
        logger.warn('Email webhook secret mismatch');
        return;
      }
    }

    const events = Array.isArray(req.body) ? req.body : [req.body];
    for (const event of events) {
      await prisma.webhookEvent.create({ data: { provider: 'email', eventType: event.event || 'unknown', payload: event } });

      // Handle standard events
      if (event.MessageID || event.message_id) {
        const msgId = event.MessageID || event.message_id;
        if (event.event === 'bounce' || event.type === 'bounce') {
          await prisma.campaignMessage.updateMany({ where: { providerMessageId: msgId }, data: { status: 'BOUNCED', failedAt: new Date() } });
          const email = event.Email || event.email || event.recipient;
          if (email) await prisma.suppressionEntry.create({ data: { email, reason: 'BOUNCED', source: 'webhook' } }).catch(() => {});
        }
        if (event.event === 'unsubscribe' || event.type === 'unsubscribe') {
          const email = event.Email || event.email || event.recipient;
          if (email) {
            await prisma.contact.updateMany({ where: { email }, data: { emailUnsubscribed: true, emailUnsubscribedAt: new Date() } });
            await prisma.suppressionEntry.create({ data: { email, reason: 'UNSUBSCRIBED', source: 'webhook' } }).catch(() => {});
          }
        }
      }
    }
  } catch (err) {
    logger.error({ err }, 'Email webhook processing error');
  }
});

export default router;
