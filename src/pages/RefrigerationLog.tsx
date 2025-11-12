import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Thermometer, Gauge, Droplets, Settings, FileText } from "lucide-react";

interface Equipment {
  id: string;
  equipment_type: string;
  equipment_name: string;
  display_order: number;
}

interface ChecklistItem {
  id: string;
  item_text: string;
  display_order: number;
}

export default function RefrigerationLog() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [readings, setReadings] = useState<Record<string, any>>({});
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");
  const [facilityId, setFacilityId] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("facility_id")
        .eq("user_id", user.id)
        .single();

      if (profile?.facility_id) {
        setFacilityId(profile.facility_id);

        const [equipmentRes, checklistRes] = await Promise.all([
          supabase
            .from("refrigeration_equipment")
            .select("*")
            .eq("facility_id", profile.facility_id)
            .eq("is_active", true)
            .order("display_order"),
          supabase
            .from("refrigeration_checklist_template")
            .select("*")
            .eq("facility_id", profile.facility_id)
            .eq("is_active", true)
            .order("display_order")
        ]);

        if (equipmentRes.data) setEquipment(equipmentRes.data);
        if (checklistRes.data) setChecklistItems(checklistRes.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ title: "Error loading data", variant: "destructive" });
    }
  };

  const handleReadingChange = (equipmentId: string, field: string, value: string) => {
    setReadings(prev => ({
      ...prev,
      [equipmentId]: {
        ...prev[equipmentId],
        [field]: value
      }
    }));
  };

  const handleChecklistChange = (itemId: string, checked: boolean) => {
    setChecklist(prev => ({ ...prev, [itemId]: checked }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("refrigeration_logs").insert({
        facility_id: facilityId,
        operator_id: user.id,
        readings,
        checklist_items: checklist,
        notes
      });

      if (error) throw error;

      toast({ title: "Log entry saved successfully" });
      setReadings({});
      setChecklist({});
      setNotes("");
    } catch (error) {
      console.error("Error saving log:", error);
      toast({ title: "Error saving log", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const groupedEquipment = equipment.reduce((acc, item) => {
    if (!acc[item.equipment_type]) acc[item.equipment_type] = [];
    acc[item.equipment_type].push(item);
    return acc;
  }, {} as Record<string, Equipment[]>);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Refrigeration Log</h1>
          <p className="text-muted-foreground">Monitor refrigeration system vital signs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/refrigeration-reports")}>
            <FileText className="mr-2 h-4 w-4" />
            View Reports
          </Button>
          <Button variant="outline" onClick={() => navigate("/admin/refrigeration-config")}>
            <Settings className="mr-2 h-4 w-4" />
            Configure
          </Button>
        </div>
      </div>

      {Object.entries(groupedEquipment).map(([type, items]) => (
        <Card key={type} className="p-6">
          <h2 className="text-xl font-semibold mb-4 capitalize flex items-center gap-2">
            {type === "compressor" && <Gauge className="h-5 w-5" />}
            {type === "pump" && <Droplets className="h-5 w-5" />}
            {type === "condenser" && <Thermometer className="h-5 w-5" />}
            {type}s
          </h2>
          <div className="grid gap-4">
            {items.map(item => (
              <div key={item.id} className="border rounded-lg p-4 space-y-3">
                <h3 className="font-medium">{item.equipment_name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Pressure (PSI)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={readings[item.id]?.pressure || ""}
                      onChange={(e) => handleReadingChange(item.id, "pressure", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Temperature (°F)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={readings[item.id]?.temperature || ""}
                      onChange={(e) => handleReadingChange(item.id, "temperature", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Oil Level</Label>
                    <Input
                      placeholder="Normal/Low/High"
                      value={readings[item.id]?.oil_level || ""}
                      onChange={(e) => handleReadingChange(item.id, "oil_level", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Daily Safety Checklist</h2>
        <div className="space-y-3">
          {checklistItems.map(item => (
            <div key={item.id} className="flex items-center space-x-2">
              <Checkbox
                id={item.id}
                checked={checklist[item.id] || false}
                onCheckedChange={(checked) => handleChecklistChange(item.id, checked as boolean)}
              />
              <Label htmlFor={item.id} className="cursor-pointer">
                {item.item_text}
              </Label>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Additional Notes</h2>
        <Textarea
          placeholder="Enter any observations or concerns..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
        />
      </Card>

      <Button onClick={handleSubmit} disabled={loading} size="lg" className="w-full">
        {loading ? "Saving..." : "Submit Log Entry"}
      </Button>
    </div>
  );
}
