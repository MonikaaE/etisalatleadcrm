"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskSchema = exports.contactSchema = exports.companySchema = exports.registerSchema = exports.loginSchema = exports.TaskType = exports.TaskStatus = exports.CampaignStatus = exports.CampaignType = exports.Priority = exports.EMIRATE_LABELS = exports.Emirate = exports.INDUSTRY_LABELS = exports.Industry = exports.PIPELINE_STAGE_LABELS = exports.PIPELINE_STAGES = exports.LeadStatus = exports.UserRole = void 0;
const zod_1 = require("zod");
// ─────────────────────────────────────────────────────────────
// ENUMS (mirroring Prisma enums for frontend use)
// ─────────────────────────────────────────────────────────────
exports.UserRole = {
    ADMIN: 'ADMIN',
    SALES_MANAGER: 'SALES_MANAGER',
    SALES_REP: 'SALES_REP',
    ANALYST: 'ANALYST',
};
exports.LeadStatus = {
    NEW: 'NEW',
    NEEDS_REVIEW: 'NEEDS_REVIEW',
    QUALIFIED: 'QUALIFIED',
    CONTACTED: 'CONTACTED',
    ENGAGED: 'ENGAGED',
    MEETING_BOOKED: 'MEETING_BOOKED',
    PROPOSAL_SENT: 'PROPOSAL_SENT',
    WON: 'WON',
    LOST: 'LOST',
    DISQUALIFIED: 'DISQUALIFIED',
};
exports.PIPELINE_STAGES = [
    'NEW', 'NEEDS_REVIEW', 'QUALIFIED', 'CONTACTED',
    'ENGAGED', 'MEETING_BOOKED', 'PROPOSAL_SENT', 'WON', 'LOST',
];
exports.PIPELINE_STAGE_LABELS = {
    NEW: 'New',
    NEEDS_REVIEW: 'Needs Review',
    QUALIFIED: 'Qualified',
    CONTACTED: 'Contacted',
    ENGAGED: 'Engaged',
    MEETING_BOOKED: 'Meeting Booked',
    PROPOSAL_SENT: 'Proposal/Offer',
    WON: 'Won',
    LOST: 'Lost',
    DISQUALIFIED: 'Disqualified',
};
exports.Industry = {
    CONSTRUCTION: 'CONSTRUCTION',
    REAL_ESTATE: 'REAL_ESTATE',
    LOGISTICS: 'LOGISTICS',
    HEALTHCARE: 'HEALTHCARE',
    EDUCATION: 'EDUCATION',
    RETAIL: 'RETAIL',
    HOSPITALITY: 'HOSPITALITY',
    MANUFACTURING: 'MANUFACTURING',
    PROFESSIONAL_SERVICES: 'PROFESSIONAL_SERVICES',
    IT_TECHNOLOGY: 'IT_TECHNOLOGY',
    TRADING: 'TRADING',
    FINANCE: 'FINANCE',
    MEDIA: 'MEDIA',
    TELECOM: 'TELECOM',
    ENERGY: 'ENERGY',
    GOVERNMENT: 'GOVERNMENT',
    OTHER: 'OTHER',
};
exports.INDUSTRY_LABELS = {
    CONSTRUCTION: 'Construction',
    REAL_ESTATE: 'Real Estate',
    LOGISTICS: 'Logistics & Transport',
    HEALTHCARE: 'Healthcare',
    EDUCATION: 'Education',
    RETAIL: 'Retail',
    HOSPITALITY: 'Hospitality & Tourism',
    MANUFACTURING: 'Manufacturing',
    PROFESSIONAL_SERVICES: 'Professional Services',
    IT_TECHNOLOGY: 'IT & Technology',
    TRADING: 'Trading',
    FINANCE: 'Finance & Banking',
    MEDIA: 'Media & Marketing',
    TELECOM: 'Telecom',
    ENERGY: 'Energy & Utilities',
    GOVERNMENT: 'Government',
    OTHER: 'Other',
};
exports.Emirate = {
    ABU_DHABI: 'ABU_DHABI',
    DUBAI: 'DUBAI',
    SHARJAH: 'SHARJAH',
    AJMAN: 'AJMAN',
    UMM_AL_QUWAIN: 'UMM_AL_QUWAIN',
    RAS_AL_KHAIMAH: 'RAS_AL_KHAIMAH',
    FUJAIRAH: 'FUJAIRAH',
};
exports.EMIRATE_LABELS = {
    ABU_DHABI: 'Abu Dhabi',
    DUBAI: 'Dubai',
    SHARJAH: 'Sharjah',
    AJMAN: 'Ajman',
    UMM_AL_QUWAIN: 'Umm Al Quwain',
    RAS_AL_KHAIMAH: 'Ras Al Khaimah',
    FUJAIRAH: 'Fujairah',
};
exports.Priority = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    URGENT: 'URGENT',
};
exports.CampaignType = { EMAIL: 'EMAIL', WHATSAPP: 'WHATSAPP' };
exports.CampaignStatus = {
    DRAFT: 'DRAFT',
    PENDING_APPROVAL: 'PENDING_APPROVAL',
    APPROVED: 'APPROVED',
    SCHEDULED: 'SCHEDULED',
    RUNNING: 'RUNNING',
    PAUSED: 'PAUSED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    FAILED: 'FAILED',
};
exports.TaskStatus = {
    OPEN: 'OPEN',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
};
exports.TaskType = {
    CALL: 'CALL',
    EMAIL: 'EMAIL',
    MEETING: 'MEETING',
    FOLLOW_UP: 'FOLLOW_UP',
    DEMO: 'DEMO',
    PROPOSAL: 'PROPOSAL',
    OTHER: 'OTHER',
};
// ─────────────────────────────────────────────────────────────
// ZOD SCHEMAS
// ─────────────────────────────────────────────────────────────
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    firstName: zod_1.z.string().min(1, 'First name is required'),
    lastName: zod_1.z.string().min(1, 'Last name is required'),
    role: zod_1.z.enum(['ADMIN', 'SALES_MANAGER', 'SALES_REP', 'ANALYST']).optional(),
});
exports.companySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Company name is required'),
    tradingName: zod_1.z.string().optional(),
    industry: zod_1.z.enum(['CONSTRUCTION', 'REAL_ESTATE', 'LOGISTICS', 'HEALTHCARE', 'EDUCATION', 'RETAIL', 'HOSPITALITY', 'MANUFACTURING', 'PROFESSIONAL_SERVICES', 'IT_TECHNOLOGY', 'TRADING', 'FINANCE', 'MEDIA', 'TELECOM', 'ENERGY', 'GOVERNMENT', 'OTHER']).optional(),
    businessCategory: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    website: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    domain: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    phone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    area: zod_1.z.string().optional(),
    emirate: zod_1.z.enum(['ABU_DHABI', 'DUBAI', 'SHARJAH', 'AJMAN', 'UMM_AL_QUWAIN', 'RAS_AL_KHAIMAH', 'FUJAIRAH']).optional(),
    country: zod_1.z.string().optional(),
    leadStatus: zod_1.z.enum(['NEW', 'NEEDS_REVIEW', 'QUALIFIED', 'CONTACTED', 'ENGAGED', 'MEETING_BOOKED', 'PROPOSAL_SENT', 'WON', 'LOST', 'DISQUALIFIED']).optional(),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    assignedToId: zod_1.z.string().optional(),
    followUpDate: zod_1.z.string().optional(),
    potentialSimQty: zod_1.z.number().optional(),
    existingProvider: zod_1.z.string().optional(),
    multiSiteRequired: zod_1.z.boolean().optional(),
    roamingRequired: zod_1.z.boolean().optional(),
    purchaseTimeline: zod_1.z.string().optional(),
    estimatedValue: zod_1.z.number().optional(),
    notes: zod_1.z.string().optional(),
});
exports.contactSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, 'First name is required'),
    lastName: zod_1.z.string().min(1, 'Last name is required'),
    title: zod_1.z.string().optional(),
    department: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    phone: zod_1.z.string().optional(),
    companyId: zod_1.z.string().optional(),
    assignedToId: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
exports.taskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required'),
    description: zod_1.z.string().optional(),
    type: zod_1.z.enum(['CALL', 'EMAIL', 'MEETING', 'FOLLOW_UP', 'DEMO', 'PROPOSAL', 'OTHER']).optional(),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    dueDate: zod_1.z.string().optional(),
    companyId: zod_1.z.string().optional(),
    contactId: zod_1.z.string().optional(),
    assigneeId: zod_1.z.string().optional(),
});
//# sourceMappingURL=index.js.map