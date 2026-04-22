# Hybrid Editorial / Operator UI Design

Date: 2026-04-22
Status: Approved for planning
Scope: App-wide UI polish across light/dark mode, shell components, and primary pages

## 1. Problem Statement
The app already has a coherent visual direction, but the current UI stops short of feeling fully intentional across light mode, dark mode, and page hierarchy.

Primary UX and visual gaps:
- The theme system has a good foundation, but surface elevation and contrast are not consistently differentiated across shell, panels, dialogs, and dense controls.
- `Today` has the strongest personality, yet the rest of the product does not consistently inherit that quality or deliberately contrast with it.
- `Calendar` and `Habits` need to feel more operational and scan-friendly without collapsing into a generic dashboard aesthetic.
- Dark mode exists, but it still risks reading like a darker inversion of the light theme instead of a tuned first-class visual system.
- Loading, empty, hover, focus, and utility states are less designed than the main resting states.

## 2. Product Direction (Locked)
Approach: Hybrid editorial / operator UI.

References:
- Primary: `docs/visual_design.md`
- Secondary: `docs/vercel_design.md`

Locked design choices from brainstorming:
1. Preserve both light mode and dark mode as first-class options.
2. Keep the current warm paper / ember identity rather than shifting to a colder, Vercel-like visual language.
3. Use `Today` as the emotional and visual benchmark for the app shell.
4. Keep `Calendar` and `Habits` intentionally denser and more operational than `Today`.
5. Raise overall quality across the app, but do not normalize every page to the same spacing and atmosphere level.

Design principle:
- The shell should feel calm, warm, and composed.
- The working surfaces should feel fast, legible, and explicit.
- Page contrast is intentional: reflective where users orient, denser where users act.

## 3. Theme System Changes
### 3.1 Elevation ladder
The theme system should clearly separate:
- `background`: page canvas
- `surface`: default working panel / card
- `surface-elevated`: dialogs, drawers, popovers, and prominent overlays

Expected outcome:
- Light mode gets stronger separation between paper canvas and white working surfaces.
- Dark mode gets cleaner panel boundaries and improved legibility in dense regions.

### 3.2 Dark mode as a tuned system
Dark mode must remain available everywhere and should not be implemented as a simple tonal inversion.

Rules:
- Dense interactive surfaces need stronger border and hover contrast than in light mode.
- Active states must be brighter and easier to parse than the surrounding neutral surfaces.
- Dialogs, segmented controls, inputs, and calendar cells should use clearer elevation and border distinction than they do today.
- Browser chrome should match the active theme via `theme-color` and `color-scheme`.

### 3.3 Motion and chrome
Motion remains restrained and structural.

Rules:
- Animate only `opacity`, `transform`, and deliberate chrome changes such as border/background color.
- No layout-driven animation.
- Motion should clarify interaction or gently reinforce hierarchy, not create ambience for its own sake.

## 4. Shell and Shared Component Direction
### 4.1 Sidebar
The sidebar remains the stable frame of the app, but should feel more intentional and slightly more separated from the main canvas.

Changes:
- Stronger plane distinction from content area
- Clearer active navigation treatment
- Better hover and focus contrast in both themes
- Footer controls feel integrated into the shell rather than appended

### 4.2 TopBar
The top bar should remain editorial, but become a consistent page header system rather than a generic row with a bottom border.

Changes:
- More disciplined spacing rules
- Better title/subtitle rhythm
- More obvious relationship between page title area and page actions
- Improved visual consistency across all top-level pages

### 4.3 Primitives
Shared primitives remain the source of truth.

Affected areas:
- Buttons
- Inputs
- Dialogs
- Toggle and segmented controls
- Reusable surface classes

Rules:
- Primary, outline, ghost, and dense utility actions must be more clearly distinguished.
- Focus rings remain visible and consistent.
- Disabled and loading states must read as designed states, not just opacity reductions.

## 5. Page Hierarchy
### 5.1 Today
`Today` becomes the visual benchmark and emotional anchor of the product.

Goals:
- Present the day as a composed, calm narrative rather than a stack of equivalent sections.
- Preserve spaciousness in the header and first-scroll experience.
- Make the habits section the primary work surface without losing the reflective tone.

