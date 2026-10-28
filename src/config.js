export const CONNECTION_STORAGE_KEY = '@inktrail/connection-url';
// Historical public demo, created October 11, 2026. Never use it as a new default.
const LEGACY_DEMO_HOST = 'ca491042a4a2e9cd0092.free.beeceptor.com';

export function isLegacyDemoUrl(value) {
  try {return new URL(value).hostname === LEGACY_DEMO_HOST;} catch {return false;}
}

export function normalizeBaseUrl(value) {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  let url;
  try {url = new URL(trimmed);} catch {throw new Error('Enter a complete HTTPS endpoint URL.');}
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new Error('Use an HTTPS base URL without credentials, query parameters, or a fragment.');
  }
  if (url.pathname.endsWith('/entries') || url.pathname.endsWith('/lists')) {
    throw new Error('Use the base URL, without /entries or /lists at the end.');
  }
  if (/^your[-_]project\./i.test(url.hostname)) {
    throw new Error('Replace the example URL with the exact HTTPS base URL from your MockAPI project.');
  }
  return trimmed;
}

export function getTrackerConnection(saved, configured = '') {
  let defaultUrl = '';
  let configurationError = null;
  try {
    const normalized = normalizeBaseUrl(configured);
    if (!isLegacyDemoUrl(normalized)) defaultUrl = normalized;
  } catch (error) {
    configurationError = error.message;
  }
  // Keep explicit choices, including disconnect (''). Moving a library is deliberate.
  return { baseUrl: normalizeBaseUrl(saved ?? defaultUrl), defaultUrl, configurationError };
}
