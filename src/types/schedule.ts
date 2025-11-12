export interface ScheduleRole {
  id: string;
  name: string;
  color: string;
  description: string | null;
  required_certification: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface ScheduleStaff {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  hire_date: string;
  employment_status: 'active' | 'inactive' | 'on_leave';
  target_hours_per_week: number;
  notes: string | null;
}

export interface ScheduleShift {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  role_id: string;
  area: string;
  assigned_staff_id: string | null;
  status: 'open' | 'offered' | 'assigned' | 'confirmed' | 'completed' | 'cancelled';
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  role?: ScheduleRole;
  assigned_staff?: ScheduleStaff;
}

export interface ShiftFormData {
  date: string;
  start_time: string;
  end_time: string;
  role_id: string;
  area: string;
  assigned_staff_id: string | null;
  notes: string;
}

export const FACILITY_AREAS = [
  'Main Rink',
  'Studio Rink',
  'Front Desk',
  'Zamboni Bay',
  'Pro Shop',
  'Concessions',
  'Locker Rooms',
  'Offices',
  'Other',
] as const;

export const SHIFT_STATUS = [
  'open',
  'offered',
  'assigned',
  'confirmed',
  'completed',
  'cancelled',
] as const;

// Facility operating hours: 5 AM to 2 AM next day (21 hours)
export const FACILITY_START_HOUR = 5;
export const FACILITY_END_HOUR = 26; // 2 AM next day = hour 26
export const TIME_SLOTS = Array.from(
  { length: FACILITY_END_HOUR - FACILITY_START_HOUR },
  (_, i) => {
    const hour = (FACILITY_START_HOUR + i) % 24;
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const period = hour >= 12 && hour < 24 ? 'PM' : 'AM';
    return {
      value: `${hour.toString().padStart(2, '0')}:00`,
      label: `${displayHour}:00 ${period}`,
      hour,
    };
  }
);
