import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { IceDepthMeasurementForm } from "@/components/ice-depth/IceDepthMeasurementForm";
import { IceDepthHistory } from "@/components/ice-depth/IceDepthHistory";
import PageHeader from "@/components/PageHeader";
import { Snowflake } from "lucide-react";

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
        <PageHeader
          title="Ice Depth Log"
          subtitle="Monitor and analyze ice surface measurements"
          icon={<Snowflake className="h-8 w-8 text-primary" />}
        />

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