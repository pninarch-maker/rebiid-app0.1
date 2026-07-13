export interface MinhagSegulahTemplate {
  id: string;
  title: string;
  message: string;
}

/** Quick-add templates for optional minhag / segulah / community / family reminders. */
export const MINHAG_SEGULAH_TEMPLATES: MinhagSegulahTemplate[] = [
  {
    id: 'community_custom',
    title: 'מנהג קהילתי',
    message: 'נהגו בקהילה — כדאי לבדוק את פרטי המנהג המקומי.',
  },
  {
    id: 'special_community_prayer',
    title: 'תפילה מיוחדת',
    message: 'תפילה מיוחדת בקהילה — כדאי לבדוק מקום ושעה.',
  },
  {
    id: 'community_yahrzeit',
    title: 'יארצייט קהילתי',
    message: 'יום אזכרה קהילתי — כדאי לבדוק אם יש תפילה או התכנסות.',
  },
  {
    id: 'hillula',
    title: 'יום הילולא',
    message: 'יום הילולא — יש הנוהגים ללמוד ולזכור את הצדיק.',
  },
  {
    id: 'regular_shiur',
    title: 'שיעור או התכנסות קבועה',
    message: 'שיעור או התכנסות קבועה — כדאי להיערך בזמן.',
  },
  {
    id: 'tfilat_hashelah_custom',
    title: 'תפילת השל״ה',
    message: 'נהגו לומר תפילת השל״ה.',
  },
  {
    id: 'perek_shira',
    title: 'פרק שירה',
    message: 'נהגו לומר פרק שירה.',
  },
  {
    id: 'neshmat_kol_chai',
    title: 'נשמת כל חי',
    message: 'נהגו לומר נשמת כל חי.',
  },
  {
    id: 'tikun_klali',
    title: 'תיקון הכללי',
    message: 'נהגו לומר תיקון הכללי.',
  },
  {
    id: 'tehillim',
    title: 'תהילים',
    message: 'נהגו לומר תהילים.',
  },
  {
    id: 'refuah',
    title: 'תפילה לרפואה',
    message: 'זמן טוב לתפילה לרפואת חולים.',
  },
  {
    id: 'parnasa',
    title: 'תפילה לפרנסה',
    message: 'זמן טוב לתפילה לפרנסה.',
  },
  {
    id: 'grave_visit',
    title: 'עלייה לקבר',
    message: 'נהגו לעלות לקבר ביום זה.',
  },
  {
    id: 'family_yahrzeit',
    title: 'יארצייט משפחתי',
    message: 'יארצייט משפחתי — כדאי להדליק נר ולזכור.',
  },
  {
    id: 'family_azkara',
    title: 'אזכרה',
    message: 'יום אזכרה משפחתי — כדאי לזכור ולהתכנס.',
  },
  {
    id: 'family_annual_minhag',
    title: 'מנהג משפחתי שנתי',
    message: 'מנהג משפחתי שנתי — כדאי לשמור על המסורת.',
  },
  {
    id: 'hebrew_recurring_date',
    title: 'תאריך עברי חוזר',
    message: 'תאריך עברי חוזר — כדאי לזכור ביום זה.',
  },
];
