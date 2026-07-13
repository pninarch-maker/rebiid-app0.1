# דוח ביקורת מאגר קוד — REBIID

**גרסת דוח:** 1.0  
**תאריך הביקורת:** 12 ביולי 2026  
**פרויקט:** `C:\Users\user\luach-mvp`  
**ענף Git:** `master` (אין commits עדיין)  
**מקורות שנקראו:** `REBIID_Developer_Handoff_Report.md`, `AGENTS.md`, `README.md`, `package.json`, `app.json`, `eas.json`, `tsconfig.json`, מבנה `app/`, `src/`, `lib/`, `constants/`, `database/`, `docs/`, `scripts/`  
**היקף:** ביקורת קריאה בלבד — **לא בוצעו תיקונים בקוד האפליקציה.**

---

## 1. סיכום מנהלים

REBIID הוא פרויקט Expo Router בוגר יחסית מבחינת ארכיטקטורת מנועים (לוח, זמנים, תזכורות, מאגרי תוכן), עם הפרדה ברורה בין לוגיקה ל־UI ועם מדיניות פרטיות שנשמרת בקוד: אין Push מרוחק, אין Firebase/Analytics, ואין בקשות רשת בזמן ריצה.

בדיקות אוטומטיות שעברו בהצלחה:
- `npx tsc --noEmit` — 0 שגיאות
- `npm run test:reminders` — כל הבדיקות עברו (55+ תרחישים)
- `npm run test:knowledge` — 144 יארצייטים, 142 מנהגים, 522 היסטוריה
- `npm run test:calendar` — סדר ימי השבוע תקין
- `npm run lint` — 0 שגיאות, 30 אזהרות

כשל אחד בבדיקות בריאות:
- `npx expo-doctor` — 17/18; אייקון מוגדר כ־PNG אך תוכן הקובץ הוא JPG

הפער המרכזי מול דוח המסירה אינו "חוסר מנועים", אלא:
1. הגדרות שקיימות במודל/אחסון אך **ללא UI** (מנהג אשכנז/ספרד, פרופיל זמנים גר״א/מגן אברהם, ברירת מחדל גלובלית לתזמון).
2. חומרי הפצה חסרים (`legal/`, מקור Excel ליארצייטים, commit ראשון, התאמת package/slug).
3. **ריצה על מכשיר/אמולטור לא אומתה** בביקורת זו — מצב UI בזמן אמת מסומן כ־NOT VERIFIED היכן שאין עדות קודית מספקת.

**בריאות כללית:** טובה לפיתוח פנימי; לא מוכנה להפצה חיצונית בלי P0/P1.

---

## 2. ארכיטקטורת המאגר בפועל

### 2.1 מבנה תיקיות ראשי

```text
luach-mvp/
├── app/                      # Expo Router — מסכים
│   ├── _layout.tsx           # AppThemeProvider + RTL + notifications init
│   ├── about.tsx
│   └── (tabs)/
│       ├── _layout.tsx       # BottomNavigation מותאם
│       ├── index.tsx         # בית
│       ├── calendar.tsx
│       ├── reminders.tsx
│       └── settings.tsx
├── src/
│   ├── engine/               # JewishEngine, calendar, zmanim, reminders, types
│   ├── data/                 # ערים, כללי תזכורות, JSON מאגרים, knowledge/
│   ├── components/           # UI משותף + home/ + theme/ + navigation/
│   └── theme/                # design tokens / screen style factories
├── lib/                      # הגדרות, התראות, תצוגת זמנים, knowledgeService
├── constants/                # layout, theme, tokens
├── hooks/
├── scripts/                  # בדיקות + המרת Excel
├── database/                 # מקורות Excel (חלקי)
├── docs/                     # עיצוב + דוח ביקורת זה
├── types/
├── assets/
└── REBIID_Developer_Handoff_Report.md
```

