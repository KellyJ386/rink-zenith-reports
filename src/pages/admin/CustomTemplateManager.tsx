import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InteractiveRinkDiagram } from "@/components/ice-depth/InteractiveRinkDiagram";
import { Loader2, MapPin, Trash2 } from "lucide-react";
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

export default function CustomTemplateManager() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<string>("");
  const [savedTemplates, setSavedTemplates] = useState<any[]>([]);
  const [measurements] = useState<Record<string, number>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if user is admin or manager
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const hasRole = roleData?.some(
        (r) => r.role === "admin" || r.role === "manager"
      );

      if (!hasRole) {
        toast({
          title: "Access Denied",
          description: "You must be an administrator or manager to access this area.",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setHasAccess(true);
      await fetchFacilities();
      setLoading(false);
    };

    checkAccess();
  }, [navigate, toast]);

  const fetchFacilities = async () => {
    const { data, error } = await supabase
      .from("facilities")
      .select("*")
      .order("name");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load facilities",
        variant: "destructive",
      });
      return;
    }

    setFacilities(data || []);
    if (data && data.length > 0) {
      setSelectedFacility(data[0].id);
    }
  };

  useEffect(() => {
    if (selectedFacility && hasAccess) {
      fetchTemplates();
    }
  }, [selectedFacility, hasAccess]);

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from("custom_templates")
      .select("*")
      .eq("facility_id", selectedFacility)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching templates:", error);
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      });
      return;
    }

    setSavedTemplates(data || []);
  };

  const handleDeleteTemplate = (id: string, name: string) => {
    setTemplateToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!templateToDelete) return;

    const { error } = await supabase
      .from("custom_templates")
      .delete()
      .eq("id", templateToDelete.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: `Template "${templateToDelete.name}" deleted successfully`,
    });

    setDeleteDialogOpen(false);
    setTemplateToDelete(null);
    fetchTemplates();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-ice-frost to-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-ice-frost to-background">
      <PageHeader 
        title="Custom Template Manager"
        subtitle="Create and manage custom ice depth measurement templates"
      />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
        {/* Facility Selection */}
        <Card className="shadow-[var(--shadow-ice)]">
          <CardHeader>
            <CardTitle>Select Facility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Facility</Label>
              <Select value={selectedFacility} onValueChange={setSelectedFacility}>
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
          </CardContent>
        </Card>

        {/* Template Creation */}
        {selectedFacility && (
          <>
            <Card className="shadow-[var(--shadow-ice)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Create Custom Template
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Click on the rink diagram below to add measurement points. Use the controls to save, export, or load templates.
                </p>
                <InteractiveRinkDiagram
                  templateType="custom"
                  measurements={measurements}
                  currentPointId={1}
                  unit="in"
                  adminMode={true}
                  facilityId={selectedFacility}
                  onTemplatesChange={fetchTemplates}
                />
              </CardContent>
            </Card>

            {/* Saved Templates */}
            <Card className="shadow-[var(--shadow-ice)]">
              <CardHeader>
                <CardTitle>Saved Templates ({savedTemplates.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {savedTemplates.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No custom templates created yet. Create one using the diagram above.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {savedTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div>
                          <h4 className="font-semibold">{template.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {template.point_count} points • 
                            {new Date(template.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id, template.name)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the template "{templateToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
