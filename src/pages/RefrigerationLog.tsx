import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";
import { Thermometer, AlertTriangle, BarChart3 } from "lucide-react";
import { format } from "date-fns";

export default function RefrigerationLog() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [facilityId, setFacilityId] = useState<string>("");
  const [facilityName, setFacilityName] = useState<string>("");
  const [operatorName, setOperatorName] = useState<string>("");
  const [logDate, setLogDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [temperatureUnit, setTemperatureUnit] = useState<"fahrenheit" | "celsius">("fahrenheit");
  const [readingNumber, setReadingNumber] = useState<number>(1);
  
  const [formData, setFormData] = useState({
    // Compressor
    suction_pressure: "",
    discharge_pressure: "",
    oil_pressure: "",
    compressor_amps: "",
    oil_temperature: "",
    // Condenser
    condenser_fan_status: "",
    ambient_temperature: "",
    condenser_pressure: "",
    water_temp_in: "",
    water_temp_out: "",
    // Evaporator
    evaporator_pressure: "",
    brine_temp_supply: "",
    brine_temp_return: "",
    brine_flow_rate: "",
    ice_surface_temp: "",
    // Notes
    notes: ""
  });

  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    checkForAlerts();
  }, [formData, temperatureUnit]);

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

      if (profile?.facility_id) {
        setFacilityId(profile.facility_id);
        setOperatorName(profile.name);

        // Get facility name
        const { data: facility } = await supabase
          .from("facilities")
          .select("name")
          .eq("id", profile.facility_id)
          .single();
        
        if (facility) setFacilityName(facility.name);

        // Get next reading number
        const { data: lastLog } = await supabase
          .from("refrigeration_logs")
          .select("reading_number")
          .eq("facility_id", profile.facility_id)
          .order("reading_number", { ascending: false })
          .limit(1)
          .single();

        setReadingNumber(lastLog ? lastLog.reading_number + 1 : 1);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const checkForAlerts = () => {
    const newAlerts: string[] = [];
    const unit = temperatureUnit === "fahrenheit" ? "°F" : "°C";

    // Compressor checks
    const suctionPressure = parseFloat(formData.suction_pressure);
    if (suctionPressure && (suctionPressure < 15 || suctionPressure > 35)) {
      newAlerts.push(`Suction pressure out of range: ${suctionPressure} psig (Normal: 15-35)`);
    }

    const dischargePressure = parseFloat(formData.discharge_pressure);
    if (dischargePressure && (dischargePressure < 180 || dischargePressure > 220)) {
      newAlerts.push(`Discharge pressure out of range: ${dischargePressure} psig (Normal: 180-220)`);
    }

    const oilPressure = parseFloat(formData.oil_pressure);
    if (oilPressure && (oilPressure < 25 || oilPressure > 45)) {
      newAlerts.push(`Oil pressure out of range: ${oilPressure} psig (Normal: 25-45)`);
    }

    const compressorAmps = parseFloat(formData.compressor_amps);
    if (compressorAmps && (compressorAmps < 80 || compressorAmps > 120)) {
      newAlerts.push(`Compressor amps out of range: ${compressorAmps} A (Normal: 80-120)`);
    }

    const oilTemp = parseFloat(formData.oil_temperature);
    if (temperatureUnit === "fahrenheit" && oilTemp && (oilTemp < 140 || oilTemp > 180)) {
      newAlerts.push(`Oil temperature out of range: ${oilTemp}${unit} (Normal: 140-180)`);
    }

    setAlerts(newAlerts);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

      const { error } = await supabase.from("refrigeration_logs").insert({
        facility_id: facilityId,
        log_date: new Date(logDate).toISOString(),
        operator_id: user.id,
        reading_number: readingNumber,
        temperature_unit: temperatureUnit,
        // Compressor
        suction_pressure: parseFloat(formData.suction_pressure) || null,
        discharge_pressure: parseFloat(formData.discharge_pressure) || null,
        oil_pressure: parseFloat(formData.oil_pressure) || null,
        compressor_amps: parseFloat(formData.compressor_amps) || null,
        oil_temperature: parseFloat(formData.oil_temperature) || null,
        // Condenser
        condenser_fan_status: formData.condenser_fan_status || null,
        ambient_temperature: parseFloat(formData.ambient_temperature) || null,
        condenser_pressure: parseFloat(formData.condenser_pressure) || null,
        water_temp_in: parseFloat(formData.water_temp_in) || null,
        water_temp_out: parseFloat(formData.water_temp_out) || null,
        // Evaporator
        evaporator_pressure: parseFloat(formData.evaporator_pressure) || null,
        brine_temp_supply: parseFloat(formData.brine_temp_supply) || null,
        brine_temp_return: parseFloat(formData.brine_temp_return) || null,
        brine_flow_rate: parseFloat(formData.brine_flow_rate) || null,
        ice_surface_temp: parseFloat(formData.ice_surface_temp) || null,
        notes: formData.notes
      });

      if (error) throw error;

      toast({ title: "Equipment readings saved successfully" });
      
      // Reset form
      setFormData({
        suction_pressure: "", discharge_pressure: "", oil_pressure: "", compressor_amps: "", oil_temperature: "",
        condenser_fan_status: "", ambient_temperature: "", condenser_pressure: "", water_temp_in: "", water_temp_out: "",
        evaporator_pressure: "", brine_temp_supply: "", brine_temp_return: "", brine_flow_rate: "", ice_surface_temp: "",
        notes: ""
      });
      setLogDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
      setReadingNumber(prev => prev + 1);
    } catch (error) {
      console.error("Error saving log:", error);
      toast({ title: "Error saving log", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const tempUnit = temperatureUnit === "fahrenheit" ? "°F" : "°C";

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Refrigeration Equipment Logbook"
        subtitle="Record daily operational readings for refrigeration equipment"
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
            <strong>Warnings:</strong>
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
          <div className="flex justify-between items-center">
            <CardTitle>Log Information</CardTitle>
            <div className="flex items-center gap-2">
              <Label>°F</Label>
              <Switch
                checked={temperatureUnit === "celsius"}
                onCheckedChange={(checked) => setTemperatureUnit(checked ? "celsius" : "fahrenheit")}
              />
              <Label>°C</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Reading Number</Label>
              <Input type="number" value={readingNumber} onChange={(e) => setReadingNumber(parseInt(e.target.value))} />
            </div>
            <div>
              <Label>Facility</Label>
              <Input value={facilityName} disabled />
            </div>
            <div>
              <Label>Employee</Label>
              <Input value={operatorName} disabled />
            </div>
            <div>
              <Label>Date & Time</Label>
              <Input type="datetime-local" value={logDate} onChange={(e) => setLogDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compressor Section</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Suction Pressure (psig)</Label>
              <Input type="number" step="0.1" value={formData.suction_pressure} onChange={(e) => handleInputChange("suction_pressure", e.target.value)} placeholder="0" />
              <p className="text-xs text-muted-foreground mt-1">Normal: 15 - 35 psig</p>
            </div>
            <div>
              <Label>Discharge Pressure (psig)</Label>
              <Input type="number" step="0.1" value={formData.discharge_pressure} onChange={(e) => handleInputChange("discharge_pressure", e.target.value)} placeholder="0" />
              <p className="text-xs text-muted-foreground mt-1">Normal: 180 - 220 psig</p>
            </div>
            <div>
              <Label>Oil Pressure (psig)</Label>
              <Input type="number" step="0.1" value={formData.oil_pressure} onChange={(e) => handleInputChange("oil_pressure", e.target.value)} placeholder="0" />
              <p className="text-xs text-muted-foreground mt-1">Normal: 25 - 45 psig</p>
            </div>
            <div>
              <Label>Compressor Amps (A)</Label>
              <Input type="number" step="0.1" value={formData.compressor_amps} onChange={(e) => handleInputChange("compressor_amps", e.target.value)} placeholder="0" />
              <p className="text-xs text-muted-foreground mt-1">Normal: 80 - 120 A</p>
            </div>
            <div>
              <Label>Oil Temperature ({tempUnit})</Label>
              <Input type="number" step="0.1" value={formData.oil_temperature} onChange={(e) => handleInputChange("oil_temperature", e.target.value)} placeholder="0" />
              <p className="text-xs text-muted-foreground mt-1">Normal: 140 - 180 {tempUnit}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Condenser Section</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Condenser Fan Status</Label>
              <Select value={formData.condenser_fan_status} onValueChange={(val) => handleInputChange("condenser_fan_status", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_running">All Running</SelectItem>
                  <SelectItem value="some_off">Some Off</SelectItem>
                  <SelectItem value="all_off">All Off</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ambient Temperature ({tempUnit})</Label>
              <Input type="number" step="0.1" value={formData.ambient_temperature} onChange={(e) => handleInputChange("ambient_temperature", e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Condenser Pressure (psig)</Label>
              <Input type="number" step="0.1" value={formData.condenser_pressure} onChange={(e) => handleInputChange("condenser_pressure", e.target.value)} placeholder="0" />
              <p className="text-xs text-muted-foreground mt-1">Normal: 180 - 220 psig</p>
            </div>
            <div>
              <Label>Water Temp In ({tempUnit})</Label>
              <Input type="number" step="0.1" value={formData.water_temp_in} onChange={(e) => handleInputChange("water_temp_in", e.target.value)} placeholder="0" />
              <p className="text-xs text-muted-foreground mt-1">Normal: 75 - 85 {tempUnit}</p>
            </div>
            <div>
              <Label>Water Temp Out ({tempUnit})</Label>
              <Input type="number" step="0.1" value={formData.water_temp_out} onChange={(e) => handleInputChange("water_temp_out", e.target.value)} placeholder="0" />
              <p className="text-xs text-muted-foreground mt-1">Normal: 85 - 95 {tempUnit}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Evaporator Section</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Evaporator Pressure (psig)</Label>
              <Input type="number" step="0.1" value={formData.evaporator_pressure} onChange={(e) => handleInputChange("evaporator_pressure", e.target.value)} placeholder="0" />
              <p className="text-xs text-muted-foreground mt-1">Normal: 15 - 35 psig</p>
            </div>
            <div>
              <Label>Brine Temp Supply ({tempUnit})</Label>
              <Input type="number" step="0.1" value={formData.brine_temp_supply} onChange={(e) => handleInputChange("brine_temp_supply", e.target.value)} placeholder="0" />
              <p className="text-xs text-muted-foreground mt-1">Normal: 16 - 20 {tempUnit}</p>
            </div>
            <div>
              <Label>Brine Temp Return ({tempUnit})</Label>
              <Input type="number" step="0.1" value={formData.brine_temp_return} onChange={(e) => handleInputChange("brine_temp_return", e.target.value)} placeholder="0" />
              <p className="text-xs text-muted-foreground mt-1">Normal: 22 - 26 {tempUnit}</p>
            </div>
            <div>
              <Label>Brine Flow Rate (GPM)</Label>
              <Input type="number" step="0.1" value={formData.brine_flow_rate} onChange={(e) => handleInputChange("brine_flow_rate", e.target.value)} placeholder="0" />
              <p className="text-xs text-muted-foreground mt-1">Normal: 800 - 1200 GPM</p>
            </div>
            <div>
              <Label>Ice Surface Temp ({tempUnit})</Label>
              <Input type="number" step="0.1" value={formData.ice_surface_temp} onChange={(e) => handleInputChange("ice_surface_temp", e.target.value)} placeholder="0" />
              <p className="text-xs text-muted-foreground mt-1">Normal: 22 - 26 {tempUnit}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Any additional observations, maintenance notes, or anomalies..."
            value={formData.notes}
            onChange={(e) => handleInputChange("notes", e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      <Button onClick={handleSubmit} disabled={loading} size="lg" className="w-full">
        {loading ? "Saving..." : "Submit Equipment Readings"}
      </Button>
    </div>
  );
}
