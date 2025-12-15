import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { DynamicFormFields } from "./DynamicFormFields";

interface ResurfaceFormProps {
  userId: string;
  onSuccess: () => void;
}

export const ResurfaceForm = ({ userId, onSuccess }: ResurfaceFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [facilityId, setFacilityId] = useState<string>("");
  const [rinks, setRinks] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [selectedRink, setSelectedRink] = useState<string>("");
  const [selectedMachine, setSelectedMachine] = useState<string>("");
  const [waterUsed, setWaterUsed] = useState<string>("");
  const [machineHours, setMachineHours] = useState<string>("");
  const [snowPercentage, setSnowPercentage] = useState<string>("");
  const [timeOn, setTimeOn] = useState<string>("");
  const [timeOff, setTimeOff] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [customFields, setCustomFields] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchUserFacility();
  }, [userId]);

  useEffect(() => {
    if (facilityId) {
      fetchRinks(facilityId);
      fetchMachines(facilityId);
    }
  }, [facilityId]);

  const fetchUserFacility = async () => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("facility_id")
      .eq("user_id", userId)
      .single();
    
    if (profile?.facility_id) {
      setFacilityId(profile.facility_id);
    } else {
      // Fallback: get first facility
      const { data: facilities } = await supabase
        .from("facilities")
        .select("id")
        .order("name")
        .limit(1);
      if (facilities?.[0]) {
        setFacilityId(facilities[0].id);
      }
    }
  };

  const fetchRinks = async (facilityId: string) => {
    const { data } = await supabase.from("rinks").select("*").eq("facility_id", facilityId).order("name");
    setRinks(data || []);
  };

  const fetchMachines = async (facilityId: string) => {
    const { data } = await supabase.from("resurfacing_machines").select("*").eq("facility_id", facilityId).order("name");
    setMachines(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!facilityId || !selectedRink || !selectedMachine) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("maintenance_activities").insert({
        facility_id: facilityId,
        activity_type: "resurface",
        rink_id: selectedRink,
        machine_id: selectedMachine,
        operator_id: userId,
        water_used: waterUsed ? parseFloat(waterUsed) : null,
        machine_hours: machineHours ? parseFloat(machineHours) : null,
        notes,
        custom_fields: {
          ...customFields,
          snow_percentage: snowPercentage ? parseFloat(snowPercentage) : null,
          time_on: timeOn || null,
          time_off: timeOff || null,
        },
      });

      if (error) throw error;

      onSuccess();
      // Reset form
      setSelectedRink("");
      setSelectedMachine("");
      setWaterUsed("");
      setMachineHours("");
      setSnowPercentage("");
      setTimeOn("");
      setTimeOff("");
      setNotes("");
      setCustomFields({});
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to log activity",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-[var(--shadow-ice)]">
      <CardHeader>
        <CardTitle>Resurface Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Rink *</Label>
              <Select value={selectedRink} onValueChange={setSelectedRink}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rink" />
                </SelectTrigger>
                <SelectContent>
                  {rinks.map((rink) => (
                    <SelectItem key={rink.id} value={rink.id}>
                      {rink.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Machine *</Label>
              <Select value={selectedMachine} onValueChange={setSelectedMachine}>
                <SelectTrigger>
                  <SelectValue placeholder="Select machine" />
                </SelectTrigger>
                <SelectContent>
                  {machines.map((machine) => (
                    <SelectItem key={machine.id} value={machine.id}>
                      {machine.name} {machine.model && `(${machine.model})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Water Used (gallons)</Label>
              <Input
                type="number"
                step="0.01"
                value={waterUsed}
                onChange={(e) => setWaterUsed(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Machine Hours</Label>
              <Input
                type="number"
                step="0.01"
                value={machineHours}
                onChange={(e) => setMachineHours(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Snow Taken (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={snowPercentage}
                onChange={(e) => setSnowPercentage(e.target.value)}
                placeholder="0-100"
              />
            </div>

            <div className="space-y-2">
              <Label>Time On</Label>
              <Input
                type="time"
                value={timeOn}
                onChange={(e) => setTimeOn(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Time Off</Label>
              <Input
                type="time"
                value={timeOff}
                onChange={(e) => setTimeOff(e.target.value)}
              />
            </div>
          </div>

          <DynamicFormFields
            facilityId={facilityId}
            formType="resurface"
            values={customFields}
            onChange={setCustomFields}
          />

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              rows={3}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging...
              </>
            ) : (
              "Log Resurface Activity"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
