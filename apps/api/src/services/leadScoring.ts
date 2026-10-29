import { ScoreComponent, LeadScore } from '@kyzen/shared';

interface ScoredEntity {
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  industry?: string | null;
  emirate?: string | null;
  leadStatus?: string | null;
  employeeSizeBand?: string | null;
  potentialSimQty?: number | null;
  dataConfidence?: number | null;
  lastVerifiedAt?: Date | null;
}

export function calculateLeadScore(entity: ScoredEntity): LeadScore {
  const components: ScoreComponent[] = [];
  let total = 0;

  // Email available
  const emailPoints = entity.email ? 15 : 0;
  components.push({ factor: 'email', label: 'Business Email', points: emailPoints, maxPoints: 15, reason: entity.email ? 'Business email available' : 'No business email found' });
  total += emailPoints;

  // Phone available
  const phonePoints = entity.phone ? 10 : 0;
  components.push({ factor: 'phone', label: 'Business Phone', points: phonePoints, maxPoints: 10, reason: entity.phone ? 'Phone number available' : 'No phone number found' });
  total += phonePoints;

  // Website available
  const webPoints = entity.website ? 10 : 0;
  components.push({ factor: 'website', label: 'Website', points: webPoints, maxPoints: 10, reason: entity.website ? 'Website URL available' : 'No website found' });
  total += webPoints;

  // Industry fit for telecom (high-value industries)
  const highValueIndustries = ['CONSTRUCTION', 'LOGISTICS', 'REAL_ESTATE', 'MANUFACTURING', 'IT_TECHNOLOGY', 'HEALTHCARE'];
  const mediumValueIndustries = ['TRADING', 'RETAIL', 'HOSPITALITY', 'PROFESSIONAL_SERVICES', 'FINANCE'];
  let industryPoints = 0;
  let industryReason = 'Industry not specified';
  if (entity.industry && highValueIndustries.includes(entity.industry)) {
    industryPoints = 20;
    industryReason = `High-value industry for telecom: ${entity.industry}`;
  } else if (entity.industry && mediumValueIndustries.includes(entity.industry)) {
    industryPoints = 12;
    industryReason = `Medium-value industry: ${entity.industry}`;
  } else if (entity.industry) {
    industryPoints = 6;
    industryReason = `Industry present: ${entity.industry}`;
  }
  components.push({ factor: 'industry', label: 'Industry Fit', points: industryPoints, maxPoints: 20, reason: industryReason });
  total += industryPoints;

  // Potential SIM quantity
  let simPoints = 0;
  let simReason = 'No SIM quantity estimate';
  if (entity.potentialSimQty && entity.potentialSimQty > 0) {
    simPoints = entity.potentialSimQty >= 50 ? 20 : entity.potentialSimQty >= 20 ? 14 : entity.potentialSimQty >= 5 ? 8 : 4;
    simReason = `Estimated ${entity.potentialSimQty} SIMs`;
  }
  components.push({ factor: 'simQty', label: 'SIM Quantity Potential', points: simPoints, maxPoints: 20, reason: simReason });
  total += simPoints;

  // Company size
  let sizePoints = 0;
  let sizeReason = 'Company size unknown';
  if (entity.employeeSizeBand) {
    const sizeMap: Record<string, number> = { '1-10': 2, '11-50': 5, '51-200': 10, '201-500': 14, '501-1000': 16, '1000+': 18 };
    sizePoints = sizeMap[entity.employeeSizeBand] || 5;
    sizeReason = `Size band: ${entity.employeeSizeBand}`;
  }
  components.push({ factor: 'companySize', label: 'Company Size', points: sizePoints, maxPoints: 18, reason: sizeReason });
  total += sizePoints;

  // Data verification recency
  let verifyPoints = 0;
  let verifyReason = 'Data not recently verified';
  if (entity.lastVerifiedAt) {
    const daysSince = (Date.now() - entity.lastVerifiedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 30) { verifyPoints = 7; verifyReason = 'Verified within 30 days'; }
    else if (daysSince < 90) { verifyPoints = 5; verifyReason = 'Verified within 90 days'; }
    else if (daysSince < 365) { verifyPoints = 3; verifyReason = 'Verified within a year'; }
  }
  components.push({ factor: 'verification', label: 'Data Freshness', points: verifyPoints, maxPoints: 7, reason: verifyReason });
  total += verifyPoints;

  const maxPossible = 100;
  let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
  if (total >= 80) grade = 'A';
  else if (total >= 60) grade = 'B';
  else if (total >= 40) grade = 'C';
  else if (total >= 20) grade = 'D';

  return { total: Math.min(total, maxPossible), maxPossible, grade, components };
}