**חסר מול המסמך:**
- `legal/` — לא קיים
- `CHANGELOG.md`, `LICENSE.md` — לא קיימים
- `docs/PRODUCT_PRINCIPLES.md`, `docs/DESIGN_SYSTEM.md` — לא קיימים (יש `DESIGN_GUIDELINES.md`, `DESIGN_REFERENCES.md`, `UI_PRINCIPLES.md`)
- `database/REBIID_Yahrzeit_Database_Full_Year_v1.xlsx` — חסר; יש רק קובצי מנהגים והיסטוריה

### 2.2 מחסנית טכנולוגית (גרסאות מותקנות)

מתוך `npm ls --depth=0` ו־`package.json`:

| חבילה | גרסה מותקנת |
|--------|-------------|
| expo | 54.0.35 |
| expo-router | 6.0.24 |
| react | 19.1.0 |
| react-native | 0.81.5 |
| typescript | 5.9.3 |
| @hebcal/core | 6.6.0 |
| expo-notifications | 0.32.17 |
| @react-native-async-storage/async-storage | 2.2.0 |
| react-native-reanimated | 4.1.7 |
| xlsx (dev) | 0.18.5 |

TypeScript: `strict: true` ב־`tsconfig.json`.

### 2.3 נקודות כניסה וניווט

- Entry: `expo-router/entry` (`package.json` → `main`)
- Root: `app/_layout.tsx` — `AppThemeProvider`, `I18nManager.forceRTL(true)`, `initializeNotifications()`
- Tabs: היום / לוח / תזכורות / הגדרות דרך `BottomNavigation`
- Stack נוסף: `about`

### 2.4 מנועים — קיימים כמתועד

```text
src/engine/
├── JewishEngine.ts
├── calendar/
├── zmanim/
├── reminders/
└── types/
```

עדות: קבצים קיימים; `JewishEngine.getToday` מחבר calendar + zmanim + reminders.

### 2.5 כפילויות / שאריות

| פריט | הערה |
|------|------|
| `constants/layout.ts` — `baseCardStyle`, `modalSheetStyle`, `screenSafeArea`, `Colors` סטטי | נשארו כ־API ישן (צבעי Light קשיחים). מסכים פעילים עברו ל־theme factories, אך הייצוא הישן עדיין קיים. |
| `Colors` ב־`constants/theme.ts` | תמיד Light + aliases; לא לשימוש ישיר ב־UI |
| `lib/knowledgeService.ts` | פונקציות deprecated (`getTodayKnowledge`, `getKnowledgeForDate`) |
| `isFirstLaunch` / `markFirstLaunchDone` | מוגדרים ב־`lib/settings.ts` אך **לא בשימוש** באף מסך |
| תיקיית `components/` בשורש | ריקה / שאריות תבנית |
| `package.json` name=`luach-mvp` מול מוצר REBIID | אי־התאמת מיתוג |

### 2.6 TODO / FIXME

לא נמצאו `TODO`/`FIXME` משמעותיים בקוד האפליקציה. יש שימוש במילה "placeholder" בהקשר של תבניות טקסט לתזכורות (`lib/reminderPlaceholders.ts`) — זה לא קוד מת, אלא מנגנון `{city}`/`{time}`.

---

## 3. פקודות ואימות

| פקודה | תוצאה | Exit | פירוט |
|--------|--------|------|--------|
| `git status --short` | שינויים רבים staged + untracked | — | אין commits; כל הקוד עדיין לא נשמר כהיסטוריה |
| `npx tsc --noEmit` | עבר | 0 | ללא שגיאות TypeScript |
| `npm run test:reminders` | עבר | 0 | כולל ברכת החמה, תענית בכורות, ערב ר״ה, מנהגים לפי אשכנז/ספרד |
| `npm run test:knowledge` | עבר | 0 | טעינה + התאמות תאריך + דדופליקציה |
| `npm run test:calendar` | עבר | 0 | א׳ מימין, ש׳ משמאל |
| `npm run lint` | עבר עם אזהרות | 0 | 30 warnings (hooks deps, unused imports) |
| `npx expo-doctor` | נכשל חלקית | 1 | אייקון/adaptive foreground: סיומת `.png` אך תוכן JPG |
| `npx expo start` / ריצה על מכשיר | **לא הורץ** | — | NOT VERIFIED — כדי לא לשנות סביבה ולבקשת "אין שינויי קוד" |

