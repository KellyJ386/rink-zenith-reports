
## Make the Rink Diagram Bigger in the Export PDF

### Current State

The rink SVG is generated at `width: 220, height: 380` (lines 42–43) and is placed in a left column (`.rink-col { flex: 0 0 auto; }`) beside a right column containing Details, Statistics, and the measurements table. The tight side-by-side layout constrains the rink to ~220px wide.

### Problem

The rink diagram is relatively small because it shares horizontal space with the info panels. To make it noticeably larger, the layout needs to change — the rink should take up the dominant portion of the page.

### Proposed Solution

Switch from a side-by-side layout to a **stacked layout**:

```text
┌─────────────────────────────────────────────────────┐
│  HEADER (title, facility, status badge, date)       │
├─────────────────────────────────────────────────────┤
│  STATS ROW  (Min | Max | Avg | Std Dev) — 4 boxes   │
├──────────────────────┬──────────────────────────────┤
│                      │  Details (date, op, template) │
│   RINK DIAGRAM       ├──────────────────────────────┤
│   (larger, centered) │  Measurements table           │
│                      │  (scrollable right column)    │
└──────────────────────┴──────────────────────────────┘
│  Legend + AI Analysis + Footer                      │
└─────────────────────────────────────────────────────┘
```

Actually a cleaner approach that gives the rink maximum visual space while still fitting one page:

- **Rink SVG size**: increase from `220×380` → `300×520` (proportionally larger, ~36% bigger)
- **Dot radius**: increase from `r="11"` → `r="13"` and font-size from `7` → `8.5` so labels stay readable at the larger size
- **Corner radius**: scale from `28` → `38`
- **Layout**: keep two-column but give the rink column a fixed width of `310px` (up from auto ~220px), and make the right column more compact (smaller fonts/padding) to compensate
- **Page margin**: reduce from `12mm` → `8mm` to reclaim space
- **Stats row**: move above the two-column section so it spans full width, freeing vertical space in the right column for the table

### Technical Changes

**File: `src/components/ice-depth/IceDepthHistory.tsx`**

1. **Lines 42–44** — `generateRinkSVGForExport`: Change `width = 220` → `300`, `height = 380` → `520`, `cornerRadius = 28` → `38`
2. **Line 55** — dot radius `r="11"` → `r="13"`, `font-size="7"` → `font-size="8.5"`
3. **Line 60** — SVG `width` and `height` attributes updated to match new dimensions
4. **Lines 112–140** — CSS in `generateQuickReportHTML`:
   - `@page` margin `12mm` → `8mm`
   - `.rink-col { flex: 0 0 310px; }` (was `flex: 0 0 auto`)
   - `.main { gap: 14px }` → `gap: 10px`
   - Stats row moved above `.main` div as a full-width section
   - Right column font sizes slightly reduced to fit the narrower space
5. **Lines 154–200** — HTML body: Move the stats grid (`<div class="stats-row">`) above the `.main` flex container so it spans the full page width, giving the rink column clean vertical room

No backend changes or new dependencies required.
