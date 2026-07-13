import { createRule } from '../createRule';
import { REMINDER_PATTERNS } from '../patterns';

export const minhagSegulahReminderRules = [
  createRule({
    id: 'tfilat_hashelah',
    category: 'minhag_segulah',
    title: 'תפילת השל״ה',
    message: 'היום ערב ראש חודש סיוון. נהגו לומר תפילת השל״ה.',
    triggerType: 'special_calendar_pattern',
    patternId: REMINDER_PATTERNS.erevRoshChodeshSivan,
  }),
  createRule({
    id: 'yom_kippur_katan',
    category: 'minhag_segulah',
    title: 'יום כיפור קטן',
    message: 'היום ערב ראש חודש. יש הנוהגים לומר תפילות יום כיפור קטן.',
    triggerType: 'special_calendar_pattern',
    patternId: REMINDER_PATTERNS.yomKippurKatan,
  }),
];