---

## 4. מטריצת סטטוס פיצ'רים

מקרא: **WORKING** / **PARTIAL** / **BROKEN** / **MISSING** / **NOT VERIFIED**

| פיצ'ר | סטטוס | עדות |
|--------|--------|------|
| מסך בית | WORKING* | `app/(tabs)/index.tsx` + רכיבי `src/components/home/` |
| תאריך עברי/לועזי | WORKING* | `HebrewDateHero` + `JewishEngine.getToday` |
| לוח חודשי | WORKING* | `calendar.tsx` + `getHebrewMonth` + `test:calendar` |
| פירוט יום נבחר | WORKING* | כרטיס detail ב־`calendar.tsx` |
| זמני יום ליום נבחר | WORKING* | `ZmanimModal` + `getZmanim(selectedDate)` |
| תזכורות קרובות (30 יום) | WORKING* | `reminders.tsx` + `getUpcomingReminders` |
| מודל פרטי תזכורת | WORKING* | `ReminderDetailsModal.tsx` |
| הגדרות | PARTIAL | UI רחב קיים; חסרים מנהג/פרופיל זמנים/offset גלובלי |
| בחירת עיר (compact + sheet) | WORKING* | `CityPickerField` + `CityPickerSheet` |
| תזכורת אישית | WORKING* | טופס ב־`settings.tsx` + `customReminders` |
| תזמון התראות מקומיות | WORKING* (קוד) | `lib/notifications.ts` + `localNotifications.ts` — ריצה במכשיר NV |
| בחירת מראה | WORKING* | Settings + `AppThemeProvider` + AsyncStorage |
| Dark Mode גלובלי | WORKING* (קוד) | Theme provider + screen style factories |
| כפתור "מה קרה היום?" | WORKING* | `FloatingHistoryButton` + `JewishHistoryModal` |
| תצוגת יארצייטים | WORKING* | `knowledgeService` + בדיקות ידע |
| מנהגים וסגולות | WORKING* | כנ״ל + dedupe + שישי כולל שבת (בדיקות) |
| היסטוריה יהודית | WORKING* | 522 רשומות, בדיקות |
| מצבי ריק/שגיאה | PARTIAL | Empty copy קיים; אין Error Boundary גלובלי |
| אודות / נגישות / משפטי | PARTIAL | About + טקסט נגישות בהגדרות; `legal/` חסר |
| Onboarding | MISSING | `isFirstLaunch` לא מחובר ל־UI |
| EAS/APK | PARTIAL | `eas.json` קיים; package/slug/version לא תואמים למסמך; doctor נכשל על assets |

\*WORKING מבוסס על קוד + בדיקות יחידה; **לא** על צילום מסך/מכשיר בביקורת זו.

---

## 5. פיצ'רים שעובדים (WORKING)

1. **ארכיטקטורת מנועים** — `src/engine/JewishEngine.ts` מחבר לוח, זמנים ותזכורות.
2. **קטלוג תזכורות מובנה** — 120 כללים לפי `test:reminders` (`Built-in rules: 120`).
3. **זמנים הלכתיים מ־@hebcal/core** — `src/engine/zmanim/index.ts` משתמש ב־`Zmanim` + מיקום מההגדרות; אין midpoint ידני ל־chatzot.
4. **לוח עם א׳ מימין / ש׳ משמאל** — `lib/calendarWeekLayout.ts` + בדיקות.
5. **מאגרי JSON** — נטענים ומתאימים תאריכים (`test:knowledge`).
6. **התראות מקומיות בלבד** — אין `getExpoPushTokenAsync` וכו׳ בכל הריפו; ייבוא ממוקד ב־`lib/localNotifications.ts`.
7. **Theme גלובלי** — `AppThemeProvider` ב־`app/_layout.tsx`.
8. **בחירת עיר קומפקטית** — Bottom sheet + חיפוש.
9. **שליטה לפי קטגוריית התראות** — `NotificationCategoriesSection` + sheet.
10. **RTL לזמנים** — `ZmanimRowList` + `rtlLabelValueRow` (תווית מימין, שעה משמאל).

