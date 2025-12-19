import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Pencil, Trash2, GripVertical, X, Check, Snowflake } from "lucide-react";
import { format } from "date-fns";

interface TemplatePoint {
  id: number;
  x: number;
  y: number;
  label?: string;
}

interface CustomIceTemplate {
  id: string;
  facility_id: string;
  rink_id: string;
  created_by: string;
  template_name: string;
  template_number: number;
  point_count: number;
  points: TemplatePoint[];
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

interface Rink {
  id: string;
  name: string;
}

const IceDepthSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [facilityId, setFacilityId] = useState<string>("");
  const [rinks, setRinks] = useState<Rink[]>([]);
  const [selectedRink, setSelectedRink] = useState<string>("");
  const [templates, setTemplates] = useState<CustomIceTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<CustomIceTemplate | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [points, setPoints] = useState<TemplatePoint[]>([]);
  const [saving, setSaving] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number>(1);
  const [userId, setUserId] = useState<string>("");

  // Fetch user's facility and rinks
  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("facility_id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.facility_id) {
        toast({
          title: "No Facility",
          description: "You are not assigned to a facility",
          variant: "destructive",
        });
        return;
      }

      setFacilityId(profile.facility_id);

      const { data: rinkData } = await supabase
        .from("rinks")
        .select("id, name")
        .eq("facility_id", profile.facility_id)
        .eq("is_active", true)
        .order("name");

