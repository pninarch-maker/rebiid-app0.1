# דוח מועמד לשחרור — REBIID (Release Candidate)

**גרסת דוח:** 1.0  
**תאריך:** 13 ביולי 2026  
**מוצר:** REBIID  
**פרויקט:** `luach-mvp` (`C:\Users\user\luach-mvp`)  
**מטרה:** מוכנות לבטא פנימית (APK Android)  
**היקף:** QA סוגר שחרור — ללא פיצ'רים חדשים וללא עיצוב מחדש

---

## 1. סיכום מועמד לשחרור

REBIID עבר שער אוטומטי מלא (TypeScript, lint, בדיקות מנועים/מאגרים, `expo-doctor`) לאחר תיקון חוסמי שחרור מאומתים:

1. נכסי אייקון/ספלאש שהיו JPG עם סיומת PNG  
2. בקשת הרשאת התראות אוטומטית בהפעלה (תוקן — רק בפעולת משתמש)  
3. אי־התאמת `defaultChannel` ב־`app.json` מול ערוצי Android בזמן ריצה  
4. רענון מאגר יארצייטים מ־Excel מעודכן (542 רשומות, כולל כ״ז בתמוז)

**פסק דין:** **READY FOR INTERNAL APK**

אימות חזותי ו־RTL על מכשיר Android פיזי **לא** בוצע בדוח זה — ראו רשימת בדיקות מכשיר בסעיף 11.

---

## 2. מצב Git

| פריט | ערך |
|------|-----|
| ענף | `master` |
| Commits | **אין** — המאגר מאותחל אך ללא commit ראשון |
| HEAD | לא קיים |
| Push / PR | **לא בוצעו** (כמבוקש) |
| שינויים | רבים ב־staging + untracked (כל הפרויקט בפועל) |

**Phase A:** מצב העבודה נשמר; לא נמחקו ולא הוחלפו שינויי משתמש.

---

## 3. קבצים ששונו ב־QA הסופי

| קובץ | שינוי |
|------|--------|
| `assets/images/icon.png` | המרה ל־PNG אמיתי |
| `assets/images/android-icon-foreground.png` | המרה ל־PNG אמיתי |
| `assets/images/splash-icon.png` | המרה ל־PNG אמיתי |
| `assets/images/favicon.png` | המרה ל־PNG אמיתי |
| `assets/images/rebiid-logo.png` | המרה ל־PNG אמיתי |
| `lib/notifications.ts` | `syncNotificationsIfEnabled` בודק הרשאה בלי לבקש; בקשה רק מ־enable/test |
| `app.json` | `defaultChannel` → `reminders-default` |
| `src/data/yahrzeits.json` | נוצר מחדש מ־Excel (542) |
| `scripts/test-knowledge-databases.ts` | עדכון בדיקות כ״ז בתמוז (יש רשומות במקור המעודכן) |
| `docs/REBIID_RELEASE_CANDIDATE_REPORT.md` | דוח זה |

לא שונו: כללי תזכורות, חישובי זמנים, עיצוב מסכים, תלויות Expo/RN.

---

## 4. תוצאות פקודות אוטומטיות

| פקודה | תוצאה | הערות |
|--------|--------|--------|
| `npx tsc --noEmit` | ✅ עבר | 0 שגיאות |
| `npm run lint` | ✅ עבר | 0 שגיאות, 30 אזהרות קיימות (MINOR) |
| `npm run test:reminders` | ✅ עבר | |
| `npm run test:knowledge` | ✅ עבר | לאחר רענון JSON + עדכון בדיקת כ״ז |
| `npm run test:calendar` | ✅ עבר | |
| `npx expo-doctor` | ✅ עבר | 18/18 (לאחר תיקון PNG) |

### כשלים שטופלו

| כשל | סיווג | שורש | תיקון |
|-----|--------|------|--------|
| `expo-doctor` — icon/foreground JPG כ־PNG | **BLOCKER** | תוכן JPEG עם סיומת `.png` | המרה ל־PNG אמיתי (System.Drawing) |
| בקשת הרשאה ב־`initializeNotifications` → `syncNotificationsIfEnabled` | **BLOCKER** (מדיניות פרטיות) | `requestNotificationPermissions()` בנתיב cold-start | בדיקת `getPermissionsAsync` בלבד בסינכרון; בקשה רק מ־Settings/בדיקה |
| `defaultChannel: "reminders"` | **MAJOR** בטוח | לא תואם ל־`reminders-default` | יישור ב־`app.json` |
| `test:knowledge` צפה 542 מול JSON ישן 144 | **BLOCKER** לבדיקות | Excel מעודכן + JSON לא מסונכרן; בדיקת כ״ז הייתה "ריק" | `convert:yahrzeits` + עדכון אסרציות |

