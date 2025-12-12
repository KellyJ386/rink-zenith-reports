import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logAuditEvent } from "@/services/auditLog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import PageHeader from "@/components/PageHeader";
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
import { Plus, Edit, Trash2, Users, Building2, Shield, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const MODULES = [
  "Ice Depth Log",
  "Ice Maintenance Log",
  "Refrigeration Log",
  "Air Quality Log",
  "Employee Scheduling",
  "Incident Reports",
  "Communications Log",
  "Safety & Compliance",
];

const JOB_TITLES = [
  "Facility Manager",
  "Supervisor",
  "Maintenance",
  "Attendant",
  "Front Desk",
  "Part-Time",
  "Zamboni Driver",
];

const ACCOUNT_STATUSES = [
  { value: "active", label: "Active", color: "bg-green-500/10 text-green-600" },
  { value: "inactive", label: "Inactive", color: "bg-gray-500/10 text-gray-600" },
  { value: "on_leave", label: "On Leave", color: "bg-yellow-500/10 text-yellow-600" },
  { value: "seasonal", label: "Seasonal", color: "bg-blue-500/10 text-blue-600" },
  { value: "terminated", label: "Terminated", color: "bg-red-500/10 text-red-600" },
];

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  facility_id: string | null;
  facility_name: string | null;
  job_title: string | null;
  account_status: string | null;
}

interface Facility {
  id: string;
  name: string;
}

interface PermissionTemplate {
  id: string;
  name: string;
  description: string | null;
  modules: Array<{
    module: string;
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    export: boolean;
  }>;
}

const UserManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [permissionTemplates, setPermissionTemplates] = useState<PermissionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff",
    facility_id: "",
    job_title: "",
    account_status: "active",
    address: "",
    phone_number: "",
    date_of_birth: "",
    email_notifications_enabled: true,
    sms_notifications_enabled: false,
    force_email_change: false,
  });

  useEffect(() => {
    loadUsers();
    loadFacilities();
    loadPermissionTemplates();
  }, []);

  const loadFacilities = async () => {
    const { data } = await supabase
      .from("facilities")
      .select("id, name")
      .order("name");
    setFacilities(data || []);
  };

  const loadPermissionTemplates = async () => {
    const { data } = await supabase
      .from("permission_templates")
      .select("*")
      .order("name");
    setPermissionTemplates((data || []) as unknown as PermissionTemplate[]);
  };

  const loadUsers = async () => {
    try {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select(`
          id, 
          user_id, 
          name,
          facility_id,
          job_title,
          account_status,
          facilities:facility_id (name)
        `);

      if (!profilesData) {
        setLoading(false);
        return;
      }

      const usersWithRoles = await Promise.all(
        profilesData.map(async (profile) => {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.user_id)
            .maybeSingle();

          const { data: { user } } = await supabase.auth.getUser();
          const isCurrentUser = user?.id === profile.user_id;
          const facilityData = profile.facilities as unknown as { name: string } | null;
          
          return {
            id: profile.user_id,
            email: isCurrentUser ? (user?.email || "N/A") : "N/A",
            name: profile.name,
            role: roleData?.role || "staff",
            facility_id: profile.facility_id,
            facility_name: facilityData?.name || null,
            job_title: profile.job_title,
            account_status: profile.account_status,
          };
        })
      );

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error loading users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { name: formData.name },
        },
      });

      if (authError || !authData.user) {
        toast({
          title: "Error",
          description: authError?.message || "Failed to create user",
          variant: "destructive",
        });
        return;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          address: formData.address,
          phone_number: formData.phone_number,
          date_of_birth: formData.date_of_birth || null,
          email_notifications_enabled: formData.email_notifications_enabled,
          sms_notifications_enabled: formData.sms_notifications_enabled,
          force_email_change: formData.force_email_change,
          facility_id: formData.facility_id || null,
          job_title: formData.job_title || null,
          account_status: formData.account_status,
        })
        .eq("user_id", authData.user.id);

      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: authData.user.id,
        role: formData.role as "admin" | "manager" | "staff",
      });

      if (roleError || profileError) {
        console.error("Role error:", roleError);
        console.error("Profile error:", profileError);
        toast({
          title: "Partial Success",
          description: "User created but some additional data failed to save.",
          variant: "destructive",
        });
      } else {
        await logAuditEvent({
          action: "created user",
          targetType: "user",
          targetId: authData.user.id,
          targetName: formData.name,
          changes: { role: formData.role, job_title: formData.job_title },
        });
        toast({ 
          title: "Success", 
          description: `User ${formData.name} created successfully` 
        });
      }

      resetFormData();
      setIsAddDialogOpen(false);
      loadUsers();
    } catch (error) {
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const resetFormData = () => {
    setFormData({ 
      name: "", 
      email: "", 
      password: "", 
      role: "staff",
      facility_id: "",
      job_title: "",
      account_status: "active",
      address: "",
      phone_number: "",
      date_of_birth: "",
      email_notifications_enabled: true,
      sms_notifications_enabled: false,
      force_email_change: false,
    });
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    const { error: roleError } = await supabase
      .from("user_roles")
      .update({ role: formData.role as "admin" | "manager" | "staff" })
      .eq("user_id", selectedUser.id);

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ 
        name: formData.name,
        facility_id: formData.facility_id || null,
        job_title: formData.job_title || null,
        account_status: formData.account_status,
      })
      .eq("user_id", selectedUser.id);

    if (roleError || profileError) {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    } else {
      await logAuditEvent({
        action: "updated user",
        targetType: "user",
        targetId: selectedUser.id,
        targetName: formData.name,
        changes: { 
          role: formData.role, 
          job_title: formData.job_title,
          account_status: formData.account_status,
        },
      });
      toast({ title: "Success", description: "User updated successfully" });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      loadUsers();
    }
  };

  const loadUserPermissions = async (userId: string) => {
    const { data } = await supabase
      .from("user_permissions")
      .select("module_name")
      .eq("user_id", userId)
      .eq("can_access", true);

    setUserPermissions(data?.map((p) => p.module_name) || []);
  };

  const handleApplyTemplate = async (templateId: string) => {
    const template = permissionTemplates.find(t => t.id === templateId);
    if (!template) return;

    const moduleNames = template.modules
      .filter(m => m.view)
      .map(m => {
        // Map template module names to our MODULES array
        const moduleMap: Record<string, string> = {
          "ice_maintenance": "Ice Maintenance Log",
          "refrigeration": "Refrigeration Log",
          "ice_depth": "Ice Depth Log",
          "air_quality": "Air Quality Log",
          "incidents": "Incident Reports",
          "daily_reports": "Communications Log",
          "scheduling": "Employee Scheduling",
        };
        return moduleMap[m.module] || m.module;
      });

    setUserPermissions(moduleNames.filter(m => MODULES.includes(m)));
    toast({
      title: "Template Applied",
      description: `Applied "${template.name}" permissions`,
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;

    await supabase
      .from("user_permissions")
      .delete()
      .eq("user_id", selectedUser.id);

    const permissions = userPermissions.map((module) => ({
      user_id: selectedUser.id,
      module_name: module,
      can_access: true,
    }));

    const { error } = await supabase.from("user_permissions").insert(permissions);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update permissions",
        variant: "destructive",
      });
    } else {
      await logAuditEvent({
        action: "updated permissions",
        targetType: "user",
        targetId: selectedUser.id,
        targetName: selectedUser.name,
        changes: { modules: userPermissions },
      });
      toast({ title: "Success", description: "Permissions updated successfully" });
      setIsPermissionsDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;

    const userToDelete = users.find(u => u.id === deleteUserId);

    // First update the account status to terminated (soft delete)
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ account_status: "terminated" })
      .eq("user_id", deleteUserId);

    if (profileError) {
      toast({
        title: "Error",
        description: "Failed to deactivate user",
        variant: "destructive",
      });
    } else {
      await logAuditEvent({
        action: "terminated user",
        targetType: "user",
        targetId: deleteUserId,
        targetName: userToDelete?.name,
      });
      toast({ title: "Success", description: "User account terminated" });
      setDeleteUserId(null);
      loadUsers();
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({ 
      ...formData, 
      name: user.name, 
      role: user.role, 
      email: user.email,
      facility_id: user.facility_id || "",
      job_title: user.job_title || "",
      account_status: user.account_status || "active",
    });
    setIsEditDialogOpen(true);
  };

  const openPermissionsDialog = async (user: User) => {
    setSelectedUser(user);
    await loadUserPermissions(user.id);
    setIsPermissionsDialogOpen(true);
  };

  const getStatusBadge = (status: string | null) => {
    const statusConfig = ACCOUNT_STATUSES.find(s => s.value === status) || ACCOUNT_STATUSES[0];
    return (
      <Badge variant="secondary" className={statusConfig.color}>
        {statusConfig.label}
      </Badge>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        subtitle="Manage staff accounts, roles, and facility assignments"
        icon={<Users className="h-8 w-8 text-primary" />}
        actions={
          <Button onClick={() => { resetFormData(); setIsAddDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users
          </CardTitle>
          <CardDescription>All registered users in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Facility</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.filter(u => u.account_status !== "terminated").map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.job_title || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(user.account_status)}</TableCell>
                  <TableCell>
                    {user.facility_name ? (
                      <Badge variant="outline" className="gap-1">
                        <Building2 className="h-3 w-3" />
                        {user.facility_name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">Not assigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openPermissionsDialog(user)}>
                      <Shield className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteUserId(user.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account with role and facility assignment</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="job_title">Job Title</Label>
                <Select 
                  value={formData.job_title} 
                  onValueChange={(val) => setFormData({ ...formData, job_title: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select job title" />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_TITLES.map((title) => (
                      <SelectItem key={title} value={title}>{title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">System Role</Label>
                <Select value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="facility">Assigned Facility</Label>
                <Select 
                  value={formData.facility_id} 
                  onValueChange={(val) => setFormData({ ...formData, facility_id: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select facility" />
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
              <div className="space-y-2">
                <Label htmlFor="account_status">Account Status</Label>
                <Select 
                  value={formData.account_status} 
                  onValueChange={(val) => setFormData({ ...formData, account_status: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="email-notifications"
                  checked={formData.email_notifications_enabled}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, email_notifications_enabled: checked === true })
                  }
                />
                <Label htmlFor="email-notifications" className="cursor-pointer">
                  Accept Email Notifications
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="force-email-change"
                  checked={formData.force_email_change}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, force_email_change: checked === true })
                  }
                />
                <Label htmlFor="force-email-change" className="cursor-pointer">
                  Force Password Change on First Login
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser}>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information, role and facility assignment</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-job-title">Job Title</Label>
                <Select 
                  value={formData.job_title} 
                  onValueChange={(val) => setFormData({ ...formData, job_title: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select job title" />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_TITLES.map((title) => (
                      <SelectItem key={title} value={title}>{title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">System Role</Label>
                <Select value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-facility">Assigned Facility</Label>
                <Select 
                  value={formData.facility_id} 
                  onValueChange={(val) => setFormData({ ...formData, facility_id: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select facility" />
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
              <div className="space-y-2">
                <Label htmlFor="edit-status">Account Status</Label>
                <Select 
                  value={formData.account_status} 
                  onValueChange={(val) => setFormData({ ...formData, account_status: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Module Permissions
            </DialogTitle>
            <DialogDescription>
              Select which modules {selectedUser?.name} can access
            </DialogDescription>
          </DialogHeader>
          
          {/* Permission Templates */}
          {permissionTemplates.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Quick Apply Template</Label>
              <div className="flex flex-wrap gap-2">
                {permissionTemplates.map((template) => (
                  <Button
                    key={template.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyTemplate(template.id)}
                  >
                    <Wand2 className="h-3 w-3 mr-1" />
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          <Separator />
          
          <div className="space-y-3">
            {MODULES.map((module) => (
              <div key={module} className="flex items-center space-x-2">
                <Checkbox
                  id={module}
                  checked={userPermissions.includes(module)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setUserPermissions([...userPermissions, module]);
                    } else {
                      setUserPermissions(userPermissions.filter((m) => m !== module));
                    }
                  }}
                />
                <Label htmlFor={module} className="cursor-pointer">
                  {module}
                </Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPermissionsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePermissions}>Save Permissions</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminate User Account</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the user as terminated and remove their access. 
              The account data will be preserved for audit purposes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser}>Terminate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManagement;
