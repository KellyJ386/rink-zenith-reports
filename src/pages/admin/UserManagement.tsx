import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { Plus, Edit, Trash2, Users } from "lucide-react";

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

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

const UserManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
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
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, user_id, name");

    if (!profilesData) return;

    const usersWithRoles = await Promise.all(
      profilesData.map(async (profile) => {
        const { data: userData } = await supabase.auth.admin.getUserById(profile.user_id);
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", profile.user_id)
          .single();

        return {
          id: profile.user_id,
          email: userData?.user?.email || "",
          name: profile.name,
          role: roleData?.role || "staff",
        };
      })
    );

    setUsers(usersWithRoles);
    setLoading(false);
  };

  const handleAddUser = async () => {
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

    const { error: roleError } = await supabase.from("user_roles").insert({
      user_id: authData.user.id,
      role: formData.role as "admin" | "manager" | "staff",
    });

    if (roleError) {
      toast({
        title: "Error",
        description: "User created but role assignment failed",
        variant: "destructive",
      });
    } else {
      toast({ title: "Success", description: "User created successfully" });
      setFormData({ name: "", email: "", password: "", role: "staff" });
      setIsAddDialogOpen(false);
      loadUsers();
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    const { error: roleError } = await supabase
      .from("user_roles")
      .update({ role: formData.role as "admin" | "manager" | "staff" })
      .eq("user_id", selectedUser.id);

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ name: formData.name })
      .eq("user_id", selectedUser.id);

    if (roleError || profileError) {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    } else {
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
      toast({ title: "Success", description: "Permissions updated successfully" });
      setIsPermissionsDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;

    const { error } = await supabase.auth.admin.deleteUser(deleteUserId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    } else {
      toast({ title: "Success", description: "User deleted successfully" });
      setDeleteUserId(null);
      loadUsers();
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({ ...formData, name: user.name, role: user.role, email: user.email });
    setIsEditDialogOpen(true);
  };

  const openPermissionsDialog = async (user: User) => {
    setSelectedUser(user);
    await loadUserPermissions(user.id);
    setIsPermissionsDialogOpen(true);
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        subtitle="Manage staff accounts, roles, and permissions"
        icon={<Users className="h-8 w-8 text-primary" />}
        actions={
          <Button onClick={() => setIsAddDialogOpen(true)}>
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
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="capitalize">{user.role}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openPermissionsDialog(user)}>
                      Permissions
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

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account with role assignment</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
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
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser}>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and role</DialogDescription>
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
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" value={formData.email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Module Permissions</DialogTitle>
            <DialogDescription>
              Select which modules {selectedUser?.name} can access
            </DialogDescription>
          </DialogHeader>
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

      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone and will
              remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManagement;
