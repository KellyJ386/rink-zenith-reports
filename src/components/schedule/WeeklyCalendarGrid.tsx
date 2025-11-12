import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScheduleShift, TIME_SLOTS } from "@/types/schedule";
import { Pencil, Trash2, User } from "lucide-react";

interface WeeklyCalendarGridProps {
  weekStart: Date;
  shifts: ScheduleShift[];
  onEditShift: (shift: ScheduleShift) => void;
  onDeleteShift: (id: string) => void;
}

export const WeeklyCalendarGrid = ({ weekStart, shifts, onEditShift, onDeleteShift }: WeeklyCalendarGridProps) => {
  const days = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(weekStart, { weekStartsOn: 0 }), i));
  const today = new Date();

  const getShiftPosition = (shift: ScheduleShift) => {
    const startHour = parseInt(shift.start_time.split(':')[0]);
    const startMinutes = parseInt(shift.start_time.split(':')[1]);
    const endHour = parseInt(shift.end_time.split(':')[0]);
    const endMinutes = parseInt(shift.end_time.split(':')[1]);

    // Calculate position relative to 5 AM start
    const startOffset = (startHour >= 5 ? startHour - 5 : startHour + 19) * 60 + startMinutes;
    let duration = (endHour - startHour) * 60 + (endMinutes - startMinutes);
    
    // Handle overnight shifts
    if (duration < 0) {
      duration = (24 - startHour + endHour) * 60 + (endMinutes - startMinutes);
    }

    const top = (startOffset / 60) * 60; // 60px per hour
    const height = Math.max((duration / 60) * 60, 40); // minimum 40px

    return { top, height };
  };

  const getShiftsForDay = (day: Date) => {
    return shifts.filter(shift => isSameDay(new Date(shift.date), day));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-muted text-muted-foreground';
      case 'offered': return 'bg-accent text-accent-foreground';
      case 'assigned': return 'bg-primary text-primary-foreground';
      case 'confirmed': return 'bg-primary text-primary-foreground';
      case 'completed': return 'bg-secondary text-secondary-foreground';
      case 'cancelled': return 'bg-destructive/20 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      {/* Header with days */}
      <div className="grid grid-cols-8 border-b bg-muted/50">
        <div className="p-4 text-sm font-medium text-muted-foreground border-r">Time</div>
        {days.map((day, index) => (
          <div
            key={index}
            className={`p-4 text-center border-r last:border-r-0 ${
              isSameDay(day, today) ? 'bg-primary/10' : ''
            }`}
          >
            <div className="text-sm font-medium">{format(day, 'EEE')}</div>
            <div className={`text-2xl font-bold ${
              isSameDay(day, today) ? 'text-primary' : ''
            }`}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="grid grid-cols-8">
        {/* Time labels column */}
        <div className="border-r">
          {TIME_SLOTS.map((slot, index) => (
            <div
              key={index}
              className="h-[60px] border-b text-xs text-muted-foreground p-2 flex items-start"
            >
              {slot.label}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((day, dayIndex) => {
          const dayShifts = getShiftsForDay(day);
          
          return (
            <div
              key={dayIndex}
              className={`relative border-r last:border-r-0 ${
                isSameDay(day, today) ? 'bg-primary/5' : ''
              }`}
            >
              {/* Hour lines */}
              {TIME_SLOTS.map((_, index) => (
                <div
                  key={index}
                  className="h-[60px] border-b hover:bg-muted/20 transition-colors"
                />
              ))}

              {/* Shifts overlay */}
              {dayShifts.map((shift) => {
                const { top, height } = getShiftPosition(shift);
                
                return (
                  <Card
                    key={shift.id}
                    className="absolute left-1 right-1 p-2 cursor-pointer hover:shadow-lg transition-all group overflow-hidden"
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                      backgroundColor: shift.role?.color ? `${shift.role.color}20` : undefined,
                      borderLeft: shift.role?.color ? `4px solid ${shift.role.color}` : undefined,
                    }}
                    onClick={() => onEditShift(shift)}
                  >
                    <div className="flex flex-col h-full justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-semibold truncate">
                            {shift.role?.name}
                          </span>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] px-1 py-0 ${getStatusColor(shift.status)}`}
                          >
                            {shift.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(`2000-01-01T${shift.start_time}`), 'h:mm a')} - {format(new Date(`2000-01-01T${shift.end_time}`), 'h:mm a')}
                        </div>
                        {shift.assigned_staff && (
                          <div className="flex items-center gap-1 text-xs">
                            <User className="h-3 w-3" />
                            <span className="truncate">{shift.assigned_staff.full_name}</span>
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground truncate">
                          {shift.area}
                        </div>
                      </div>

                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 mt-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-6 px-2 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditShift(shift);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-6 px-2 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Are you sure you want to delete this shift?')) {
                              onDeleteShift(shift.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
