import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Wind, Plus, Trash2, Save, Send, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { DynamicFormFields } from "@/components/maintenance/DynamicFormFields";

interface Resurfacer {
  unit_number: number;
  make_model: string;
  fuel_type: string;
}

interface Equipment {
  equipment_name: string;
  fuel_type: string;
  notes: string;
}

interface Measurement {
  measurement_type: string;
  measurement_time: string;
  location: string;
  co_instant: number;
  co_one_hour_avg: number;
  no2_instant: number;
  no2_one_hour_avg: number;
  notes: string;
  actions_taken: string;
}

interface ActionRecord {
  action_type: string;
  exceedance_time: string;
  co_concentration: number;
  no2_concentration: number;
  health_authority_name: string;
  health_authority_notified_time: string;
  reentry_authorized_datetime: string;
  reentry_authority: string;
  acceptable_levels_restored_time: string;
  cause_and_measures: string;
}

export default function AirQualityLog() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState("");
  const [facilityId, setFacilityId] = useState("");
  const [facilityName, setFacilityName] = useState("");
  
  const currentDate = format(new Date(), "yyyy-MM-dd");
  const currentTime = format(new Date(), "HH:mm");

  // Form state
  const [logDate, setLogDate] = useState(currentDate);
  const [logTime, setLogTime] = useState(currentTime);
  const [testerName, setTesterName] = useState("");
  const [testerCertification, setTesterCertification] = useState("");
  const [coMonitorType, setCoMonitorType] = useState("");
  const [coMonitorModel, setCoMonitorModel] = useState("");
  const [coCalibrationDate, setCoCalibrationDate] = useState("");
  const [no2MonitorType, setNo2MonitorType] = useState("");
  const [no2MonitorModel, setNo2MonitorModel] = useState("");
  const [no2CalibrationDate, setNo2CalibrationDate] = useState("");
  const [ventilationInspectionDate, setVentilationInspectionDate] = useState("");
  const [arenaStatus, setArenaStatus] = useState("");
  const [ventilationStatus, setVentilationStatus] = useState("");
  const [resurfacerMaintenance, setResurfacerMaintenance] = useState("");
  const [ventilationMaintenance, setVentilationMaintenance] = useState("");
  const [otherEquipmentMaintenance, setOtherEquipmentMaintenance] = useState("");
  const [electricConsideration, setElectricConsideration] = useState("");
  const [staffTrained, setStaffTrained] = useState(false);
  const [publicSignage, setPublicSignage] = useState(false);
  const [unusualObservations, setUnusualObservations] = useState("");

  const [resurfacers, setResurfacers] = useState<Resurfacer[]>([
    { unit_number: 1, make_model: "", fuel_type: "" },
    { unit_number: 2, make_model: "", fuel_type: "" },
    { unit_number: 3, make_model: "", fuel_type: "" }
  ]);
  
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [postEdgingMeasurements, setPostEdgingMeasurements] = useState<Measurement[]>([]);
  const [immediateAction, setImmediateAction] = useState<ActionRecord | null>(null);
  const [correctiveAction, setCorrectiveAction] = useState<ActionRecord | null>(null);

  const [customFields, setCustomFields] = useState<Record<string, any>>({});

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, facility_id, facilities(name)")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setUserName(profile.name || user.email || "");
        setTesterName(profile.name || "");
        if (profile.facility_id) {
          setFacilityId(profile.facility_id);
          const facilityData = profile.facilities as any;
          setFacilityName(facilityData?.name || "Main Arena");
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateResurfacer = (index: number, field: keyof Resurfacer, value: string) => {
    const updated = [...resurfacers];
    updated[index] = { ...updated[index], [field]: value };
    setResurfacers(updated);
  };

  const addEquipment = () => {
    setEquipment([...equipment, { equipment_name: "", fuel_type: "", notes: "" }]);
  };

  const removeEquipment = (index: number) => {
    setEquipment(equipment.filter((_, i) => i !== index));
  };

  const addMeasurement = () => {
    setMeasurements([...measurements, {
      measurement_type: "routine",
      measurement_time: currentTime,
      location: "",
      co_instant: 0,
      co_one_hour_avg: 0,
      no2_instant: 0,
      no2_one_hour_avg: 0,
      notes: "",
      actions_taken: ""
    }]);
  };

  const addPostEdgingMeasurement = () => {
    setPostEdgingMeasurements([...postEdgingMeasurements, {
      measurement_type: "post_edging",
      measurement_time: currentTime,
      location: "",
      co_instant: 0,
      co_one_hour_avg: 0,
      no2_instant: 0,
      no2_one_hour_avg: 0,
      notes: "",
      actions_taken: ""
    }]);
  };

  const checkAlertLevels = (measurement: Measurement) => {
    const alerts = [];
    if (measurement.co_instant >= 200) alerts.push("CRITICAL: CO instant ≥ 200 ppm - EVACUATE IMMEDIATELY!");
    if (measurement.co_one_hour_avg >= 100) alerts.push("CRITICAL: CO 1-hour avg ≥ 100 ppm - EVACUATE!");
    if (measurement.no2_instant >= 2) alerts.push("CRITICAL: NO2 instant ≥ 2 ppm - EVACUATE!");
    if (measurement.co_one_hour_avg > 35 && measurement.co_one_hour_avg < 100) alerts.push("WARNING: CO 1-hour avg > 35 ppm");
    if (measurement.co_one_hour_avg > 20) alerts.push("ACTION: CO 1-hour avg > 20 ppm");
    if (measurement.no2_one_hour_avg > 0.25) alerts.push("ACTION: NO2 1-hour avg > 0.25 ppm");
    if (measurement.no2_one_hour_avg > 0.3) alerts.push("WARNING: NO2 1-hour avg > 0.3 ppm");
    return alerts;
  };

  const saveLog = async (status: string) => {
    if (!user || !facilityId) return;
    
    setSaving(true);
    try {
      const { data: log, error: logError } = await supabase
        .from("air_quality_logs")
        .insert({
          facility_id: facilityId,
          log_date: logDate,
          log_time: logTime,
          submitted_by: user.id,
          tester_name: testerName,
          tester_certification: testerCertification,
          co_monitor_type: coMonitorType,
          co_monitor_model: coMonitorModel,
          co_monitor_calibration_date: coCalibrationDate || null,
          no2_monitor_type: no2MonitorType,
          no2_monitor_model: no2MonitorModel,
          no2_monitor_calibration_date: no2CalibrationDate || null,
          ventilation_last_inspection: ventilationInspectionDate || null,
          arena_status: arenaStatus,
          ventilation_status: ventilationStatus,
          resurfacer_last_maintenance: resurfacerMaintenance,
          ventilation_last_maintenance: ventilationMaintenance,
          other_equipment_last_maintenance: otherEquipmentMaintenance,
          electric_equipment_consideration: electricConsideration,
          staff_trained: staffTrained,
          public_signage_present: publicSignage,
          unusual_observations: unusualObservations,
          status,
          custom_fields: customFields
        })
        .select()
        .single();

      if (logError) throw logError;

      // Save resurfacers
      const activeResurfacers = resurfacers.filter(r => r.make_model || r.fuel_type);
      if (activeResurfacers.length > 0) {
        const { error: resurfacersError } = await supabase
          .from("air_quality_resurfacers")
          .insert(activeResurfacers.map(r => ({ ...r, log_id: log.id })));
        if (resurfacersError) throw resurfacersError;
      }

      // Save equipment
      if (equipment.length > 0) {
        const { error: equipmentError } = await supabase
          .from("air_quality_equipment")
          .insert(equipment.map(e => ({ ...e, log_id: log.id })));
        if (equipmentError) throw equipmentError;
      }

      // Save measurements
      const allMeasurements = [...measurements, ...postEdgingMeasurements];
      if (allMeasurements.length > 0) {
        const { error: measurementsError } = await supabase
          .from("air_quality_measurements")
          .insert(allMeasurements.map(m => ({ ...m, log_id: log.id })));
        if (measurementsError) throw measurementsError;
      }

      // Save action records
      const actions = [];
      if (immediateAction?.exceedance_time) actions.push({ ...immediateAction, log_id: log.id, action_type: "immediate" });
      if (correctiveAction?.exceedance_time) actions.push({ ...correctiveAction, log_id: log.id, action_type: "corrective" });
      
      if (actions.length > 0) {
        const { error: actionsError } = await supabase
          .from("air_quality_actions")
          .insert(actions);
        if (actionsError) throw actionsError;
      }

      toast({
        title: status === "draft" ? "Draft Saved" : "Log Submitted",
        description: `Air quality log ${status === "draft" ? "saved as draft" : "submitted successfully"}`
      });

      // Reset form
      setMeasurements([]);
      setPostEdgingMeasurements([]);
      setEquipment([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <PageHeader
        title="Air Quality Monitoring Log"
        subtitle="Indoor air quality monitoring for ice arenas"
        icon={<Wind className="h-8 w-8 text-primary" />}
      />

      {/* Auto-populated Header */}
      <Card className="mb-6 bg-muted/50">
        <CardHeader>
          <CardTitle>Log Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label className="text-muted-foreground">Date</Label>
              <p className="text-lg font-semibold">{format(new Date(logDate), "MMMM dd, yyyy")}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Time</Label>
              <p className="text-lg font-semibold">{logTime}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Logged By</Label>
              <p className="text-lg font-semibold">{userName}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {/* Facility and Equipment Information */}
        <Card>
          <CardHeader>
            <CardTitle>ICE ARENA INDOOR AIR QUALITY MONITORING LOG</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Facility Name</Label>
                <Input value={facilityName} onChange={(e) => setFacilityName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Date of Test</Label>
                <Input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tester Name/Certification</Label>
                <Input value={testerName} onChange={(e) => setTesterName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tester Certification</Label>
                <Input 
                  placeholder="Certification details"
                  value={testerCertification} 
                  onChange={(e) => setTesterCertification(e.target.value)} 
                />
              </div>
            </div>

            <Separator />

            <h3 className="font-semibold">Monitoring Equipment Used</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>CO Monitor (Type, Model)</Label>
                <Input 
                  placeholder="Type"
                  value={coMonitorType} 
                  onChange={(e) => setCoMonitorType(e.target.value)} 
                />
                <Input 
                  placeholder="Model"
                  value={coMonitorModel} 
                  onChange={(e) => setCoMonitorModel(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label>CO Monitor Calibration Date</Label>
                <Input 
                  type="date"
                  value={coCalibrationDate} 
                  onChange={(e) => setCoCalibrationDate(e.target.value)} 
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>NO2 Monitor (Type, Model)</Label>
                <Input 
                  placeholder="Type"
                  value={no2MonitorType} 
                  onChange={(e) => setNo2MonitorType(e.target.value)} 
                />
                <Input 
                  placeholder="Model"
                  value={no2MonitorModel} 
                  onChange={(e) => setNo2MonitorModel(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label>NO2 Monitor Calibration Date</Label>
                <Input 
                  type="date"
                  value={no2CalibrationDate} 
                  onChange={(e) => setNo2CalibrationDate(e.target.value)} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ventilation System Check - Last Inspection Date</Label>
              <Input 
                type="date"
                value={ventilationInspectionDate} 
                onChange={(e) => setVentilationInspectionDate(e.target.value)} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 1: General Information & Equipment Status */}
        <Card>
          <CardHeader>
            <CardTitle>Section 1: General Information & Equipment Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Arena Operating Status</Label>
              <Select value={arenaStatus} onValueChange={setArenaStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select arena status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open/Operating</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <h3 className="font-semibold">Ice Resurfacer(s) Used Today</h3>
            {resurfacers.map((resurfacer, index) => (
              <div key={index} className="grid gap-4 md:grid-cols-3 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label>Unit {resurfacer.unit_number}: Make/Model</Label>
                  <Input
                    value={resurfacer.make_model}
                    onChange={(e) => updateResurfacer(index, "make_model", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fuel Type</Label>
                  <Select 
                    value={resurfacer.fuel_type} 
                    onValueChange={(value) => updateResurfacer(index, "fuel_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electric">Electric</SelectItem>
                      <SelectItem value="propane">Propane</SelectItem>
                      <SelectItem value="natural_gas">Natural Gas</SelectItem>
                      <SelectItem value="gasoline">Gasoline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}

            <Separator />

            <div className="space-y-2">
              <Label>Other Fuel-Burning Equipment Used Today</Label>
              {equipment.map((eq, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input
                      placeholder="Equipment name"
                      value={eq.equipment_name}
                      onChange={(e) => {
                        const updated = [...equipment];
                        updated[index].equipment_name = e.target.value;
                        setEquipment(updated);
                      }}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEquipment(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={addEquipment}>
                <Plus className="h-4 w-4 mr-2" />
                Add Equipment
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Ventilation System Status</Label>
              <Select value={ventilationStatus} onValueChange={setVentilationStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ventilation status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operating_normal">Operating Normally</SelectItem>
                  <SelectItem value="operating_reduced">Operating at Reduced Capacity</SelectItem>
                  <SelectItem value="not_operating">Not Operating</SelectItem>
                  <SelectItem value="maintenance">Under Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Last Maintenance: Ice Resurfacer(s)</Label>
                <Input
                  placeholder="Date & Performed by"
                  value={resurfacerMaintenance}
                  onChange={(e) => setResurfacerMaintenance(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Maintenance: Ventilation System</Label>
                <Input
                  placeholder="Date & Performed by"
                  value={ventilationMaintenance}
                  onChange={(e) => setVentilationMaintenance(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Maintenance: Other Equipment</Label>
                <Input
                  placeholder="Date & Performed by"
                  value={otherEquipmentMaintenance}
                  onChange={(e) => setOtherEquipmentMaintenance(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2A: Routine Measurements */}
        <Card>
          <CardHeader>
            <CardTitle>Section 2: Air Quality Measurements</CardTitle>
            <CardDescription>
              A. Routine Daily/Weekly Monitoring - Minimum: Twice on weekdays, once on weekend days
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Locations: 1-Rink Level, 2-Timekeeper&apos;s Box/Seating, 3-Dressing Room, 4-Other
            </p>

            {measurements.map((m, index) => {
              const alerts = checkAlertLevels(m);
              return (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  {alerts.length > 0 && (
                    <div className="bg-destructive/10 border border-destructive rounded p-3">
                      <div className="flex gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
                        <div className="space-y-1">
                          {alerts.map((alert, i) => (
                            <p key={i} className="text-sm font-semibold text-destructive">{alert}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid gap-4 md:grid-cols-6">
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Input
                        type="time"
                        value={m.measurement_time}
                        onChange={(e) => {
                          const updated = [...measurements];
                          updated[index].measurement_time = e.target.value;
                          setMeasurements(updated);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Select
                        value={m.location}
                        onValueChange={(value) => {
                          const updated = [...measurements];
                          updated[index].location = value;
                          setMeasurements(updated);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rink_level">Rink Level</SelectItem>
                          <SelectItem value="timekeeper_box">Timekeeper&apos;s Box/Seating</SelectItem>
                          <SelectItem value="dressing_room">Dressing Room</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>CO Instant (ppm)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={m.co_instant || ""}
                        onChange={(e) => {
                          const updated = [...measurements];
                          updated[index].co_instant = parseFloat(e.target.value) || 0;
                          setMeasurements(updated);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CO 1-Hr Avg (ppm)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={m.co_one_hour_avg || ""}
                        onChange={(e) => {
                          const updated = [...measurements];
                          updated[index].co_one_hour_avg = parseFloat(e.target.value) || 0;
                          setMeasurements(updated);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>NO2 Instant (ppm)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={m.no2_instant || ""}
                        onChange={(e) => {
                          const updated = [...measurements];
                          updated[index].no2_instant = parseFloat(e.target.value) || 0;
                          setMeasurements(updated);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>NO2 1-Hr Avg (ppm)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={m.no2_one_hour_avg || ""}
                        onChange={(e) => {
                          const updated = [...measurements];
                          updated[index].no2_one_hour_avg = parseFloat(e.target.value) || 0;
                          setMeasurements(updated);
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      placeholder="Measurement notes"
                      value={m.notes}
                      onChange={(e) => {
                        const updated = [...measurements];
                        updated[index].notes = e.target.value;
                        setMeasurements(updated);
                      }}
                    />
                  </div>
                </div>
              );
            })}

            <Button variant="outline" onClick={addMeasurement}>
              <Plus className="h-4 w-4 mr-2" />
              Add Measurement
            </Button>
          </CardContent>
        </Card>

        {/* Section 2B: Post-Edging Measurements */}
        <Card>
          <CardHeader>
            <CardTitle>B. Post-Edging Monitoring</CardTitle>
            <CardDescription>
              At least once a week, 20 minutes after completion if public present
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {postEdgingMeasurements.map((m, index) => {
              const alerts = checkAlertLevels(m);
              return (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  {alerts.length > 0 && (
                    <div className="bg-destructive/10 border border-destructive rounded p-3">
                      <div className="flex gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
                        <div className="space-y-1">
                          {alerts.map((alert, i) => (
                            <p key={i} className="text-sm font-semibold text-destructive">{alert}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid gap-4 md:grid-cols-5">
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Input
                        type="time"
                        value={m.measurement_time}
                        onChange={(e) => {
                          const updated = [...postEdgingMeasurements];
                          updated[index].measurement_time = e.target.value;
                          setPostEdgingMeasurements(updated);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Location (Rink Level)</Label>
                      <Input
                        placeholder="Specify rink location"
                        value={m.location}
                        onChange={(e) => {
                          const updated = [...postEdgingMeasurements];
                          updated[index].location = e.target.value;
                          setPostEdgingMeasurements(updated);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CO Instant (ppm)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={m.co_instant || ""}
                        onChange={(e) => {
                          const updated = [...postEdgingMeasurements];
                          updated[index].co_instant = parseFloat(e.target.value) || 0;
                          setPostEdgingMeasurements(updated);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>NO2 Instant (ppm)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={m.no2_instant || ""}
                        onChange={(e) => {
                          const updated = [...postEdgingMeasurements];
                          updated[index].no2_instant = parseFloat(e.target.value) || 0;
                          setPostEdgingMeasurements(updated);
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      placeholder="Measurement notes"
                      value={m.notes}
                      onChange={(e) => {
                        const updated = [...postEdgingMeasurements];
                        updated[index].notes = e.target.value;
                        setPostEdgingMeasurements(updated);
                      }}
                    />
                  </div>
                </div>
              );
            })}

            <Button variant="outline" onClick={addPostEdgingMeasurement}>
              <Plus className="h-4 w-4 mr-2" />
              Add Post-Edging Measurement
            </Button>
          </CardContent>
        </Card>

        {/* Section 4: Additional Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Section 4: Additional Recommendations & Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Consideration for Electric Equipment</Label>
              <Select value={electricConsideration} onValueChange={setElectricConsideration}>
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="under_consideration">Under Consideration</SelectItem>
                  <SelectItem value="not_applicable">Not Applicable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="staff-trained"
                  checked={staffTrained}
                  onCheckedChange={(checked) => setStaffTrained(checked as boolean)}
                />
                <Label htmlFor="staff-trained" className="cursor-pointer">
                  Staff trained
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="public-signage"
                  checked={publicSignage}
                  onCheckedChange={(checked) => setPublicSignage(checked as boolean)}
                />
                <Label htmlFor="public-signage" className="cursor-pointer">
                  Public signage present
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Any unusual observations or complaints</Label>
              <Textarea
                placeholder="e.g., odors, symptoms reported by users"
                rows={4}
                value={unusualObservations}
                onChange={(e) => setUnusualObservations(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {facilityId && (
        <DynamicFormFields
          facilityId={facilityId}
          formType="air_quality_log"
          values={customFields}
          onChange={setCustomFields}
        />
      )}

      <div className="flex justify-end gap-4 mt-6">
        <Button
          variant="outline"
          onClick={() => saveLog("draft")}
          disabled={saving}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Draft
        </Button>
        <Button
          onClick={() => saveLog("submitted")}
          disabled={saving}
        >
          <Send className="h-4 w-4 mr-2" />
          Submit Air Quality Log
        </Button>
      </div>
    </div>
  );
}
