export function normalizePhone(phone: string): string {
  // Remove spaces, dashes, parentheses
  let normalized = phone.replace(/[\s\-().]/g, '');

  // UAE numbers: if starts with 05, convert to +9715
  if (normalized.startsWith('05')) normalized = '+971' + normalized.slice(1);
  // If starts with 5 (without 0), assume UAE mobile
  else if (normalized.match(/^5[0-9]{8}$/)) normalized = '+971' + normalized;
  // If starts with 971, add +
  else if (normalized.startsWith('971')) normalized = '+' + normalized;
  // International format: keep as-is if already has +
  else if (!normalized.startsWith('+')) {
    // Prepend +971 for UAE numbers that don't have country code
    if (normalized.match(/^0[0-9]{9}$/)) normalized = '+971' + normalized.slice(1);
  }

  return normalized;
}

export function normalizeDomain(website: string): string {
  try {
    const url = new URL(website.startsWith('http') ? website : `https://${website}`);
    return url.hostname.replace(/^www\./, '');
  } catch {
    return website.toLowerCase().replace(/^www\./, '');
  }
}

export function normalizeCompanyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\b(llc|fze|fzc|wll|pjsc|psc|ltd|limited|trading|company|co|corp|group)\b\.?/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function paginate(page: number, limit: number) {
  return { skip: (page - 1) * limit, take: limit };
}
