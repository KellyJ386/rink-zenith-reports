
## Problem: Custom Template Points Don't Match in PDF Export

### Root Cause (Two-Part)

**Part 1 — Custom points not fetched at all:**
The export function in `generateRinkSVGForExport` checks `measurementPoints[templateType]`. For `template_type = "custom"`, `measurementPoints["custom"]` is an empty array, so the code falls into a grid-layout fallback (lines 28–40) that auto-generates evenly-spaced points on a grid — completely ignoring the actual custom template point positions stored in the database.

**Part 2 — Wrong coordinate space even if fetched:**
The `custom_ice_templates` table stores point `x`/`y` coordinates as percentages clicked on the `rink-base.svg` portrait image (a plain image with no rotation). The PDF SVG applies `rotate(90, 170, 170)` to a `rinkLength=800, rinkWidth=340` coordinate space — the `USAHockeyRink` internal space. When points from the rink-base image space are fed into this rotated SVG, all dots land in wrong positions.

From the database query, the custom template "NHL TEST" has its 43 points stored exactly as x/y percentages of the portrait rink-base image. The PDF needs to use those exact percentages to position dots on the same portrait-orientation rink.

### The Fix

The PDF rink diagram should not use the rotated `USAHockeyRink` SVG for custom templates at all. Instead, it should:

1. **Fetch the custom template points from the database** using the `custom_template_id` stored on the measurement record.
2. **Render a portrait rink SVG** (no rotation) for custom templates, using a simple but accurate rink outline, and map points with `x%` / `y%` directly onto it — exactly matching how the app's `InteractiveRinkDiagram` renders custom templates using `rink-base.svg`.

### Technical Changes

**File: `src/components/ice-depth/IceDepthHistory.tsx`**

**1. Fetch custom template points before export:**
The `handleExport` function (and the measurement details dialog) needs to fetch the custom template points from `custom_ice_templates` table using `measurement.custom_template_id` before calling `generateRinkSVGForExport`.

**2. Pass custom template points to the SVG generator:**
Update `generateRinkSVGForExport(measurement, customTemplatePoints?)` signature to accept the fetched custom points.

**3. New portrait-rink SVG for custom templates:**
When custom template points are provided, render a simple portrait rink SVG (no rotation) using the same `rink-base.svg` proportions. Points are placed using percentage-based `left`/`top` equivalents in SVG: `svgX = (x / 100) * W`, `svgY = (y / 100) * H`.

The portrait rink dimensions will match the aspect ratio of the rink-base image (approximately 1:2.35 width:height based on real NHL rink proportions — 85ft wide × 200ft long). Use `viewBox="0 0 340 800"` (same numbers as USAHockeyRink but NOT rotated).

**4. Render rink markings in portrait orientation:**
Draw the same markings (goal lines, blue lines, center line, center circle, faceoff circles) but without the `rotate(90)` transform — the rink is already portrait.

**5. Key coordinate mapping for custom points (portrait, no rotation):**
```
svgX = (point.x / 100) * 340    // rinkWidth = 340 (horizontal axis = 85ft)
svgY = (point.y / 100) * 800    // rinkLength = 800 (vertical axis = 200ft)
```
No counter-rotation needed on labels since the diagram is not rotated.

### Data Flow

```text
handleExport(measurement)
  → fetch custom_ice_templates WHERE id = measurement.custom_template_id
  → extract points array [{id, x, y, label}]
  → generateRinkSVGForExport(measurement, customPoints)
      → if customPoints provided: render portrait SVG with percentage mapping
      → else: render rotated USAHockeyRink SVG (standard templates)
  → generateQuickReportHTML(measurement, rinkSVG)
```

### No New Dependencies

Pure SVG string generation using already-available data. The custom_ice_templates table is already populated with point coordinates.
