import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FormConfigEditor } from "@/components/admin/FormConfigEditor";
import PageHeader from "@/components/PageHeader";
import { Settings } from "lucide-react";

const AdminFormConfig = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleData?.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "Only administrators can access this page",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    setUser(user);
    setIsAdmin(true);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ice-frost to-background">
        <div className="text-center">
          <Settings className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-frost to-background p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Form Configuration"
          subtitle="Customize maintenance form fields"
          icon={<Settings className="h-8 w-8 text-primary" />}
        />

        <Tabs defaultValue="resurface" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="resurface">Resurface</TabsTrigger>
            <TabsTrigger value="blade_change">Blade Change</TabsTrigger>
            <TabsTrigger value="edging">Edging</TabsTrigger>
            <TabsTrigger value="circle_check">Circle Check</TabsTrigger>
          </TabsList>

          <TabsContent value="resurface">
            <FormConfigEditor formType="resurface" />
          </TabsContent>

          <TabsContent value="blade_change">
            <FormConfigEditor formType="blade_change" />
          </TabsContent>

          <TabsContent value="edging">
            <FormConfigEditor formType="edging" />
          </TabsContent>

          <TabsContent value="circle_check">
            <FormConfigEditor formType="circle_check" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminFormConfig;