# מדריך עדכון תזכורות — REBIID

מדריך קצר לעדכון **נוסח וקונפיגורציית תוכן** של תזכורות מובנות בין גרסאות האפליקציה.
האפליקציה נשארת offline-first: אין עדכון מרחוק בזמן ריצה. שינויים נכנסים רק עם גרסת APK חדשה.

---

## איזה קובץ לערוך

ערוך רק:

`database/REBIID_Reminders_Master.xlsx`

גיליון: `reminder_content`

**אל תערכו ידנית** את:

`src/data/reminders/generated/reminderContent.generated.json`

קובץ זה נוצר אוטומטית.

---

## עמודות

| עמודה | האם בטוח לערוך? | הסבר |
|--------|------------------|------|
| `id` | **לא** (אלא בהוספת תזכורת חדשה בקוד) | מזהה יציב — משמש בדיקות, התראות והגדרות |
| `enabled` | כן, בזהירות | כיבוי תזכורת שמופעלת כברירת מחדל דורש מילוי `notes` |
| `category` | **לא** לשינוי חופשי | חייבת להתאים לקטלוג TypeScript |
| `title_he` | **כן** | כותרת התזכורת בעברית |
| `body_he` | **כן** | גוף ההודעה; מותר `{city}`, `{time}`, `{monthName}` |
| `short_label_he` | כן | תווית קצרה (לשימוש עתידי / תצוגה) |
| `default_lead_minutes` | בזהירות | רלוונטי בעיקר ל־`relative_to_zman` (`offsetMinutes`) |
| `priority` | כן | `info` או `important` |
| `minhag_scope` | **לא** לשינוי חופשי | חייב להתאים לקטלוג |
| `rule_type` | **לא** | סוג הטריגר — נשאר בסמכות הקוד |
| `rule_reference` | **לא** | הפניה ל־handler ב־TypeScript / pattern / zman |
| `source` | בדרך כלל `built_in` | |
| `notes` | כן | הערות לעורכים; חובה כשמכבים תזכורת קיימת |
| `content_version` | כן | גרסת תוכן אחידה לכל השורות |

---

## מה נשאר ב־TypeScript

לוגיקת לוח, הלכה וזמנים **לא** נמצאת באקסל:

- `src/data/reminders/catalog/*.ts` — הגדרות טריגר
- `src/data/reminders/patterns.ts` — תבניות מיוחדות
- `src/engine/reminders/ruleEngine.ts` — מנוע ההתאמה

באקסל רק מפנים אליהם דרך `rule_type` + `rule_reference`.

דוגמאות `rule_reference`:

- תבנית: `birkat_hachama_eve`
- זמן: `zman:candleLighting`
- אחרת: זהה ל־`id`

---

## עדכון נוסח קיים

1. פתחו את `REBIID_Reminders_Master.xlsx`.
2. מצאו את השורה לפי `id`.
3. עדכנו `title_he` / `body_he` בלבד.
4. העלו את `content_version` בכל השורות (למשל `1.0.0` → `1.0.1`).
5. הריצו את הפקודות למטה.

## הוספת תזכורת פשוטה

1. הוסיפו כלל חדש ב־TypeScript (`catalog/*.ts`) עם `id` יציב וטריגר מלא.
2. הריצו `npm run reminders:export-master` כדי לסנכרן את האקסל (או הוסיפו שורה ידנית תואמת).
3. ערכו נוסח באקסל אם צריך.
4. הריצו build + בדיקות.

אין להוסיף שורה באקסל בלבד בלי קוד — ה־build ייכשל.

## תזכורות מורכבות

תזכורות עם `special_calendar_pattern` או חישובי תאריך מיוחדים נשארות ב־`patterns.ts` / קבצי עזר.
באקסל מעדכנים רק טקסט, לא את הלוגיקה.

---

## פקודות

```bash
# יצוא קטלוג TypeScript → אקסל + JSON ראשוני
npm run reminders:export-master

# אקסל → JSON (אחרי עריכה)
npm run reminders:build

# בדיקת תקינות בלי כתיבה
npm run reminders:validate

# בדיקות תוכן + מנוע
npm run test:reminder-content
npm run test:reminders
```

---

## שגיאות אימות נפוצות

| שגיאה | משמעות |
|--------|---------|
| missing id / duplicate id | מזהה חסר או כפול |
| required Hebrew title | `title_he` ריק |
| invalid category | קטגוריה לא מוכרת או לא תואמת לקטלוג |
| unsupported rule_type | סוג טריגר לא נתמך |
| rule_reference does not exist | הפניה ל־pattern/handler שגויה |
| would silently disable | כיביתם תזכורת פעילה בלי `notes` |
| record count unexpectedly dropped | נמחקו שורות יחסית ל־JSON הקודם |
| missing from the content workbook | חסר `id` שקיים בקטלוג הקוד |

---

## contentVersion

- כל השורות חייבות לאותו `content_version`.
- אחרי שינוי תוכן — העלו גרסה (SemVer קל: `1.0.1`, `1.1.0`…).
- `generatedAt` בקובץ ה־JSON הוא דטרמיניסטי: `content:<contentVersion>` — לא חותמת שעון.

---

## לפני פרסום גרסה

1. `npm run reminders:validate`
2. `npm run reminders:build`
3. בדקו את ה־diff של `reminderContent.generated.json`
4. `npm run test:reminder-content`
5. `npm run test:reminders`
6. ודאו שאין שינוי לא מכוון בתאריכים/טריגרים — רק בנוסח שאושר
7. שלבו את ה־JSON בגרסת האפליקציה הבאה
