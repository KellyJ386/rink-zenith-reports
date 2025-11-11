import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FormConfigEditorProps {
  formType: string;
}

export const FormConfigEditor = ({ formType }: FormConfigEditorProps) => {
  const { toast } = useToast();
  const [facilities, setFacilities] = useState<any[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<string>("");
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // New field form
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");
  const [newFieldOptions, setNewFieldOptions] = useState("");
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  useEffect(() => {
    fetchFacilities();
  }, []);

  useEffect(() => {
    if (selectedFacility) {
      fetchFields();
    }
  }, [selectedFacility, formType]);

  const fetchFacilities = async () => {
    const { data } = await supabase.from("facilities").select("*").order("name");
    setFacilities(data || []);
  };

  const fetchFields = async () => {
    const { data } = await supabase
      .from("form_configurations")
      .select("*")
      .eq("facility_id", selectedFacility)
      .eq("form_type", formType)
      .order("display_order");
    setFields(data || []);
  };

  const handleAddField = async () => {
    if (!newFieldName || !newFieldLabel) {
      toast({
        title: "Missing Information",
        description: "Please provide field name and label",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const options = newFieldType === "select" && newFieldOptions
        ? newFieldOptions.split(",").map(opt => opt.trim())
        : [];

      const { error } = await supabase.from("form_configurations").insert({
        facility_id: selectedFacility,
        form_type: formType,
        field_name: newFieldName.toLowerCase().replace(/\s+/g, "_"),
        field_label: newFieldLabel,
        field_type: newFieldType,
        field_options: options,
        is_required: newFieldRequired,
        display_order: fields.length,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Field added successfully",
      });

      // Reset form
      setNewFieldName("");
      setNewFieldLabel("");
      setNewFieldType("text");
      setNewFieldOptions("");
      setNewFieldRequired(false);

      fetchFields();
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add field",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!confirm("Are you sure you want to delete this field?")) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("form_configurations")
        .delete()
        .eq("id", fieldId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Field deleted successfully",
      });

      fetchFields();
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete field",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (fieldId: string, isActive: boolean) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("form_configurations")
        .update({ is_active: !isActive })
        .eq("id", fieldId);

      if (error) throw error;

      fetchFields();
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update field",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-[var(--shadow-ice)]">
        <CardHeader>
          <CardTitle>Select Facility</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {selectedFacility && (
        <>
          <Card className="shadow-[var(--shadow-ice)]">
            <CardHeader>
              <CardTitle>Add New Field</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Field Name (identifier) *</Label>
                  <Input
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    placeholder="e.g., temperature"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Field Label (display) *</Label>
                  <Input
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                    placeholder="e.g., Ice Temperature"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Field Type *</Label>
                  <Select value={newFieldType} onValueChange={setNewFieldType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="textarea">Text Area</SelectItem>
                      <SelectItem value="select">Dropdown</SelectItem>
                      <SelectItem value="checkbox">Checkbox</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newFieldType === "select" && (
                  <div className="space-y-2">
                    <Label>Options (comma-separated)</Label>
                    <Input
                      value={newFieldOptions}
                      onChange={(e) => setNewFieldOptions(e.target.value)}
                      placeholder="Option 1, Option 2, Option 3"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newFieldRequired}
                    onCheckedChange={setNewFieldRequired}
                  />
                  <Label>Required Field</Label>
                </div>
              </div>

              <Button onClick={handleAddField} disabled={loading}>
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-ice)]">
            <CardHeader>
              <CardTitle>Existing Fields</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {fields.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No custom fields configured yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {fields.map((field) => (
                      <Card key={field.id} className="border-border/50">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <div className="flex-1">
                                <p className="font-medium">{field.field_label}</p>
                                <p className="text-sm text-muted-foreground">
                                  {field.field_name} • {field.field_type}
                                  {field.is_required && " • Required"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={field.is_active}
                                onCheckedChange={() => handleToggleActive(field.id, field.is_active)}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteField(field.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};