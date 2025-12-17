export interface DailyReportTab {
  id: string;
  facility_id: string;
  tab_name: string;
  tab_key: string;
  display_order: number;
  is_active: boolean;
  is_required: boolean;
  form_template_id: string | null;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface DailyReportTabRole {
  id: string;
  tab_id: string;
  role_id: string;
  created_at: string;
}

export interface DailyReportTabSubmission {
  id: string;
  report_id: string;
  tab_id: string;
  submitted_by: string;
  submitted_at: string;
  form_data: Record<string, unknown>;
  status: 'draft' | 'submitted' | 'approved';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyReportTabWithRoles extends DailyReportTab {
  roles?: Array<{
    id: string;
    role_id: string;
    role?: {
      id: string;
      name: string;
      color: string;
    };
  }>;
}

export const DEFAULT_TAB_CATEGORIES = [
  { tab_key: 'front_desk', tab_name: 'Front Desk Operations', icon: 'clipboard-list' },
  { tab_key: 'custodial', tab_name: 'Custodial Services', icon: 'spray-can' },
  { tab_key: 'pro_shop', tab_name: 'Pro Shop', icon: 'shopping-bag' },
  { tab_key: 'concessions', tab_name: 'Concessions', icon: 'utensils' },
  { tab_key: 'learn_to_skate', tab_name: 'Learn to Skate', icon: 'graduation-cap' },
  { tab_key: 'public_sessions', tab_name: 'Public Sessions', icon: 'users' },
  { tab_key: 'safety_emergency', tab_name: 'Safety & Emergency', icon: 'shield-alert' },
  { tab_key: 'general_facility', tab_name: 'General Facility', icon: 'building' },
  { tab_key: 'locker_rooms', tab_name: 'Locker Rooms', icon: 'door-open' },
  { tab_key: 'parking_exterior', tab_name: 'Parking/Exterior', icon: 'car' },
  { tab_key: 'hvac_building', tab_name: 'HVAC/Building Systems', icon: 'thermometer' },
  { tab_key: 'event_setup', tab_name: 'Event Setup', icon: 'calendar-check' },
  { tab_key: 'rental_equipment', tab_name: 'Rental Equipment', icon: 'package' },
  { tab_key: 'skating_aids', tab_name: 'Skating Aids', icon: 'life-buoy' },
  { tab_key: 'custom', tab_name: 'Custom/Reserved', icon: 'plus-circle' },
] as const;

export const TAB_ICONS = [
  'clipboard-list',
  'spray-can',
  'shopping-bag',
  'utensils',
  'graduation-cap',
  'users',
  'shield-alert',
  'building',
  'door-open',
  'car',
  'thermometer',
  'calendar-check',
  'package',
  'life-buoy',
  'plus-circle',
  'clipboard',
  'file-text',
  'check-circle',
  'alert-circle',
  'settings',
] as const;
