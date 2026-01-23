import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DynamicFormFields } from "./DynamicFormFields";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ELECTRIC_CHECK_SECTIONS,
  GAS_CHECK_SECTIONS,
  CheckSection,
  initializeCheckState,
} from "@/data/circleCheckData";

interface CircleCheckFormProps {
  userId: string;
  onSuccess: () => void;
}

export const CircleCheckForm = ({ userId, onSuccess }: CircleCheckFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [facilityId, setFacilityId] = useState<string>("");
  const [machines, setMachines] = useState<any[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<string>("");
  const [selectedFuelType, setSelectedFuelType] = useState<"gas" | "electric" | null>(null);
  const [checkItems, setCheckItems] = useState<Record<string, { passed: boolean; notes: string }>>({});
  const [generalNotes, setGeneralNotes] = useState<string>("");
  const [customFields, setCustomFields] = useState<Record<string, any>>({});

  const currentSections: CheckSection[] = selectedFuelType === "gas" 
    ? GAS_CHECK_SECTIONS 
    : selectedFuelType === "electric" 
      ? ELECTRIC_CHECK_SECTIONS 
      : [];

  useEffect(() => {
    fetchUserFacility();
  }, [userId]);

  useEffect(() => {
    if (facilityId) {
      fetchMachines(facilityId);
    }
  }, [facilityId]);

  // Initialize check items when machine changes
  useEffect(() => {
    if (selectedFuelType && currentSections.length > 0) {
      setCheckItems(initializeCheckState(currentSections));
    }
  }, [selectedFuelType]);

  const fetchUserFacility = async () => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("facility_id")
      .eq("user_id", userId)
      .single();
    
    if (profile?.facility_id) {
      setFacilityId(profile.facility_id);
    } else {
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

  const handleMachineChange = (machineId: string) => {
    setSelectedMachine(machineId);
    const machine = machines.find((m) => m.id === machineId);
    if (machine?.fuel_type) {
      setSelectedFuelType(machine.fuel_type as "gas" | "electric");
    } else {
      // Default to electric if no fuel type specified
      setSelectedFuelType("electric");
    }
  };

  const toggleCheckItem = (item: string) => {
    setCheckItems(prev => ({
      ...prev,
      [item]: {
        ...prev[item],
        passed: !prev[item].passed,
        notes: prev[item].passed ? prev[item].notes : ""
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

  const getSectionProgress = (section: CheckSection) => {
    const passed = section.items.filter(item => checkItems[item]?.passed).length;
    return { passed, total: section.items.length };
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

      // Insert all check items
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
      setSelectedFuelType(null);
      setCheckItems({});
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
            <Select value={selectedMachine} onValueChange={handleMachineChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select machine" />
              </SelectTrigger>
              <SelectContent>
                {machines.map((machine) => (
                  <SelectItem key={machine.id} value={machine.id}>
                    {machine.name} {machine.model && `(${machine.model})`}
                    {machine.fuel_type && ` - ${machine.fuel_type.charAt(0).toUpperCase() + machine.fuel_type.slice(1)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedFuelType && currentSections.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">
                  Pre-Operation Checklist ({selectedFuelType.charAt(0).toUpperCase() + selectedFuelType.slice(1)})
                </Label>
                <Badge variant="outline">
                  {Object.values(checkItems).filter(i => i.passed).length} / {Object.keys(checkItems).length} Passed
                </Badge>
              </div>

              <Accordion type="multiple" defaultValue={currentSections.map(s => s.id)} className="space-y-2">
                {currentSections.map((section) => {
                  const { passed, total } = getSectionProgress(section);
                  const allPassed = passed === total;
                  const progressPercent = (passed / total) * 100;

                  return (
                    <AccordionItem 
                      key={section.id} 
                      value={section.id}
                      className="border rounded-lg overflow-hidden"
                    >
                      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                        <div className="flex items-center gap-3 flex-1">
                          {allPassed ? (
                            <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                          ) : (
                            <XCircle className="h-5 w-5 text-amber-500 shrink-0" />
                          )}
                          <span className="font-medium">{section.title}</span>
                          <div className="flex-1 max-w-[100px] ml-auto mr-4">
                            <Progress value={progressPercent} className="h-2" />
                          </div>
                          <span className={`text-sm ${allPassed ? "text-green-600" : "text-amber-600"}`}>
                            {passed}/{total}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-2 pt-2">
                          {section.items.map((item) => (
                            <div 
                              key={item} 
                              className={`p-3 rounded-lg border ${
                                checkItems[item]?.passed 
                                  ? "border-border/50 bg-background" 
                                  : "border-destructive/50 bg-destructive/5"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 flex-1">
                                  {checkItems[item]?.passed ? (
                                    <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-destructive shrink-0" />
                                  )}
                                  <span className="text-sm">{item}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs ${checkItems[item]?.passed ? "text-green-600" : "text-destructive"}`}>
                                    {checkItems[item]?.passed ? "Pass" : "Fail"}
                                  </span>
                                  <Switch
                                    checked={checkItems[item]?.passed ?? true}
                                    onCheckedChange={() => toggleCheckItem(item)}
                                  />
                                </div>
                              </div>

                              {!checkItems[item]?.passed && (
                                <div className="mt-2">
                                  <Textarea
                                    placeholder="Describe the issue..."
                                    value={checkItems[item]?.notes || ""}
                                    onChange={(e) => updateCheckItemNotes(item, e.target.value)}
                                    rows={2}
                                    className="bg-background text-sm"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          )}

          {!selectedMachine && (
            <div className="text-center py-8 text-muted-foreground">
              Select a machine to view the checklist
            </div>
          )}

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

          <Button type="submit" disabled={loading || !selectedMachine} className="w-full">
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