---

## 6. פיצ'רים חלקיים (PARTIAL)

1. **הגדרות מנהג (אשכנז/ספרד/אישי)** — המנוע תומך (`ReminderEngineSettings.minhag`, מפתח `@luach/minhag`), הבדיקות מוכיחות סינון, **אך אין UI ב־`settings.tsx`**. ברירת מחדל קבועה: אשכנזי.
2. **פרופיל זמנים גר״א / מגן אברהם** — שמור ב־`AppSettings.zmanimProfile` וממומש ב־`calculate.ts`, **ללא בורר בהגדרות**.
3. **ברירת מחדל גלובלית לזמן תזכורת** — `defaultReminderOffsetMinutes` + API `setDefaultReminderOffsetMinutes`; ב־UI מופיע בעיקר offset פר־קטגוריה / פר־תזכורת אישית.
4. **אודות ומשפטי** — תוכן משפטי מוטמע ב־`about.tsx` / copy; תיקיית `legal/` וקבצי Markdown דו־לשוניים חסרים.
5. **נגישות** — תוויות חלקיות, `minTouchTarget: 44`, מייל לחיץ; אין Dynamic Type מפורש / אין מדיניות `maxFontSizeMultiplier`; TalkBack לא נבדק במכשיר.
6. **מצבי שגיאה** — `console.warn` בהתראות; אין Error Boundary ברמת האפליקציה.
7. **EAS** — פרופילי preview/production קיימים; מיתוג package/slug/version לא תואם למסמך המסירה.
8. **סגנונות ישנים** — `baseCardStyle` וכו׳ עדיין מייצאים צבעי Light סטטיים מ־`constants/layout.ts`.

---

## 7. פיצ'רים שבורים (BROKEN)

לא זוהו באגים runtime קריטיים בבדיקות האוטומטיות.  
פריטים שבורים מבחינת **מוכנות הפצה / תצורה**:

1. **נכסי אייקון** — `expo-doctor`: `assets/images/icon.png` ו־`android-icon-foreground.png` הם JPG עם סיומת PNG.
2. **אין היסטוריית Git** — `fatal: your current branch 'master' does not have any commits yet` — סיכון לאיבוד עבודה ושיתוף.

אין כרגע עדות לקריסת `BUILT_IN_REMINDER_RULES` או ל־`baseCardStyle` חסר במסכים הפעילים (הבעיות מהמסמך נראות כפתורות).

---

## 8. פיצ'רים חסרים (MISSING)

1. **Onboarding** — מפתחות first-launch קיימים אך ללא מסך/זרימה.
2. **`legal/`** — Terms / Privacy / Disclaimer כקבצים נפרדים.
3. **Excel יארצייטים ב־`database/`** — רק JSON קיים ב־runtime; מקור Excel חסר בתיקייה.
4. **UI לבחירת מנהג אשכנז/ספרד**.
5. **UI לבחירת שיטת חישוב זמנים (גר״א/מ״א)**.
6. **מסמכי מוצר שצוינו במסמך** — `PRODUCT_PRINCIPLES.md`, `DESIGN_SYSTEM.md`, `CHANGELOG.md`, `LICENSE.md`.
7. **Error Boundary גלובלי**.
8. **בדיקת ריצה על Android/iOS** במסגרת ביקורת זו.

---

## 9. שגיאות Runtime ו־TypeScript

### TypeScript
- `npx tsc --noEmit` — **ללא שגיאות**.

### Lint
- 30 אזהרות — בעיקר unused imports ו־`react-hooks/exhaustive-deps` ב־`index.tsx` / `calendar.tsx` (תלות מכוונת ב־`zmanimSettingsKey` לרענון אחרי שינוי עיר).

### Runtime (מתועד בקוד, לא נצפה במכשיר)
- כשלי הרשאות/תזמון מדווחים ב־`console.warn` ב־`lib/notifications.ts`.
- אין Error Boundary — קריסה ב־JS תפיל את המסך כולו.

