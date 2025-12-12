import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DynamicFormFields } from "./DynamicFormFields";

interface CircleCheckFormProps {
  userId: string;
  onSuccess: () => void;
}

const defaultCheckItems = [
  "Blades (condition and sharpness)",
  "Hydraulics (leaks or issues)",
  "Fluids (levels and condition)",
  "Belts (wear and tension)",
  "Safety Equipment (operational)",
  "Tires (pressure and wear)",
  "Lights (all functional)",
  "Controls (responsive)",
];

export const CircleCheckForm = ({ userId, onSuccess }: CircleCheckFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [facilityId, setFacilityId] = useState<string>("");
  const [machines, setMachines] = useState<any[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<string>("");
  const [checkItems, setCheckItems] = useState<Record<string, { passed: boolean; notes: string }>>(
    defaultCheckItems.reduce((acc, item) => ({
      ...acc,
      [item]: { passed: true, notes: "" }
    }), {})
  );
  const [generalNotes, setGeneralNotes] = useState<string>("");
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
    const { data } = await supabase
      .from("resurfacing_machines")
      .select("*")
      .eq("facility_id", facilityId)
      .order("name");
    setMachines(data || []);
  };

  const toggleCheckItem = (item: string) => {
    setCheckItems(prev => ({
      ...prev,
      [item]: {
        ...prev[item],
        passed: !prev[item].passed,
        notes: prev[item].passed ? prev[item].notes : "" // Clear notes when passing
      }
    }));
  };

  const updateCheckItemNotes = (item: string, notes: string) => {
    setCheckItems(prev => ({
      ...prev,
      [item]: { ...prev[item], notes }
    }));
  };

  const getFailedCount = () => {
    return Object.values(checkItems).filter(item => !item.passed).length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMachine) {
      toast({
        title: "Missing Information",
        description: "Please select a machine",
        variant: "destructive",
      });
      return;
    }

    const failedCount = getFailedCount();
    if (failedCount > 0) {
      const confirm = window.confirm(
        `You have ${failedCount} failed item(s). Are you sure you want to proceed?`
      );
      if (!confirm) return;
    }

    setLoading(true);
    try {
      const { data: activityData, error: activityError } = await supabase
        .from("maintenance_activities")
        .insert({
          facility_id: facilityId,
          activity_type: "circle_check",
          machine_id: selectedMachine,
          operator_id: userId,
          notes: generalNotes,
          custom_fields: customFields,
        })
        .select()
        .single();

      if (activityError) throw activityError;

      // Insert all check items - map passed/failed to ok/critical for DB compatibility
      const checkItemsData = Object.entries(checkItems).map(([item, data]) => ({
        activity_id: activityData.id,
        check_item: item,
        status: data.passed ? "ok" : "critical",
        notes: data.notes || null,
      }));

      const { error: checksError } = await supabase
        .from("circle_checks")
        .insert(checkItemsData);

      if (checksError) throw checksError;

      onSuccess();
      
      // Reset form
      setSelectedMachine("");
      setCheckItems(defaultCheckItems.reduce((acc, item) => ({
        ...acc,
        [item]: { passed: true, notes: "" }
      }), {}));
      setGeneralNotes("");
      setCustomFields({});

      toast({
        title: "Circle Check Complete",
        description: failedCount > 0 
          ? `Logged with ${failedCount} failed item(s)`
          : "All items passed inspection",
      });
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to log circle check",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-[var(--shadow-ice)]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Digital Circle Check</CardTitle>
          {getFailedCount() > 0 && (
            <Badge variant="destructive">
              {getFailedCount()} Failed
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div className="space-y-3">
            <Label className="text-lg font-semibold">Pre-Operation Checklist</Label>
            {defaultCheckItems.map((item) => (
              <div 
                key={item} 
                className={`p-4 rounded-lg border ${
                  checkItems[item].passed 
                    ? "border-border/50 bg-background" 
                    : "border-destructive/50 bg-destructive/5"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    {checkItems[item].passed ? (
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive shrink-0" />
                    )}
                    <span className="font-medium">{item}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${checkItems[item].passed ? "text-green-600" : "text-destructive"}`}>
                      {checkItems[item].passed ? "Pass" : "Fail"}
                    </span>
                    <Switch
                      checked={checkItems[item].passed}
                      onCheckedChange={() => toggleCheckItem(item)}
                    />
                  </div>
                </div>

                {!checkItems[item].passed && (
                  <div className="mt-3">
                    <Textarea
                      placeholder="Describe the issue..."
                      value={checkItems[item].notes}
                      onChange={(e) => updateCheckItemNotes(item, e.target.value)}
                      rows={2}
                      className="bg-background"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <DynamicFormFields
            facilityId={facilityId}
            formType="circle_check"
            values={customFields}
            onChange={setCustomFields}
          />

          <div className="space-y-2">
            <Label>General Notes</Label>
            <Textarea
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="Add any additional notes about the inspection..."
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
              "Complete Circle Check"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
