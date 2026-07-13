# REBIID — Official Design References

Approved **Figma** designs are the **single source of truth** for all UI implementation.

Before any visual change, inspect the relevant frame using the **connected Figma MCP**.

---

## Official Figma Frames

| Theme | Node ID | Link |
|-------|---------|------|
| **Light (Official)** | `3:114` | [Home — Light](https://www.figma.com/design/rrqRV8A0WmnjGgSM1WR7Sh/REBIID-%E2%80%94-Premium-Jewish-Daily-Life-Design-System?node-id=3-114) |
| **Dark (Official)** | `3:343` | [Home — Dark](https://www.figma.com/design/rrqRV8A0WmnjGgSM1WR7Sh/REBIID-%E2%80%94-Premium-Jewish-Daily-Life-Design-System?node-id=3-343) |

**File key:** `rrqRV8A0WmnjGgSM1WR7Sh`

These two frames are the official design source for the REBIID Home screen. Additional screens should follow the same design system file; prefer frame names like `Home - Light`, `Home - Dark`, `Calendar - Light`, etc.

---

## Implementation Rules

1. Before changing any UI, inspect the relevant Figma frame using the connected MCP.
2. Implement the UI as accurately as possible.
3. Follow:
   - Layout
   - Grid
   - Spacing
   - Typography
   - Colors
   - Component hierarchy
   - Icons
   - Shadows
   - Border radius
   - Elevation
   - Animations
   - RTL
   - Accessibility
4. Do **not** invent new colors, spacing, border radius, or components.
5. Always reuse project **Design Tokens** (`constants/tokens.ts`, `constants/theme.ts`, `constants/layout.ts`).
6. Always reuse **shared UI components** (`src/components/`).
7. If implementation cannot exactly match Figma due to technical limits, **explain the limitation before changing the design**.

See also: [DESIGN_GUIDELINES.md](./DESIGN_GUIDELINES.md) for token values and philosophy.

---

## Theme Support

REBIID supports three appearance modes:

| Option | Label |
|--------|-------|
| ☀️ Light | בהיר |
| 🌙 Dark | כהה |
| ⚙️ Follow Device | לפי המכשיר |

- **Default:** Follow Device
- **Settings:** Settings → **מראה**
- Theme changes apply **immediately** — no app restart, no backend; stored locally in `AppSettings.appearancePreference`.

Light and Dark are **separate approved Figma frames** — implement both.

---

## RTL

REBIID is Hebrew-first. Every screen must support:

- `textAlign: 'right'`
- `writingDirection: 'rtl'`

Buttons may remain centered.

**Calendar:** Sunday on the far right, Shabbat on the far left.

---

## Design System

Follow the approved Design System. Never introduce new colors, typography, spacing, shadows, or elevations unless explicitly requested.

---

## Home Screen Structure

Implement according to the approved Home design (Light + Dark frames):

1. Greeting
2. Hebrew date
3. Gregorian date
4. “What happens today?” (`מה קורה היום?`)
5. Four Bento cards
6. Floating scroll button (history)
7. Bottom navigation

Shared components: `AppShell`, `HebrewDateHero`, `TodayStatus`, `BentoCard`, `ReminderCard`, `ZmanimCard`, `FloatingHistoryButton`, `BottomNavigation`.

---

## Accessibility

Maintain:

- AA contrast
- Dynamic Type
- Large touch targets (44×44 minimum)
- Accessibility labels
- Keyboard navigation where applicable

Never reduce accessibility.

---

## Business Logic

Unless explicitly requested: **do not change application logic**. Implement visual changes only.

---

## Workflow (Every UI Task)

1. Inspect the correct Figma frame (Light and/or Dark).
2. Compare with the existing implementation.
3. List visual differences.
4. Implement only the required changes.
5. Verify Light Mode.
6. Verify Dark Mode.
7. Verify RTL.

If anything in Figma is unclear — **ask** instead of guessing. Never invent missing UI.

---

## Final Report (End of Every UI Task)

- Figma frame inspected
- Screens updated
- Components updated
- Design tokens changed
- Remaining visual differences
- RTL verified
- Light Mode verified
- Dark Mode verified