---

## 10. התראות ופרטיות

### חיפוש אסור (תוצאה: לא נמצא בקוד מקור)
- `getExpoPushTokenAsync`
- `getDevicePushTokenAsync`
- `addPushTokenListener`
- Firebase / Analytics / Mixpanel / Amplitude / Sentry

### מנגנון בפועל
| נושא | ממצא | קובץ |
|------|--------|------|
| Local only | כן — הערה מפורשת + ייבוא ממוקד | `lib/localNotifications.ts`, `lib/notifications.ts` |
| הרשאות | בבקשת הפעלה בהגדרות / sync; לא ב־first launch שקט | `requestPermissionOnFirstLaunch` ריק במכוון |
| תזמון | cancel-all ואז schedule לפי upcoming 30 יום | `syncLocalNotifications` |
| מניעת כפילויות | `identifier: reminder.id` | `lib/notifications.ts` |
| Reschedule אחרי שינוי הגדרות | `rescheduleNotificationsAfterSettingsChange` מחובר ל־settings | `settings.tsx`, `notifications.ts` |
| Android channels | `ensureAndroidNotificationChannels` | `lib/notificationChannels.ts` |
| רקע מרוחק | `enableBackgroundRemoteNotifications: false` | `app.json` |
| כשלים | catch + warn; אין UX משתמש מפורט | `notifications.ts` |

### רשת
- אין `fetch`/`axios` בקוד האפליקציה. קישורי HTTPS מופיעים בנתוני מקור JSON (שדות "מקור"/כתובת) וב־`lib/appInfo.ts` (אתר החברה) — לא קריאות API בזמן שימוש.

**מסקנה פרטיות:** עקרון Offline/privacy נשמר בקוד הנוכחי.

---

## 11. ממצאי זמנים (Zmanim)

### זרימת נתונים
```text
Settings (city, lat, lon, timezone, candle offset, havdalah, zmanimProfile)
  → lib/appState.currentAppSettings
  → createZmanimLocation()
  → getZmanim(date)
  → calculateHalachicZmanim(@hebcal/core)
  → getHomeKeyZmanimDisplayRows / getZmanimDisplayRows
  → Home / Calendar modal / (תזמון תזכורות דרך reminderTiming)
```

### שימוש בפרמטרים
| פרמטר | בשימוש? | עדות |
|--------|---------|------|
| תאריך נבחר | כן | `getZmanim(date)` מקבל Date; בלוח — יום נבחר |
| עיר | כן | `Location(..., city, 'IL')` |
| lat/lon | כן | מ־`currentAppSettings` |
| timezone | כן | כל הערים `Asia/Jerusalem` ב־`israeliCities.ts` |
| פרופיל חישוב | כן בקוד; ברירת מחדל `gra`; אין UI | `calculate.ts`, `DEFAULT_APP_SETTINGS` |

### מסכים
- **Home:** 4 זמנים מפתח (זריחה/חצות/שקיעה/צאת הכוכבים) — `getHomeKeyZmanimDisplayRows`
- **Calendar:** רשימה מלאה במודל — `getZmanimDisplayRows`
- **Reminder details:** מציג זמן קשור/הקשר עיר דרך `reminderDetails` (לא מחשב מחדש רשימת זמנים מלאה)
- **Notifications:** תזמון לפי `getNotificationTriggerDate` + הגדרות עיר/offset

### אין עדות לחישוב מקורב אסור
- `chatzot` מגיע מ־`zmanim.chatzot()` ולא מ־midpoint ידני.

### מגבלות
- אין UI לשינוי גר״א/מ״א → המשתמש תמיד על ברירת מחדל אלא אם שונה ידנית באחסון.
- **נכונות הלכתית מוחלטת לא אומתה מול פוסק/לוח חיצוני** בביקורת זו — רק עקבות קוד.

---

## 12. RTL ונגישות

