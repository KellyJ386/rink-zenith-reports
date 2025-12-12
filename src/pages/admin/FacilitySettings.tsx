import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { logAuditEvent } from "@/services/auditLog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";
import { Trash2, Plus, Building2, DoorOpen, Wrench, Snowflake, Upload, Edit, X, Image, MapPin, Calendar } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

interface FacilityForm {
  name: string;
  address: string;
  timezone: string;
  phone: string;
  emergency_contact: string;
  website: string;
  season_start: string;
  season_end: string;
  latitude: string;
  longitude: string;
}

interface Facility {
  id: string;
  name: string;
  address: string | null;
  timezone: string | null;
  enabled_templates: unknown;
  phone: string | null;
  emergency_contact: string | null;
  website: string | null;
  season_start: string | null;
  season_end: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface Rink {
  id: string;
  name: string;
  center_ice_logo_url: string | null;
  length_feet: number | null;
  width_feet: number | null;
  target_depth_min: number | null;
  target_depth_max: number | null;
  target_depth_ideal: number | null;
  primary_use: string | null;
  measurement_grid: string | null;
  is_active: boolean;
}

interface Machine {
  id: string;
  name: string;
  model: string | null;
  fuel_type: string | null;
  year: number | null;
  serial_number: string | null;
  blade_tracking: string | null;
  expected_blade_life_hours: number | null;
  expected_blade_life_makes: number | null;
  current_blade_hours: number | null;
  current_blade_makes: number | null;
  last_blade_change: string | null;
  status: string | null;
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
  const [newMachine, setNewMachine] = useState({ 
    name: "", 
    model: "", 
    fuel_type: "electric",
    year: "",
    serial_number: "",
    blade_tracking: "hours",
    expected_blade_life_hours: "100",
    expected_blade_life_makes: "500",
  });
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimezone, setSelectedTimezone] = useState<string>("America/New_York");
  const [enabledTemplates, setEnabledTemplates] = useState<EnabledTemplates>(defaultEnabledTemplates);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [editingTemplateName, setEditingTemplateName] = useState("");
  const [editingPoints, setEditingPoints] = useState<{ id: number; x: number; y: number; name?: string }[]>([]);
  const [uploadingLogo, setUploadingLogo] = useState<string | null>(null);
  const [editingRink, setEditingRink] = useState<Rink | null>(null);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);

  const { register, handleSubmit, setValue, watch } = useForm<FacilityForm>();

  useEffect(() => {
    loadFacilities();
  }, []);

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

    setFacilities((facilitiesData || []) as Facility[]);

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
      setValue("phone", selectedFacility.phone || "");
      setValue("emergency_contact", selectedFacility.emergency_contact || "");
      setValue("website", selectedFacility.website || "");
      setValue("season_start", selectedFacility.season_start || "");
      setValue("season_end", selectedFacility.season_end || "");
      setValue("latitude", selectedFacility.latitude?.toString() || "");
      setValue("longitude", selectedFacility.longitude?.toString() || "");
      setSelectedTimezone(selectedFacility.timezone || "America/New_York");
      if (selectedFacility.enabled_templates) {
        setEnabledTemplates(selectedFacility.enabled_templates as unknown as EnabledTemplates);
      } else {
        setEnabledTemplates(defaultEnabledTemplates);
      }
    }

    const { data: rinksData } = await supabase
      .from("rinks")
      .select("*")
      .eq("facility_id", facilityId);
    setRinks((rinksData || []) as Rink[]);

    const { data: machinesData } = await supabase
      .from("resurfacing_machines")
      .select("*")
      .eq("facility_id", facilityId);
    setMachines((machinesData || []) as Machine[]);

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

    const updateData = {
      name: data.name,
      address: data.address,
      timezone: selectedTimezone,
      phone: data.phone || null,
      emergency_contact: data.emergency_contact || null,
      website: data.website || null,
      season_start: data.season_start || null,
      season_end: data.season_end || null,
      latitude: data.latitude ? parseFloat(data.latitude) : null,
      longitude: data.longitude ? parseFloat(data.longitude) : null,
    };

    const { error } = await supabase
      .from("facilities")
      .update(updateData)
      .eq("id", selectedFacilityId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update facility settings",
        variant: "destructive",
      });
    } else {
      await logAuditEvent({
        action: "updated facility settings",
        targetType: "facility",
        targetId: selectedFacilityId,
        targetName: data.name,
        changes: updateData,
      });
      toast({
        title: "Success",
        description: "Facility settings updated successfully",
      });
      const { data: facilitiesData } = await supabase.from("facilities").select("*").order("name");
      setFacilities((facilitiesData || []) as Facility[]);
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
      await logAuditEvent({
        action: "added rink",
        targetType: "rink",
        targetName: newRinkName,
      });
      toast({ title: "Success", description: "Rink added successfully" });
      setNewRinkName("");
      loadFacilityData(selectedFacilityId);
    }
  };

  const handleSaveRink = async () => {
    if (!editingRink) return;

    const { error } = await supabase
      .from("rinks")
      .update({
        name: editingRink.name,
        length_feet: editingRink.length_feet,
        width_feet: editingRink.width_feet,
        target_depth_min: editingRink.target_depth_min,
        target_depth_max: editingRink.target_depth_max,
        target_depth_ideal: editingRink.target_depth_ideal,
        primary_use: editingRink.primary_use,
        measurement_grid: editingRink.measurement_grid,
        is_active: editingRink.is_active,
      })
      .eq("id", editingRink.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update rink", variant: "destructive" });
    } else {
      await logAuditEvent({
        action: "updated rink",
        targetType: "rink",
        targetId: editingRink.id,
        targetName: editingRink.name,
      });
      toast({ title: "Success", description: "Rink updated successfully" });
      setEditingRink(null);
      if (selectedFacilityId) loadFacilityData(selectedFacilityId);
    }
  };

  const addMachine = async () => {
    if (!newMachine.name.trim() || !selectedFacilityId) return;

    const { error } = await supabase.from("resurfacing_machines").insert({
      facility_id: selectedFacilityId,
      name: newMachine.name,
      model: newMachine.model || null,
      fuel_type: newMachine.fuel_type,
      year: newMachine.year ? parseInt(newMachine.year) : null,
      serial_number: newMachine.serial_number || null,
      blade_tracking: newMachine.blade_tracking,
      expected_blade_life_hours: parseInt(newMachine.expected_blade_life_hours) || 100,
      expected_blade_life_makes: parseInt(newMachine.expected_blade_life_makes) || 500,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add machine",
        variant: "destructive",
      });
    } else {
      await logAuditEvent({
        action: "added machine",
        targetType: "machine",
        targetName: newMachine.name,
      });
      toast({ title: "Success", description: "Machine added successfully" });
      setNewMachine({ 
        name: "", 
        model: "", 
        fuel_type: "electric",
        year: "",
        serial_number: "",
        blade_tracking: "hours",
        expected_blade_life_hours: "100",
        expected_blade_life_makes: "500",
      });
      loadFacilityData(selectedFacilityId);
    }
  };

  const handleSaveMachine = async () => {
    if (!editingMachine) return;

    const { error } = await supabase
      .from("resurfacing_machines")
      .update({
        name: editingMachine.name,
        model: editingMachine.model,
        fuel_type: editingMachine.fuel_type,
        year: editingMachine.year,
        serial_number: editingMachine.serial_number,
        blade_tracking: editingMachine.blade_tracking,
        expected_blade_life_hours: editingMachine.expected_blade_life_hours,
        expected_blade_life_makes: editingMachine.expected_blade_life_makes,
        status: editingMachine.status,
      })
      .eq("id", editingMachine.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update machine", variant: "destructive" });
    } else {
      await logAuditEvent({
        action: "updated machine",
        targetType: "machine",
        targetId: editingMachine.id,
        targetName: editingMachine.name,
      });
      toast({ title: "Success", description: "Machine updated successfully" });
      setEditingMachine(null);
      if (selectedFacilityId) loadFacilityData(selectedFacilityId);
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
      await logAuditEvent({
        action: `deleted ${deleteTarget.type}`,
        targetType: deleteTarget.type,
        targetId: deleteTarget.id,
        targetName: deleteTarget.name,
      });
      toast({ title: "Success", description: `${deleteTarget.type} deleted successfully` });
      if (selectedFacilityId) loadFacilityData(selectedFacilityId);
    }
    setDeleteTarget(null);
  };

  const getMachineStatusColor = (status: string | null) => {
    switch (status) {
      case "active": return "bg-green-500/10 text-green-600";
      case "inactive": return "bg-yellow-500/10 text-yellow-600";
      case "out_of_service": return "bg-red-500/10 text-red-600";
      default: return "bg-muted text-muted-foreground";
    }
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

      {/* Facility Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Facility Information
          </CardTitle>
          <CardDescription>Update your facility's basic details and contact information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Facility Name</Label>
                <Input id="name" {...register("name")} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" {...register("phone")} placeholder="(555) 555-5555" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register("address")} placeholder="Street, City, State, Zip" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact">Emergency Contact</Label>
                <Input id="emergency_contact" {...register("emergency_contact")} placeholder="Name and phone" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" {...register("website")} placeholder="https://..." />
              </div>
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
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Operating Season
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="season_start">Season Start</Label>
                  <Input id="season_start" type="date" {...register("season_start")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="season_end">Season End</Label>
                  <Input id="season_end" type="date" {...register("season_end")} />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location Coordinates (for Weather API)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input id="latitude" type="number" step="any" {...register("latitude")} placeholder="e.g., 40.7128" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input id="longitude" type="number" step="any" {...register("longitude")} placeholder="e.g., -74.0060" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter coordinates for accurate weather data. You can find these on Google Maps.
              </p>
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

      {/* Rinks */}
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
                  <div>
                    <span className="font-medium">{rink.name}</span>
                    <div className="flex items-center gap-2 mt-1">
                      {rink.length_feet && rink.width_feet && (
                        <span className="text-xs text-muted-foreground">
                          {rink.length_feet}' × {rink.width_feet}'
                        </span>
                      )}
                      <Badge variant={rink.is_active ? "default" : "secondary"} className="text-xs">
                        {rink.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingRink(rink)}>
                    <Edit className="h-4 w-4" />
                  </Button>
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
                        {uploadingLogo === rink.id ? "..." : "Logo"}
                      </span>
                    </Button>
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget({ type: "rink", id: rink.id, name: rink.name })}
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

      {/* Resurfacing Machines */}
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
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{machine.name}</span>
                    {machine.model && <span className="text-sm text-muted-foreground">({machine.model})</span>}
                    {machine.year && <span className="text-xs text-muted-foreground">• {machine.year}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {machine.fuel_type === "gas" ? "Gas" : machine.fuel_type === "propane" ? "Propane" : "Electric"}
                    </Badge>
                    <Badge variant="secondary" className={`text-xs ${getMachineStatusColor(machine.status)}`}>
                      {machine.status === "out_of_service" ? "Out of Service" : machine.status || "Active"}
                    </Badge>
                    {machine.serial_number && (
                      <span className="text-xs text-muted-foreground">SN: {machine.serial_number}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingMachine(machine)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget({ type: "machine", id: machine.id, name: machine.name })}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
            <h4 className="font-medium text-sm">Add New Machine</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input
                placeholder="Machine name *"
                value={newMachine.name}
                onChange={(e) => setNewMachine({ ...newMachine, name: e.target.value })}
              />
              <Input
                placeholder="Model"
                value={newMachine.model}
                onChange={(e) => setNewMachine({ ...newMachine, model: e.target.value })}
              />
              <Input
                placeholder="Year"
                type="number"
                value={newMachine.year}
                onChange={(e) => setNewMachine({ ...newMachine, year: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input
                placeholder="Serial Number"
                value={newMachine.serial_number}
                onChange={(e) => setNewMachine({ ...newMachine, serial_number: e.target.value })}
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
                  <SelectItem value="propane">Propane</SelectItem>
                </SelectContent>
              </Select>
              <Select 
                value={newMachine.blade_tracking} 
                onValueChange={(value) => setNewMachine({ ...newMachine, blade_tracking: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Blade Tracking" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hours">Track by Hours</SelectItem>
                  <SelectItem value="makes">Track by Makes</SelectItem>
                  <SelectItem value="both">Track Both</SelectItem>
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
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rink Editor Dialog */}
      <Dialog open={!!editingRink} onOpenChange={() => setEditingRink(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Rink</DialogTitle>
            <DialogDescription>Update rink details, dimensions, and target ice depth</DialogDescription>
          </DialogHeader>
          {editingRink && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Rink Name</Label>
                <Input
                  value={editingRink.name}
                  onChange={(e) => setEditingRink({ ...editingRink, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Length (feet)</Label>
                  <Input
                    type="number"
                    value={editingRink.length_feet || ""}
                    onChange={(e) => setEditingRink({ ...editingRink, length_feet: parseFloat(e.target.value) || null })}
                    placeholder="e.g., 200"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Width (feet)</Label>
                  <Input
                    type="number"
                    value={editingRink.width_feet || ""}
                    onChange={(e) => setEditingRink({ ...editingRink, width_feet: parseFloat(e.target.value) || null })}
                    placeholder="e.g., 85"
                  />
                </div>
              </div>
              <Separator />
              <h4 className="font-medium text-sm">Target Ice Depth (inches)</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label className="text-xs">Minimum</Label>
                  <Input
                    type="number"
                    step="0.25"
                    value={editingRink.target_depth_min || ""}
                    onChange={(e) => setEditingRink({ ...editingRink, target_depth_min: parseFloat(e.target.value) || null })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Ideal</Label>
                  <Input
                    type="number"
                    step="0.25"
                    value={editingRink.target_depth_ideal || ""}
                    onChange={(e) => setEditingRink({ ...editingRink, target_depth_ideal: parseFloat(e.target.value) || null })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Maximum</Label>
                  <Input
                    type="number"
                    step="0.25"
                    value={editingRink.target_depth_max || ""}
                    onChange={(e) => setEditingRink({ ...editingRink, target_depth_max: parseFloat(e.target.value) || null })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Primary Use</Label>
                <Select
                  value={editingRink.primary_use || "multi-purpose"}
                  onValueChange={(value) => setEditingRink({ ...editingRink, primary_use: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hockey">Hockey</SelectItem>
                    <SelectItem value="figure-skating">Figure Skating</SelectItem>
                    <SelectItem value="multi-purpose">Multi-Purpose</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Default Measurement Grid</Label>
                <Select
                  value={editingRink.measurement_grid || "35-point"}
                  onValueChange={(value) => setEditingRink({ ...editingRink, measurement_grid: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24-point">24-Point</SelectItem>
                    <SelectItem value="35-point">35-Point</SelectItem>
                    <SelectItem value="47-point">47-Point</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={editingRink.is_active}
                  onCheckedChange={(checked) => setEditingRink({ ...editingRink, is_active: checked })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRink(null)}>Cancel</Button>
            <Button onClick={handleSaveRink}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Machine Editor Dialog */}
      <Dialog open={!!editingMachine} onOpenChange={() => setEditingMachine(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Machine</DialogTitle>
            <DialogDescription>Update machine details and blade tracking settings</DialogDescription>
          </DialogHeader>
          {editingMachine && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Machine Name</Label>
                  <Input
                    value={editingMachine.name}
                    onChange={(e) => setEditingMachine({ ...editingMachine, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input
                    value={editingMachine.model || ""}
                    onChange={(e) => setEditingMachine({ ...editingMachine, model: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input
                    type="number"
                    value={editingMachine.year || ""}
                    onChange={(e) => setEditingMachine({ ...editingMachine, year: parseInt(e.target.value) || null })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Serial Number</Label>
                  <Input
                    value={editingMachine.serial_number || ""}
                    onChange={(e) => setEditingMachine({ ...editingMachine, serial_number: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fuel Type</Label>
                  <Select
                    value={editingMachine.fuel_type || "electric"}
                    onValueChange={(value) => setEditingMachine({ ...editingMachine, fuel_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electric">Electric</SelectItem>
                      <SelectItem value="gas">Gas</SelectItem>
                      <SelectItem value="propane">Propane</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={editingMachine.status || "active"}
                    onValueChange={(value) => setEditingMachine({ ...editingMachine, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="out_of_service">Out of Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <h4 className="font-medium text-sm">Blade Tracking</h4>
              <div className="space-y-2">
                <Label>Tracking Mode</Label>
                <Select
                  value={editingMachine.blade_tracking || "hours"}
                  onValueChange={(value) => setEditingMachine({ ...editingMachine, blade_tracking: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hours">Track by Hours</SelectItem>
                    <SelectItem value="makes">Track by Makes</SelectItem>
                    <SelectItem value="both">Track Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Expected Blade Life (Hours)</Label>
                  <Input
                    type="number"
                    value={editingMachine.expected_blade_life_hours || ""}
                    onChange={(e) => setEditingMachine({ ...editingMachine, expected_blade_life_hours: parseInt(e.target.value) || null })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expected Blade Life (Makes)</Label>
                  <Input
                    type="number"
                    value={editingMachine.expected_blade_life_makes || ""}
                    onChange={(e) => setEditingMachine({ ...editingMachine, expected_blade_life_makes: parseInt(e.target.value) || null })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMachine(null)}>Cancel</Button>
            <Button onClick={handleSaveMachine}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
