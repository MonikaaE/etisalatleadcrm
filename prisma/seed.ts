import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Kyzen Etisalat B2B Platform...');

  const passwordHash = await bcrypt.hash('Admin@123456', 12);

  // 1. Seed Roles & Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@kyzen.ae' },
    update: {},
    create: {
      email: 'admin@kyzen.ae',
      passwordHash,
      firstName: 'Tariq',
      lastName: 'Al Hashimi',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@kyzen.ae' },
    update: {},
    create: {
      email: 'manager@kyzen.ae',
      passwordHash,
      firstName: 'Fatima',
      lastName: 'Zahra',
      role: 'SALES_MANAGER',
      status: 'ACTIVE',
    },
  });

  const rep = await prisma.user.upsert({
    where: { email: 'rep@kyzen.ae' },
    update: {},
    create: {
      email: 'rep@kyzen.ae',
      passwordHash,
      firstName: 'Rashid',
      lastName: 'Khan',
      role: 'SALES_REP',
      status: 'ACTIVE',
    },
  });

  const analyst = await prisma.user.upsert({
    where: { email: 'analyst@kyzen.ae' },
    update: {},
    create: {
      email: 'analyst@kyzen.ae',
      passwordHash,
      firstName: 'Omar',
      lastName: 'Mansoor',
      role: 'ANALYST',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Users seeded: admin@kyzen.ae, manager@kyzen.ae, rep@kyzen.ae, analyst@kyzen.ae');

  // 2. Seed Lead Sources
  const sourcesData = [
    {
      key: 'dubai_chamber',
      name: 'Dubai Chamber of Commerce Directory',
      type: 'REGISTRY',
      description: 'Official commercial member directory across Dubai Freezones and Mainland.',
      status: 'ACTIVE',
    },
    {
      key: 'ded_mainland',
      name: 'Dubai Economy & Tourism (DED) License Registry',
      type: 'REGISTRY',
      description: 'Commercial registry of active mainland business entities and trade licenses.',
      status: 'ACTIVE',
    },
    {
      key: 'jafza_freezone',
      name: 'Jebel Ali Free Zone (JAFZA) Directory',
      type: 'REGISTRY',
      description: 'Industrial and logistics enterprise tenants in JAFZA.',
      status: 'ACTIVE',
    },
    {
      key: 'uae_yellowpages',
      name: 'Etisalat Yellow Pages UAE',
      type: 'PUBLIC_DIRECTORY',
      description: 'Public business telephone directory curated by e& (Etisalat).',
      status: 'ACTIVE',
    },
    {
      key: 'manual',
      name: 'Manual & CSV Ingestion',
      type: 'CSV_IMPORT',
      description: 'Direct sales rep and analyst lead imports.',
      status: 'ACTIVE',
    },
  ];

  for (const src of sourcesData) {
    await prisma.leadSource.upsert({
      where: { key: src.key },
      update: {},
      create: src,
    });
  }

  console.log('✅ Lead sources seeded.');

  // 3. Seed Realistic Dubai B2B Companies
  const companiesData = [
    {
      name: 'Al Naboodah Construction Group LLC',
      emirate: 'DUBAI' as const,
      address: 'Al Awir Road, Ras Al Khor Industrial 3',
      phone: '+97142948888',
      email: 'info@alnaboodah-construction.ae',
      website: 'https://alnaboodahconstruction.com',
      domain: 'alnaboodahconstruction.com',
      industry: 'CONSTRUCTION' as const,
      employeeSizeBand: '1000+',
      potentialSimQty: 250,
      score: 92,
      leadStatus: 'QUALIFIED' as const,
    },
    {
      name: 'Apex Global Logistics FZE',
      emirate: 'DUBAI' as const,
      address: 'JAFZA South, Gate 4, Warehouse 12',
      phone: '+97148819200',
      email: 'contact@apexlogistics-me.com',
      website: 'https://apexlogistics-me.com',
      domain: 'apexlogistics-me.com',
      industry: 'LOGISTICS' as const,
      employeeSizeBand: '201-500',
      potentialSimQty: 85,
      score: 88,
      leadStatus: 'MEETING_BOOKED' as const,
    },
    {
      name: 'Gulf Horizon General Trading LLC',
      emirate: 'DUBAI' as const,
      address: 'Deira Business Center, Baniyas Square',
      phone: '+97142289100',
      email: 'procurement@gulfhorizon-trading.ae',
      website: 'https://gulfhorizon-trading.ae',
      domain: 'gulfhorizon-trading.ae',
      industry: 'TRADING' as const,
      employeeSizeBand: '51-200',
      potentialSimQty: 30,
      score: 74,
      leadStatus: 'CONTACTED' as const,
    },
    {
      name: 'CloudCore Technologies FZ-LLC',
      emirate: 'DUBAI' as const,
      address: 'Dubai Internet City, Building 14',
      phone: '+97143912000',
      email: 'ops@cloudcore.ae',
      website: 'https://cloudcore.ae',
      domain: 'cloudcore.ae',
      industry: 'IT_TECHNOLOGY' as const,
      employeeSizeBand: '51-200',
      potentialSimQty: 45,
      score: 82,
      leadStatus: 'PROPOSAL_SENT' as const,
    },
    {
      name: 'Emirates Care Medical Center LLC',
      emirate: 'SHARJAH' as const,
      address: 'Al Wahda Street, Industrial Area 4',
      phone: '+97165330122',
      email: 'admin@emiratescare-mc.ae',
      website: 'https://emiratescare-mc.ae',
      domain: 'emiratescare-mc.ae',
      industry: 'HEALTHCARE' as const,
      employeeSizeBand: '51-200',
      potentialSimQty: 25,
      score: 68,
      leadStatus: 'NEW' as const,
    },
  ];

  for (const comp of companiesData) {
    const createdComp = await prisma.company.upsert({
      where: {
        domain_isDeleted: {
          domain: comp.domain,
          isDeleted: false,
        },
      },
      update: {
        ...comp,
        assignedToId: rep.id,
      },
      create: {
        ...comp,
        assignedToId: rep.id,
      },
    });

    // Create Contacts for this company
    if (comp.name.includes('Al Naboodah')) {
      const contact = await prisma.contact.upsert({
        where: {
          email_isDeleted: {
            email: 'm.suwaidi@alnaboodah-construction.ae',
            isDeleted: false,
          },
        },
        update: {
          company: { connect: { id: createdComp.id } },
        },
        create: {
          company: { connect: { id: createdComp.id } },
          firstName: 'Mohammed',
          lastName: 'Al Suwaidi',
          fullName: 'Mohammed Al Suwaidi',
          title: 'Government Relations & PRO Director',
          department: 'PRO',
          email: 'm.suwaidi@alnaboodah-construction.ae',
          phone: '+971501234567',
          emailOptIn: true,
          whatsappOptIn: true,
        },
      });

      const existingTask = await prisma.task.findFirst({
        where: { companyId: createdComp.id, title: 'Present 250-line CUG (Closed User Group) proposal' },
      });

      if (!existingTask) {
        await prisma.task.create({
          data: {
            company: { connect: { id: createdComp.id } },
            title: 'Present 250-line CUG (Closed User Group) proposal',
            type: 'MEETING',
            priority: 'URGENT',
            status: 'OPEN',
            assignee: { connect: { id: rep.id } },
            creator: { connect: { id: rep.id } },
            dueDate: new Date(Date.now() + 86400000 * 2),
          },
        });
      }
    }

    if (comp.name.includes('Apex Global')) {
      const contact = await prisma.contact.upsert({
        where: {
          email_isDeleted: {
            email: 'v.menon@apexlogistics-me.com',
            isDeleted: false,
          },
        },
        update: {
          company: { connect: { id: createdComp.id } },
        },
        create: {
          company: { connect: { id: createdComp.id } },
          firstName: 'Vikram',
          lastName: 'Menon',
          fullName: 'Vikram Menon',
          title: 'Head of Fleet & Operations',
          department: 'IT_TELECOM',
          email: 'v.menon@apexlogistics-me.com',
          phone: '+971559876543',
          emailOptIn: true,
          whatsappOptIn: true,
        },
      });

      // Seed a WhatsApp conversation
      let conv = await prisma.conversation.findFirst({
        where: { phoneNumber: '+971559876543' },
      });

      if (!conv) {
        conv = await prisma.conversation.create({
          data: {
            phoneNumber: '+971559876543',
            assignedTo: { connect: { id: rep.id } },
            isOpen: true,
            lastMessageAt: new Date(),
          },
        });

        await prisma.conversationContact.create({
          data: { conversationId: conv.id, contactId: contact.id },
        });

        await prisma.conversationMessage.create({
          data: {
            conversationId: conv.id,
            direction: 'inbound',
            type: 'text',
            body: 'Hello Kyzen team, our current telecom contract expires next month. We need 85 data SIMs for our drivers.',
            sentAt: new Date(Date.now() - 3600000 * 2),
            status: 'DELIVERED',
          },
        });

        await prisma.conversationMessage.create({
          data: {
            conversationId: conv.id,
            direction: 'outbound',
            type: 'text',
            body: 'Hello Vikram! Thank you for contacting Kyzen. As an Etisalat authorized partner, we can offer custom Business Shared Data pools and subsidized handsets.',
            sentAt: new Date(Date.now() - 3600000),
            status: 'READ',
          },
        });
      }
    }
  }

  // 4. Seed WhatsApp & Email Templates
  await prisma.whatsAppTemplate.createMany({
    data: [
      {
        name: 'etisalat_b2b_intro_v1',
        category: 'MARKETING',
        language: 'en',
        status: 'APPROVED',
        previewText: 'Marhaba {{1}}, this is Rashid from Kyzen Telecom, authorized Etisalat Channel Partner in Dubai...',
        components: [
          {
            type: 'BODY',
            text: 'Marhaba {{1}}, this is Rashid from Kyzen Telecom, authorized Etisalat Channel Partner in Dubai. We are assisting companies in {{2}} to reduce corporate mobile expenses with our 2026 Business SIM bundles. Would you be open for a quick 5-minute comparison?',
          },
        ],
      },
      {
        name: 'cug_fleet_sim_pitch',
        category: 'MARKETING',
        language: 'en',
        status: 'APPROVED',
        previewText: 'Hello {{1}}, noticed that {{2}} manages fleet operations...',
        components: [
          {
            type: 'BODY',
            text: 'Hello {{1}}, noticed that {{2}} manages fleet operations. Etisalat currently offers zero-rated intra-company calls (CUG) + 15GB pooled national data per SIM. Can we send over the tariff sheet?',
          },
        ],
      },
    ],
    skipDuplicates: true,
  });

  await prisma.emailTemplate.createMany({
    data: [
      {
        name: 'etisalat_corporate_quote_email',
        subject: 'Etisalat Corporate Telecom Review for {{company_name}}',
        htmlBody: '<p>Dear {{first_name}},</p><p>As an authorized Etisalat Channel Partner in the UAE, Kyzen provides enterprise clients with customized corporate SIM packages.</p>',
        textBody: 'Dear {{first_name}},\n\nAs an authorized Etisalat Channel Partner in the UAE, Kyzen provides enterprise clients with customized corporate SIM packages.',
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Templates seeded.');
  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
