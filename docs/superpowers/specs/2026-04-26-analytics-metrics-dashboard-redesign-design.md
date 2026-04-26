# Analytics Metrics Dashboard Redesign

Date: 2026-04-26
Status: Approved for planning
Scope: Frontend-only redesign of the Analytics summary page hierarchy, controls, metric cards, and secondary navigation/review affordances

## 1. Problem Statement
The current Analytics page matches the app's broader visual system, but it does not yet behave like a well-prioritized analytics surface.

Primary UX gaps:
- `Score breakdown` duplicates the same metrics already shown in the top stat row and adds no new information.
- The page places low-value KPI cards ahead of the most informative artifact on the page, the time-series trend chart.
- `Balanced score` lacks visual scale context, so the raw number is hard to interpret at a glance.
- The four top stat cards do not share a consistent structure or height, which makes the row feel uneven.
- The control strip exposes raw date inputs by default, which is more technical than the rest of the app's tone.
- `Progress deep-dive` and `Jump to goals` look like informational cards instead of clear navigation targets.
- The weekly review ready-state uses an alert-like bordered treatment that clashes with the softer emphasis patterns used elsewhere in the app.

## 2. Product Direction (Locked)
Approach: Metrics dashboard refinement.

The Analytics page should stay quantitative and trend-oriented rather than trying to become an insight-writing surface in this pass.

Locked product decisions from brainstorming:
1. Analytics should focus on temporal signal rather than repeating detail pages for Goals or Habits.
2. `Compare previous period` should immediately affect the top score row so the answer to "am I improving?" is visible without reading the chart.
3. The page should remove redundant KPI/count sections rather than preserve them for completeness.
4. The redesign should improve hierarchy and affordance using the existing data model, not introduce new analytic concepts that belong to future insight work.

## 3. Information Architecture
The page should be reorganized into three tiers.

### 3.1 Header and control tier
This tier retains:
- Existing `TopBar`
- Range preset pills
- Granularity control
- Compare toggle
- Refresh action

This tier changes:
- Start/end raw date inputs are not visible by default.
- Raw date inputs appear only when the user is operating in `Custom` range mode.
- Preset pills remain the primary range selection mechanism and should visually lead the control cluster.
- Granularity, compare toggle, and refresh remain available, but should read as supporting controls rather than the focus of the page.

### 3.2 Primary metrics tier
This tier remains directly below the controls and consists only of the four top stat cards:
- `Balanced score`
- `Habit consistency`
- `Goal pace`
- `Execution volume`

Rules:
- All four cards must share a consistent internal structure and visual height.
- Each card contains:
  - eyebrow label
  - primary value
  - subordinate line
- No top card may have a missing subordinate line in any state.

### 3.3 Trend-first content tier
Immediately after the control tier, the main `Trend` chart becomes the first large section on the page.

Below the chart, the page contains only supporting sections:
- `Weekly review`
- Deep-link navigation cards for `Progress deep-dive` and `Jump to goals`

Removed sections:
- `Score breakdown`
- `KPIs`

## 4. Top Metric Card Behavior
### 4.1 Shared card structure
All four cards should align visually as a unified row.

Rules:
- Use the same vertical rhythm across all cards.
- The subordinate line should be secondary, muted, and shorter in visual weight than the main value.
- When comparison is enabled, the subordinate line becomes delta context.
- When comparison is disabled, the subordinate line falls back to a static descriptor so the cards do not collapse visually.

### 4.2 Default subordinate copy
When `Compare previous period` is off:
- `Balanced score`: `out of 100`
- `Habit consistency`: `this period`
- `Goal pace`: `this period`
- `Execution volume`: `this period`

When `Compare previous period` is on:
- Each card shows a subdued delta string such as `+12 vs previous period` or `-4 vs previous period`.
- Delta text must remain subordinate to the main metric rather than competing with it.

### 4.3 Balanced score context
`Balanced score` needs explicit scale context.

Rules:
- Keep the numeric score as the primary value.
- Add a thin horizontal progress bar beneath the score area.
- The progress bar represents the score on a `0-100` scale.
- This bar should use the same design language as the horizontal progress treatments already used on the Goals page.
- Do not introduce a circular gauge or any new chart idiom for this metric.

## 5. Trend Chart Placement and Role
The main trend chart is the page's most valuable analytic artifact and should be treated as such.

