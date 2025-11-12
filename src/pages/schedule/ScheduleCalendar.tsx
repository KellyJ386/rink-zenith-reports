import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const ScheduleCalendar = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Weekly Schedule</h2>
          <p className="text-muted-foreground">View and manage staff shifts</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Shift
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schedule Calendar</CardTitle>
          <CardDescription>Week of {new Date().toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">Calendar view coming in Phase 3</p>
            <p className="text-sm">Staff schedules will be displayed here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduleCalendar;
