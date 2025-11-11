import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ResurfaceForm } from "@/components/maintenance/ResurfaceForm";
import { BladeChangeForm } from "@/components/maintenance/BladeChangeForm";
import { EdgingForm } from "@/components/maintenance/EdgingForm";
import { CircleCheckForm } from "@/components/maintenance/CircleCheckForm";
import { ActivityFeed } from "@/components/maintenance/ActivityFeed";
import { Wrench, ArrowLeft, Settings } from "lucide-react";

const IceMaintenance = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showFeed, setShowFeed] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleActivityCreated = () => {
    setRefreshTrigger(prev => prev + 1);
    toast({
      title: "Success",
      description: "Activity logged successfully",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ice-frost to-background">
        <div className="text-center">
          <Wrench className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-frost to-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/admin/form-config")}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configure Forms
          </Button>
        </div>

        <Card className="shadow-[var(--shadow-ice)] mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-2xl">
                  <Wrench className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl">Ice Maintenance Log</CardTitle>
                  <CardDescription>Track resurfacing, blade changes, and equipment checks</CardDescription>
                </div>
              </div>
              <Button
                variant={showFeed ? "default" : "outline"}
                onClick={() => setShowFeed(!showFeed)}
              >
                {showFeed ? "Hide" : "Show"} Activity Feed
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={showFeed ? "lg:col-span-2" : "lg:col-span-3"}>
            <Tabs defaultValue="resurface" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="resurface">Resurface</TabsTrigger>
                <TabsTrigger value="blade-change">Blade Change</TabsTrigger>
                <TabsTrigger value="edging">Edging</TabsTrigger>
                <TabsTrigger value="circle-check">Circle Check</TabsTrigger>
              </TabsList>

              <TabsContent value="resurface">
                <ResurfaceForm userId={user.id} onSuccess={handleActivityCreated} />
              </TabsContent>

              <TabsContent value="blade-change">
                <BladeChangeForm userId={user.id} onSuccess={handleActivityCreated} />
              </TabsContent>

              <TabsContent value="edging">
                <EdgingForm userId={user.id} onSuccess={handleActivityCreated} />
              </TabsContent>

              <TabsContent value="circle-check">
                <CircleCheckForm userId={user.id} onSuccess={handleActivityCreated} />
              </TabsContent>
            </Tabs>
          </div>

          {showFeed && (
            <div className="lg:col-span-1">
              <ActivityFeed refreshTrigger={refreshTrigger} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IceMaintenance;