אזהרות lint קיימות (unused vars וכו') סווגו **MINOR** ולא תוקנו במשימה זו.

---

## 5. שלמות נתונים (Phase C)

### המרות שורצו

- `npm run convert:yahrzeits`
- `npm run convert:minhagim-segulot`
- `npm run convert:jewish-history`

### יארצייטים

| פריט | ערך |
|------|-----|
| מקור | `database/REBIID_Yahrzeit_Database_Full_Year_v1.xlsx` |
| גיליון | `יארצייטים` |
| שורות מקור (לא ריקות) | **542** |
| מיובאות | **542** |
| נדחות | **0** |
| כפילויות ID | **0** |
| תאריכים עבריים לא תקינים | **0** |
| פלט | `src/data/yahrzeits.json` |
| צריכה | `loadDatabase` → `knowledgeService` → כרטיס בית |

**כ״ז בתמוז:** קיימות **3** רשומות במקור המעודכן (למשל אלעזר אבוחצירא, חיים אביגדור, יעקב מאיר עבאדי). כרטיס ריק בתאריך זה **אינו** צפוי יותר.

### מנהגים וסגולות

| פריט | ערך |
|------|-----|
| מקור | `database/REBIID_Customs_and_Segulot_Database_v2_Exact_Dates.xlsx` |
| מיובאות | **142** |
| תאריכים לא תקינים | **0** |
| פלט | `src/data/minhagimSegulot.json` |

### דברי הימים

| פריט | ערך |
|------|-----|
| מקור | `database/REBIID_Jewish_History_522_Events_v2.xlsx` |
| מיובאות | **522** |
| שדות תאריך חסרים | **0** |
| פלט | `src/data/jewishHistoryToday.json` |

### תוכן מידעי ≠ התראות

קטגוריות `yahrzeits` ו־`historical_events` מסומנות `knowledgeOnly: true` ואינן נכנסות לתזמון התראות. מאומת בקוד (`notificationCategories.ts`, `notificationCategoryPrefs.ts`).

---

## 6. מטריצת מוכנות פיצ'רים

| תחום | סטטוס | הערה |
|------|--------|------|
| בית — תאריך / זמנים / תזכורת | READY | אומת בקוד + בדיקות |
| בית — יארצייטים / מנהגים | READY | מאגרים מסונכרנים |
| בית — היסטוריה (FAB) | READY | מודאל + JSON |
| לוח עברי RTL | READY | בדיקות יישור שבוע |
| תזכורות 30 יום | READY | |
| הגדרות עיר / נרות / הבדלה / מראה | READY | |
| קטגוריות התראות | READY | |
| תזכורות אישיות | READY | |
| בחירת מנהג (אשכנז/ספרד) UI | DEFERRED | נשמר במנוע, ללא UI |
| פרופיל זמנים (גר״א / מגן אברהם) UI | DEFERRED | נשמר כ־`gra`, ללא UI |
| תיקיית `legal/` | DEFERRED | תוכן משפטי ב־About |
| iOS | OUT OF SCOPE | בטא Android בלבד |

---

## 7. RTL וערכת נושא (Phase D)

### עדות קודית

- `I18nManager.forceRTL(true)` ב־`app/_layout.tsx`
- טוקנים: `rtlRow`, `rtlTitle`, `rtlLabelValueRow`, `hebrewText`
- זמנים: `ZmanimRowList` עם `direction: 'ltr'` מפורש — שעה משמאל, תווית מימין
- לוח: רשת מבודדת; יום א׳ מימין / שבת משמאל (`calendarWeekLayout`)
- מראה: Light / Dark / System דרך `AppThemeProvider` + אסימונים גלובליים

### ⚠️ לא אומת חזותית על מכשיר

אין לטעון אימות ויזואלי מבדיקת קוד סטטית. ראו סעיף 11.

---

## 8. התראות (Phase F)

| בדיקה | סטטוס |
|--------|--------|
| מקומיות בלבד | ✅ |
| אין Expo Push Token / Firebase / remote push | ✅ (grep + ייבוא מקומי מבוקר) |
| ערוצי Android | ✅ `reminders-default/silent/gentle/classic` |
| מניעת כפילויות | ✅ ביטול הכל לפני תזמון + `identifier` |
| שינוי הגדרות → תזמון מחדש | ✅ |
| כיבוי → ביטול מתוזמנות | ✅ |
| תוכן knowledgeOnly לא מתוזמן | ✅ |
| בקשת הרשאה בלי הקשר משתמש | ✅ **תוקן** — cold-start לא מבקש |

---

## 9. התמדה של הגדרות (Phase E)

| הגדרה | UI | AsyncStorage | נצרכת בריצה |
|--------|-----|--------------|-------------|
| עיר / קואורדינטות / א״ז | כן | כן | כן (זמנים) |
| מראה | כן | כן | כן (ערכת נושא) |
| דקות הדלקת נרות | כן | כן | כן |
| שיטת הבדלה | כן | כן | כן |
| התראות מופעלות | כן | כן | כן |
| העדפות קטגוריות | כן | כן | כן |
| תזכורות מותאמות | כן | כן | כן |
| מגדר פנייה | כן | כן | ברכה בלבד (לא מנוע) |
| מנהג מנוע | **לא** | כן (`@luach/minhag`) | כן — ברירת אשכנז |
| פרופיל זמנים | **לא** | כן | כן — ברירת `gra` |
| `defaultReminderOffsetMinutes` | **לא** | כן | חלקי / כמעט מת |

---

## 10. מוכנות Expo / EAS

| שדה | ערך נוכחי |
|------|-----------|
| name | `REBIID` |
| slug | `luach-mvp` |
| package | **`com.rebiid.app`** |
| version | `1.0.0` |
| versionCode | `1` |
| icon / adaptive / splash | נתיבים תקינים; תוכן PNG אמיתי |
| notification icon | `./assets/images/icon.png` |
| preview | `distribution: internal`, `android.buildType: apk` |
| production | גם APK (לא AAB) — להחלטה לפני חנות |
| `expo-doctor` | 18/18 ✅ |

**חובה לפני Google Play:** החלטת package (`com.rebiid.app` מול `com.deepmedia.rebiid`) — **לא שונה** במשימה זו.

---

## 11. רשימת בדיקות במכשיר Android פיזי

יש לאשר ידנית על מכשיר אמיתי (או אמולטור) לפני הפצה רחבה יותר:

1. התקנת APK מפרופיל `preview`  
2. מסך בית — Light ו־Dark ו־System  
3. שורות זמנים: תווית עברית בימין קיצוני, שעה בשמאל קיצוני  
4. כ״ז בתמוז / 12.7.2026 — מופיעות הילולות (לא כרטיס ריק)  
5. לוח: א׳ מימין, שבת משמאל  
6. מודאל זמנים / פרטי תזכורת / בחירת עיר / קטגוריות / היסטוריה — RTL  
7. ניווט תחתון  
8. הפעלה ראשונה: **אין** דיאלוג הרשאת התראות עד הפעלה בהגדרות  
9. הפעלת התראות → אישור OS → תזמון; כיבוי → ביטול  
10. שינוי עיר / נרות / הבדלה → זמנים והתראות מתעדכנים  
11. כיבוי קטגוריה / showOnHome — התנהגות בית מול תזמון  
12. מצב הרשאה שנדחתה — אין קריסה  
13. מצבי ריק (אין תזכורות / אין היסטוריה)  
14. ניגודיות Light/Dark וגודל מגע בסיסי  

---

## 12. מגבלות ידועות

- אין commit ראשון ב־Git  
- `package.json` name / slug עדיין `luach-mvp`  
- אין UI למנהג ולפרופיל זמנים  
- אין `ErrorBoundary` ברמת אפליקציה  
- כיסוי `accessibilityLabel` חלקי  
- `legal/` חסר כתיקייה נפרדת  
- production ב־EAS מוגדר כ־APK ולא AAB  
- lint: 30 אזהרות לא חוסמות  

---

## 13. פריטים נדחים

1. יישור מיתוג: slug / npm name / package לחנות  
2. UI למנהג אשכנז/ספרד  
3. UI לפרופיל זמנים  
4. חומרים משפטיים דו־לשוניים ב־`legal/`  
5. Error boundary + שיפור נגישות  
6. commit ראשון + remote  
7. מעבר production ל־AAB לחנות  

---

## 14. החלטות Google Play שעדיין נדרשות

1. **מזהה חבילה Android:** כיום `com.rebiid.app` — מועמד מתועד: `com.deepmedia.rebiid` (**REQUIRED BEFORE GOOGLE PLAY**)  
2. slug / שם פרויקט EAS (`luach-mvp` מול REBIID)  
3. חתימה / keystore / חשבון מפתח  
4. AAB מול APK לפרודקשן  
5. מדיניות פרטיות / תנאי שימוש בחנות  
6. צילומי מסך ונכסי חנות  

---

## 15. פסק דין סופי

### READY FOR INTERNAL APK

אין חוסם ידוע לבניית APK פנימי דרך פרופיל `preview`.

**הפקודה הבאה (לא הורצה במשימה זו):**

```bash
eas build --platform android --profile preview
```

**לא בוצע:** push, PR, פרסום לחנות, או הרצת EAS build.
