# REBIID — Beta Release Notes

**Version:** 1.0.0  
**Brand:** REBIID — *לא צריך לזכור לבד.*  
**Platform:** Android APK (Expo / EAS)

---

## Current Features

### Home (היום)
- Time-of-day greeting (בוקר / צהריים / ערב / לילה)
- Large Hebrew + Gregorian dates
- Next reminder with relative time label (היום / מחר / בעוד X ימים / שעות)
- Halachic zmanim for today — calculated from the user's selected city and date
- Up to 3 upcoming reminders with tap-to-details

### Calendar (לוח)
- Hebrew month grid (RTL)
- Month navigation with smooth transition
- Today, Shabbat, and selected-day highlights
- Holiday and reminder dot indicators
- Day detail card (holidays + reminders)
- **זמני היום** button: full halachic zmanim for the **selected calendar day** and **selected city**

### Reminders (תזכורות)
- 30-day upcoming list grouped by day
- Relative time labels
- Tap for reminder details modal

### Settings (הגדרות)
- City selector (30 Israeli cities — latitude, longitude, timezone per city)
- Candle lighting offset
- Havdalah method (regular / Rabbeinu Tam)
- Zmanim calculation profile stored for future UI (GRA default, Magen Avraham)
- Local notification preferences (sound, vibration, channel)
- Default reminder offset
- Personal custom reminders (Hebrew date + time)
- Test notification button
- About REBIID

### Reminder Engine
- 49 built-in Jewish calendar rules
- Personal reminders
- Minhag-aware rule filtering
- Local notification scheduling (no remote push)

---

## Missing Features (not in v1.0)

- Final brand logo / splash artwork
- Onboarding flow
- Minhag & category toggles in Settings UI
- Edit existing personal reminders (add/delete/toggle only)
- Widgets
- iOS release polish
- Cloud sync / account
- Push notifications (remote)
- English UI toggle
- In-app zmanim profile picker UI (GRA / Magen Avraham stored in settings, not yet exposed in UI)

---

## Zmanim Calculation (Halachic)

All zmanim are computed dynamically by **@hebcal/core** (`Zmanim` class) using:

1. **Date** — the Hebrew/Gregorian day shown (today on Home; selected day on Calendar)
2. **Location** — latitude, longitude, and timezone from the city selected in Settings (never hardcoded Jerusalem unless the user chose it)
3. **Solar data** — NOAA-based sunrise/sunset for the location, then halachic **sha'ot zmaniyos** (proportional hours)

### Displayed zmanim (when available for the day)

| Zman | Hebcal method |
|------|----------------|
| Alot HaShachar | `alotHaShachar()` |
| Hanetz (sunrise) | `sunrise()` |
| Sof Zman Kriat Shema | `sofZmanShma()` (GRA) or `sofZmanShmaMGA()` (Magen Avraham) |
| Sof Zman Tefillah | `sofZmanTfilla()` (GRA) or `sofZmanTfillaMGA()` (Magen Avraham) |
| Chatzot | `chatzot()` — sunrise + 6 sha'ot zmaniyos (not midpoint of sunrise/sunset) |
| Mincha Gedola | `minchaGedola()` or `minchaGedolaMGA()` |
| Mincha Ketana | `minchaKetana()` or `minchaKetanaMGA()` |
| Plag HaMincha | `plagHaMincha()` |
| Shkiah (sunset) | `sunset()` |
| Tzeit HaKochavim | `tzeit()` (3 small stars, Gra) |
| Candle lighting | `HebrewCalendar.calendar({ candlelighting: true })` + user offset |
| Havdalah / Motzei Shabbat | Calendar `HavdalahEvent` when present; otherwise `tzeit()` or Rabbeinu Tam `sunsetOffset(72)` per Settings |

### Calculation profiles

- **GRA** (default) — Vilna Gaon methods for Shema, Tefillah, and Mincha
- **Magen Avraham** — MGA variants for Shema, Tefillah, Mincha Gedola/Ketana (`zmanimProfile` in settings)
- **Rabbeinu Tam** — Motzei Shabbat via `sunsetOffset(72, false)` when `havdalahMethod === 'rabbeinu_tam'` and no calendar Havdalah event

The app does **not** use approximate formulas (e.g. chatzot as `(sunrise + sunset) / 2`).

---

## Known Limitations

- **Splash screen:** REBIID logo on light background (`#F8FAFC`); dark mode uses navy
- **Notifications:** Android local only; require user permission; rescheduled on settings change
- **City list:** Israeli cities only; zmanim use each city's stored coordinates and timezone
- **Zmanim profile UI:** Magen Avraham is supported in the engine; Settings UI toggle planned for v1.1
- **Personal reminders:** No `{name}` templates in custom message UI beyond title substitution
- **EAS:** Requires `eas login` + `eas init` to assign `projectId` before first cloud build
- **Web:** Functional but not optimized for beta distribution

---

## Next Version Roadmap

### v1.1
- Optimized adaptive icon crop (foreground safe zone)
- Edit personal reminders
- Settings UI for minhag and reminder category toggles
- Settings UI for zmanim profile (GRA / Magen Avraham)
- Refresh home data on app focus (midnight / settings change)

### v1.2
- Widget: next reminder + Hebrew date
- Notification deep-link to reminder details

### v2.0
- Optional account + backup
- iOS App Store release
- English companion strings

---

## Build Instructions (Android APK)

Prerequisites:
- Node.js 18+
- `npm install`
- Expo account: `npm install -g eas-cli` → `eas login`

Verify locally:
```bash
npx tsc --noEmit
npm run lint
npm run test:reminders
```

First-time EAS setup:
```bash
eas init
```

Build APK (preview profile):
```bash
eas build -p android --profile preview
```

Production APK:
```bash
eas build -p android --profile production
```

**Android package:** `com.rebiid.app`  
**EAS config:** `eas.json` (preview + production → `apk`)

---

## QA Checklist Before Beta

- [ ] Select city → zmanim update
- [ ] Enable notifications → grant permission → test notification fires
- [ ] Tap reminders on Home, Calendar, Reminders screens
- [ ] Add / delete personal reminder
- [ ] Calendar grid fits on small phone (no overflow)
- [ ] RTL text alignment on all screens
- [ ] App survives restart with saved settings
