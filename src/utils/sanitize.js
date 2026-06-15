const MAX_STRING_LENGTH = 500;
const ALLOWED_CATEGORIES = ['Estudios', 'Gimnasio', 'Comida', 'Transporte', 'Entretenimiento', 'Vivienda', 'Salud', 'Suscripciones', 'Otros'];
const ALLOWED_TIPOS = ['gasto', 'ingreso'];

const CSV_FORMULA_PREFIXES = ['=', '+', '-', '@', '\t', '\n', '\r'];

export function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>&"'`]/g, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, MAX_STRING_LENGTH);
}

export function sanitizeCSVField(value) {
  if (typeof value !== 'string') value = String(value ?? '');
  const cleaned = value.replace(/"/g, '""');
  if (CSV_FORMULA_PREFIXES.includes(cleaned.charAt(0))) {
    return "'" + cleaned;
  }
  return cleaned;
}

export function validateEnum(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

export function safeParseFloat(value, fallback = 0) {
  const num = parseFloat(value);
  return isNaN(num) || !isFinite(num) ? fallback : Math.max(0, num);
}

export { ALLOWED_CATEGORIES, ALLOWED_TIPOS };
