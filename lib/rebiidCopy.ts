import type { AddressGender } from '@/lib/settingsTypes';

export const REBIID = {
  name: 'REBIID',
  tagline: 'לא צריך לזכור לבד.',
  taglineEn: 'Your Jewish Reminder Companion',
} as const;

export function getAddressTitle(gender: AddressGender = 'male'): string {
  if (gender === 'female') {
    return 'רבנית';
  }
  return 'רבי';
}

export function getTimeOfDayGreeting(
  date: Date = new Date(),
  gender: AddressGender = 'male',
): string {
  const hour = date.getHours();
  const title = getAddressTitle(gender);

  if (hour >= 5 && hour < 12) {
    return `בוקר טוב ${title} ☀️`;
  }
  if (hour >= 12 && hour < 17) {
    return `צהריים טובים ${title} ☀️`;
  }
  if (hour >= 17 && hour < 21) {
    return `ערב טוב ${title} ☀️`;
  }
  return `לילה טוב ${title} 🌙`;
}

export const HomeCopy = {
  subtitle: 'מה קורה היום?',
  yahrzeitsCardTitle: 'לוח הילולות ויארצייט',
  minhagimCardTitle: 'לוח מנהגים וסגולות',
  historyModalTitle: 'מה קרה היום?',
  historyModalSubtitle: 'אירועים בהיסטוריה היהודית לפי התאריך העברי.',
  historyFabAccessibilityLabel: 'מה קרה היום?',
  zmanimTitle: 'זמני היום',
  mainReminderTitle: 'התזכורת הקרובה',
  appearancePrefix: 'יופיע ב:',
  quietMessage: 'היום שקט. אין תזכורת קרובה.',
  showMore: 'הצג עוד',
  emptyYahrzeits: 'אין הילולאות או יארצייטים ליום זה.',
  emptyMinhagim: 'אין מנהגים או סגולות ליום זה.',
  emptyZmanim: 'זמנים לא זמינים כרגע.',
  emptyHistory: 'אין אירועים היסטוריים ליום זה.',
} as const;

export const EmptyCopy = {
  upcomingReminders: 'כרגע אין תזכורות קרובות לפי ההגדרות שלך.',
  calendarDay: 'ביום הזה אין משהו מיוחד לזכור.',
  personalReminders: 'עוד לא הוספת תזכורות משלך.',
  notificationsPermission:
    'כדי ש־REBIID יוכל להזכיר לך בזמן, צריך לאשר התראות במכשיר. ההתראות נשארות מקומיות — בלי שרת ובלי מעקב.',
  notificationsDisabled: 'התזכורות כבויות כרגע. אפשר להפעיל אותן בהגדרות.',
} as const;

export const PrivacyCopy = {
  title: 'פרטיות',
  tagline: 'הנתונים שלך נשארים אצלך.',
  summary:
    'REBIID לא דורש חשבון, לא עוקב אחריך, ולא שולח מידע לשום שרת. הכל עובד על המכשיר שלך.',
  bullets: [
    'אין צורך בהרשמה או חשבון',
    'אין מעקב ואין אנליטיקה',
    'אין שרת — הכל נשמר על המכשיר',
    'לא נדרש אינטרנט לשימוש יומיומי',
    'הגדרות ותזכורות נשמרות מקומית בלבד',
    'התראות מקומיות בלבד — בלי דחיפה מרחוק',
  ],
  notificationsNote:
    'כשמפעילים תזכורות, המכשיר יבקש הרשאת התראות. REBIID משתמש בה רק לתזמון מקומי על המכשיר — בלי שרת, בלי מעקב, ובלי שליחת מידע החוצה.',
  aboutNote:
    'הפרטיות שלך חשובה לנו: אין חשבון, אין מעקב, אין שרת. הנתונים נשארים על המכשיר, והתזכורות מתוזמנות מקומית בלבד.',
} as const;

export const AccessibilityCopy = {
  title: 'נגישות, משוב ועדכונים',
  text:
    'REBIID שואפת להיות נגישה, מדויקת ומתעדכנת באופן שוטף.\n' +
    'נתקלתם בבעיית נגישות, מצאתם מידע הדורש תיקון, או שיש לכם הצעה לפיצ׳ר,\n' +
    'לתזכורת או לתוכן נוסף? נשמח לקבל מכם משוב ולבחון אותו לקראת העדכונים הבאים.',
  developerEmailLabel: 'מייל ליצירת קשר:',
  emailAccessibilityLabel: 'פתיחת מייל למשוב והצעה לעדכון',
  emailSubject: 'REBIID – משוב והצעה לעדכון',
  emailUnavailableTitle: 'לא ניתן לפתוח מייל',
  emailUnavailableMessage:
    'לא נמצאה אפליקציית דוא״ל במכשיר. ניתן לשלוח ידנית אל eli@deep-media.com',
} as const;

