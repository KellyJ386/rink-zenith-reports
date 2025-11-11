import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { IceDepthMeasurementForm } from "@/components/ice-depth/IceDepthMeasurementForm";
import { IceDepthHistory } from "@/components/ice-depth/IceDepthHistory";
import { Snowflake, ArrowLeft } from "lucide-react";

const IceDepthLog = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ice-frost to-background">
        <div className="text-center">
          <Snowflake className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-frost to-background p-6">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="shadow-[var(--shadow-ice)] mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-2xl">
                <Snowflake className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl">Ice Depth Log</CardTitle>
                <CardDescription>Monitor and analyze ice surface measurements</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="new-measurement" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="new-measurement">New Measurement</TabsTrigger>
            <TabsTrigger value="history">Measurement History</TabsTrigger>
          </TabsList>

          <TabsContent value="new-measurement">
            <IceDepthMeasurementForm userId={user.id} />
          </TabsContent>

          <TabsContent value="history">
            <IceDepthHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default IceDepthLog;