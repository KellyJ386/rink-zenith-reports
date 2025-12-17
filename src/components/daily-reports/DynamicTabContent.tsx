import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DailyReportTabWithRoles } from "@/types/dailyReport";
import * as LucideIcons from "lucide-react";

interface DynamicTabContentProps {
  tab: DailyReportTabWithRoles;
  formData: Record<string, any>;
  onFormDataChange: (tabId: string, data: Record<string, any>) => void;
}

// Map icon names to Lucide components
const getIcon = (iconName: string) => {
  const iconMap: Record<string, any> = {
    'clipboard-list': LucideIcons.ClipboardList,
    'spray-can': LucideIcons.SprayCan,
    'shopping-bag': LucideIcons.ShoppingBag,
    'utensils': LucideIcons.Utensils,
    'graduation-cap': LucideIcons.GraduationCap,
    'users': LucideIcons.Users,
    'shield-alert': LucideIcons.ShieldAlert,
    'building': LucideIcons.Building,
    'door-open': LucideIcons.DoorOpen,
    'car': LucideIcons.Car,
    'thermometer': LucideIcons.Thermometer,
    'calendar-check': LucideIcons.CalendarCheck,
    'package': LucideIcons.Package,
    'life-buoy': LucideIcons.LifeBuoy,
    'plus-circle': LucideIcons.PlusCircle,
    'clipboard': LucideIcons.Clipboard,
    'file-text': LucideIcons.FileText,
    'check-circle': LucideIcons.CheckCircle,
    'alert-circle': LucideIcons.AlertCircle,
    'settings': LucideIcons.Settings,
  };
  return iconMap[iconName] || LucideIcons.FileText;
};

// Default checklist items for each tab type
const getDefaultChecklist = (tabKey: string): string[] => {
  const checklists: Record<string, string[]> = {
    front_desk: [
      'Phone system checked and working',
      'Cash drawer counted and verified',
      'Reservations reviewed for the day',
      'Customer inquiries addressed',
      'Lost and found items logged',
    ],
    custodial: [
      'Restrooms cleaned and stocked',
      'Lobby/common areas cleaned',
      'Trash emptied throughout facility',
      'Floors mopped/vacuumed',
      'Windows and glass cleaned',
    ],
    pro_shop: [
      'Inventory check completed',
      'Display areas organized',
      'Sales transactions recorded',
      'Equipment rentals logged',
      'Special orders processed',
    ],
    concessions: [
      'Opening inventory count',
      'Food safety temps recorded',
      'Equipment cleaned and sanitized',
      'Sales recorded',
      'Closing inventory count',
    ],
    learn_to_skate: [
      'Class attendance recorded',
      'Equipment inspected',
      'Instructor assignments confirmed',
      'Parent communications sent',
      'Progress reports updated',
    ],
    public_sessions: [
      'Session attendance tracked',
      'Skate rental counts recorded',
      'Ice conditions monitored',
      'Safety announcements made',
      'Capacity limits maintained',
    ],
    safety_emergency: [
      'First aid kit inventory checked',
      'AED checked and operational',
      'Emergency exits clear',
      'Incident reports filed',
      'Safety equipment inspected',
    ],
    general_facility: [
      'Building walkthrough completed',
      'Lighting checked',
      'Temperature comfortable',
      'Signage in place',
      'General maintenance issues noted',
    ],
    locker_rooms: [
      'Cleaned and sanitized',
      'Showers functioning',
      'Lockers secured',
      'Supplies stocked',
      'Drains clear',
    ],
    parking_exterior: [
      'Parking lot inspected',
      'Exterior lighting working',
      'Signage visible',
      'Walkways clear',
      'Snow/ice removal (if needed)',
    ],
    hvac_building: [
      'Temperature readings recorded',
      'HVAC system functioning',
      'Air quality acceptable',
      'Unusual sounds/odors reported',
      'Dehumidifier status checked',
    ],
    event_setup: [
      'Event schedule confirmed',
      'Setup requirements reviewed',
      'Equipment positioned',
      'Staffing confirmed',
      'Cleanup plan in place',
    ],
    rental_equipment: [
      'Skates inspected and sanitized',
      'Helmets cleaned',
      'Equipment inventory counted',
      'Damaged items reported',
      'Sizing labels verified',
    ],
    skating_aids: [
      'Skating aids inspected',
      'Cleaned and sanitized',
      'Count verified',
      'Damaged units removed',
      'Storage organized',
    ],
    custom: [
      'Custom item 1',
      'Custom item 2',
      'Custom item 3',
    ],
  };
  return checklists[tabKey] || ['No checklist items defined'];
};

export function DynamicTabContent({ tab, formData, onFormDataChange }: DynamicTabContentProps) {
  const IconComponent = getIcon(tab.icon);
  const checklist = getDefaultChecklist(tab.tab_key);
  const tabFormData = formData[tab.id] || { checklist: {}, notes: '' };

  const updateChecklist = (item: string, checked: boolean) => {
    onFormDataChange(tab.id, {
      ...tabFormData,
      checklist: {
        ...tabFormData.checklist,
        [item]: checked,
      },
    });
  };

  const updateNotes = (notes: string) => {
    onFormDataChange(tab.id, {
      ...tabFormData,
      notes,
    });
  };

  const completedCount = Object.values(tabFormData.checklist || {}).filter(Boolean).length;
  const totalCount = checklist.length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <IconComponent className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{tab.tab_name}</CardTitle>
              <CardDescription>
                {completedCount}/{totalCount} items completed
                {tab.is_required && (
                  <span className="ml-2 text-destructive text-xs font-medium">Required</span>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {checklist.map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Checkbox
                  id={`${tab.id}-${index}`}
                  checked={tabFormData.checklist?.[item] || false}
                  onCheckedChange={(checked) => updateChecklist(item, checked as boolean)}
                />
                <Label
                  htmlFor={`${tab.id}-${index}`}
                  className={`flex-1 cursor-pointer ${tabFormData.checklist?.[item] ? 'line-through text-muted-foreground' : ''}`}
                >
                  {item}
                </Label>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t">
            <Label htmlFor={`${tab.id}-notes`} className="text-sm font-medium">
              Notes & Observations
            </Label>
            <Textarea
              id={`${tab.id}-notes`}
              placeholder={`Add notes for ${tab.tab_name}...`}
              value={tabFormData.notes || ''}
              onChange={(e) => updateNotes(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
