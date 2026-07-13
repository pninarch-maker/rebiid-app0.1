# REBIID Design System

Version 1.0

> **Official Figma references:** see [DESIGN_REFERENCES.md](./DESIGN_REFERENCES.md)  
> Light Home: node `3:114` · Dark Home: node `3:343`

## Philosophy

REBIID is not a calendar.

REBIID is a calm personal Jewish companion.

The interface should feel:

- Calm
- Premium
- Modern
- Human
- Trustworthy
- Lightweight

The user opens REBIID for seconds.

Everything important must be understood immediately.

When choosing between beauty and clarity, always choose clarity.

---

## Brand

**Name:** REBIID

**Tagline:** לא צריך לזכור לבד.

**Keywords:** Calm · Jewish · Modern · Premium · Minimal · Warm · Offline · Private

---

## Color System

### Primary — Royal Blue `#3657D6`

Primary buttons, links, selected states, main icons.

### Secondary — Sky Indigo `#5B7FFF`

### Accent — Warm Gold `#E8B64A`

Use only for: important reminders, holiday highlights, floating button. Never large gold backgrounds.

### Semantic

| Token | Hex |
|-------|-----|
| Success | `#22C55E` |
| Warning | `#F59E0B` |
| Error | `#EF4444` |
| Information | `#0EA5E9` |

### Surfaces

| Token | Hex |
|-------|-----|
| Background | `#F7F9FC` |
| Cards | `#FFFFFF` |
| Borders | `#E6EAF2` |
| Primary text | `#111827` |
| Secondary text | `#6B7280` |

Implementation: `constants/theme.ts`

---

## Time Themes

Only the accent background changes — never a full interface redesign.

| Time | Background tint |
|------|-----------------|
| Morning | Light Blue |
| Afternoon | Warm Sky |
| Evening | Deep Indigo |
| Shabbat | Soft Cream with Gold accent |

---

## Typography

Hebrew first. Preferred fonts: Rubik, Heebo, Assistant. Fallback: system.

| Role | Size |
|------|------|
| Greeting | 22 |
| Section titles | 18 |
| Card title | 16 |
| Card body | 15 |
| Hebrew date | 40–48 |
| Gregorian date | 18 |

Weights: Bold, SemiBold, Regular. Avoid Light.

Implementation: `constants/layout.ts` → `Typography`

---

## RTL

Everything is RTL.

- Text: `textAlign: 'right'`, `writingDirection: 'rtl'`
- Buttons: centered
- Calendar: Sunday on the right, Shabbat on the left
- Never reverse twice

---

## Layout

8-point grid: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64

### Border radius

| Element | Radius |
|---------|--------|
| Cards | 28 |
| Buttons | 20 |
| Inputs | 18 |
| Bottom sheet | 32 |
| Floating button | 999 |

### Shadows

No black shadows. Soft colored shadows, opacity below 15%, blur 24–40.

---

## Bento Cards

Core UI. Each card: icon, title, content, optional CTA. Maximum 3 visible rows.

Sizes: large hero, medium, small. Never long paragraphs.

Home card order:

1. התזכורת הקרובה
2. זמני היום
3. לוח הילולות ויארצייט
4. לוח מנהגים וסגולות

---

## Buttons

| Type | Style |
|------|-------|
| Primary | Blue, white text |
| Secondary | White, blue border |
| Ghost | Transparent |
| Floating | Gold, white scroll icon |

---

## Icons

Outline only. Lucide style. Rounded. 2px stroke. No emoji inside cards. Emoji allowed only in greeting.

---

## Gradients

Allowed only for: hero background, primary button, Shabbat theme. Very subtle. Never rainbow.

---

## Glassmorphism

Modals, bottom sheets, dialogs only. Never on every card.

---

## Motion

Duration 120–180ms (max 250ms). Spring animation. Small scale on press. Fade + slide. No bouncing.

---

## Haptics

| Weight | Use |
|--------|-----|
| Light | Button press |
| Medium | Reminder completed |
| Success | Important actions |

---

## Empty States

Always friendly. Example: "היום שקט." Never blank screens.

---

## Floating Button

Bottom left. Gold. Scroll icon. Always visible.

---

## Dark Mode

Dedicated palette (not inverted):

| Token | Hex |
|-------|-----|
| Background | `#0F172A` |
| Cards | `#1E293B` |
| Primary text | `#F8FAFC` |
| Secondary text | `#CBD5E1` |

Blue slightly brighter. Gold slightly muted. Tokens in `ColorsDark`.

---

## Accessibility

AA contrast minimum. Dynamic Type. Large touch targets (44×44 min). Accessibility labels. No information by color only.

---

## Product Personality

Should feel like a wise friend. Never like a government form, banking app, or technical dashboard.

---

## AI Rules

When adding a new screen:

1. Follow this Design System
2. Do not invent new colors, radiuses, spacing, or typography
3. Reuse existing components from `constants/theme.ts` and `constants/layout.ts`
4. Consistency is more important than novelty
