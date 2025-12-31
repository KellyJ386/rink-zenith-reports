// Grouped shift type options for Daily Reports
// Each area has 4 time slots: Morning, Afternoon, Evening, Overnight

export interface ShiftTypeOption {
  value: string;
  label: string;
}

export interface ShiftTypeGroup {
  areaKey: string;
  areaLabel: string;
  options: ShiftTypeOption[];
}

const TIME_SLOTS = [
  { key: 'morning', label: 'Morning' },
  { key: 'afternoon', label: 'Afternoon' },
  { key: 'evening', label: 'Evening' },
  { key: 'overnight', label: 'Overnight' },
];

const FACILITY_AREAS = [
  { key: 'front_desk', label: 'Front Desk Operations' },
  { key: 'custodial', label: 'Custodial Services' },
  { key: 'pro_shop', label: 'Pro Shop' },
  { key: 'concessions', label: 'Concessions' },
  { key: 'learn_to_skate', label: 'Learn to Skate Programs' },
  { key: 'public_sessions', label: 'Public Sessions' },
  { key: 'safety', label: 'Safety & Emergency Protocols' },
  { key: 'general_facility', label: 'General Facility Operations' },
  { key: 'locker_rooms', label: 'Locker Rooms' },
  { key: 'parking_exterior', label: 'Parking & Exterior' },
  { key: 'hvac_building', label: 'HVAC & Building Systems' },
  { key: 'event_setup', label: 'Event Setup' },
  { key: 'rental_equipment', label: 'Rental Equipment' },
  { key: 'skating_aids', label: 'Skating Aids' },
  { key: 'custom', label: 'Custom / Reserved' },
];

export const SHIFT_TYPE_GROUPS: ShiftTypeGroup[] = FACILITY_AREAS.map((area) => ({
  areaKey: area.key,
  areaLabel: area.label,
  options: TIME_SLOTS.map((slot) => ({
    value: `${area.key}-${slot.key}`,
    label: `${area.label} - ${slot.label}`,
  })),
}));

// Helper to parse a combined shift type value
export function parseShiftType(value: string): { areaKey: string; timeSlot: string } {
  const parts = value.split('-');
  if (parts.length >= 2) {
    const timeSlot = parts[parts.length - 1];
    const areaKey = parts.slice(0, -1).join('-');
    return { areaKey, timeSlot };
  }
  // Fallback for legacy values like "morning"
  return { areaKey: '', timeSlot: value };
}

// Get display label for a shift type value
export function getShiftTypeLabel(value: string): string {
  for (const group of SHIFT_TYPE_GROUPS) {
    const option = group.options.find((opt) => opt.value === value);
    if (option) return option.label;
  }
  // Fallback for legacy values
  const legacyLabels: Record<string, string> = {
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
    overnight: 'Overnight',
  };
  return legacyLabels[value] || value;
}