### מנגנון מרכזי
- `I18nManager.forceRTL(true)` ב־`app/_layout.tsx`
- פרימיטיבים: `rtlRow`, `rtlLabelValueRow`, `rtlOptionRow` ב־`constants/layout.ts`
- לוח מבודד מ־RTL כפול: `direction: 'ltr'` + `row-reverse` ב־`calendarWeekLayout.ts`

### תואם לכללים
- תווית מימין / שעה משמאל בזמנים — `ZmanimRowList` / `zmanimRowStyles.ts`
- כותרות/פסקאות עם `rtlTitle` / `rtlCardText` ברוב מסכי ה־theme

### סיכונים / קבצים לבדיקה ויזואלית
| קובץ | סיכון |
|------|--------|
| `constants/layout.ts` | `buttonText` ממורכז (מותר לכפתורים); סגנונות ישנים עם צבעי Light |
| `BottomNavigation.tsx` | תוויות ממורכזות (סטנדרט לטאב) |
| `aboutScreenStyles.ts` | Hero ממורכז במכוון |
| `calendarScreenStyles.ts` | מספרי ימים ממורכזים בתא (מכוון) |
| רכיבי home | יישור ימין בקוד; לא אומת על מכשיר |

### נגישות
- יש `accessibilityLabel` בטאב, FAB היסטוריה, חלק מהמודלים.
- אין כיסוי מלא לכל הכפתורים.
- Dynamic Type / TalkBack — **NOT VERIFIED**.

---

## 13. Theme ומערכת עיצוב

| נושא | ממצא |
|------|--------|
| Provider גלובלי | כן — `AppThemeProvider` |
| Tokens | `constants/tokens.ts`, `constants/theme.ts` (Light/Dark), `src/theme/*` |
| Light / Dark / System | כן — `appearancePreference` + `resolveThemeMode` |
| Persistence | `AppSettings.appearancePreference` במפתח `@luach/app-settings-v2` |
| החלה מיידית | `setAppearancePreference` מעדכן state + save |
| Hardcoded | נקודתיים ב־`themedSurfaces` / `MARKER_ROSH_CHODESH` / `ON_PRIMARY` — לא מסכי UI שלמים |
| Figma | מתועד ב־`docs/DESIGN_REFERENCES.md` (3:114 / 3:343); **לא בוצעה השוואת פיקסלים בביקורת** |
| Time-of-day backgrounds | קיימים ל־Light; ב־Dark משתמשים ב־`colors.background` |

---

## 14. מאגרי נתונים

