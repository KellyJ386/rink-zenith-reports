import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, CheckCircle, XCircle } from "lucide-react";
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
  const [facilities, setFacilities] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<string>("");
  const [selectedMachine, setSelectedMachine] = useState<string>("");
  const [checkItems, setCheckItems] = useState<Record<string, { status: string; notes: string }>>(
    defaultCheckItems.reduce((acc, item) => ({
      ...acc,
      [item]: { status: "ok", notes: "" }
    }), {})
  );
  const [generalNotes, setGeneralNotes] = useState<string>("");
  const [customFields, setCustomFields] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchFacilities();
  }, []);

  useEffect(() => {
    if (selectedFacility) {
      fetchMachines(selectedFacility);
    }
  }, [selectedFacility]);

  const fetchFacilities = async () => {
    const { data } = await supabase.from("facilities").select("*").order("name");
    setFacilities(data || []);
  };

  const fetchMachines = async (facilityId: string) => {
    const { data } = await supabase.from("resurfacing_machines").select("*").eq("facility_id", facilityId).order("name");
    setMachines(data || []);
  };

  const updateCheckItem = (item: string, field: "status" | "notes", value: string) => {
    setCheckItems(prev => ({
      ...prev,
      [item]: {
        ...prev[item],
        [field]: value
      }
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ok":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "needs_attention":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "critical":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getCriticalCount = () => {
    return Object.values(checkItems).filter(item => item.status === "critical" || item.status === "needs_attention").length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFacility || !selectedMachine) {
      toast({
        title: "Missing Information",
        description: "Please select facility and machine",
        variant: "destructive",
      });
      return;
    }

    const criticalCount = getCriticalCount();
    if (criticalCount > 0) {
      const confirm = window.confirm(
        `You have ${criticalCount} item(s) that need attention. Are you sure you want to proceed?`
      );
      if (!confirm) return;
    }

    setLoading(true);
    try {
      const { data: activityData, error: activityError } = await supabase
        .from("maintenance_activities")
        .insert({
          facility_id: selectedFacility,
          activity_type: "circle_check",
          machine_id: selectedMachine,
          operator_id: userId,
          notes: generalNotes,
          custom_fields: customFields,
        })
        .select()
        .single();

      if (activityError) throw activityError;

      // Insert all check items
      const checkItemsData = Object.entries(checkItems).map(([item, data]) => ({
        activity_id: activityData.id,
        check_item: item,
        status: data.status,
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
        [item]: { status: "ok", notes: "" }
      }), {}));
      setGeneralNotes("");
      setCustomFields({});

      toast({
        title: "Circle Check Complete",
        description: criticalCount > 0 
          ? `Logged with ${criticalCount} item(s) needing attention`
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
          {getCriticalCount() > 0 && (
            <Badge variant="destructive">
              {getCriticalCount()} Issues Found
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Facility *</Label>
              <Select value={selectedFacility} onValueChange={setSelectedFacility}>
                <SelectTrigger>
                  <SelectValue placeholder="Select facility" />
                </SelectTrigger>
                <SelectContent>
                  {facilities.map((facility) => (
                    <SelectItem key={facility.id} value={facility.id}>
                      {facility.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Machine *</Label>
              <Select value={selectedMachine} onValueChange={setSelectedMachine} disabled={!selectedFacility}>
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
          </div>

          <div className="space-y-4">
            <Label className="text-lg font-semibold">Pre-Operation Checklist</Label>
            {defaultCheckItems.map((item) => (
              <Card key={item} className="border-border/50">
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">{item}</Label>
                      {getStatusIcon(checkItems[item].status)}
                    </div>
                    
                    <RadioGroup
                      value={checkItems[item].status}
                      onValueChange={(value) => updateCheckItem(item, "status", value)}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ok" id={`${item}-ok`} />
                        <Label htmlFor={`${item}-ok`} className="font-normal cursor-pointer">OK</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="needs_attention" id={`${item}-attention`} />
                        <Label htmlFor={`${item}-attention`} className="font-normal cursor-pointer">Needs Attention</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="critical" id={`${item}-critical`} />
                        <Label htmlFor={`${item}-critical`} className="font-normal cursor-pointer">Critical</Label>
                      </div>
                    </RadioGroup>

                    {checkItems[item].status !== "ok" && (
                      <Textarea
                        placeholder="Describe the issue..."
                        value={checkItems[item].notes}
                        onChange={(e) => updateCheckItem(item, "notes", e.target.value)}
                        rows={2}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <DynamicFormFields
            facilityId={selectedFacility}
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