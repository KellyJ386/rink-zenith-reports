import { useNavigate } from "react-router-dom";
import { useAccountContext } from "@/hooks/useAccountContext";
import { UserLimitIndicator } from "@/components/account/UserLimitIndicator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Settings, UserPlus, Shield, Building2, TrendingUp } from "lucide-react";

const AccountDashboard = () => {
  const navigate = useNavigate();
  const { facility, userCount, role, profile } = useAccountContext();

  const maxUsers = facility?.max_users || 200;
  const planType = facility?.plan_type || "standard";

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case "enterprise": return "default";
      case "professional": return "secondary";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold">Welcome, {profile?.name}</h2>
        <p className="text-muted-foreground">
          Manage your facility account and team members
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>{facility?.name || "Your Facility"}</CardTitle>
                  <CardDescription>{facility?.address || "No address set"}</CardDescription>
                </div>
              </div>
              <Badge variant={getPlanBadgeVariant(planType)}>
                {planType.charAt(0).toUpperCase() + planType.slice(1)} Plan
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <UserLimitIndicator currentUsers={userCount} maxUsers={maxUsers} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Your Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="default" className="text-lg px-4 py-2">
              {role === "account_owner" ? "Account Owner" : role?.charAt(0).toUpperCase() + role?.slice(1)}
            </Badge>
            <p className="text-sm text-muted-foreground mt-3">
              {role === "account_owner" || role === "admin"
                ? "You have full access to manage users and facility settings."
                : "Contact your account owner for permission changes."}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/account/users")}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-blue-500/10">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <CardTitle>Manage Users</CardTitle>
                <CardDescription>View and manage team members</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{userCount}</span>
              <Button variant="outline" size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/account/settings")}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-green-500/10">
                <Settings className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Configure facility preferences</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="w-full">
              Open Settings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-purple-500/10">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <CardTitle>Usage Stats</CardTitle>
                <CardDescription>This month's activity</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Users</span>
                <span className="font-medium">{userCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reports Created</span>
                <span className="font-medium">--</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Logins This Week</span>
                <span className="font-medium">--</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountDashboard;
