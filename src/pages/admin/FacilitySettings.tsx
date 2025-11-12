import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";
import { Trash2, Plus, Building2, DoorOpen, Wrench } from "lucide-react";
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
}

interface Machine {
  id: string;
  name: string;
  model: string;
}

const FacilitySettings = () => {
  const { toast } = useToast();
  const [facility, setFacility] = useState<any>(null);
  const [rinks, setRinks] = useState<Rink[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [newRinkName, setNewRinkName] = useState("");
  const [newMachine, setNewMachine] = useState({ name: "", model: "" });
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimezone, setSelectedTimezone] = useState<string>("America/New_York");

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
      .select("*")
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

  const addMachine = async () => {
    if (!newMachine.name.trim() || !facility) return;

    const { error } = await supabase.from("resurfacing_machines").insert({
      facility_id: facility.id,
      name: newMachine.name,
      model: newMachine.model,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add machine",
        variant: "destructive",
      });
    } else {
      toast({ title: "Success", description: "Machine added successfully" });
      setNewMachine({ name: "", model: "" });
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
          <div className="space-y-2">
            {rinks.map((rink) => (
              <div key={rink.id} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">{rink.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTarget({ type: "rink", id: rink.id })}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
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
            <div className="flex gap-2">
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
