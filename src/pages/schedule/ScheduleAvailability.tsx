import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, Edit2, Trash2 } from "lucide-react";
import { useScheduleStaff } from "@/hooks/useScheduleStaff";
import { useScheduleAvailability } from "@/hooks/useScheduleAvailability";
import { AvailabilityModal } from "@/components/schedule/AvailabilityModal";
import { ScheduleAvailability as AvailabilityType } from "@/hooks/useScheduleAvailability";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const ScheduleAvailability = () => {
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState<AvailabilityType | null>(null);

  const { data: staff, isLoading: staffLoading } = useScheduleStaff();
  const {
    availability,
    isLoading: availabilityLoading,
    createAvailability,
    updateAvailability,
    deleteAvailability,
    isSubmitting,
  } = useScheduleAvailability(selectedStaffId || undefined);

  const handleCreateAvailability = (data: any) => {
    createAvailability.mutate(data);
  };

  const handleUpdateAvailability = (data: any) => {
    if (editingAvailability) {
      updateAvailability.mutate({ id: editingAvailability.id, data });
    }
  };

  const handleEditAvailability = (availability: AvailabilityType) => {
    setEditingAvailability(availability);
    setIsModalOpen(true);
  };

  const handleDeleteAvailability = (id: string) => {
    if (confirm("Are you sure you want to delete this availability?")) {
      deleteAvailability.mutate(id);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingAvailability(null);
  };

  const groupedAvailability = availability.reduce((acc, item) => {
    if (!acc[item.day_of_week]) {
      acc[item.day_of_week] = [];
    }
    acc[item.day_of_week].push(item);
    return acc;
  }, {} as Record<number, AvailabilityType[]>);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const period = hour >= 12 ? 'PM' : 'AM';
    return `${displayHour}:${minutes} ${period}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Staff Availability</h2>
          <p className="text-muted-foreground">Manage recurring weekly availability patterns</p>
        </div>
        {selectedStaffId && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Availability
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Staff Member</CardTitle>
          <CardDescription>View and manage availability for a specific staff member</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select a staff member" />
            </SelectTrigger>
            <SelectContent>
              {staffLoading ? (
                <SelectItem value="loading" disabled>Loading staff...</SelectItem>
              ) : staff?.length === 0 ? (
                <SelectItem value="empty" disabled>No staff members found</SelectItem>
              ) : (
                staff?.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedStaffId && (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Availability</CardTitle>
            <CardDescription>
              {staff?.find(s => s.id === selectedStaffId)?.full_name}'s recurring availability
            </CardDescription>
          </CardHeader>
          <CardContent>
            {availabilityLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading availability...</div>
            ) : availability.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No availability set</p>
                <p className="text-sm">Add availability slots to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {DAYS_OF_WEEK.map((day, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{day}</h3>
                      {groupedAvailability[index]?.length > 0 && (
                        <Badge variant="secondary">
                          {groupedAvailability[index].length} slot{groupedAvailability[index].length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    {groupedAvailability[index]?.length > 0 ? (
                      <div className="space-y-2">
                        {groupedAvailability[index].map((slot) => (
                          <div
                            key={slot.id}
                            className="flex items-center justify-between p-3 bg-muted rounded-md"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <span className="font-medium">
                                  {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                </span>
                                <Badge variant={slot.is_available ? "default" : "secondary"}>
                                  {slot.is_available ? "Available" : "Unavailable"}
                                </Badge>
                              </div>
                              {slot.notes && (
                                <p className="text-sm text-muted-foreground mt-1">{slot.notes}</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditAvailability(slot)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteAvailability(slot.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No availability set</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedStaffId && (
        <AvailabilityModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSubmit={editingAvailability ? handleUpdateAvailability : handleCreateAvailability}
          staffId={selectedStaffId}
          initialData={editingAvailability}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

export default ScheduleAvailability;
