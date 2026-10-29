# KYZEN B2B LEAD INTELLIGENCE, CRM & OUTREACH PLATFORM
### Etisalat Authorized Channel Partner • Dubai, United Arab Emirates

Kyzen is a production-oriented, full-stack B2B lead discovery, intelligence, CRM, and omnichannel outreach platform engineered specifically for selling Etisalat business SIM cards, mobile packages, and corporate telecom services across Dubai, Abu Dhabi, and the Northern Emirates.

---

## 🏛️ System Architecture

The platform is structured as a TypeScript monorepo powered by npm workspaces:

```
etisalatoff/
├── apps/
│   ├── api/            # Express.js REST API with Helmet, Rate Limiter, Pino Logger
│   │   └── src/
│   │       ├── routes/     # Auth, Dashboard, Companies, Contacts, Tasks, Imports,
│   │       │               # Campaigns, Templates, Sources, Webhooks, Admin
│   │       ├── services/   # Lead Scoring Engine, Compliance Checker, Import Parser, Audit
│   │       ├── queues/     # BullMQ Job Queues (Import, Discovery, Campaigns)
│   │       └── middleware/ # JWT Auth, Role-Based Access Control (RBAC), Error Handler
│   │
│   ├── web/            # React 18 / Vite / TailwindCSS SPA with dark glassmorphic UI
│   │   └── src/
│   │       ├── contexts/   # AuthContext with token refresh and RBAC helpers
│   │       ├── components/ # Sidebar, Navbar, Metrics, Filter bars, Modals
│   │       └── pages/      # Dashboard, Companies CRM, Company Detail (360 View),
│   │                       # Contacts (PRO/HR), Tasks Queue, Bulk Import Wizard,
│   │                       # Outreach Campaigns, Message Templates, WhatsApp Shared Inbox,
│   │                       # Suppression & Compliance, System Administration
│   │
│   └── worker/         # BullMQ Background Workers for CSV/XLSX imports and discovery
│       └── src/        # Row validation, deduplication, UAE phone normalization
│
├── packages/
│   └── shared/         # Shared TypeScript interfaces, enums, and Zod schemas
│
├── prisma/
│   ├── schema.prisma   # PostgreSQL schema with 18 relational models
│   └── seed.ts         # Seed script with Dubai B2B demo data & role accounts
│
├── docker-compose.yml  # PostgreSQL 16, Redis 7, and Redis Commander services
└── .env.example        # Environment variable template
```

---

## 🔐 Role-Based Access Control (RBAC)

The application includes 4 distinct roles with strict permission boundaries:

| Role | Permissions & Scope | Demo Account |
| :--- | :--- | :--- |
| **Admin** | Full access to user management, integrations, audit logs, data export | `admin@kyzen.ae` / `Admin@123456` |
| **Sales Manager**| Team pipeline management, campaign approval, rep task assignment | `manager@kyzen.ae` / `Admin@123456` |
| **Sales Rep** | Account management, task scheduling, live WhatsApp inbox, outbound calls | `rep@kyzen.ae` / `Admin@123456` |
| **Analyst** | Read-only analytics, lead scoring inspection, data hygiene reporting | `analyst@kyzen.ae` / `Admin@123456` |

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js**: v20 or later
- **Docker & Docker Compose**: for PostgreSQL and Redis
- **npm**: v10 or later

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Spin up Database and Cache
```bash
docker compose up -d
```
This starts:
- **PostgreSQL**: `localhost:5432` (`kyzen` / `kyzen_dev_password`)
- **Redis**: `localhost:6379`
- **Redis Commander UI**: `http://localhost:8081`

### 4. Install Dependencies & Generate Prisma Client
```bash
npm install
npx prisma generate
npx prisma db push
```

### 5. Seed Demo Data
```bash
npm run seed
```
This seeds:
- 4 pre-configured demo users across all roles
- 5 official UAE lead sources (Dubai Chamber, DED Mainland, JAFZA, Yellow Pages)
- Real Dubai B2B enterprises (Al Naboodah, Apex Global Logistics, CloudCore)
- Contact persons (PROs, Fleet Managers)
- Live WhatsApp conversation threads and approved Etisalat marketing templates

### 6. Run the Full Stack
```bash
# Terminal 1: Backend API (port 4000)
npm run dev:api

# Terminal 2: Background Worker
npm run dev:worker

# Terminal 3: Web Frontend (port 5173)
npm run dev:web
```

Open `http://localhost:5173` in your browser.

---

## 📞 Key Business Features for Etisalat Channel Partners

1. **Transparent Lead Scoring Engine** (`apps/api/src/services/leadScoring.ts`)
   - Industry telecom fit (+20 pts)
   - Estimated business SIM potential (+20 pts)
   - Decision-maker contact availability (+25 pts)
   - Data verification recency (+10 pts)
   - UAE jurisdiction verification (+15 pts)

2. **UAE E.164 Phone Normalization** (`apps/api/src/lib/utils.ts`)
   - Automatically sanitizes and maps `050xxxxxxx`, `055xxxxxxx`, or `50xxxxxxx` into `+97150xxxxxxx`.

3. **WhatsApp Shared Team Inbox** (`apps/web/src/pages/Inbox.tsx`)
   - Real-time 2-way conversation view
   - Private internal team notes (hidden from prospect)
   - Meta WhatsApp Business Cloud Webhook handler with signature validation (`apps/api/src/routes/webhooks.ts`)

4. **UAE Personal Data Protection Compliance** (`apps/api/src/services/compliance.service.ts`)
   - Mandatory opt-in checks before campaign launch
   - Global Suppression / Do-Not-Contact (DNC) list checking
   - Automatic bounce and unsubscribe webhook processing

---

## 🛡️ License
Proprietary & Confidential. Designed for Kyzen Telecom (Etisalat Authorized Channel Partner, Dubai, UAE).
