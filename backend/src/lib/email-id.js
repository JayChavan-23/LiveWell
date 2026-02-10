export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function trimString(s) {
  return typeof s === 'string' ? s.trim() : s;
}
