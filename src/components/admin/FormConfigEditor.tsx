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