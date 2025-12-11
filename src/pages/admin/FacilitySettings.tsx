import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";
import { Trash2, Plus, Building2, DoorOpen, Wrench, Upload, X, ImageIcon } from "lucide-react";
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

interface FacilityForm {
  name: string;
  address: string;
  timezone: string;
}

interface Rink {
  id: string;
  name: string;
  center_ice_logo_url?: string | null;
}

interface Machine {
  id: string;
  name: string;
  model: string;
  fuel_type: string;
}

const FacilitySettings = () => {
  const { toast } = useToast();
  const [facility, setFacility] = useState<any>(null);
  const [rinks, setRinks] = useState<Rink[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [newRinkName, setNewRinkName] = useState("");
  const [newMachine, setNewMachine] = useState({ name: "", model: "", fuel_type: "electric" });
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimezone, setSelectedTimezone] = useState<string>("America/New_York");
  const [uploadingLogo, setUploadingLogo] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const { register, handleSubmit, setValue } = useForm<FacilityForm>();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: facilityData } = await supabase.from("facilities").select("*").single();
    if (facilityData) {
      setFacility(facilityData);
      setValue("name", facilityData.name);
      setValue("address", facilityData.address || "");
      setSelectedTimezone(facilityData.timezone || "America/New_York");
    }

    const { data: rinksData } = await supabase
      .from("rinks")
      .select("id, name, center_ice_logo_url")
      .eq("facility_id", facilityData?.id);
    setRinks(rinksData || []);

    const { data: machinesData } = await supabase
      .from("resurfacing_machines")
      .select("*")
      .eq("facility_id", facilityData?.id);
    setMachines(machinesData || []);

    setLoading(false);
  };

  const onSubmit = async (data: FacilityForm) => {
    if (!facility) return;

    const { error } = await supabase
      .from("facilities")
      .update({
        name: data.name,
        address: data.address,
        timezone: selectedTimezone,
      })
      .eq("id", facility.id);

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
      loadData();
    }
  };

  const addRink = async () => {
    if (!newRinkName.trim() || !facility) return;

    const { error } = await supabase.from("rinks").insert({
      facility_id: facility.id,
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
      loadData();
    }
  };

  const handleLogoUpload = async (rinkId: string, file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image must be less than 2MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingLogo(rinkId);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${rinkId}-${Date.now()}.${fileExt}`;
      const filePath = `center-ice/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("rink-logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("rink-logos")
        .getPublicUrl(filePath);

      // Update rink with logo URL
      const { error: updateError } = await supabase
        .from("rinks")
        .update({ center_ice_logo_url: publicUrl })
        .eq("id", rinkId);

      if (updateError) throw updateError;

      toast({ title: "Success", description: "Logo uploaded successfully" });
      loadData();
    } catch (error: any) {
      console.error("Logo upload error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload logo",
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(null);
    }
  };

  const handleRemoveLogo = async (rinkId: string) => {
    try {
      const { error } = await supabase
        .from("rinks")
        .update({ center_ice_logo_url: null })
        .eq("id", rinkId);

      if (error) throw error;

      toast({ title: "Success", description: "Logo removed" });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to remove logo",
        variant: "destructive",
      });
    }
  };

  const addMachine = async () => {
    if (!newMachine.name.trim() || !facility) return;

    const { error } = await supabase.from("resurfacing_machines").insert({
      facility_id: facility.id,
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
      loadData();
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
      loadData();
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DoorOpen className="h-5 w-5" />
            Rinks
          </CardTitle>
          <CardDescription>Manage ice rinks at this facility</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {rinks.map((rink) => (
              <div key={rink.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{rink.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget({ type: "rink", id: rink.id })}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                
                {/* Center Ice Logo Section */}
                <div className="border-t pt-3">
                  <Label className="text-sm text-muted-foreground">Center Ice Logo</Label>
                  <div className="flex items-center gap-3 mt-2">
                    {rink.center_ice_logo_url ? (
                      <div className="relative">
                        <img 
                          src={rink.center_ice_logo_url} 
                          alt="Center ice logo" 
                          className="h-16 w-16 object-contain border rounded-lg bg-white p-1"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => handleRemoveLogo(rink.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="h-16 w-16 border rounded-lg bg-muted flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={(el) => (fileInputRefs.current[rink.id] = el)}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleLogoUpload(rink.id, file);
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRefs.current[rink.id]?.click()}
                        disabled={uploadingLogo === rink.id}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadingLogo === rink.id ? "Uploading..." : "Upload Logo"}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG up to 2MB. Shows at center ice.
                      </p>
                    </div>
                  </div>
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
    </div>
  );
};

export default FacilitySettings;
