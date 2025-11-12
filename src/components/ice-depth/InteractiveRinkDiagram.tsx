import { measurementPoints, MeasurementPoint } from "./measurementPoints";
import { Check, MapPin, Copy, Download, Upload, Save, FolderOpen } from "lucide-react";
import rink24Point from "@/assets/rink-24-point.svg";
import rink35Point from "@/assets/rink-35-point.svg";
import rink47Point from "@/assets/rink-47-point.svg";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface InteractiveRinkDiagramProps {
  templateType: string;
  measurements: Record<string, number>;
  currentPointId: number;
  onPointClick?: (pointId: number) => void;
}

export const InteractiveRinkDiagram = ({
  templateType,
  measurements,
  currentPointId,
  onPointClick,
}: InteractiveRinkDiagramProps) => {
  const [devMode, setDevMode] = useState(false);
  const [devTemplate, setDevTemplate] = useState(templateType);
  const [capturedPoints, setCapturedPoints] = useState<{ x: number; y: number; id: number }[]>([]);
  const [savedTemplates, setSavedTemplates] = useState<any[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const activeTemplate = devMode ? devTemplate : templateType;
  const points = measurementPoints[activeTemplate] || [];

  // Fetch saved templates when entering dev mode
  useEffect(() => {
    if (devMode) {
      fetchSavedTemplates();
    }
  }, [devMode]);

  const fetchSavedTemplates = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("custom_templates")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching templates:", error);
      return;
    }

    setSavedTemplates(data || []);
  };

  const getPointState = (point: MeasurementPoint): "disabled" | "current" | "complete" => {
    const measurementKey = `Point ${point.id}`;
    const hasMeasurement = measurements[measurementKey] !== undefined && measurements[measurementKey] > 0;
    
    if (hasMeasurement) return "complete";
    if (point.id === currentPointId) return "current";
    return "disabled";
  };

  const getPointStyles = (state: "disabled" | "current" | "complete", isSpecial?: boolean) => {
    const baseClasses = "absolute flex items-center justify-center rounded-full font-bold text-white transition-all cursor-pointer";
    
    // Responsive sizing
    const sizeClasses = state === "current" 
      ? "w-10 h-10 md:w-12 md:h-12 text-sm md:text-base" 
      : "w-8 h-8 md:w-10 md:h-10 text-xs md:text-sm";
    
    if (state === "disabled") {
      return `${baseClasses} ${sizeClasses} bg-muted text-muted-foreground opacity-50`;
    }
    
    if (state === "current") {
      return `${baseClasses} ${sizeClasses} bg-primary text-primary-foreground animate-pulse shadow-lg ring-2 ring-primary/50`;
    }
    
    if (state === "complete") {
      const bgColor = isSpecial ? "bg-amber-500" : "bg-green-500";
      return `${baseClasses} ${sizeClasses} ${bgColor} text-white shadow-md hover:scale-110`;
    }
    
    return baseClasses;
  };

  const getImageSource = () => {
    switch (activeTemplate) {
      case "25-point":
        return rink24Point;
      case "35-point":
        return rink35Point;
      case "47-point":
        return rink47Point;
      case "custom":
        return rink24Point; // Use basic rink outline for custom template
      default:
        return rink24Point;
    }
  };

  const handleDiagramClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!devMode) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const newPoint = { x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)), id: capturedPoints.length + 1 };
    setCapturedPoints([...capturedPoints, newPoint]);
    console.log(`Point ${newPoint.id}: x: ${newPoint.x}%, y: ${newPoint.y}%`);
  };

  const copyCoordinates = () => {
    const code = `[\n${capturedPoints.map(p => `  { id: ${p.id}, x: ${p.x}, y: ${p.y}, name: "Point ${p.id}", row: 1 }`).join(',\n')}\n]`;
    navigator.clipboard.writeText(code);
    toast.success("Coordinates copied to clipboard!");
  };

  const clearPoints = () => {
    setCapturedPoints([]);
    toast.success("Points cleared!");
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportAsJSON = () => {
    const data = {
      template: devTemplate,
      points: capturedPoints.map(p => ({
        id: p.id,
        x: p.x,
        y: p.y,
        name: `Point ${p.id}`,
        row: 1
      }))
    };
    const content = JSON.stringify(data, null, 2);
    downloadFile(content, `${devTemplate}-coordinates.json`, 'application/json');
    toast.success("JSON file downloaded!");
  };

  const exportAsCSV = () => {
    const headers = "id,x,y,name,row\n";
    const rows = capturedPoints.map(p => `${p.id},${p.x},${p.y},"Point ${p.id}",1`).join('\n');
    const content = headers + rows;
    downloadFile(content, `${devTemplate}-coordinates.csv`, 'text/csv');
    toast.success("CSV file downloaded!");
  };

  const exportAsTypeScript = () => {
    const content = `export const ${devTemplate.replace('-', '')}Points = [\n${capturedPoints.map(p => `  { id: ${p.id}, x: ${p.x}, y: ${p.y}, name: "Point ${p.id}", row: 1 }`).join(',\n')}\n] as const;\n`;
    downloadFile(content, `${devTemplate}-coordinates.ts`, 'text/typescript');
    toast.success("TypeScript file downloaded!");
  };

  const parseCSV = (content: string): { x: number; y: number; id: number }[] => {
    const lines = content.trim().split('\n');
    const points: { x: number; y: number; id: number }[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const match = line.match(/^(\d+),([0-9.]+),([0-9.]+)/);
      if (match) {
        points.push({
          id: parseInt(match[1]),
          x: parseFloat(match[2]),
          y: parseFloat(match[3])
        });
      }
    }
    
    return points;
  };

  const parseTypeScript = (content: string): { x: number; y: number; id: number }[] => {
    const points: { x: number; y: number; id: number }[] = [];
    const matches = content.matchAll(/\{\s*id:\s*(\d+),\s*x:\s*([0-9.]+),\s*y:\s*([0-9.]+)/g);
    
    for (const match of matches) {
      points.push({
        id: parseInt(match[1]),
        x: parseFloat(match[2]),
        y: parseFloat(match[3])
      });
    }
    
    return points;
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let importedPoints: { x: number; y: number; id: number }[] = [];
        
        if (file.name.endsWith('.json')) {
          const data = JSON.parse(content);
          if (data.template) {
            setDevTemplate(data.template);
          }
          importedPoints = data.points?.map((p: any) => ({ id: p.id, x: p.x, y: p.y })) || [];
        } else if (file.name.endsWith('.csv')) {
          importedPoints = parseCSV(content);
        } else if (file.name.endsWith('.ts')) {
          importedPoints = parseTypeScript(content);
        } else {
          toast.error("Unsupported file format. Use JSON, CSV, or TypeScript files.");
          return;
        }

        if (importedPoints.length > 0) {
          setCapturedPoints(importedPoints);
          toast.success(`Imported ${importedPoints.length} points successfully!`);
        } else {
          toast.error("No valid points found in file.");
        }
      } catch (error) {
        console.error("Import error:", error);
        toast.error("Failed to import file. Please check the file format.");
      }
    };
    
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    if (capturedPoints.length === 0) {
      toast.error("No points to save");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in to save templates");
      return;
    }

    const templateData = {
      template: devTemplate,
      points: capturedPoints.map(p => ({
        id: p.id,
        x: p.x,
        y: p.y,
        name: `Point ${p.id}`,
        row: 1
      }))
    };

    const { error } = await supabase
      .from("custom_templates")
      .insert({
        name: templateName,
        user_id: user.id,
        template_data: templateData,
        point_count: capturedPoints.length
      });

    if (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template");
      return;
    }

    toast.success(`Template "${templateName}" saved successfully!`);
    setTemplateName("");
    setSaveDialogOpen(false);
    fetchSavedTemplates();
  };

  const handleLoadTemplate = async (template: any) => {
    try {
      const data = template.template_data;
      if (data.template) {
        setDevTemplate(data.template);
      }
      const importedPoints = data.points?.map((p: any) => ({ id: p.id, x: p.x, y: p.y })) || [];
      setCapturedPoints(importedPoints);
      toast.success(`Loaded template "${template.name}" with ${importedPoints.length} points`);
      setLoadDialogOpen(false);
    } catch (error) {
      console.error("Error loading template:", error);
      toast.error("Failed to load template");
    }
  };

  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    const { error } = await supabase
      .from("custom_templates")
      .delete()
      .eq("id", templateId);

    if (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
      return;
    }

    toast.success(`Template "${templateName}" deleted`);
    fetchSavedTemplates();
  };

  return (
    <div className="space-y-4">
      {/* Dev Mode Controls */}
      <div className="flex gap-2 items-center justify-end flex-wrap">
        <Button
          variant={devMode ? "default" : "outline"}
          size="sm"
          onClick={() => setDevMode(!devMode)}
        >
          <MapPin className="w-4 h-4 mr-2" />
          {devMode ? "Exit" : "Enable"} Coordinate Capture
        </Button>
        {devMode && (
          <>
            <Select value={devTemplate} onValueChange={setDevTemplate}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25-point">25-point</SelectItem>
                <SelectItem value="35-point">35-point</SelectItem>
                <SelectItem value="47-point">47-point</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv,.ts"
              onChange={handleImportFile}
              className="hidden"
            />
            <Button variant="outline" size="sm" onClick={triggerImport}>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLoadDialogOpen(true)}>
              <FolderOpen className="w-4 h-4 mr-2" />
              Load ({savedTemplates.length})
            </Button>
            {capturedPoints.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={() => setSaveDialogOpen(true)}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Template
                </Button>
                <Button variant="outline" size="sm" onClick={copyCoordinates}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy ({capturedPoints.length})
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={exportAsJSON}>
                      Export as JSON
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportAsCSV}>
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportAsTypeScript}>
                      Export as TypeScript
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="sm" onClick={clearPoints}>
                  Clear
                </Button>
              </>
            )}
          </>
        )}
      </div>

      <div 
        className="relative w-full" 
        style={{ aspectRatio: "595.28 / 841.89" }}
        onClick={handleDiagramClick}
      >
        {/* Base rink diagram */}
        <img
          src={getImageSource()}
          alt={`Ice rink ${activeTemplate} measurement template`}
          className="w-full h-full object-contain"
        />
      
      {/* Measurement point overlays */}
      <div className="absolute inset-0 pointer-events-none">
        {!devMode && points.map((point) => {
          const state = getPointState(point);
          const measurementKey = `Point ${point.id}`;
          const measurementValue = measurements[measurementKey];
          const hasValue = measurementValue !== undefined && measurementValue > 0;
          
          return (
            <div
              key={point.id}
              className={`${getPointStyles(state, point.isSpecial)} pointer-events-auto`}
              style={{
                left: `${point.x}%`,
                top: `${point.y}%`,
                transform: "translate(-50%, -50%)",
              }}
              onClick={() => onPointClick?.(point.id)}
              title={point.isSpecial ? point.specialLabel : point.name}
            >
              {state === "complete" ? (
                hasValue ? (
                  <span className="flex items-center gap-1">
                    <Check className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden md:inline text-xs">
                      {measurementValue.toFixed(2)}
                    </span>
                  </span>
                ) : (
                  <Check className="w-3 h-3 md:w-4 md:h-4" />
                )
              ) : (
                <span>{point.id}</span>
              )}
              
              {/* Special badge for goal crease and center ice */}
              {point.isSpecial && state !== "disabled" && (
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap shadow-md hidden md:block">
                  {point.specialLabel === "Center Ice" ? "CI" : "GC"}
                </div>
              )}
            </div>
          );
        })}
        
        {/* Captured points in dev mode */}
        {devMode && capturedPoints.map((point) => (
          <div
            key={point.id}
            className="absolute w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold pointer-events-none"
            style={{
              left: `${point.x}%`,
              top: `${point.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {point.id}
          </div>
        ))}
      </div>
      </div>

      {/* Save Template Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Custom Template</DialogTitle>
            <DialogDescription>
              Save your {capturedPoints.length} captured points as a reusable template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                placeholder="e.g., My Custom 30-Point Pattern"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveTemplate();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate}>
              <Save className="w-4 h-4 mr-2" />
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Template Dialog */}
      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Load Saved Template</DialogTitle>
            <DialogDescription>
              Select a saved template to load into the coordinate capture tool.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {savedTemplates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No saved templates yet</p>
                <p className="text-sm mt-1">Capture points and save them to create templates</p>
              </div>
            ) : (
              savedTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{template.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {template.point_count} points • {template.template_data.template || 'custom'} • 
                      {new Date(template.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLoadTemplate(template)}
                    >
                      Load
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id, template.name)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