Rules:
- Place the chart immediately below the controls.
- Preserve the existing summary-trend role as the main temporal view over the selected window.
- The chart should remain the first major section users encounter after choosing a range.
- Other sections must not visually compete with the chart for primary attention.

This page's job is to answer whether activity and consistency are moving up or down over time. The chart and top row together should carry that answer.

## 6. Control Behavior and Tone
The controls should feel calmer and more aligned with the product's tone without reducing capability.

Rules:
- Preset pills remain always visible.
- Add a `Custom` option that reveals manual start/end date inputs only when selected.
- Manual date inputs should be visually grouped as advanced/secondary controls when visible.
- The compare toggle remains available because it changes the meaning of the top metrics.
- Refresh remains available, but should not dominate the control row visually.

Responsive behavior:
- On smaller screens, the preset pills and main controls should wrap cleanly without collapsing into a dense technical toolbar.
- Revealed custom date inputs should stack cleanly below the preset row on narrow viewports.

## 7. Weekly Review Section
The weekly review section remains on the page, but its emphasis model changes.

### 7.1 Ready-state priority
If `Weekly review is ready` is true:
- The ready-state prompt appears above the existing score sub-cards.
- It should read as the lead action/state in the section.
- Users should not have to scan past historical review data before seeing that a review is ready.

### 7.2 Ready-state styling
Rules:
- Remove the bordered alert/error-like treatment.
- Present the ready-state using the same softer warm-accent emphasis style used elsewhere in the app.
- The message should feel actionable and warm, not alarming.

### 7.3 Informational content
The existing informational blocks for `Latest score` and `Recent scores` may remain below the ready-state message.

Rules:
- The section still reads as supportive context, not the page's primary focus.
- If no review is ready, the section should gracefully fall back to the informational content only.

## 8. Deep Links and Interaction Affordance
The lower navigation cards should be unmistakably interactive.

Targets:
- `Progress deep-dive`
- `Jump to goals`

Rules:
- Add a directional affordance such as a chevron or arrow.
- Increase the clarity of hover and focus states.
- Preserve the existing card language, but make the components read as link targets rather than passive information panels.
- The text hierarchy should support fast scanning: destination first, supporting description second.

## 9. Implementation Boundaries
This redesign is intentionally narrow.

In scope:
- Analytics summary page layout reordering
- Removal of redundant `Score breakdown` and `KPIs`
- Top card restructuring and comparison-state polish
- Balanced score progress bar context
- Control presentation changes around `Custom` date mode
- Weekly review visual restyling and ordering changes
- Deep-link navigation affordance improvements

Out of scope:
- New analytics insight copy or recommendation engine behavior
- New data sources or backend logic unrelated to existing analytics summary metrics
- Replacing the current trend chart with a different chart type
- Expanding Analytics into a second Goals or Habits detail page

## 10. Validation Strategy
### 10.1 Functional checks
- Toggling `Compare previous period` updates the top card subordinate lines correctly.
- With comparison off, all four cards still render stable subordinate lines.
- Selecting presets updates the page without exposing raw date inputs.
- Selecting `Custom` reveals manual date inputs and preserves range editing behavior.
- Trend chart still reflects the selected range and granularity.
- Weekly review ready-state appears above the historical sub-cards when applicable.
- Deep-link cards remain keyboard accessible and clearly interactive.

### 10.2 UX acceptance checks
1. The trend chart is now the first major analytic artifact after the controls.
2. The top row answers "where do I stand, and am I improving?" without needing the user to decode the chart first.
3. `Balanced score` is legible as a score on a known scale, not an isolated number.
4. The control strip feels quieter and less technical than before.
5. The weekly review prompt no longer reads like an error state.
6. The lower navigation cards clearly look clickable.

### 10.3 Responsive checks
- Mobile: top stat cards remain readable, control groups wrap cleanly, and trend chart placement still feels primary.
- Tablet/laptop: top stat row, chart, and secondary cards keep clear vertical hierarchy.
- Wide screens: removed KPI noise does not leave the page feeling sparse or unfinished.

## 11. Recommended Execution Shape
Implement in this order:
1. Refactor the top summary/header area and card states
2. Simplify controls and add `Custom` reveal behavior
3. Reorder the page content and remove redundant sections
4. Restyle weekly review and deep-link cards
5. Run responsive and interaction polish pass

This order reduces layout churn by settling the top hierarchy first, then refining supporting sections after the main structure is in place.
