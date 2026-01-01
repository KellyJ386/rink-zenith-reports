import { useState, useEffect } from "react";
import { useAccountContext } from "@/hooks/useAccountContext";
import { supabase } from "@/integrations/supabase/client";
import { UserLimitIndicator } from "@/components/account/UserLimitIndicator";
import { InviteUserModal } from "@/components/account/InviteUserModal";
import { EditUserModal } from "@/components/account/EditUserModal";
import { ChangeRoleModal } from "@/components/account/ChangeRoleModal";
import { UserStatusActions } from "@/components/account/UserStatusActions";
import { AccountActivityLog } from "@/components/account/AccountActivityLog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Search, Users, UserCheck, Ban, UserX } from "lucide-react";

interface FacilityUser {
  id: string;
  user_id: string;
  name: string;
  job_title: string | null;
  account_status: string | null;
  created_at: string;
  role?: string;
}

const AccountUserManagement = () => {
  const { toast } = useToast();
  const { facility, userCount, refetch, user } = useAccountContext();
  const [users, setUsers] = useState<FacilityUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<FacilityUser | null>(null);

  const maxUsers = facility?.max_users || 200;

  const loadUsers = async () => {
    if (!facility?.id) return;

    setLoading(true);
    try {
      const { data: profilesData, error } = await supabase
        .from("profiles")
        .select("id, user_id, name, job_title, account_status, created_at")
        .eq("facility_id", facility.id)
        .order("name");

      if (error) throw error;

      const usersWithRoles = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.user_id)
            .single();

          return {
            ...profile,
            role: roleData?.role || "staff",
          };
        })
      );

      setUsers(usersWithRoles);
    } catch (error: any) {
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

  useEffect(() => {
    loadUsers();
  }, [facility?.id]);

  const handleUserAdded = () => {
    loadUsers();
    refetch();
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.job_title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || u.account_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>;
      case "invited":
        return <Badge variant="secondary">Invited</Badge>;
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>;
      case "terminated":
        return <Badge variant="outline" className="text-muted-foreground">Terminated</Badge>;
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "account_owner":
        return <Badge className="bg-primary/10 text-primary border-primary/20">Owner</Badge>;
      case "admin":
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">Admin</Badge>;
      case "manager":
        return <Badge variant="secondary">Manager</Badge>;
      default:
        return <Badge variant="outline">Staff</Badge>;
    }
  };

  // Calculate stats
  const activeCount = users.filter((u) => u.account_status === "active").length;
  const suspendedCount = users.filter((u) => u.account_status === "suspended").length;
  const terminatedCount = users.filter((u) => u.account_status === "terminated").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Team Members</h2>
          <p className="text-muted-foreground">Manage users in your facility</p>
        </div>
        <Button onClick={() => setInviteModalOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Ban className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{suspendedCount}</p>
                <p className="text-sm text-muted-foreground">Suspended</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <UserX className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{terminatedCount}</p>
                <p className="text-sm text-muted-foreground">Terminated</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <UserLimitIndicator currentUsers={userCount} maxUsers={maxUsers} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle>All Users</CardTitle>
                  <CardDescription>
                    {filteredUsers.length} of {users.length} users shown
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="invited">Invited</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading users...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery || statusFilter !== "all" ? "No users match your filters" : "No users found"}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>{u.job_title || "--"}</TableCell>
                        <TableCell>{getRoleBadge(u.role || "staff")}</TableCell>
                        <TableCell>{getStatusBadge(u.account_status)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <UserStatusActions
                            user={u}
                            currentUserId={user?.id || ""}
                            onEdit={() => {
                              setSelectedUser(u);
                              setEditModalOpen(true);
                            }}
                            onChangeRole={() => {
                              setSelectedUser(u);
                              setRoleModalOpen(true);
                            }}
                            onStatusChanged={loadUsers}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <AccountActivityLog facilityId={facility?.id || ""} />
        </div>
      </div>

      <InviteUserModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        facilityId={facility?.id || ""}
        facilityName={facility?.name || "Your Facility"}
        currentUserCount={userCount}
        maxUsers={maxUsers}
        onUserAdded={handleUserAdded}
      />

      <EditUserModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        user={selectedUser}
        onUserUpdated={() => {
          loadUsers();
          refetch();
        }}
      />

      <ChangeRoleModal
        open={roleModalOpen}
        onOpenChange={setRoleModalOpen}
        userId={selectedUser?.user_id || ""}
        userName={selectedUser?.name || ""}
        currentRole={selectedUser?.role || "staff"}
        onSaved={() => {
          loadUsers();
          refetch();
        }}
      />
    </div>
  );
};

export default AccountUserManagement;
