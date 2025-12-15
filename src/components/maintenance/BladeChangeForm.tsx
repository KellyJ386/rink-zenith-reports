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

interface BladeChangeFormProps {
  userId: string;
  onSuccess: () => void;
}

export const BladeChangeForm = ({ userId, onSuccess }: BladeChangeFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [facilityId, setFacilityId] = useState<string>("");
  const [machines, setMachines] = useState<any[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<string>("");
  const [oldBladeHours, setOldBladeHours] = useState<string>("");
  const [newBladeId, setNewBladeId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [customFields, setCustomFields] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchUserFacility();
  }, [userId]);

  useEffect(() => {
    if (facilityId) {
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

  const fetchMachines = async (facilityId: string) => {
    const { data } = await supabase.from("resurfacing_machines").select("*").eq("facility_id", facilityId).order("name");
    setMachines(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!facilityId || !selectedMachine) {
      toast({
        title: "Missing Information",
        description: "Please select a machine",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("maintenance_activities").insert({
        facility_id: facilityId,
        activity_type: "blade_change",
        machine_id: selectedMachine,
        operator_id: userId,
        old_blade_hours: oldBladeHours ? parseFloat(oldBladeHours) : null,
        new_blade_id: newBladeId || null,
        notes,
        custom_fields: customFields,
      });

      if (error) throw error;

      onSuccess();
      // Reset form
      setSelectedMachine("");
      setOldBladeHours("");
      setNewBladeId("");
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
        <CardTitle>Blade Change</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label>Old Blade Hours</Label>
              <Input
                type="number"
                step="0.01"
                value={oldBladeHours}
                onChange={(e) => setOldBladeHours(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>New Blade ID</Label>
              <Input
                type="text"
                value={newBladeId}
                onChange={(e) => setNewBladeId(e.target.value)}
                placeholder="Blade serial number or ID"
              />
            </div>
          </div>

          <DynamicFormFields
            facilityId={facilityId}
            formType="blade_change"
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
              "Log Blade Change"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
