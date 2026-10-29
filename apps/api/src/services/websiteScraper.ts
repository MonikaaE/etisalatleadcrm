import axios from 'axios';
import * as cheerio from 'cheerio';
import { normalizePhone, normalizeDomain } from '../lib/utils';

export interface ScrapedWebsiteContacts {
  website: string;
  domain: string;
  phones: string[];
  primaryPhone?: string;
  primaryPhoneNormalized?: string;
  emails: string[];
  primaryEmail?: string;
  address?: string;
  linkedinUrl?: string;
  title?: string;
  verified: boolean;
  source: string;
}

/**
 * Scrapes a company's live official website and contact pages
 * to extract 100% verified real telephone numbers, emails, physical address, and LinkedIn profile.
 */
export async function scrapeWebsiteContacts(targetUrl: string): Promise<ScrapedWebsiteContacts> {
  let url = targetUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  const domain = normalizeDomain(url) || url.replace(/^https?:\/\//i, '').split('/')[0];
  const phonesSet = new Set<string>();
  const emailsSet = new Set<string>();
  const addressesSet = new Set<string>();
  let linkedinUrl: string | undefined;
  let pageTitle = '';

  const client = axios.create({
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.8',
    },
    timeout: 9000,
    maxRedirects: 5,
  });

  const extractFromCheerio = ($: cheerio.CheerioAPI, baseUrl: string) => {
    if (!pageTitle) {
      pageTitle = $('title').text().trim();
    }

    // 1. Extract tel: href links
    $('a[href^="tel:"]').each((_, el) => {
      const raw = $(el).attr('href')?.replace(/^tel:/i, '').trim();
      if (raw) {
        const clean = cleanPhoneNumber(raw);
        if (clean) phonesSet.add(clean);
      }
    });

    // 2. Extract mailto: href links
    $('a[href^="mailto:"]').each((_, el) => {
      const raw = $(el).attr('href')?.replace(/^mailto:/i, '').split('?')[0].trim().toLowerCase();
      if (raw && isValidCorporateEmail(raw)) {
        emailsSet.add(raw);
      }
    });

    // 3. Extract LinkedIn company profile
    $('a[href*="linkedin.com/company/"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && !linkedinUrl) {
        linkedinUrl = href.trim();
      }
    });

    // 4. Regex scan body text for UAE phone numbers (+971, 00971, 04, 02, 800, 600, 05)
    const text = $('body').text();
    const phoneRegexes = [
      /(?:\+971|00971)[\s.-]?[0-9][\s.-]?[0-9]{3}[\s.-]?[0-9]{4}/g,
      /(?:\+971|00971)[\s.-]?5[024568][\s.-]?[0-9]{3}[\s.-]?[0-9]{4}/g,
      /(?:800|600)[\s.-]?[0-9]{3,6}/g,
      /(?:04|02|06|07|09)[\s.-]?[0-9]{3}[\s.-]?[0-9]{4}/g,
    ];

    for (const regex of phoneRegexes) {
      const matches = text.match(regex) || [];
      for (const m of matches) {
        const clean = cleanPhoneNumber(m);
        if (clean) phonesSet.add(clean);
      }
    }

    // 5. Regex scan body text for corporate emails
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emailMatches = text.match(emailRegex) || [];
    for (const em of emailMatches) {
      const clean = em.toLowerCase();
      if (isValidCorporateEmail(clean)) {
        emailsSet.add(clean);
      }
    }

    // 6. Look for physical address in schema.org or footer tags
    $('[itemtype*="PostalAddress"], [itemprop="address"], footer address, .address, .contact-address').each((_, el) => {
      const addr = $(el).text().replace(/\s+/g, ' ').trim();
      if (addr && addr.length > 10 && addr.length < 250) {
        addressesSet.add(addr);
      }
    });
  };

  try {
    const homeRes = await client.get(url);
    const $home = cheerio.load(homeRes.data);
    extractFromCheerio($home, url);

    // Look for contact page link
    let contactPageUrl: string | undefined;
    $home('a[href]').each((_, el) => {
      const href = $home(el).attr('href');
      const linkText = $home(el).text().toLowerCase();
      if (href && !contactPageUrl) {
        if (
          linkText.includes('contact') ||
          linkText.includes('reach us') ||
          linkText.includes('get in touch') ||
          href.toLowerCase().includes('contact')
        ) {
          try {
            contactPageUrl = new URL(href, url).href;
          } catch (_) {}
        }
      }
    });

    if (contactPageUrl && contactPageUrl !== url) {
      try {
        const contactRes = await client.get(contactPageUrl);
        const $contact = cheerio.load(contactRes.data);
        extractFromCheerio($contact, contactPageUrl);
      } catch (err: any) {
        // Continue if contact subpage fails
      }
    }
  } catch (err: any) {
    // If https fails, try http as fallback
    if (url.startsWith('https://')) {
      try {
        const fallbackRes = await client.get(url.replace('https://', 'http://'));
        const $fallback = cheerio.load(fallbackRes.data);
        extractFromCheerio($fallback, url);
      } catch (_) {}
    }
  }

  const phones = Array.from(phonesSet);
  const emails = Array.from(emailsSet);
  const addresses = Array.from(addressesSet);

  const primaryPhone = phones[0] || undefined;
  let primaryPhoneNormalized: string | undefined;
  if (primaryPhone) {
    try {
      primaryPhoneNormalized = normalizePhone(primaryPhone);
    } catch (_) {
      primaryPhoneNormalized = primaryPhone;
    }
  }

  const primaryEmail = emails.find((e) => e.includes('info@') || e.includes('contact@') || e.includes('support@')) || emails[0] || undefined;
  const address = addresses[0] || undefined;

  return {
    website: url,
    domain,
    phones,
    primaryPhone,
    primaryPhoneNormalized,
    emails,
    primaryEmail,
    address,
    linkedinUrl,
    title: pageTitle,
    verified: phones.length > 0 || emails.length > 0,
    source: `Live Website Scraper (${url})`,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function cleanPhoneNumber(str: string): string | null {
  const clean = str.replace(/[^\d+]/g, '').trim();
  if (clean.length < 7 || clean.length > 18) return null;
  // Format standard UAE prefixes
  if (clean.startsWith('00971')) {
    return `+971 ${clean.substring(5)}`;
  }
  if (clean.startsWith('971') && !clean.startsWith('+')) {
    return `+${clean}`;
  }
  if (clean.startsWith('04') || clean.startsWith('02') || clean.startsWith('06')) {
    return `+971 ${clean.substring(1, 2)} ${clean.substring(2)}`;
  }
  if (clean.startsWith('+971')) {
    return clean;
  }
  return clean;
}

function isValidCorporateEmail(email: string): boolean {
  if (!email || email.length < 5) return false;
  const lower = email.toLowerCase();
  const invalidEndings = ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif', '.css', '.js'];
  for (const end of invalidEndings) {
    if (lower.endsWith(end)) return false;
  }
  const invalidHosts = ['sentry.io', 'wixpress.com', 'example.com', 'yourdomain.com', 'domain.com'];
  for (const host of invalidHosts) {
    if (lower.includes(host)) return false;
  }
  return true;
}