Changes:
- The hero/date/header area becomes more atmospheric and deliberate.
- Metrics become cleaner and more integrated into the page rhythm.
- Habit groups gain stronger sectional framing and slightly denser internal rows.
- Todos and goal impact remain secondary and quieter.

### 5.2 Habits
`Habits` becomes a more explicit operating surface.

Goals:
- Improve scan speed.
- Reduce unnecessary vertical sprawl inside cards.
- Make actions feel immediate and practical.

Changes:
- Status-first composition
- Tighter metric presentation
- More legible alerts and linked-context cues
- Quick actions feel like utility controls, not decorative buttons

### 5.3 Calendar
`Calendar` should feel sharper and more tool-like than `Today`.

Goals:
- Improve period navigation clarity.
- Increase density and legibility without clutter.
- Make day headers, drop zones, and active states easier to read in both themes.

Changes:
- More anchored header
- Stronger active view switcher
- More elevated and readable right drawer
- Clearer busy-state cues and drag targets in week/day views

### 5.4 Goals and Analytics
These pages should sit between `Today` and the operational surfaces.

Goals:
- Keep editorial consistency with the shell.
- Increase scan value and information density.

Changes:
- Goal cards become slightly more informative and less airy.
- Analytics KPI framing becomes more deliberate.
- Charts and summary panels gain stronger structural framing and dark-mode contrast.

## 6. State Design Requirements
### 6.1 Loading states
Loading states should mirror real layout structure instead of appearing as generic pulsing blocks.

Rules:
- `Today` loading states should resemble hero + list composition.
- `Habits` and `Calendar` loading states should be denser and utility-shaped.
- Avoid flicker from ultra-short loading transitions when practical.

### 6.2 Empty states
Empty states must feel intentional and contextual.

Rules:
- Each primary page should explain the missing state in product terms.
- Empty states should point to the next action where appropriate.
- Empty states should visually match the hierarchy of the page they live on.

### 6.3 Hover, focus, active
Interactive states need stronger visual differentiation across the app.

Rules:
- Increase contrast on hover, focus, and active states.
- Dense operator surfaces must show clearer interaction affordance than editorial surfaces.
- Icon-only buttons must remain clearly discoverable in dark mode.

## 7. Accessibility and Visual Guardrails
This redesign must follow the standards already captured in the reference docs.

Non-negotiables:
- Visible focus states
- Strong keyboard operability
- Native semantics where possible
- Adequate contrast, especially in dark mode and on dense surfaces
- No color-only status communication
- Reduced-motion compatibility

## 8. Implementation Boundaries
This is a polish and systems-coherence pass, not a product rewrite.

In scope:
- Theme token refinement
- Shell polish
- Page hierarchy updates for `Today`, `Habits`, `Calendar`, `Goals`, and `Analytics`
- Shared component styling alignment
- Loading and empty state upgrades

Out of scope:
- Major IA changes
- New product flows unrelated to presentation and interaction polish
- Replacing the theme architecture
- Brand reset away from the current warm identity

## 9. Validation Strategy
### 9.1 Functional verification
- Theme switching works without hydration mismatch or flash
- Light and dark mode both remain usable across all top-level pages
- Dense controls retain legibility and affordance in dark mode

### 9.2 UX acceptance checks
1. `Today` feels more composed and premium than the other pages.
2. `Habits` and `Calendar` feel faster to scan and act in than before.
3. The shell feels consistent across all top-level pages.
4. Light and dark mode both feel intentional rather than one feeling secondary.

### 9.3 Responsive checks
- Mobile: controls remain usable and spacing survives compression
- Laptop: shell and page hierarchy feel balanced
- Ultra-wide: content max widths and surface grouping still feel deliberate

## 10. Recommended Execution Shape
Implement in this order:
1. Theme tokens and shell primitives
2. `Today` as the benchmark page
3. `Habits` and `Calendar` density and control polish
4. `Goals` and `Analytics` alignment pass
5. Loading, empty, and state polish sweep

This sequencing keeps the visual language coherent and prevents page-by-page drift.
