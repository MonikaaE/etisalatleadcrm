import { prisma } from '../lib/prisma';

interface ComplianceContact {
  id: string;
  email?: string | null;
  phone?: string | null;
  emailOptIn?: boolean;
  emailUnsubscribed?: boolean;
  whatsappOptIn?: boolean;
  whatsappOptedOut?: boolean;
  isDeleted?: boolean;
  markedForReview?: boolean;
}

interface ComplianceResult {
  eligible: boolean;
  reasons: string[];
}

export async function checkCompliance(contact: ComplianceContact, channel: 'EMAIL' | 'WHATSAPP'): Promise<ComplianceResult> {
  const reasons: string[] = [];

  if (contact.isDeleted) { reasons.push('Contact is deleted'); }
  if (contact.markedForReview) { reasons.push('Contact is marked for review'); }

  if (channel === 'EMAIL') {
    if (!contact.email) reasons.push('No email address');
    if (contact.emailUnsubscribed) reasons.push('Contact has unsubscribed from email');
    if (!contact.emailOptIn) reasons.push('No email opt-in consent recorded');

    // Check suppression list
    if (contact.email) {
      const suppressed = await prisma.suppressionEntry.findFirst({ where: { email: contact.email } });
      if (suppressed) reasons.push(`Email in suppression list (reason: ${suppressed.reason})`);
    }
  }

  if (channel === 'WHATSAPP') {
    if (!contact.phone) reasons.push('No phone number');
    if (contact.whatsappOptedOut) reasons.push('Contact has opted out of WhatsApp');
    if (!contact.whatsappOptIn) reasons.push('No WhatsApp opt-in consent recorded');

    // Check suppression list
    if (contact.phone) {
      const suppressed = await prisma.suppressionEntry.findFirst({ where: { phone: contact.phone, channel: 'WHATSAPP' } });
      if (suppressed) reasons.push(`Phone in WhatsApp suppression list (reason: ${suppressed.reason})`);
    }
  }

  // Check global do-not-contact
  const dncEntry = await prisma.suppressionEntry.findFirst({
    where: {
      OR: [
        { contactId: contact.id },
        ...(contact.email ? [{ email: contact.email, reason: 'DO_NOT_CONTACT' }] : []),
      ],
      reason: 'DO_NOT_CONTACT',
    },
  });
  if (dncEntry) reasons.push('Contact is on the global do-not-contact list');

  return { eligible: reasons.length === 0, reasons };
}