### קבצים
| מקור | Runtime | ספירה (בדיקה) |
|------|---------|----------------|
| Excel יארצייטים | `src/data/yahrzeits.json` | 144 — **Excel חסר ב־database/** |
| Excel מנהגים v2 | `src/data/minhagimSegulot.json` | 142 — Excel קיים ב־`database/` |
| Excel היסטוריה v2 | `src/data/jewishHistoryToday.json` | 522 — Excel קיים ב־`database/` |

### סקריפטים
- `scripts/convert-excel-databases.mjs`
- `scripts/convert-jewish-history.mjs`
- `scripts/convert-minhagim-segulot.mjs`
- `scripts/minhag-import-validation.mjs`
- `npm run convert:*` / `test:knowledge`

### התאמה
- נרמול חודשים עבריים: `src/data/knowledge/hebrewDate.ts` (כולל תיקון Tamuz/Tammuz שתועד בעבר)
- שישי כולל שבת: `shabbatMatch.ts` + בדיקות
- דדופליקציה: `minhagExactMatch.ts`
- אין schema validation חיצוני (Zod וכו׳) — רק טיפוסים + טעינה רכה

### עקיבת 3 דוגמאות (מקור → UI)

1. **יארצייט — רבי עקיבא, י׳ תשרי**  
   JSON → `YAHRZEIT_ROWS` → `matchesYahrzeitRecord` → כרטיס הילולות בבית.  
   בדיקה: `Yahrzeits on 10 Tishrei 5786: 2` + `Sample yahrzeit preserved: רבי עקיבא`.

2. **מנהג — שבת מברכים (כל השנה / תאריך מדויק)**  
   JSON → `MINHAG_ROWS` → `matchesMinhagRecord` → כרטיס מנהגים.  
   בדיקה: `Shabbat Zachor on Friday before Zachor`, דדופליקציה ב־1 תשרי.

3. **היסטוריה — בריאת האדם, א׳ תשרי**  
   JSON → `JEWISH_HISTORY_ROWS` → FAB → `JewishHistoryModal`.  
   בדיקה: `History on 1 Tishrei 5786: 11`.

### למה תוכן עלול להיראות ריק למרות שקיים רשומה
1. התאריך העברי של היום אינו תואם לשדות החודש/יום במאגר.
2. רשומת מנהג מותנית בכלל מורכב (ערב/שבת/טווח) ולא ביום המדויק.
3. קטגוריה מוסתרת במסך הבית (`showOnHome` בהעדפות התראה).
4. באג נרמול שם חודש (תוקן ל־Tamuz; רגרסיות עתידיות אפשריות).
5. גיליון JSON עם שם שונה מ־`יארצייטים` / `מנהגים וסגולות` / `דברי הימים` → מערך ריק בטעינה.

---

## 15. שמירת הגדרות

**מפתח ראשי:** `@luach/app-settings-v2` (`lib/settings.ts`)

| הגדרה | ברירת מחדל | נשמר? | UI? | צרכן runtime |
|--------|------------|-------|-----|----------------|
| city + lat/lon/tz | ירושלים | כן | כן (CityPicker) | zmanim, תזכורות |
| addressGender | male | כן | כן | ברכה בבית |
| appearancePreference | system | כן | כן (מראה) | Theme |
| candleLightingOffsetMinutes | 40 | כן | כן | zmanim/calendar |
| havdalahMethod | regular | כן | כן | zmanim + engine |
| notificationsEnabled | true | כן | כן | notifications |
| notificationCategoryPreferences | defaults | כן | כן (קטגוריות) | schedule + home show |
| customReminders | [] | כן | כן | engine |
| zmanimProfile | gra | כן | **לא** | calculate.ts |
| defaultReminderOffsetMinutes | 60 | כן | **חלקי** (פר־קטגוריה) | reminderTiming |
| notificationSound* | default | כן | דרך קטגוריות | channels |
| minhag (engine) | ashkenazi | מפתח נפרד `@luach/minhag` | **לא** | ruleEngine |
| enabled categories / disabled rules | legacy keys | כן | דרך קטגוריות התראות (חלקי) | ruleEngine |

**נתונים ישנים:** `normalizeAppSettings` + מיגרציה מ־legacy keys.  
**לא תקין:** חזרה ל־`DEFAULT_APP_SETTINGS` ב־parse error.

---

## 16. מוכנות להפצה

| פריט | סטטוס |
|------|--------|
| TypeScript strict | מוכן |
| בדיקות יחידה | מוכנות |
| פרטיות / local notifications | מוכן בקוד |
| אייקון/splash תקינים | לא (JPG as PNG) |
| package id | `com.rebiid.app` (מסמך ביקש `com.deepmedia.rebiid`) |
| slug | `luach-mvp` (מסמך ביקש `rebiid`) |
| version | `1.0.0` בקוד / מסמך ציין `0.9.0` |
| eas.json | קיים (preview APK) |
| legal | חסר |
| Git remote / commit | חסר |
| בדיקת מכשיר אמיתית | לא בוצעה |

**מסקנה:** מתאים להמשך פיתוח פנימי; **לא** מוכן ל־Beta חיצוני לפני P0/P1.

---

## 17. סיכונים ואי־ודאויות

1. אין commits — סיכון לאיבוד עבודה.
2. ריצה על מכשיר לא אומתה — באגים ויזואליים/התראות OS אפשריים.
3. מנהג אשכנז קבוע למשתמשים ללא UI — תזכורות ספרדיות עלולות להיחסם בטעות.
4. פער מיתוג package/slug מול חנות/EAS.
5. מקור Excel ליארצייטים חסר ב־`database/` — קושי לעדכן מאגר.
6. אין Error Boundary.
7. Figma pixel-accuracy לא נבדקה.
8. מגבלות OS על התראות מקומיות (סוללה/המתנה) — לא נבדקו.
9. כל הערים על `Asia/Jerusalem` — נכון לישראל, אך אין תמיכה בחו״ל.
10. אזהרות lint רבות — חוב טכני מתגלגל.

---

## 18. עשר המשימות הבאות (לפי עדיפות)

1. **לאמת ריצה על Android** (Expo Go / Dev Build) ולתעד צילומי מסך לכל טאב + Dark Mode.
2. **לתקן נכסי אייקון** (PNG אמיתי) עד ש־`expo-doctor` יעבור.
3. **Commit ראשוני מאורגן** + remote פרטי (ללא שינוי לוגיקה).
4. **להוסיף UI למנהג** (אשכנז/ספרד/אישי) ולחבר ל־`@luach/minhag`.
5. **להוסיף UI לפרופיל זמנים** (גר״א / מגן אברהם).
6. **להשלים `database/`** עם Excel יארצייטים + לוודא סקריפטי convert.
7. **ליצור `legal/`** והצגה עקבית באודות/הגדרות.
8. **ליישר `app.json`** (slug/package/version) מול החלטת מיתוג.
9. **Error Boundary + מצבי כשל התראות** למשתמש.
10. **בדיקת Figma Light/Dark** מול מסך הבית והגדרות (ויזואלי בלבד).

---

## 19. Backlog לפי עדיפות

### P0
- אימות runtime על מכשיר
- תיקון אייקונים (expo-doctor)
- שמירת Git (commit ראשון)
- חיבור UI למנהג (חוסם דיוק תזכורות למשתמש)

### P1
- UI לפרופיל זמנים
- legal + אודות מלא
- יישור package/slug/version
- השלמת מקורות Excel
- Error Boundary
- ניקוי אזהרות lint קריטיות / ייצואים ישנים מסוכנים

### P2
- השוואת Figma מדויקת
- נגישות TalkBack + Dynamic Type
- Onboarding קצר (הרשאות התראות מוסברות)
- בדיקות E2E בסיסיות להתראות

### Later
- תמיכה בחו״ל / אזורי זמן נוספים
- CHANGELOG/LICENSE רשמיים
- הרחבת מאגרים
- Development Build קבוע ב־CI

---

## 20. לא אומת (NOT VERIFIED)

1. התנהגות ויזואלית מלאה על מסכים פיזיים (RTL/Dark/Safe Area).
2. תזמון התראות בפועל במכשיר Android (ערוצים, Doze, הרשאות).
3. דיוק הלכתי מוחלט של זמנים מול לוח חיצוני/פוסק.
4. התאמת פיקסלים ל־Figma 3:114 / 3:343.
5. TalkBack / ניגודיות AA / הגדלת גופן מערכת.
6. בניית APK דרך EAS (רק קונפיגורציה נבדקה).
7. ביצועים עם 120 כללים × 30 ימים על מכשירים חלשים.
8. התנהגות אחרי שינוי שעון/אזור זמן של המערכת.
9. שלמות כל תרחישי "ערב פסח שחל בשבת" מחוץ לבדיקות היחידה הקיימות.
10. האם משתמשים רואים תוכן יארצייט/מנהג ביום נתון ספציפי מחוץ לדגימות הבדיקה.

---

## נספח א׳ — סקריפטי npm זמינים

```text
start, android, ios, web
lint
test:reminders
test:knowledge
test:calendar
convert:excel-databases
convert:jewish-history
convert:minhagim-segulot
reset-project
```

## נספח ב׳ — ספירת קבצי מפתח שנבדקו

- מסכי app: 7  
- מנועי src/engine: מבנה מלא  
- מאגרי JSON: 3  
- רכיבי theme/home/navigation: קיימים  
- legal: 0  
- commits: 0  

---

**סוף דוח הביקורת.**  
לא בוצעו שינויי קוד מעבר ליצירת קובץ זה.
