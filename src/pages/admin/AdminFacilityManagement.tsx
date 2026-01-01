import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { logAuditEvent } from "@/services/auditLog";
import PageHeader from "@/components/PageHeader";
import { Plus, Edit, Trash2, Building2, Users, Search, Crown, Settings } from "lucide-react";

interface Facility {
  id: string;
  name: string;
  address: string | null;
  owner_user_id: string | null;
  max_users: number | null;
  plan_type: string | null;
  created_at: string;
  user_count?: number;
  owner_name?: string;
}

interface Profile {
  id: string;
  user_id: string;
  name: string;
}

const PLAN_TYPES = [
  { value: "starter", label: "Starter", maxUsers: 10 },
  { value: "standard", label: "Standard", maxUsers: 200 },
  { value: "professional", label: "Professional", maxUsers: 500 },
  { value: "enterprise", label: "Enterprise", maxUsers: 1000 },
];

const AdminFacilityManagement = () => {
  const { toast } = useToast();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    owner_user_id: "",
    plan_type: "standard",
    max_users: 200,
  });

  const loadFacilities = async () => {
    setLoading(true);
    try {
      const { data: facilitiesData, error } = await supabase
        .from("facilities")
        .select("*")
        .order("name");

      if (error) throw error;

      // Get user counts for each facility
      const facilitiesWithCounts = await Promise.all(
        (facilitiesData || []).map(async (facility) => {
          const { count } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("facility_id", facility.id);

          // Get owner name if exists
          let ownerName = null;
          if (facility.owner_user_id) {
            const { data: ownerData } = await supabase
              .from("profiles")
              .select("name")
              .eq("user_id", facility.owner_user_id)
              .single();
            ownerName = ownerData?.name;
          }

          return {
            ...facility,
            user_count: count || 0,
            owner_name: ownerName,
          };
        })
      );

      setFacilities(facilitiesWithCounts);
    } catch (error: any) {
      console.error("Error loading facilities:", error);
      toast({
        title: "Error",
        description: "Failed to load facilities",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProfiles = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, user_id, name")
      .order("name");
    setProfiles(data || []);
  };

  useEffect(() => {
    loadFacilities();
    loadProfiles();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      owner_user_id: "",
      plan_type: "standard",
      max_users: 200,
    });
    setSelectedFacility(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (facility: Facility) => {
    setSelectedFacility(facility);
    setFormData({
      name: facility.name,
      address: facility.address || "",
      owner_user_id: facility.owner_user_id || "",
      plan_type: facility.plan_type || "standard",
      max_users: facility.max_users || 200,
    });
    setDialogOpen(true);
  };

  const handlePlanChange = (planType: string) => {
    const plan = PLAN_TYPES.find(p => p.value === planType);
    setFormData({
      ...formData,
      plan_type: planType,
      max_users: plan?.maxUsers || 200,
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Facility name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const facilityData = {
        name: formData.name,
        address: formData.address || null,
        owner_user_id: formData.owner_user_id || null,
        plan_type: formData.plan_type,
        max_users: formData.max_users,
      };

      if (selectedFacility) {
        const { error } = await supabase
          .from("facilities")
          .update(facilityData)
          .eq("id", selectedFacility.id);

        if (error) throw error;

        // If owner changed, update their role
        if (formData.owner_user_id && formData.owner_user_id !== selectedFacility.owner_user_id) {
          // Set new owner's role to account_owner
          const { data: existingRole } = await supabase
            .from("user_roles")
            .select("id")
            .eq("user_id", formData.owner_user_id)
            .single();

          if (existingRole) {
            await supabase
              .from("user_roles")
              .update({ role: "account_owner" })
              .eq("user_id", formData.owner_user_id);
          } else {
            await supabase.from("user_roles").insert({
              user_id: formData.owner_user_id,
              role: "account_owner",
            });
          }

          // Update new owner's facility
          await supabase
            .from("profiles")
            .update({ facility_id: selectedFacility.id })
            .eq("user_id", formData.owner_user_id);
        }

        await logAuditEvent({
          action: "updated facility",
          targetType: "facility",
          targetId: selectedFacility.id,
          targetName: formData.name,
          changes: facilityData,
        });

        toast({ title: "Success", description: "Facility updated successfully" });
      } else {
        const { data: newFacility, error } = await supabase
          .from("facilities")
          .insert(facilityData)
          .select()
          .single();

        if (error) throw error;

        // If owner specified, update their role and facility
        if (formData.owner_user_id) {
          await supabase
            .from("user_roles")
            .upsert({
              user_id: formData.owner_user_id,
              role: "account_owner",
            }, { onConflict: "user_id" });

          await supabase
            .from("profiles")
            .update({ facility_id: newFacility.id })
            .eq("user_id", formData.owner_user_id);
        }

        await logAuditEvent({
          action: "created facility",
          targetType: "facility",
          targetId: newFacility.id,
          targetName: formData.name,
          changes: facilityData,
        });

        toast({ title: "Success", description: "Facility created successfully" });
      }

      setDialogOpen(false);
      resetForm();
      loadFacilities();
    } catch (error: any) {
      console.error("Error saving facility:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save facility",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedFacility) return;

    try {
      // Check if facility has users
      if (selectedFacility.user_count && selectedFacility.user_count > 0) {
        toast({
          title: "Cannot Delete",
          description: "Remove all users from this facility before deleting it.",
          variant: "destructive",
        });
        setDeleteDialogOpen(false);
        return;
      }

      const { error } = await supabase
        .from("facilities")
        .delete()
        .eq("id", selectedFacility.id);

      if (error) throw error;

      await logAuditEvent({
        action: "deleted facility",
        targetType: "facility",
        targetId: selectedFacility.id,
        targetName: selectedFacility.name,
      });

      toast({ title: "Success", description: "Facility deleted successfully" });
      setDeleteDialogOpen(false);
      setSelectedFacility(null);
      loadFacilities();
    } catch (error: any) {
      console.error("Error deleting facility:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete facility",
        variant: "destructive",
      });
    }
  };

  const filteredFacilities = facilities.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.owner_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPlanBadge = (planType: string | null) => {
    switch (planType) {
      case "starter":
        return <Badge variant="outline">Starter</Badge>;
      case "professional":
        return <Badge className="bg-purple-500">Professional</Badge>;
      case "enterprise":
        return <Badge className="bg-amber-500">Enterprise</Badge>;
      default:
        return <Badge variant="secondary">Standard</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facility Management"
        subtitle="Manage all facilities and their account owners"
        showBackButton={false}
        showHomeButton={false}
      />

      <div className="flex items-center justify-between gap-4">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search facilities..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Facility
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Facilities</CardTitle>
          <CardDescription>
            {filteredFacilities.length} of {facilities.length} facilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading facilities...</div>
          ) : filteredFacilities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No facilities match your search" : "No facilities found"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Facility</TableHead>
                  <TableHead>Account Owner</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFacilities.map((facility) => (
                  <TableRow key={facility.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-medium">{facility.name}</p>
                          {facility.address && (
                            <p className="text-xs text-muted-foreground">{facility.address}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {facility.owner_name ? (
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-amber-500" />
                          <span>{facility.owner_name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No owner assigned</span>
                      )}
                    </TableCell>
                    <TableCell>{getPlanBadge(facility.plan_type)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {facility.user_count} / {facility.max_users || 200}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(facility.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(facility)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedFacility(facility);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (!open) resetForm();
        setDialogOpen(open);
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedFacility ? "Edit Facility" : "Create Facility"}
            </DialogTitle>
            <DialogDescription>
              {selectedFacility
                ? "Update facility details and subscription"
                : "Add a new facility to the system"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Facility Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter facility name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner">Account Owner</Label>
              <Select
                value={formData.owner_user_id}
                onValueChange={(value) => setFormData({ ...formData, owner_user_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an account owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No owner</SelectItem>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.user_id} value={profile.user_id}>
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4" />
                        {profile.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan">Plan Type</Label>
                <Select value={formData.plan_type} onValueChange={handlePlanChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAN_TYPES.map((plan) => (
                      <SelectItem key={plan.value} value={plan.value}>
                        {plan.label} ({plan.maxUsers} users)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_users">Max Users</Label>
                <Input
                  id="max_users"
                  type="number"
                  value={formData.max_users}
                  onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) || 200 })}
                  min={1}
                  max={10000}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {selectedFacility ? "Update Facility" : "Create Facility"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Facility</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedFacility?.name}"? 
              This action cannot be undone.
              {selectedFacility?.user_count && selectedFacility.user_count > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  This facility has {selectedFacility.user_count} user(s). 
                  Remove all users before deleting.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
              disabled={!!selectedFacility?.user_count && selectedFacility.user_count > 0}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminFacilityManagement;
