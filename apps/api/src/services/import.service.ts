import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

interface ParseResult {
  headers: string[];
  rows: Record<string, unknown>[];
  totalRows: number;
}

export async function parseFile(filePath: string, originalName: string): Promise<ParseResult> {
  const ext = path.extname(originalName).toLowerCase();
  const buffer = fs.readFileSync(filePath);

  let workbook: XLSX.WorkBook;
  if (ext === '.csv') {
    workbook = XLSX.read(buffer, { type: 'buffer', raw: false });
  } else {
    workbook = XLSX.read(buffer, { type: 'buffer' });
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: false });

  if (raw.length === 0) return { headers: [], rows: [], totalRows: 0 };

  const headers = Object.keys(raw[0]);
  return { headers, rows: raw, totalRows: raw.length };
}

export function normalizeRow(row: Record<string, unknown>, mapping: Record<string, string>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const [colName, fieldName] of Object.entries(mapping)) {
    if (row[colName] !== undefined) {
      normalized[fieldName] = row[colName];
    }
  }
  return normalized;
}

export function validateCompanyRow(row: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (!row.name || String(row.name).trim() === '') errors.push('Company name is required');
  if (row.email && !isValidEmail(String(row.email))) errors.push(`Invalid email: ${row.email}`);
  if (row.website && !isValidUrl(String(row.website))) errors.push(`Invalid website URL: ${row.website}`);

  // Contacts are mandatory for every lead
  const hasContactName =
    (row.contact_name && String(row.contact_name).trim() !== '') ||
    (row.contactName && String(row.contactName).trim() !== '') ||
    (row.contact_first_name && String(row.contact_first_name).trim() !== '') ||
    (row.contactFirstName && String(row.contactFirstName).trim() !== '');
  if (!hasContactName) {
    errors.push('At least one contact (contact_name or contact_first_name) is required per lead');
  }

  return errors;
}

export function validateContactRow(row: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (!row.firstName && !row.fullName) errors.push('First name is required');
  if (!row.lastName && !row.fullName) errors.push('Last name is required');
  if (row.email && !isValidEmail(String(row.email))) errors.push(`Invalid email: ${row.email}`);
  return errors;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidUrl(url: string): boolean {
  try { new URL(url.startsWith('http') ? url : `https://${url}`); return true; } catch { return false; }
}
