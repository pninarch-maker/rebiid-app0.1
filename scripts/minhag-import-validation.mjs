/** Shared validation helpers for minhag exact-date import (Node scripts). */

const HEBREW_MONTHS = new Set([
  'תשרי',
  'חשוון',
  'חשון',
  'מרחשוון',
  'כסלו',
  'טבת',
  'שבט',
  'אדר',
  'אדר א׳',
  'אדר א',
  'אדר ב׳',
  'אדר ב',
  'ניסן',
  'אייר',
  'סיוון',
  'תמוז',
  'אב',
  'אלול',
]);

const SHABBAT_MARKERS = [
  'שבת',
  'השבת',
  'פרשת',
  'פרשה',
  'יום שלישי בשבוע',
  'שני–חמישי–שני',
];

const RELATIVE_MARKERS = [
  'בחודש',
  'בחודש הבא',
  'בחודש הקודם',
  'במהלך החודש',
  'לאחר היום השמיני של חנוכה',
  'ל״ג בעומר / שבועות',
];

function stripTimingPrefix(value) {
  return value
    .replace(/^(ליל|ערב|מוצאי|בוקר|מוסף)\s+/u, '')
    .replace(/\s+לפני השקיעה$/u, '')
    .trim();
}

function hasHebrewDayToken(value) {
  const cleaned = stripTimingPrefix(value);
  if (!cleaned) {
    return false;
  }

  if (cleaned.includes('בחודש') || cleaned.includes('בעומר')) {
    return true;
  }

  const monthMatch = cleaned.match(/\s([א-ת״׳' ]+)$/u);
  if (monthMatch && HEBREW_MONTHS.has(monthMatch[1].trim())) {
    const dayPart = cleaned.slice(0, monthMatch.index).trim();
    return dayPart.length > 0;
  }

  if (cleaned.includes('–') || cleaned.includes('-')) {
    const [start, end] = cleaned.split(/[–-]/);
    return hasHebrewDayToken(start) && hasHebrewDayToken(end);
  }

  return /[א-ת״׳'0-9]/u.test(cleaned);
}

export function isExactDateExpressionValid(expression, recordMonth, rule = '', isEnd = false) {
  const trimmed = String(expression ?? '').trim();
  if (!trimmed) {
    return isEnd;
  }

  if (trimmed.startsWith('עד ')) {
    return hasHebrewDayToken(trimmed.replace(/^עד\s+/u, ''));
  }

  if (SHABBAT_MARKERS.some((marker) => trimmed.includes(marker))) {
    return true;
  }

  if (RELATIVE_MARKERS.some((marker) => trimmed.includes(marker))) {
    return true;
  }

  if (trimmed.includes('ליל ויום')) {
    return hasHebrewDayToken(trimmed.replace(/^ליל ויום\s+/u, ''));
  }

  if (rule.includes('ימי חנוכה') || trimmed.includes('חנוכה')) {
    return true;
  }

  return hasHebrewDayToken(trimmed);
}
