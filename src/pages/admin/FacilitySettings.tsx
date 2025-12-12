import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";
import { Trash2, Plus, Building2, DoorOpen, Wrench, Snowflake, Upload, Edit, X, Image } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SVGRinkDiagram } from "@/components/ice-depth/SVGRinkDiagram";
import { Separator } from "@/components/ui/separator";
import { useUserContext } from "@/hooks/useUserContext";

interface FacilityForm {
  name: string;
  address: string;
  timezone: string;
}

interface Facility {
  id: string;
  name: string;
  address: string | null;
  timezone: string | null;
  enabled_templates: unknown;
}

interface Rink {
  id: string;
  name: string;
  center_ice_logo_url: string | null;
}

interface Machine {
  id: string;
  name: string;
  model: string;
  fuel_type: string;
}

interface EnabledTemplates {
  "24-point": boolean;
  "35-point": boolean;
  "47-point": boolean;
  "custom_1": boolean;
  "custom_2": boolean;
  "custom_3": boolean;
}

interface CustomTemplate {
  id: string;
  name: string;
  slot_number: number;
  point_count: number;
  template_data: {
    points: { id: number; x: number; y: number; name?: string }[];
  };
}

const defaultEnabledTemplates: EnabledTemplates = {
  "24-point": true,
  "35-point": true,
  "47-point": true,
  "custom_1": false,
  "custom_2": false,
  "custom_3": false,
};