export const AboutScreenCopy = {
  title: 'אודות',
  back: 'חזרה',
  versionLabel: 'גרסה',
  developerLabel: 'מפתח',
  companyLabel: 'חברה',
  websiteLabel: 'אתר',
  emailLabel: 'מייל',
  licenseLabel: 'רישיון',
  copyrightLabel: 'זכויות יוצרים',
  termsTitle: 'תנאי שימוש',
  termsBody:
    'REBIID מסופקת לשימוש אישי ולא מסחרי, ללא תשלום. ' +
    'אין לעשות שימוש מסחרי, להעתיק או להפיץ את האפליקציה ללא אישור. ' +
    'אנו רשאים לעדכן את התכונות והתוכן מעת לעת. ' +
    'השימוש באפליקציה מהווה הסכמה לתנאים אלה.',
  privacyTitle: 'מדיניות פרטיות',
  privacyBody:
    'REBIID לא דורשת הרשמה, לא אוספת נתוני שימוש, ולא שולחת מידע לשרתים חיצוניים. ' +
    'הגדרות, תזכורות ונתוני לוח השנה נשמרים על המכשיר בלבד. ' +
    'התראות מתוזמנות מקומית — בלי דחיפה מרחוק, בלי מעקב ובלי אנליטיקה. ' +
    'הרשאת התראות משמשת רק לתזמון תזכורות על המכשיר.',
  disclaimerTitle: 'הבהרה',
  disclaimerBody:
    'REBIID היא כלי עזר לתזכורות ולוח עברי. זמנים, מועדים ותזכורות מוצגים לנוחות בלבד ' +
    'ומבוססים על מקורות ציבוריים; ייתכנו הבדלים לפי מנהג, עיר או שיטת חישוב. ' +
    'לשאלות הלכתיות ודיניות יש לפנות לרב או למורה הדעת.',
  description:
    'REBIID הוא עוזר תזכורות יהודי פשוט וברור. הוא עוקב אחרי הלוח העברי, זמני היום ומעגל השנה — ומזכיר לך בזמן את מה שחשוב.',
} as const;

export const SuccessCopy = {
  testNotification: 'שלחנו תזכורת ניסיון — תקבל אותה בעוד כמה שניות.',
} as const;

export const ErrorCopy = {
  storage: 'משהו לא נשמר. נסה שוב בעוד רגע.',
  notificationScheduling: 'לא הצלחנו לתזמן את התזכורות כרגע. ננסה שוב בפתיחה הבאה.',
  cityUpdate: 'לא הצלחנו לעדכן את העיר. אפשר לבחור עיר ידנית.',
  generic: 'אופס, משהו קטן השתבש.',
  noInternet: 'נראה שאין חיבור, אבל רוב האפליקציה ממשיכה לעבוד כרגיל.',
  missingTitle: 'חסרה כותרת — תן לתזכורת שם קצר וברור.',
} as const;

export const ButtonCopy = {
  close: 'הבנתי',
  save: 'שמור לי',
  cancel: 'לא עכשיו',
  add: 'להוסיף',
  addPersonalReminder: 'להוסיף תזכורת משלי',
  testNotification: 'שלח לי תזכורת ניסיון',
  reset: 'להחזיר לברירת מחדל',
  closeForm: 'לא עכשיו',
} as const;

export const ModalCopy = {
  hebrewDate: 'תאריך עברי',
  gregorianDate: 'תאריך לועזי',
  dayOfWeek: 'יום',
  notificationTime: 'שעת התזכורת',
  relatedZman: 'זמן קשור',
  relatedZmanCity: 'עיר לזמנים',
  noExtraDetails: 'זה כל מה שצריך לדעת כרגע.',
} as const;

export const HebrewDatePickerCopy = {
  fieldLabel: 'תאריך עברי',
  cancel: 'ביטול',
  confirm: 'בחירת התאריך',
  prevMonth: 'חודש קודם',
  nextMonth: 'חודש הבא',
} as const;

export const ZmanimCopy = {
  baseTitle: 'זמני היום',
  noCity: 'עיר לא נבחרה',
} as const;

