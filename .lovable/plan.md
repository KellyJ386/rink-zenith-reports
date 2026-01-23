
## Filter Daily Report Checklists by Shift Type

### Overview
Update the Daily Reports module so that when a shift type is selected from the dropdown (Open, During, Close, Shift Handoff), only the relevant checklist sections are displayed - not all sections from every tab.

### Current Behavior (Problem)
- User selects "Open" from the dropdown
- All tabs appear with ALL their sections (Opening, During, Closing, Handoff)
- This is confusing because the user only wants to see Opening-related tasks

### Expected Behavior (Solution)
- User selects "Open" → Only "Opening Procedures" sections appear
- User selects "During" → Only "During Operations" sections appear
- User selects "Close" → Only "Closing Procedures" sections appear
- User selects "Shift Handoff" → Only "Shift Handoff Notes" sections appear

### Implementation Changes

**1. Map Shift Types to Section IDs**

Create a mapping between the dropdown values and the section IDs used in `dailyReportChecklists.ts`:

```text
Shift Type     →  Section IDs to Show
─────────────────────────────────────────
"open"         →  "opening", "pre", "daily"
"during"       →  "during", "hourly", "operations"
"close"        →  "closing", "post"
"handoff"      →  "handoff", "special", "admin", "documentation"
```

**2. Update DynamicTabContent Component**

Modify `src/components/daily-reports/DynamicTabContent.tsx` to:
- Accept the current `shiftType` as a prop
- Filter checklist sections to only show those matching the selected shift type
- Use the mapping to determine which sections are visible

**3. Update DailyReports Page**

Modify `src/pages/DailyReports.tsx` to:
- Pass the `shiftType` value down to each `DynamicTabContent` component
- This allows each tab to filter its content based on the selected shift

**4. Update SectionedChecklist Component**

Modify `src/components/daily-reports/SectionedChecklist.tsx` to:
- Accept an optional `visibleSectionIds` prop
- Only render sections whose IDs are in the visible list
- When no filter is provided, show all sections (backward compatibility)

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/DailyReports.tsx` | Pass `shiftType` to `DynamicTabContent` |
| `src/components/daily-reports/DynamicTabContent.tsx` | Accept `shiftType` prop, filter sections |
| `src/components/daily-reports/SectionedChecklist.tsx` | Add section filtering logic |
| `src/data/dailyReportChecklists.ts` | Add shift-to-section mapping constant (optional) |

### User Experience After Changes

1. User opens Daily Reports page
2. User sees dropdown with shift types (Open, During, Close, Shift Handoff)
3. User selects "Open"
4. Only Opening-related checklist items appear in each tab
5. User completes only the opening tasks
6. If they need to do closing tasks, they select "Close" from dropdown
7. The view updates to show only closing-related items

### Technical Details

**Section ID Mapping:**
```typescript
const SHIFT_SECTION_MAP: Record<string, string[]> = {
  open: ['opening', 'pre', 'setup', 'daily'],
  during: ['during', 'hourly', 'operations', 'readiness'],
  close: ['closing', 'post', 'cleanup'],
  handoff: ['handoff', 'special', 'admin', 'documentation', 'notes', 'inventory', 'safety', 'weekly'],
};
```

This ensures that each shift type shows only the relevant work for that time of day, preventing the confusion of seeing all shift types at once.
