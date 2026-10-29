import { z } from 'zod';

// ─────────────────────────────────────────────────────────────
// ENUMS (mirroring Prisma enums for frontend use)
// ─────────────────────────────────────────────────────────────

export const UserRole = {
  ADMIN: 'ADMIN',
  SALES_MANAGER: 'SALES_MANAGER',
  SALES_REP: 'SALES_REP',
  ANALYST: 'ANALYST',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const LeadStatus = {
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
} as const;
export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

export const PIPELINE_STAGES: LeadStatus[] = [
  'NEW', 'NEEDS_REVIEW', 'QUALIFIED', 'CONTACTED',
  'ENGAGED', 'MEETING_BOOKED', 'PROPOSAL_SENT', 'WON', 'LOST',
];

export const PIPELINE_STAGE_LABELS: Record<LeadStatus, string> = {
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

export const Industry = {
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
} as const;
export type Industry = (typeof Industry)[keyof typeof Industry];

export const INDUSTRY_LABELS: Record<Industry, string> = {
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

export const Emirate = {
  ABU_DHABI: 'ABU_DHABI',
  DUBAI: 'DUBAI',
  SHARJAH: 'SHARJAH',
  AJMAN: 'AJMAN',
  UMM_AL_QUWAIN: 'UMM_AL_QUWAIN',
  RAS_AL_KHAIMAH: 'RAS_AL_KHAIMAH',
  FUJAIRAH: 'FUJAIRAH',
} as const;
export type Emirate = (typeof Emirate)[keyof typeof Emirate];

export const EMIRATE_LABELS: Record<Emirate, string> = {
  ABU_DHABI: 'Abu Dhabi',
  DUBAI: 'Dubai',
  SHARJAH: 'Sharjah',
  AJMAN: 'Ajman',
  UMM_AL_QUWAIN: 'Umm Al Quwain',
  RAS_AL_KHAIMAH: 'Ras Al Khaimah',
  FUJAIRAH: 'Fujairah',
};

export const Priority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;
export type Priority = (typeof Priority)[keyof typeof Priority];

export const CampaignType = { EMAIL: 'EMAIL', WHATSAPP: 'WHATSAPP' } as const;
export type CampaignType = (typeof CampaignType)[keyof typeof CampaignType];

export const CampaignStatus = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  SCHEDULED: 'SCHEDULED',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
} as const;
export type CampaignStatus = (typeof CampaignStatus)[keyof typeof CampaignStatus];

export const TaskStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskType = {
  CALL: 'CALL',
  EMAIL: 'EMAIL',
  MEETING: 'MEETING',
  FOLLOW_UP: 'FOLLOW_UP',
  DEMO: 'DEMO',
  PROPOSAL: 'PROPOSAL',
  OTHER: 'OTHER',
} as const;
export type TaskType = (typeof TaskType)[keyof typeof TaskType];

// ─────────────────────────────────────────────────────────────
// ZOD SCHEMAS
// ─────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['ADMIN', 'SALES_MANAGER', 'SALES_REP', 'ANALYST']).optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  tradingName: z.string().optional(),
  industry: z.enum(['CONSTRUCTION','REAL_ESTATE','LOGISTICS','HEALTHCARE','EDUCATION','RETAIL','HOSPITALITY','MANUFACTURING','PROFESSIONAL_SERVICES','IT_TECHNOLOGY','TRADING','FINANCE','MEDIA','TELECOM','ENERGY','GOVERNMENT','OTHER']).optional(),
  businessCategory: z.string().optional(),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  domain: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  area: z.string().optional(),
  emirate: z.enum(['ABU_DHABI','DUBAI','SHARJAH','AJMAN','UMM_AL_QUWAIN','RAS_AL_KHAIMAH','FUJAIRAH']).optional(),
  country: z.string().optional(),
  leadStatus: z.enum(['NEW','NEEDS_REVIEW','QUALIFIED','CONTACTED','ENGAGED','MEETING_BOOKED','PROPOSAL_SENT','WON','LOST','DISQUALIFIED']).optional(),
  priority: z.enum(['LOW','MEDIUM','HIGH','URGENT']).optional(),
  assignedToId: z.string().optional(),
  followUpDate: z.string().optional(),
  potentialSimQty: z.number().optional(),
  existingProvider: z.string().optional(),
  multiSiteRequired: z.boolean().optional(),
  roamingRequired: z.boolean().optional(),
  purchaseTimeline: z.string().optional(),
  estimatedValue: z.number().optional(),
  notes: z.string().optional(),
});
export type CompanyInput = z.infer<typeof companySchema>;

export const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  title: z.string().optional(),
  department: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  companyId: z.string().optional(),
  assignedToId: z.string().optional(),
  notes: z.string().optional(),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['CALL','EMAIL','MEETING','FOLLOW_UP','DEMO','PROPOSAL','OTHER']).optional(),
  priority: z.enum(['LOW','MEDIUM','HIGH','URGENT']).optional(),
  dueDate: z.string().optional(),
  companyId: z.string().optional(),
  contactId: z.string().optional(),
  assigneeId: z.string().optional(),
});
export type TaskInput = z.infer<typeof taskSchema>;

// ─────────────────────────────────────────────────────────────
// API TYPES
// ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─────────────────────────────────────────────────────────────
// LEAD SCORING
// ─────────────────────────────────────────────────────────────

export interface ScoreComponent {
  factor: string;
  label: string;
  points: number;
  maxPoints: number;
  reason: string;
}

export interface LeadScore {
  total: number;
  maxPossible: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  components: ScoreComponent[];
}

// ─────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalCompanies: number;
  totalContacts: number;
  newLeads: number;
  qualifiedLeads: number;
  contactedLeads: number;
  openOpportunities: number;
  tasksDueToday: number;
  overdueFollowUps: number;
  companiesByIndustry: { industry: string; count: number }[];
  companiesByEmirate: { emirate: string; count: number }[];
  companiesByStage: { stage: string; count: number }[];
  recentActivities: ActivityItem[];
  integrationStatus: IntegrationStatus[];
}

export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  userId?: string;
  userName?: string;
  createdAt: string;
}

export interface IntegrationStatus {
  key: string;
  name: string;
  status: string;
  lastChecked?: string;
  lastSuccess?: string;
  errorMessage?: string;
}