      setRinks(rinkData || []);
      if (rinkData && rinkData.length > 0) {
        setSelectedRink(rinkData[0].id);
      }
      setLoading(false);
    };

    fetchInitialData();
  }, [navigate, toast]);

  // Fetch templates when rink changes
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!facilityId || !selectedRink) return;

      const { data, error } = await supabase
        .from("custom_ice_templates")
        .select("*")
        .eq("facility_id", facilityId)
        .eq("rink_id", selectedRink)
        .order("template_number");

      if (error) {
        console.error("Error fetching templates:", error);
        return;
      }

      setTemplates((data || []).map(t => ({
        ...t,
        points: (t.points as unknown as TemplatePoint[]) || []
      })));
    };

    fetchTemplates();
  }, [facilityId, selectedRink]);

  const getTemplateSlots = () => {
    const slots = [];
    for (let i = 1; i <= 8; i++) {
      const template = templates.find(t => t.template_number === i);
      slots.push({
        number: i,
        template: template || null,
      });
    }
    return slots;
  };

  const handleOpenEditor = (slotNumber: number, existingTemplate?: CustomIceTemplate) => {
    setSelectedSlot(slotNumber);
    if (existingTemplate) {
      setEditingTemplate(existingTemplate);
      setTemplateName(existingTemplate.template_name);
      setPoints(existingTemplate.points || []);
    } else {
      setEditingTemplate(null);
      setTemplateName("");
      setPoints([]);
    }
    setIsEditorOpen(true);
  };

  const handleDiagramClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const newPoint: TemplatePoint = {
      id: points.length + 1,
      x: parseFloat(x.toFixed(1)),
      y: parseFloat(y.toFixed(1)),
      label: `Point ${points.length + 1}`,
    };
    
    setPoints([...points, newPoint]);
  };

  const handleRemovePoint = (pointId: number) => {
    setPoints(points.filter(p => p.id !== pointId).map((p, i) => ({
      ...p,
      id: i + 1,
      label: `Point ${i + 1}`,
    })));
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for this template",
        variant: "destructive",
      });
      return;
    }

    if (points.length === 0) {
      toast({
        title: "Points Required",
        description: "Please add at least one measurement point",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const templateData = {
        facility_id: facilityId,
        rink_id: selectedRink,
        created_by: userId,
        template_name: templateName.trim(),
        template_number: selectedSlot,
        point_count: points.length,
        points: points as unknown as any,
        is_active: true,
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from("custom_ice_templates")
          .update({
            template_name: templateData.template_name,
            point_count: templateData.point_count,
            points: templateData.points,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingTemplate.id);

        if (error) throw error;
        toast({ title: "Template Updated" });
      } else {
        const { error } = await supabase
          .from("custom_ice_templates")
          .insert(templateData);

        if (error) throw error;
        toast({ title: "Template Created" });
      }

      // Refresh templates
      const { data } = await supabase
        .from("custom_ice_templates")
        .select("*")
        .eq("facility_id", facilityId)
        .eq("rink_id", selectedRink)
        .order("template_number");

      setTemplates((data || []).map(t => ({
        ...t,
        points: (t.points as unknown as TemplatePoint[]) || []
      })));

      setIsEditorOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save template",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const { error } = await supabase
        .from("custom_ice_templates")
        .delete()
        .eq("id", templateId);

      if (error) throw error;

      setTemplates(templates.filter(t => t.id !== templateId));
      toast({ title: "Template Deleted" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Snowflake className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const slots = getTemplateSlots();

  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-frost to-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Ice Depth Templates</h1>
            <p className="text-muted-foreground">
              Create and manage up to 8 custom measurement templates per rink
            </p>
          </div>
        </div>

        {/* Rink Selector */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Select Rink</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedRink} onValueChange={setSelectedRink}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select a rink" />
              </SelectTrigger>
              <SelectContent>
                {rinks.map(rink => (
                  <SelectItem key={rink.id} value={rink.id}>
                    {rink.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Template Slots */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {slots.map(slot => (
            <Card 
              key={slot.number} 
              className={`relative ${slot.template ? 'border-primary/50' : 'border-dashed'}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Template {slot.number}</CardTitle>
                  {slot.template && (
                    <Badge variant="secondary">{slot.template.point_count} pts</Badge>
                  )}
                </div>
                {slot.template ? (
                  <CardDescription className="font-medium text-foreground">
                    {slot.template.template_name}
                  </CardDescription>
                ) : (
                  <CardDescription>Not configured</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {slot.template && (
                  <div className="text-xs text-muted-foreground">
                    Last modified: {format(new Date(slot.template.updated_at), "MMM d, yyyy")}
                  </div>
                )}
                <div className="flex gap-2">
                  {slot.template ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleOpenEditor(slot.number, slot.template!)}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteTemplate(slot.template!.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleOpenEditor(slot.number)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Create Template
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Templates Message */}
        {templates.length === 0 && (
          <Card className="border-amber-500/50 bg-amber-500/10">
            <CardContent className="py-6 text-center">
              <p className="text-amber-700 dark:text-amber-400">
                No templates configured for this rink. Users will not be able to record ice depth measurements until at least one template is created.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Template Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Edit Template" : "Create Template"} - Slot {selectedSlot}
            </DialogTitle>
            <DialogDescription>
              Click on the rink diagram to add measurement points. Drag to reposition.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Game Day, Practice, Weekly Check"
              />
            </div>

            <div className="space-y-2">
              <Label>Measurement Points ({points.length})</Label>
              <div 
                className="relative border rounded-lg overflow-hidden bg-ice-frost cursor-crosshair"
                style={{ aspectRatio: "200/85" }}
                onClick={handleDiagramClick}
              >
                {/* Rink SVG Background */}
                <img
                  src="/src/assets/rink-35-point.svg"
                  alt="Rink"
                  className="w-full h-full object-contain pointer-events-none opacity-50"
                />
                
                {/* Points Overlay */}
                {points.map((point) => (
                  <div
                    key={point.id}
                    className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                    style={{ left: `${point.x}%`, top: `${point.y}%` }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="relative group">
                      <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium shadow-md">
                        {point.id}
                      </div>
                      <button
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        onClick={() => handleRemovePoint(point.id)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}

                {points.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-muted-foreground bg-background/80 px-4 py-2 rounded">
                      Click anywhere to add measurement points
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditorOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate} disabled={saving}>
              {saving ? "Saving..." : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Save Template
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IceDepthSettings;