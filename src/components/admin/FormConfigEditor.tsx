import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FormBuilderEditor } from "./form-builder/FormBuilderEditor";

interface FormConfigEditorProps {
  formType: string;
}

export const FormConfigEditor = ({ formType }: FormConfigEditorProps) => {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<string>("");

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    const { data } = await supabase.from("facilities").select("*").order("name");
    setFacilities(data || []);
    if (data && data.length > 0 && !selectedFacility) {
      setSelectedFacility(data[0].id);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Form Builder Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p><strong>➕ Add Fields:</strong> Drag field types from the left palette onto the canvas</p>
          <p><strong>✏️ Edit Fields:</strong> Click any field to edit its properties on the right</p>
          <p><strong>🗑️ Remove Fields:</strong> Click the trash icon on any field to delete it</p>
          <p><strong>↕️ Reorder:</strong> Drag fields up/down to rearrange them</p>
          <p><strong>💾 Save:</strong> Click the Save button to apply your changes</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Select Facility</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Facility</Label>
            <Select value={selectedFacility} onValueChange={setSelectedFacility}>
              <SelectTrigger>
                <SelectValue placeholder="Select a facility" />
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
        </CardContent>
      </Card>

      {selectedFacility && (
        <FormBuilderEditor facilityId={selectedFacility} formType={formType} />
      )}
    </div>
  );
};