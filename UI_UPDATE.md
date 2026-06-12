# UI Update — Summary of Changes

A full visual redesign of the CalmText web app: a white & blue **glassmorphism** theme, a **3-column layout**, refreshed copy, and a polished, icon-driven home screen.

---

## 1. Theme — White & Blue Glassmorphism

- Replaced the previous dark theme with a light **white/blue** palette.
- Soft blue/lavender radial-gradient background on `#e8efff` (fixed attachment).
- Frosted-glass surfaces throughout using `backdrop-filter: blur()`, translucent white backgrounds (`rgba(255,255,255,…)`), and soft blue shadows.
- Tailwind v4 note: custom component classes are written as **plain CSS** (not `@apply`), since v4 cannot `@apply` unknown utility classes.

**Files:** `apps/web/src/index.css`

---

## 2. Layout — 3-Column (ChatEase-style)

A responsive flex layout matching the reference image:

| Column | Width | Contents |
|--------|-------|----------|
| **Left sidebar** | 220px | Seamless logo + MODE navigation + auth (profile / logout / sign in) |
| **Center main panel** | flex | Header bar + content area (home / loading / results) |
| **Right sidebar** | 260px | Search **History**, always visible |

- **Responsive:** left sidebar shows at `≥768px`, right sidebar at `≥1024px`. Below that, a **mobile top bar** appears with logo + auth, and mode tabs move inline.
- History is **inlined** into the right sidebar (no full-screen overlay) and auto-refreshes after each analysis.
- Profile opens as a **glass modal overlay**.

**Files:** `apps/web/src/App.jsx`, `apps/web/src/index.css`

---

## 3. Copy / Text Changes

- Primary button: **"Press for Pax's Pause Take"** (ClearText mode keeps "ClearText").
- Result header: **"Pax's Take:"** (was "Pax says").
- Sub-result header: **"SubText:"**
- Logo rendered **seamless / borderless**.

**Files:** `apps/web/src/App.jsx`, `apps/web/src/components/ResultSection.jsx`, `apps/web/src/components/ClearTextResult.jsx`

---

## 4. Username Display (not email)

The sidebar now shows the **username** instead of the email. Fallback chain: `username → name → email`.

- Backend `signin` / `signup` now return `name` and `username` in the token response.
- `AuthContext` stores `name` and `username` from the login response.

**Files:**
- `apps/api/app/api/v1/routes/auth.py`
- `apps/api/app/schemas/auth.py`
- `apps/web/src/context/AuthContext.jsx`

---

## 5. Home Screen — Polished & Less Sparse

The center panel home view was redesigned to fill the previously blank space:

- **Hero:** mascot (128×128) with a radial **glow ring** and drop shadow, plus a **"Hi, I'm Pax"** headline and "Your emotional clarity companion" tagline.
- **Mode context pill:** a dynamic blue pill that changes with the selected mode (Decode / Refine / Clarity).
- **Feature hint cards:** a 3-up row — **Decode · Refine · Clarity** — each in a glass mini-card with an icon tile.
- **Footer tagline:** "Pause · Reflect · Communicate with clarity".

**Files:** `apps/web/src/App.jsx`

---

## 6. Icons — Migrated to `react-icons/lu`

All icons switched from `lucide-react` to **`react-icons`** (Lucide set, `Lu` prefix).

- Added dependency: `react-icons`.
- Replaced every icon import/usage across `App.jsx`, `Auth.jsx`, `Profile.jsx`, `History.jsx`, `ResultSection.jsx`, `ClearTextResult.jsx`.
- Replaced all **emoji** in the home screen (mode pill + feature cards) with proper Lucide icons (`LuMessageSquare`, `LuSparkles`, `LuSearch`).
- Note: `UserCircle` does not exist in `react-icons/lu` — mapped to **`LuCircleUserRound`**.

**Files:** all `apps/web/src/**` components listed above, `apps/web/package.json`

---

## Notes / Scope

- **UI-only** changes (plus the auth-response fields needed to display the username).
- No changes to analysis logic, routes, or data models beyond the `name`/`username` token fields.
