import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ScheduleAvailability = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Availability Overview</h2>
        <p className="text-muted-foreground">View staff availability and coverage</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Availability</CardTitle>
          <CardDescription>Weekly availability heatmap and details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">Availability management coming in Phase 5</p>
            <p className="text-sm">Staff availability grid will be displayed here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduleAvailability;
