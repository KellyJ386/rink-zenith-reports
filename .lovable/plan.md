
## Problem: Measurement Points Don't Match in PDF Export

### Root Cause

The PDF export uses `generateRinkSVGForExport` — a hand-drawn, simplified rink SVG with approximate line positions. The app uses `USAHockeyRink.tsx`, a precisely scaled rink built from real USA Hockey dimensions (200ft × 85ft, with exact corner radii, blue lines at 64ft from goal, faceoff circles, etc.).

The critical mismatch:
- The real app rink is **rotated 90° clockwise** and uses `scale = 4` (1 foot = 4 units), giving a `rinkLength = 800`, `rinkWidth = 340` coordinate space.
- Measurement point coordinates are **percentages** mapped into that rotated space: `svgX = (point.x / 100) * rinkLength`, `svgY = (point.y / 100) * rinkWidth`.
- The export SVG ignores the rotation and maps points into a completely different 480×720 space with approximate lines, causing all dots to land in wrong positions.

### Solution: Port the Exact Rink SVG to the PDF Generator

Replace `generateRinkSVGForExport` with a function that produces the **same SVG markup** as `USAHockeyRink.tsx` — using identical math, scale, rotation, and coordinate system — then overlays the measurement dots using the exact same coordinate transformation.

This means:
1. Same `scale = 4`, `rinkLength = 800`, `rinkWidth = 340` coordinate space
2. Same `rotate(90, rinkWidth/2, rinkWidth/2)` transform on the rink group
3. Same `viewBox="-10 -10 ${rinkWidth + 20} ${rinkLength + 20}"` (portrait orientation)
4. Same percentage → SVG coordinate mapping for dots: `svgX = (point.x / 100) * rinkLength`, `svgY = (point.y / 100) * rinkWidth`
5. Same text counter-rotation: `rotate(-90, svgX, svgY)` on point labels
6. All rink features ported as inline SVG strings: rink outline path, goal lines, blue lines, center line, center circle, goal creases, faceoff circles, neutral zone spots

### Technical Changes

**File: `src/components/ice-depth/IceDepthHistory.tsx`**

Replace the entire `generateRinkSVGForExport` function with a new version that:

1. Mirrors the exact constants from `USAHockeyRink.tsx`:
   - `scale = 4`, `rinkLength = 800`, `rinkWidth = 340`, `cornerRadius = 112`
   - `goalLineFromBoards = 44`, `blueLineFromGoal = 256`
   - All faceoff positions, circle radii, line widths

2. Builds the rink path string with identical quadratic bezier corners

3. Generates goal crease paths using the same arc math

4. Generates all faceoff circles and neutral zone spots as SVG string elements

5. Applies `transform="rotate(90, 170, 170)"` to the rink group (same as the React component)

6. Maps measurement points using the same coordinate system:
   ```
   svgX = (point.x / 100) * rinkLength
   svgY = (point.y / 100) * rinkWidth
   ```
   And places dots at those coordinates inside the rotated group, with counter-rotated labels

7. Sets `viewBox="-10 -10 360 820"` to match the React component's viewBox

The PDF layout stays the same (two-column split: rink on left, data on right), but the rink SVG will now be pixel-perfect to what the user sees in the app.

### No New Dependencies

This is a pure SVG string porting exercise — no new libraries needed. The math is already proven in `USAHockeyRink.tsx`.
