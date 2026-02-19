
## Root Cause: The PDF Uses the Wrong Coordinate System for Custom Templates

### What Was Discovered

After fully reading the live app code, the bug is now completely clear.

**The live app renders custom templates using `USAHockeyRink.tsx`** — NOT the portrait `rink-base.svg`. The change happened in `InteractiveRinkDiagram.tsx` (line 534–543):

```tsx
// ALL templates — including "custom" — now go through USAHockeyRink
<USAHockeyRink 
  showPoints={!devMode}
  points={points}   // custom points with x,y percentages
  ...
/>
```

Inside `USAHockeyRink`, custom points are placed using:
```
svgX = (point.x / 100) * rinkLength   // rinkLength = 800
svgY = (point.y / 100) * rinkWidth    // rinkWidth = 340
```
...inside a `rotate(90, 170, 170)` group. **This is how custom template dots appear in the live app.**

**The PDF currently uses the wrong path:** When `template_type === 'custom'`, it calls `generatePortraitRinkSVGForExport` which places dots on a portrait `400×850` SVG at `(x/100)*400, (y/100)*850` — completely different coordinate space, no rotation, wrong rink. So every custom point lands in the wrong position.

### The Fix

**Delete `generatePortraitRinkSVGForExport` entirely.** Custom template points must be placed using the exact same logic as standard templates — inside the rotated USA Hockey SVG.

The only change needed in `generateRinkSVGForExport`: remove the special case that branches to portrait mode for custom templates. Instead, treat custom template points identically to standard templates — use `measurementPoints` or the passed-in custom points, and map them with `svgX = (x/100)*800`, `svgY = (y/100)*340`, inside the same `rotate(90,170,170)` rotated group.

The function already does this correctly for standard templates. The bug is the `if (template_type === 'custom')` branch that sends custom points to the wrong portrait function.

### Database Verification

The custom template "NHL TEST" stored in the database has 43 points with x,y values like:
- Point 1: `x: 5.1, y: 90` → In live app: `svgX = 5.1% * 800 = 40.8`, `svgY = 90% * 340 = 306` (placed near left end, inside the 90° rotated group)
- Point 37: `x: 94.8, y: 89.4` → `svgX = 758.4`, `svgY = 303.96` (near right end)

In the PDF (currently wrong): `svgX = 5.1% * 400 = 20.4`, `svgY = 90% * 850 = 765` — completely different.

### Technical Changes

**File: `src/components/ice-depth/IceDepthHistory.tsx`**

**1. Remove `generatePortraitRinkSVGForExport` entirely** (lines 23–100 — the whole function).

**2. Remove the custom-template early return in `generateRinkSVGForExport`** (lines 102–106):
```typescript
// DELETE THESE LINES:
if (measurement.template_type === 'custom' && customTemplatePoints && customTemplatePoints.length > 0) {
  return generatePortraitRinkSVGForExport(measurement, customTemplatePoints);
}
```

**3. Update the points selection logic** to use `customTemplatePoints` when provided (for custom templates), and fall through to the standard USA Hockey SVG rendering:
```typescript
// After removing the early return:
let points: MeasurementPoint[] = [];
if (customTemplatePoints && customTemplatePoints.length > 0) {
  // Custom template — use the fetched points directly
  points = customTemplatePoints.map(p => ({
    id: typeof p.id === 'number' ? p.id : parseInt(p.id),
    x: p.x,
    y: p.y,
    name: p.label || `Point ${p.id}`,
    row: 1,
  }));
} else {
  // Standard template — look up from measurementPoints
  points = measurementPoints[templateType] || [];
}
```

Everything else in the function stays the same — the rotated USA Hockey rink SVG, the `viewBox="-10 -10 360 820"`, the `rotate(90,170,170)` group, and the point placement at `svgX = (x/100)*800, svgY = (y/100)*340`.

**4. No changes needed to `handleExportPDF`** — it already fetches custom template points from the database correctly. Those fetched points just need to flow into the unified (non-portrait) rink SVG.

### Summary of What Changes

```
BEFORE:
  custom template → generatePortraitRinkSVGForExport → 400×850 portrait, wrong coordinates

AFTER:
  custom template → generateRinkSVGForExport → rotated USAHockeyRink SVG, same coordinates as live app
  standard template → generateRinkSVGForExport → rotated USAHockeyRink SVG (unchanged)
```

The result: every measurement dot in the exported PDF will land in **exactly the same position** it occupies on the live interactive rink diagram.