const FacilitySettings = () => {
  const { toast } = useToast();
  const { facility: userFacility } = useUserContext();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [rinks, setRinks] = useState<Rink[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [newRinkName, setNewRinkName] = useState("");
  const [newMachine, setNewMachine] = useState({ name: "", model: "", fuel_type: "electric" });
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimezone, setSelectedTimezone] = useState<string>("America/New_York");
  const [enabledTemplates, setEnabledTemplates] = useState<EnabledTemplates>(defaultEnabledTemplates);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [editingTemplateName, setEditingTemplateName] = useState("");
  const [editingPoints, setEditingPoints] = useState<{ id: number; x: number; y: number; name?: string }[]>([]);
  const [uploadingLogo, setUploadingLogo] = useState<string | null>(null);

  const { register, handleSubmit, setValue } = useForm<FacilityForm>();

  // Load all facilities on mount
  useEffect(() => {
    loadFacilities();
  }, []);

  // Load facility-specific data when selection changes
  useEffect(() => {
    if (selectedFacilityId) {
      loadFacilityData(selectedFacilityId);
    }
  }, [selectedFacilityId]);

  const loadFacilities = async () => {
    const { data: facilitiesData, error } = await supabase
      .from("facilities")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error loading facilities:", error);
      setLoading(false);
      return;
    }

    setFacilities(facilitiesData || []);

    // Auto-select user's facility or first facility
    if (facilitiesData && facilitiesData.length > 0) {
      const userFacilityMatch = facilitiesData.find(f => f.id === userFacility?.id);
      setSelectedFacilityId(userFacilityMatch?.id || facilitiesData[0].id);
    }

    setLoading(false);
  };

  const loadFacilityData = async (facilityId: string) => {
    const selectedFacility = facilities.find(f => f.id === facilityId);
    
    if (selectedFacility) {
      setValue("name", selectedFacility.name);
      setValue("address", selectedFacility.address || "");
      setSelectedTimezone(selectedFacility.timezone || "America/New_York");
      if (selectedFacility.enabled_templates) {
        setEnabledTemplates(selectedFacility.enabled_templates as unknown as EnabledTemplates);
      } else {
        setEnabledTemplates(defaultEnabledTemplates);
      }
    }

    // Load rinks for selected facility
    const { data: rinksData } = await supabase
      .from("rinks")
      .select("*")
      .eq("facility_id", facilityId);
    setRinks(rinksData || []);

    // Load machines for selected facility
    const { data: machinesData } = await supabase
      .from("resurfacing_machines")
      .select("*")
      .eq("facility_id", facilityId);
    setMachines(machinesData || []);

    // Load custom templates for selected facility
    const { data: templatesData } = await supabase
      .from("custom_templates")
      .select("*")
      .eq("facility_id", facilityId)
      .order("slot_number");
    setCustomTemplates((templatesData || []).map(t => ({
      ...t,
      template_data: t.template_data as CustomTemplate["template_data"]
    })));
  };

  const selectedFacility = facilities.find(f => f.id === selectedFacilityId);

  const onSubmit = async (data: FacilityForm) => {
    if (!selectedFacilityId) return;

    const { error } = await supabase
      .from("facilities")
      .update({
        name: data.name,
        address: data.address,
        timezone: selectedTimezone,
      })
      .eq("id", selectedFacilityId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update facility settings",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Facility settings updated successfully",
      });
      // Reload facilities to get updated data
      const { data: facilitiesData } = await supabase.from("facilities").select("*").order("name");
      setFacilities(facilitiesData || []);
      loadFacilityData(selectedFacilityId);
    }
  };

  const handleTemplateToggle = async (templateKey: keyof EnabledTemplates, enabled: boolean) => {
    if (!selectedFacilityId) return;

    const updated = { ...enabledTemplates, [templateKey]: enabled };
    setEnabledTemplates(updated);

    const { error } = await supabase
      .from("facilities")
      .update({ enabled_templates: updated })
      .eq("id", selectedFacilityId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update template visibility",
        variant: "destructive",
      });
      setEnabledTemplates(enabledTemplates);
    }
  };

  const getCustomTemplateForSlot = (slot: number): CustomTemplate | undefined => {
    return customTemplates.find(t => t.slot_number === slot);
  };

  const handleEditCustomTemplate = (slot: number) => {
    const existing = getCustomTemplateForSlot(slot);
    setEditingSlot(slot);
    setEditingTemplateName(existing?.name || "");
    setEditingPoints(existing?.template_data?.points || []);
  };

  const handleSaveCustomTemplate = async () => {
    if (!selectedFacilityId || editingSlot === null) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const existing = getCustomTemplateForSlot(editingSlot);

    if (existing) {
      const { error } = await supabase
        .from("custom_templates")
        .update({
          name: editingTemplateName,
          template_data: { points: editingPoints },
          point_count: editingPoints.length,
        })
        .eq("id", existing.id);

      if (error) {
        toast({ title: "Error", description: "Failed to update template", variant: "destructive" });
        return;
      }
    } else {
      const { error } = await supabase
        .from("custom_templates")
        .insert({
          name: editingTemplateName,
          facility_id: selectedFacilityId,
          user_id: user.id,
          slot_number: editingSlot,
          template_data: { points: editingPoints },
          point_count: editingPoints.length,
        });

      if (error) {
        toast({ title: "Error", description: "Failed to create template", variant: "destructive" });
        return;
      }
    }

    toast({ title: "Success", description: "Template saved successfully" });
    setEditingSlot(null);
    loadFacilityData(selectedFacilityId);
  };

  const handleClearCustomTemplate = async (slot: number) => {
    const existing = getCustomTemplateForSlot(slot);
    if (!existing) return;

    const { error } = await supabase
      .from("custom_templates")
      .delete()
      .eq("id", existing.id);

    if (error) {
      toast({ title: "Error", description: "Failed to clear template", variant: "destructive" });
      return;
    }

    // Disable the template slot
    await handleTemplateToggle(`custom_${slot}` as keyof EnabledTemplates, false);
    toast({ title: "Success", description: "Template cleared" });
    if (selectedFacilityId) loadFacilityData(selectedFacilityId);
  };

  const handleLogoUpload = async (rinkId: string, file: File) => {
    if (!file) return;

    setUploadingLogo(rinkId);

    const fileExt = file.name.split(".").pop();
    const filePath = `${rinkId}/logo.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("rink-logos")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Error", description: "Failed to upload logo", variant: "destructive" });
      setUploadingLogo(null);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("rink-logos")
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from("rinks")
      .update({ center_ice_logo_url: publicUrl })
      .eq("id", rinkId);

    if (updateError) {
      toast({ title: "Error", description: "Failed to update rink", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Logo uploaded successfully" });
      if (selectedFacilityId) loadFacilityData(selectedFacilityId);
    }

    setUploadingLogo(null);
  };

  const addRink = async () => {
    if (!newRinkName.trim() || !selectedFacilityId) return;

    const { error } = await supabase.from("rinks").insert({
      facility_id: selectedFacilityId,
      name: newRinkName,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add rink",
        variant: "destructive",
      });
    } else {
      toast({ title: "Success", description: "Rink added successfully" });
      setNewRinkName("");
      loadFacilityData(selectedFacilityId);
    }
  };

  const addMachine = async () => {
    if (!newMachine.name.trim() || !selectedFacilityId) return;

    const { error } = await supabase.from("resurfacing_machines").insert({
      facility_id: selectedFacilityId,
      name: newMachine.name,
      model: newMachine.model,
      fuel_type: newMachine.fuel_type,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add machine",
        variant: "destructive",
      });
    } else {
      toast({ title: "Success", description: "Machine added successfully" });
      setNewMachine({ name: "", model: "", fuel_type: "electric" });
      loadFacilityData(selectedFacilityId);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    const table = deleteTarget.type === "rink" ? "rinks" : "resurfacing_machines";
    const { error } = await supabase.from(table).delete().eq("id", deleteTarget.id);

    if (error) {
      toast({
        title: "Error",
        description: `Failed to delete ${deleteTarget.type}`,
        variant: "destructive",
      });
    } else {
      toast({ title: "Success", description: `${deleteTarget.type} deleted successfully` });
      if (selectedFacilityId) loadFacilityData(selectedFacilityId);
    }
    setDeleteTarget(null);
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facility Settings"
        subtitle="Manage your facility information, rinks, and equipment"
        icon={<Building2 className="h-8 w-8 text-primary" />}
      />

      {/* Facility Selector */}
      {facilities.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Select Facility
            </CardTitle>
            <CardDescription>Choose which facility to manage</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedFacilityId || ""} onValueChange={setSelectedFacilityId}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Select a facility" />
              </SelectTrigger>
              <SelectContent>
                {facilities.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Facility Information
          </CardTitle>
          <CardDescription>Update your facility's basic details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Facility Name</Label>
              <Input id="name" {...register("name")} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register("address")} placeholder="Street, City, State, Zip" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Time Zone</Label>
              <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                  <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                  <SelectItem value="America/Phoenix">Arizona Time (MST)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                  <SelectItem value="America/Anchorage">Alaska Time (AKT)</SelectItem>
                  <SelectItem value="Pacific/Honolulu">Hawaii Time (HST)</SelectItem>
                  <SelectItem value="America/Toronto">Toronto (ET)</SelectItem>
                  <SelectItem value="America/Vancouver">Vancouver (PT)</SelectItem>
                  <SelectItem value="America/Edmonton">Edmonton (MT)</SelectItem>
                  <SelectItem value="America/Winnipeg">Winnipeg (CT)</SelectItem>
                  <SelectItem value="America/Halifax">Halifax (AT)</SelectItem>
                  <SelectItem value="Europe/London">London (GMT)</SelectItem>
                  <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                  <SelectItem value="Europe/Berlin">Berlin (CET)</SelectItem>
                  <SelectItem value="Europe/Moscow">Moscow (MSK)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                  <SelectItem value="Asia/Shanghai">Shanghai (CST)</SelectItem>
                  <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
                  <SelectItem value="Australia/Sydney">Sydney (AEDT)</SelectItem>
                  <SelectItem value="Pacific/Auckland">Auckland (NZDT)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">Save Facility Settings</Button>
          </form>
        </CardContent>
      </Card>

      {/* Ice Depth Template Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Snowflake className="h-5 w-5" />
            Ice Depth Template Settings
          </CardTitle>
          <CardDescription>Control which measurement templates are available to staff</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preset Templates */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">Preset Templates</h4>
            <div className="space-y-3">
              {[
                { key: "24-point" as const, label: "24-Point Template", points: 24 },
                { key: "35-point" as const, label: "35-Point Template", points: 35 },
                { key: "47-point" as const, label: "47-Point Template", points: 47 },
              ].map((template) => (
                <div key={template.key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <span className="font-medium">{template.label}</span>
                    <span className="text-sm text-muted-foreground ml-2">({template.points} points)</span>
                  </div>
                  <Switch
                    checked={enabledTemplates[template.key]}
                    onCheckedChange={(checked) => handleTemplateToggle(template.key, checked)}
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Custom Templates */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">Custom Templates (up to 60 points each)</h4>
            <div className="space-y-3">
              {[1, 2, 3].map((slot) => {
                const template = getCustomTemplateForSlot(slot);
                const slotKey = `custom_${slot}` as keyof EnabledTemplates;
                const isConfigured = !!template;

                return (
                  <div key={slot} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <span className="font-medium">
                        Custom {slot}: {template?.name || "[Not Set]"}
                      </span>
                      {template && (
                        <span className="text-sm text-muted-foreground ml-2">
                          ({template.point_count} points)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCustomTemplate(slot)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        {isConfigured ? "Edit" : "Create"}
                      </Button>
                      {isConfigured && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleClearCustomTemplate(slot)}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                      <Switch
                        checked={enabledTemplates[slotKey]}
                        onCheckedChange={(checked) => handleTemplateToggle(slotKey, checked)}
                        disabled={!isConfigured}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DoorOpen className="h-5 w-5" />
            Rinks
          </CardTitle>
          <CardDescription>Manage ice rinks at this facility</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {rinks.map((rink) => (
              <div key={rink.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {rink.center_ice_logo_url ? (
                    <img
                      src={rink.center_ice_logo_url}
                      alt={`${rink.name} logo`}
                      className="w-10 h-10 object-contain rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                      <Image className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <span className="font-medium">{rink.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(rink.id, file);
                      }}
                    />
                    <Button variant="outline" size="sm" asChild disabled={uploadingLogo === rink.id}>
                      <span>
                        <Upload className="h-4 w-4 mr-1" />
                        {uploadingLogo === rink.id ? "Uploading..." : "Logo"}
                      </span>
                    </Button>
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget({ type: "rink", id: rink.id })}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Rink name"
              value={newRinkName}
              onChange={(e) => setNewRinkName(e.target.value)}
            />
            <Button onClick={addRink}>
              <Plus className="h-4 w-4 mr-2" />
              Add Rink
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Resurfacing Machines
          </CardTitle>
          <CardDescription>Manage equipment used for ice maintenance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {machines.map((machine) => (
              <div key={machine.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <span className="font-medium">{machine.name}</span>
                  {machine.model && <span className="text-sm text-muted-foreground ml-2">({machine.model})</span>}
                  <span className="ml-2 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                    {machine.fuel_type === "gas" ? "Gas" : "Electric"}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTarget({ type: "machine", id: machine.id })}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input
                placeholder="Machine name"
                value={newMachine.name}
                onChange={(e) => setNewMachine({ ...newMachine, name: e.target.value })}
              />
              <Input
                placeholder="Model (optional)"
                value={newMachine.model}
                onChange={(e) => setNewMachine({ ...newMachine, model: e.target.value })}
              />
              <Select 
                value={newMachine.fuel_type} 
                onValueChange={(value) => setNewMachine({ ...newMachine, fuel_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Fuel Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="electric">Electric</SelectItem>
                  <SelectItem value="gas">Gas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={addMachine}>
              <Plus className="h-4 w-4 mr-2" />
              Add Machine
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {deleteTarget?.type}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Custom Template Editor Dialog */}
      <Dialog open={editingSlot !== null} onOpenChange={() => setEditingSlot(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {getCustomTemplateForSlot(editingSlot || 0) ? "Edit" : "Create"} Custom Template {editingSlot}
            </DialogTitle>
            <DialogDescription>
              Click on the rink diagram to place measurement points (up to 60). Click on a point to remove it.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="templateName">Template Name</Label>
              <Input
                id="templateName"
                placeholder="e.g., Quick Daily Check"
                value={editingTemplateName}
                onChange={(e) => setEditingTemplateName(e.target.value)}
              />
            </div>

            <div className="border rounded-lg overflow-hidden">
              <SVGRinkDiagram
                points={editingPoints}
                measurements={{}}
                currentPointId={0}
                unit="in"
                editMode={true}
                onPointsChange={setEditingPoints}
                maxPoints={60}
              />
            </div>

            <p className="text-sm text-muted-foreground">
              Points: {editingPoints.length} / 60
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSlot(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveCustomTemplate}
              disabled={!editingTemplateName.trim() || editingPoints.length === 0}
            >
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FacilitySettings;
