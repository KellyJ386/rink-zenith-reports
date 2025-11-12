import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";
import { Thermometer, AlertTriangle, Plus, Trash2, BarChart3 } from "lucide-react";
import { format } from "date-fns";

interface CompressorReading {
  compressor_name: string;
  suction_pressure: string;
  discharge_pressure: string;
  oil_level: string;
  temperature: string;
  running_hours: string;
}

const CHECKLIST_ITEMS = [
  "No unusual sounds detected",
  "No visible leaks",
  "All safety controls functioning",
  "Proper ventilation",
  "Area clean and accessible"
];

export default function RefrigerationLog() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [facilityId, setFacilityId] = useState<string>("");
  const [operatorName, setOperatorName] = useState<string>("");
  const [logDate, setLogDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [shift, setShift] = useState<string>("morning");
  const [notes, setNotes] = useState("");
  
  const [compressors, setCompressors] = useState<CompressorReading[]>([
    { compressor_name: "Compressor #1", suction_pressure: "", discharge_pressure: "", oil_level: "ok", temperature: "", running_hours: "" }
  ]);
  
  const [condenser, setCondenser] = useState({
    temperature: "",
    ambient_temp: "",
    fan_status: "all_running"
  });
  
  const [checklist, setChecklist] = useState<Record<string, boolean>>(
    CHECKLIST_ITEMS.reduce((acc, item) => ({ ...acc, [item]: false }), {})
  );

  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    checkForAlerts();
  }, [compressors, condenser]);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("facility_id, name")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setFacilityId(profile.facility_id);
        setOperatorName(profile.name);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const checkForAlerts = () => {
    const newAlerts: string[] = [];

    compressors.forEach((comp, idx) => {
      if (comp.oil_level === "critical") {
        newAlerts.push(`${comp.compressor_name}: CRITICAL oil level!`);
      }
      const suctionPressure = parseFloat(comp.suction_pressure);
      const dischargePressure = parseFloat(comp.discharge_pressure);
      
      if (suctionPressure < 20 || suctionPressure > 60) {
        newAlerts.push(`${comp.compressor_name}: Suction pressure out of range (${suctionPressure} PSI)`);
      }
      if (dischargePressure < 100 || dischargePressure > 250) {
        newAlerts.push(`${comp.compressor_name}: Discharge pressure out of range (${dischargePressure} PSI)`);
      }
    });

    const condenserTemp = parseFloat(condenser.temperature);
    if (condenserTemp > 100) {
      newAlerts.push(`Condenser temperature too high (${condenserTemp}°F)`);
    }

    if (condenser.fan_status === "all_off") {
      newAlerts.push("All condenser fans are OFF - check immediately!");
    }

    setAlerts(newAlerts);
  };

  const addCompressor = () => {
    setCompressors([...compressors, {
      compressor_name: `Compressor #${compressors.length + 1}`,
      suction_pressure: "",
      discharge_pressure: "",
      oil_level: "ok",
      temperature: "",
      running_hours: ""
    }]);
  };

  const removeCompressor = (index: number) => {
    setCompressors(compressors.filter((_, i) => i !== index));
  };

  const updateCompressor = (index: number, field: keyof CompressorReading, value: string) => {
    const updated = [...compressors];
    updated[index][field] = value;
    setCompressors(updated);
  };

  const handleSubmit = async () => {
    if (!facilityId) {
      toast({ title: "Error: No facility assigned", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create main log entry
      const { data: logData, error: logError } = await supabase
        .from("refrigeration_logs")
        .insert({
          facility_id: facilityId,
          log_date: new Date(logDate).toISOString(),
          shift,
          operator_id: user.id,
          notes
        })
        .select()
        .single();

      if (logError) throw logError;

      // Insert compressor readings
      const compressorInserts = compressors.map(comp => ({
        log_id: logData.id,
        compressor_name: comp.compressor_name,
        suction_pressure: parseFloat(comp.suction_pressure) || null,
        discharge_pressure: parseFloat(comp.discharge_pressure) || null,
        oil_level: comp.oil_level,
        temperature: parseFloat(comp.temperature) || null,
        running_hours: parseFloat(comp.running_hours) || null
      }));

      const { error: compError } = await supabase
        .from("compressor_readings")
        .insert(compressorInserts);

      if (compError) throw compError;

      // Insert condenser reading
      const { error: condError } = await supabase
        .from("condenser_readings")
        .insert({
          log_id: logData.id,
          temperature: parseFloat(condenser.temperature) || null,
          ambient_temp: parseFloat(condenser.ambient_temp) || null,
          fan_status: condenser.fan_status
        });

      if (condError) throw condError;

      // Insert checklist items
      const checklistInserts = CHECKLIST_ITEMS.map(item => ({
        log_id: logData.id,
        checklist_item: item,
        status: checklist[item]
      }));

      const { error: checkError } = await supabase
        .from("plant_checklist")
        .insert(checklistInserts);

      if (checkError) throw checkError;

      toast({ title: "Log entry saved successfully" });
      
      // Reset form
      setCompressors([{ compressor_name: "Compressor #1", suction_pressure: "", discharge_pressure: "", oil_level: "ok", temperature: "", running_hours: "" }]);
      setCondenser({ temperature: "", ambient_temp: "", fan_status: "all_running" });
      setChecklist(CHECKLIST_ITEMS.reduce((acc, item) => ({ ...acc, [item]: false }), {}));
      setNotes("");
      setLogDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    } catch (error) {
      console.error("Error saving log:", error);
      toast({ title: "Error saving log", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Refrigeration Log"
        subtitle="Monitor refrigeration system vital signs"
        icon={<Thermometer className="h-8 w-8 text-primary" />}
        actions={
          <Button variant="outline" onClick={() => navigate("/refrigeration-dashboard")}>
            <BarChart3 className="mr-2 h-4 w-4" />
            View Dashboard
          </Button>
        }
      />

      {alerts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Critical Alerts:</strong>
            <ul className="mt-2 ml-4 list-disc">
              {alerts.map((alert, idx) => (
                <li key={idx}>{alert}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Log Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Date & Time</Label>
              <Input
                type="datetime-local"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Shift</Label>
              <Select value={shift} onValueChange={setShift}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                  <SelectItem value="overnight">Overnight</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Operator</Label>
              <Input value={operatorName} disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Compressor Readings</CardTitle>
          <Button onClick={addCompressor} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Compressor
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {compressors.map((comp, idx) => (
            <div key={idx} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <Input
                  value={comp.compressor_name}
                  onChange={(e) => updateCompressor(idx, "compressor_name", e.target.value)}
                  className="font-semibold max-w-xs"
                />
                {compressors.length > 1 && (
                  <Button variant="destructive" size="icon" onClick={() => removeCompressor(idx)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Suction Pressure (PSI)</Label>
                  <Input
                    type="number"
                    value={comp.suction_pressure}
                    onChange={(e) => updateCompressor(idx, "suction_pressure", e.target.value)}
                    placeholder="30-50 normal"
                  />
                </div>
                <div>
                  <Label>Discharge Pressure (PSI)</Label>
                  <Input
                    type="number"
                    value={comp.discharge_pressure}
                    onChange={(e) => updateCompressor(idx, "discharge_pressure", e.target.value)}
                    placeholder="150-200 normal"
                  />
                </div>
                <div>
                  <Label>Operating Temperature (°F)</Label>
                  <Input
                    type="number"
                    value={comp.temperature}
                    onChange={(e) => updateCompressor(idx, "temperature", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Running Hours</Label>
                  <Input
                    type="number"
                    value={comp.running_hours}
                    onChange={(e) => updateCompressor(idx, "running_hours", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Oil Level</Label>
                  <RadioGroup value={comp.oil_level} onValueChange={(val) => updateCompressor(idx, "oil_level", val)}>
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ok" id={`ok-${idx}`} />
                        <Label htmlFor={`ok-${idx}`}>OK</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="low" id={`low-${idx}`} />
                        <Label htmlFor={`low-${idx}`}>Low</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="critical" id={`critical-${idx}`} />
                        <Label htmlFor={`critical-${idx}`}>Critical</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Condenser Readings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Condenser Temperature (°F)</Label>
              <Input
                type="number"
                value={condenser.temperature}
                onChange={(e) => setCondenser({ ...condenser, temperature: e.target.value })}
                placeholder="70-95 normal"
              />
            </div>
            <div>
              <Label>Ambient Temperature (°F)</Label>
              <Input
                type="number"
                value={condenser.ambient_temp}
                onChange={(e) => setCondenser({ ...condenser, ambient_temp: e.target.value })}
              />
            </div>
            <div>
              <Label>Fan Status</Label>
              <Select value={condenser.fan_status} onValueChange={(val) => setCondenser({ ...condenser, fan_status: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_running">All Running</SelectItem>
                  <SelectItem value="some_off">Some Off</SelectItem>
                  <SelectItem value="all_off">All Off</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plant Health Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {CHECKLIST_ITEMS.map((item) => (
            <div key={item} className="flex items-center space-x-2">
              <Checkbox
                id={item}
                checked={checklist[item]}
                onCheckedChange={(checked) => setChecklist({ ...checklist, [item]: checked as boolean })}
              />
              <Label htmlFor={item} className="cursor-pointer">{item}</Label>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Any issues, observations, or maintenance performed..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      <Button onClick={handleSubmit} disabled={loading} size="lg" className="w-full">
        {loading ? "Saving..." : "Submit Log Entry"}
      </Button>
    </div>
  );
}