export const SettingsCopy = {
  title: 'הגדרות',
  intro: 'כאן אפשר לכוון את REBIID לפי העיר, המנהג והדרך שבה נוח לך לקבל תזכורות.',
  cityTitle: 'העיר שלי',
  cityHelper: 'לפי העיר נחשב זמני היום, הדלקת נרות וצאת שבת.',
  citySelected: (city: string) => `נבחרה: ${city}`,
  cityPickerTitle: 'בחר עיר',
  cityPickerSearchPlaceholder: 'חיפוש עיר...',
  cityPickerEmpty: 'לא נמצאו ערים',
  cityPickerClose: 'סגור',
  addressTitle: 'איך לפנות אליך?',
  addressHelper: 'אופציונלי — משפיע על הברכה במסך הבית.',
  appearanceTitle: 'מראה',
  appearanceHelper: 'בחר ערכת צבעים. השינוי חל מיד — בלי להפעיל מחדש.',
  appearanceLight: '☀️ בהיר',
  appearanceDark: '🌙 כהה',
  appearanceSystem: '⚙️ לפי המכשיר',
  candleTitle: 'הדלקת נרות',
  candleHelper: 'כמה דקות לפני השקיעה להזכיר לך?',
  havdalahTitle: 'צאת שבת',
  havdalahHelper: 'אפשר לבחור זמן רגיל או רבנו תם.',
  havdalahRegular: 'רגיל',
  havdalahRabbeinuTam: 'רבנו תם',
  notificationsTitle: 'התראות',
  notificationsHelper: 'שליטה מלאה בכל קטגוריית תזכורת — פשוט, מקומי, בלי חשבון.',
  notificationsCategoriesHelper: 'הקש על קטגוריה לכוונון מפורט. אפשר להפעיל או לכבות כל אחת.',
  notificationTypeTitle: 'סוג התראה',
  homeScreenTitle: 'מסך הבית',
  homeScreenYes: 'כן — להציג',
  homeScreenNo: 'לא — להסתיר',
  advanceReminderTitle: 'תזכורת מוקדמת',
  notificationsPrivacyNote: PrivacyCopy.notificationsNote,
  notificationsToggle: 'הפעלת תזכורות',
  soundTitle: 'צליל ורטט',
  soundHelper: 'בחר איך נוח לך לקבל תזכורות — צליל, רטט או שקט.',
  notificationModeHelper: 'הגדרה כללית לכל התזכורות. שינוי כאן יחול על כל הקטגוריות.',
  soundEnabled: 'צליל תזכורת',
  vibrationEnabled: 'רטט',
  soundPick: 'בחירת צליל',
  defaultOffsetTitle: 'ברירת מחדל לתזכורות',
  specialEventsTitle: 'מנהגים ואירועים מיוחדים',
  specialEventsHelper: 'תזכורות למועדים מיוחדים — אפשר להפעיל או לכבות כל אחת.',
  minhagSegulahTitle: 'תזכורות מנהג וסגולה',
  minhagSegulahHelper: 'תזכורות נוספות למנהגים, תפילות מיוחדות ומנהגים משפחתיים.',
  minhagSegulahTemplatesTitle: 'תבניות להוספה מהירה',
  minhagSegulahCustomTitle: 'תזכורות מותאמות',
  addMinhagReminder: 'להוסיף תזכורת מנהג',
  personalTitle: 'תזכורות משלי',
  personalHelper: 'ימי הולדת, יארצייטים וכל דבר שחשוב לך לזכור.',
  accessibilityTitle: AccessibilityCopy.title,
  accessibilityText: AccessibilityCopy.text,
  accessibilityEmailLabel: AccessibilityCopy.developerEmailLabel,
  aboutLinkTitle: 'אודות REBIID',
  aboutLinkHelper: 'גרסה, מפתח, תנאי שימוש, פרטיות והבהרה.',
  privacyTitle: PrivacyCopy.title,
  privacyTagline: PrivacyCopy.tagline,
  privacySummary: PrivacyCopy.summary,
  privacyBullets: PrivacyCopy.bullets,
} as const;

export const RemindersScreenCopy = {
  title: 'תזכורות קרובות',
  subtitle: '30 הימים הקרובים — REBIID שומר עליך מעודכן',
} as const;

export const CalendarCopy = {
  screenTitle: 'לוח שנה עברי',
  holidays: 'חגים',
  reminders: 'תזכורות',
  dayEmpty: EmptyCopy.calendarDay,
} as const;
