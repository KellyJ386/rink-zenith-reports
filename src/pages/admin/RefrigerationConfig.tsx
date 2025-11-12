import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { Trash2, Plus } from "lucide-react";

interface Equipment {
  id: string;
  equipment_type: string;
  equipment_name: string;
  display_order: number;
  is_active: boolean;
}

interface ChecklistItem {
  id: string;
  item_text: string;
  display_order: number;
  is_active: boolean;
}

export default function RefrigerationConfig() {
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [facilityId, setFacilityId] = useState<string>("");
  const [newEquipment, setNewEquipment] = useState({ type: "compressor", name: "" });
  const [newChecklistItem, setNewChecklistItem] = useState("");

  useEffect(() => {
    checkAdminAndFetchData();
  }, []);

  const checkAdminAndFetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = roles?.some(r => r.role === "admin");
    if (!isAdmin) {
      toast({ title: "Access denied", variant: "destructive" });
      navigate("/dashboard");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("facility_id")
      .eq("user_id", user.id)
      .single();

    if (profile?.facility_id) {
      setFacilityId(profile.facility_id);
      fetchData(profile.facility_id);
    }
  };

  const fetchData = async (fId: string) => {
    const [equipmentRes, checklistRes] = await Promise.all([
      supabase
        .from("refrigeration_equipment")
        .select("*")
        .eq("facility_id", fId)
        .order("display_order"),
      supabase
        .from("refrigeration_checklist_template")
        .select("*")
        .eq("facility_id", fId)
        .order("display_order")
    ]);

    if (equipmentRes.data) setEquipment(equipmentRes.data);
    if (checklistRes.data) setChecklistItems(checklistRes.data);
  };

  const handleAddEquipment = async () => {
    if (!newEquipment.name.trim()) {
      toast({ title: "Please enter equipment name", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("refrigeration_equipment").insert({
      facility_id: facilityId,
      equipment_type: newEquipment.type,
      equipment_name: newEquipment.name,
      display_order: equipment.length
    });

    if (error) {
      toast({ title: "Error adding equipment", variant: "destructive" });
    } else {
      toast({ title: "Equipment added" });
      setNewEquipment({ type: "compressor", name: "" });
      fetchData(facilityId);
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    const { error } = await supabase
      .from("refrigeration_equipment")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error deleting equipment", variant: "destructive" });
    } else {
      toast({ title: "Equipment deleted" });
      fetchData(facilityId);
    }
  };

  const handleToggleEquipment = async (id: string, is_active: boolean) => {
    const { error } = await supabase
      .from("refrigeration_equipment")
      .update({ is_active })
      .eq("id", id);

    if (error) {
      toast({ title: "Error updating equipment", variant: "destructive" });
    } else {
      fetchData(facilityId);
    }
  };

  const handleAddChecklistItem = async () => {
    if (!newChecklistItem.trim()) {
      toast({ title: "Please enter checklist item", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("refrigeration_checklist_template").insert({
      facility_id: facilityId,
      item_text: newChecklistItem,
      display_order: checklistItems.length
    });

    if (error) {
      toast({ title: "Error adding checklist item", variant: "destructive" });
    } else {
      toast({ title: "Checklist item added" });
      setNewChecklistItem("");
      fetchData(facilityId);
    }
  };

  const handleDeleteChecklistItem = async (id: string) => {
    const { error } = await supabase
      .from("refrigeration_checklist_template")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error deleting checklist item", variant: "destructive" });
    } else {
      toast({ title: "Checklist item deleted" });
      fetchData(facilityId);
    }
  };

  const handleToggleChecklistItem = async (id: string, is_active: boolean) => {
    const { error } = await supabase
      .from("refrigeration_checklist_template")
      .update({ is_active })
      .eq("id", id);

    if (error) {
      toast({ title: "Error updating checklist item", variant: "destructive" });
    } else {
      fetchData(facilityId);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Refrigeration Configuration</h1>
          <p className="text-muted-foreground">Manage equipment and checklist items</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/refrigeration-log")}>
          Back to Log
        </Button>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Add Equipment</h2>
        <div className="flex gap-4">
          <div className="flex-1">
            <Label>Equipment Type</Label>
            <Select value={newEquipment.type} onValueChange={(value) => setNewEquipment({ ...newEquipment, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compressor">Compressor</SelectItem>
                <SelectItem value="pump">Pump</SelectItem>
                <SelectItem value="condenser">Condenser</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label>Equipment Name</Label>
            <Input
              value={newEquipment.name}
              onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
              placeholder="e.g., Main Compressor #1"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleAddEquipment}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Equipment List</h2>
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {equipment.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">{item.equipment_name}</p>
                  <p className="text-sm text-muted-foreground capitalize">{item.equipment_type}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`eq-${item.id}`}>Active</Label>
                    <Switch
                      id={`eq-${item.id}`}
                      checked={item.is_active}
                      onCheckedChange={(checked) => handleToggleEquipment(item.id, checked)}
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteEquipment(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Add Checklist Item</h2>
        <div className="flex gap-4">
          <div className="flex-1">
            <Label>Checklist Item Text</Label>
            <Input
              value={newChecklistItem}
              onChange={(e) => setNewChecklistItem(e.target.value)}
              placeholder="e.g., Check for unusual sounds or vibrations"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleAddChecklistItem}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Checklist Items</h2>
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {checklistItems.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                <p>{item.item_text}</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`cl-${item.id}`}>Active</Label>
                    <Switch
                      id={`cl-${item.id}`}
                      checked={item.is_active}
                      onCheckedChange={(checked) => handleToggleChecklistItem(item.id, checked)}
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteChecklistItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
