import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronLeft, ChevronRight, Calendar, Filter, Search, Loader2 } from "lucide-react";
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek } from "date-fns";
import { useScheduleShifts } from "@/hooks/useScheduleShifts";
import { useScheduleRoles } from "@/hooks/useScheduleRoles";
import { useScheduleStaff } from "@/hooks/useScheduleStaff";
import { WeeklyCalendarGrid } from "@/components/schedule/WeeklyCalendarGrid";
import { ShiftModal } from "@/components/schedule/ShiftModal";
import { ScheduleShift, ShiftFormData, FACILITY_AREAS } from "@/types/schedule";

const ScheduleCalendar = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<ScheduleShift | null>(null);

  const { shifts, isLoading, createShift, updateShift, deleteShift } = useScheduleShifts(currentWeek);
  const { data: roles = [] } = useScheduleRoles();
  const { data: staff = [] } = useScheduleStaff();

  const weekStartDate = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekEndDate = endOfWeek(currentWeek, { weekStartsOn: 0 });

  // Filter shifts
  const filteredShifts = shifts.filter(shift => {
    if (selectedRole !== 'all' && shift.role_id !== selectedRole) return false;
    if (selectedArea !== 'all' && shift.area !== selectedArea) return false;
    if (selectedStaff !== 'all' && shift.assigned_staff_id !== selectedStaff) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesRole = shift.role?.name.toLowerCase().includes(query);
      const matchesArea = shift.area.toLowerCase().includes(query);
      const matchesStaff = shift.assigned_staff?.full_name.toLowerCase().includes(query);
      const matchesNotes = shift.notes?.toLowerCase().includes(query);
      return matchesRole || matchesArea || matchesStaff || matchesNotes;
    }
    return true;
  });

  const handleCreateShift = (data: ShiftFormData) => {
    createShift.mutate(data, {
      onSuccess: () => {
        setIsModalOpen(false);
      },
    });
  };

  const handleUpdateShift = (data: ShiftFormData) => {
    if (!editingShift) return;
    
    updateShift.mutate(
      { id: editingShift.id, updates: data },
      {
        onSuccess: () => {
          setIsModalOpen(false);
          setEditingShift(null);
        },
      }
    );
  };

  const handleEditShift = (shift: ScheduleShift) => {
    setEditingShift(shift);
    setIsModalOpen(true);
  };

  const handleDeleteShift = (id: string) => {
    deleteShift.mutate(id);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingShift(null);
  };

  const stats = {
    total: filteredShifts.length,
    open: filteredShifts.filter(s => s.status === 'open').length,
    assigned: filteredShifts.filter(s => s.status === 'assigned' || s.status === 'confirmed').length,
    completed: filteredShifts.filter(s => s.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Weekly Schedule</h2>
          <p className="text-muted-foreground">
            {format(weekStartDate, 'MMM d')} - {format(weekEndDate, 'MMM d, yyyy')}
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Shift
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Shifts</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Open</div>
          <div className="text-2xl font-bold text-orange-500">{stats.open}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Assigned</div>
          <div className="text-2xl font-bold text-primary">{stats.assigned}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Completed</div>
          <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
        </Card>
      </div>

      {/* Filters and Navigation */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Week Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentWeek(new Date())}
              className="whitespace-nowrap"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Filters */}
          <div className="flex-1 flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search shifts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map(role => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedArea} onValueChange={setSelectedArea}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Areas" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="all">All Areas</SelectItem>
                {FACILITY_AREAS.map(area => (
                  <SelectItem key={area} value={area}>
                    {area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Staff" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="all">All Staff</SelectItem>
                {staff.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(selectedRole !== 'all' || selectedArea !== 'all' || selectedStaff !== 'all' || searchQuery) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedRole('all');
                  setSelectedArea('all');
                  setSelectedStaff('all');
                  setSearchQuery('');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Calendar Grid */}
      {isLoading ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading schedule...</p>
          </div>
        </Card>
      ) : (
        <WeeklyCalendarGrid
          weekStart={currentWeek}
          shifts={filteredShifts}
          onEditShift={handleEditShift}
          onDeleteShift={handleDeleteShift}
        />
      )}

      {/* Shift Modal */}
      <ShiftModal
        open={isModalOpen}
        onOpenChange={handleModalClose}
        onSubmit={editingShift ? handleUpdateShift : handleCreateShift}
        initialData={editingShift ? {
          date: editingShift.date,
          start_time: editingShift.start_time,
          end_time: editingShift.end_time,
          role_id: editingShift.role_id,
          area: editingShift.area,
          assigned_staff_id: editingShift.assigned_staff_id,
          notes: editingShift.notes || '',
        } : undefined}
        isSubmitting={createShift.isPending || updateShift.isPending}
      />
    </div>
  );
};

export default ScheduleCalendar;
