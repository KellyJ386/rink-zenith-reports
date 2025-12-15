import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { DynamicFormFields } from "./DynamicFormFields";

interface EdgingFormProps {
  userId: string;
  onSuccess: () => void;
}

export const EdgingForm = ({ userId, onSuccess }: EdgingFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [facilityId, setFacilityId] = useState<string>("");
  const [rinks, setRinks] = useState<any[]>([]);
  const [selectedRink, setSelectedRink] = useState<string>("");
  const [edgingType, setEdgingType] = useState<string>("full");
  const [notes, setNotes] = useState<string>("");
  const [customFields, setCustomFields] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchUserFacility();
  }, [userId]);

  useEffect(() => {
    if (facilityId) {
      fetchRinks(facilityId);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!facilityId || !selectedRink) {
      toast({
        title: "Missing Information",
        description: "Please select a rink",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("maintenance_activities").insert({
        facility_id: facilityId,
        activity_type: "edging",
        rink_id: selectedRink,
        operator_id: userId,
        edging_type: edgingType,
        notes,
        custom_fields: customFields,
      });

      if (error) throw error;

      onSuccess();
      // Reset form
      setSelectedRink("");
      setEdgingType("full");
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
        <CardTitle>Edging Activity</CardTitle>
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
              <Label>Edging Type *</Label>
              <Select value={edgingType} onValueChange={setEdgingType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Perimeter</SelectItem>
                  <SelectItem value="corners">Corners Only</SelectItem>
                  <SelectItem value="sides">Sides Only</SelectItem>
                  <SelectItem value="spot">Spot Edging</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DynamicFormFields
            facilityId={facilityId}
            formType="edging"
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
              "Log Edging Activity"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
