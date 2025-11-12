import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";
import BodyDiagramSelector from "@/components/incident/BodyDiagramSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Send, CheckCircle, FileText, Clock } from "lucide-react";
import { format } from "date-fns";

export default function IncidentReport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [facilityId, setFacilityId] = useState("");
  const [facilityName, setFacilityName] = useState("Main Arena");
  
  const currentDate = format(new Date(), "yyyy-MM-dd");
  const currentTime = format(new Date(), "HH:mm");
  const [incidentNumber, setIncidentNumber] = useState("");

  // Auto-populated staff info
  const [staffName, setStaffName] = useState("");
  const [staffPosition, setStaffPosition] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [staffEmail, setStaffEmail] = useState("");

  // Incident details
  const [incidentDate, setIncidentDate] = useState("");
  const [incidentTime, setIncidentTime] = useState("");
  const [location, setLocation] = useState("");
  const [activityAtTime, setActivityAtTime] = useState("");
  const [incidentType, setIncidentType] = useState("");
  const [severityLevel, setSeverityLevel] = useState("");

  // Injured person info
  const [injuredName, setInjuredName] = useState("");
  const [injuredAge, setInjuredAge] = useState("");
  const [injuredGender, setInjuredGender] = useState("prefer_not_to_say");
  const [injuredPhone, setInjuredPhone] = useState("");
  const [injuredEmail, setInjuredEmail] = useState("");
  const [injuredAddress, setInjuredAddress] = useState("");
  const [injuryLocations, setInjuryLocations] = useState<string[]>([]);
  const [additionalInjuryDetails, setAdditionalInjuryDetails] = useState("");

  // Incident description
  const [incidentDescription, setIncidentDescription] = useState("");
  const [immediateActionTaken, setImmediateActionTaken] = useState("");

  // Witness info
  const [witnessName, setWitnessName] = useState("");
  const [witnessPhone, setWitnessPhone] = useState("");
  const [witnessEmail, setWitnessEmail] = useState("");

  // Medical info
  const [medicalAttentionRequired, setMedicalAttentionRequired] = useState("");
  const [medicalFacility, setMedicalFacility] = useState("");
  const [ambulanceCalled, setAmbulanceCalled] = useState(false);

  // Additional notes
  const [additionalNotes, setAdditionalNotes] = useState("");

  useEffect(() => {
    checkAuth();
    generateIncidentNumber();
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
        const userName = profile.name || user.email || "";
        setStaffName(userName);
        setStaffEmail(user.email || "");
        
        if (profile.facility_id) {
          setFacilityId(profile.facility_id);
          const facilityData = profile.facilities as any;
          setFacilityName(facilityData?.name || "Main Arena");
        }

        // Get user role for position
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();
        
        setStaffPosition(roleData?.role || "staff");
      }
    } catch (error) {
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateIncidentNumber = () => {
    const timestamp = Date.now();
    setIncidentNumber(`IR-${timestamp}`);
  };

  const validateForm = () => {
    if (!incidentDate || !incidentTime || !location || !activityAtTime) {
      toast({ title: "Missing Required Fields", description: "Please fill in all incident details", variant: "destructive" });
      return false;
    }
    if (!incidentType || !severityLevel) {
      toast({ title: "Missing Required Fields", description: "Please select incident type and severity", variant: "destructive" });
      return false;
    }
    if (!injuredName) {
      toast({ title: "Missing Required Fields", description: "Please enter injured person's name", variant: "destructive" });
      return false;
    }
    if (!incidentDescription || !immediateActionTaken) {
      toast({ title: "Missing Required Fields", description: "Please provide incident description and immediate actions taken", variant: "destructive" });
      return false;
    }
    if (!medicalAttentionRequired) {
      toast({ title: "Missing Required Fields", description: "Please indicate if medical attention was required", variant: "destructive" });
      return false;
    }
    return true;
  };

  const submitReport = async () => {
    if (!validateForm() || !user || !facilityId) return;

    setSaving(true);
    try {
      const { data: insertedIncident, error } = await supabase.from("incidents").insert({
        incident_number: incidentNumber,
        facility_id: facilityId,
        report_date: currentDate,
        report_time: currentTime,
        incident_date: incidentDate,
        incident_time: incidentTime,
        location,
        activity_at_time: activityAtTime,
        incident_type: incidentType,
        severity_level: severityLevel,
        injured_person_name: injuredName,
        injured_person_age: injuredAge ? parseInt(injuredAge) : null,
        injured_person_gender: injuredGender,
        injured_person_phone: injuredPhone,
        injured_person_email: injuredEmail,
        injured_person_address: injuredAddress,
        injury_locations: injuryLocations,
        additional_injury_details: additionalInjuryDetails,
        incident_description: incidentDescription,
        immediate_action_taken: immediateActionTaken,
        witness_name: witnessName,
        witness_phone: witnessPhone,
        witness_email: witnessEmail,
        medical_attention_required: medicalAttentionRequired,
        medical_facility_name: medicalFacility,
        ambulance_called: ambulanceCalled,
        staff_name: staffName,
        staff_position: staffPosition,
        staff_phone: staffPhone,
        staff_email: staffEmail,
        staff_id: user.id,
        additional_notes: additionalNotes,
        status: "submitted"
      }).select().single();

      if (error) throw error;

      // Send email notification
      try {
        const emailResponse = await supabase.functions.invoke("send-incident-notification", {
          body: {
            incidentNumber,
            incidentDate,
            incidentTime,
            location,
            incidentType,
            severityLevel,
            injuredPersonName: injuredName,
            incidentDescription,
            staffName,
            facilityName,
            recipientEmails: [staffEmail] // Add management emails here
          }
        });

        if (emailResponse.error) {
          console.error("Email notification error:", emailResponse.error);
        }
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
      }

      toast({
        title: "Incident Report Submitted",
        description: `Report ${incidentNumber} has been successfully submitted and notifications sent`
      });

      navigate("/admin/incidents");
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
    <div className="container mx-auto p-6 max-w-6xl">
      <PageHeader
        title="Report Incident"
        subtitle="Complete this form immediately following any incident"
        icon={<AlertCircle className="h-8 w-8 text-destructive" />}
        actions={
          <Button variant="outline" onClick={() => navigate("/admin/incidents")}>
            <FileText className="h-4 w-4 mr-2" />
            Incident History
          </Button>
        }
      />

      <Tabs defaultValue="report" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="report">Report New Incident</TabsTrigger>
          <TabsTrigger value="history" onClick={() => navigate("/admin/incidents")}>
            Incident History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="report" className="space-y-6">
          {/* Auto-populated Report Information */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Report Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label className="text-muted-foreground">Facility Name</Label>
                  <p className="text-lg font-semibold">{facilityName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Incident ID</Label>
                  <p className="text-lg font-semibold text-primary">{incidentNumber}</p>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Report Date & Time</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-lg font-semibold">{format(new Date(), "MM/dd/yyyy")}</p>
                    <p className="text-lg font-semibold">{format(new Date(), "hh:mm a")}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Incident Details */}
          <Card>
            <CardHeader>
              <CardTitle>Incident Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Incident Date *</Label>
                  <Input
                    type="date"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Incident Time *</Label>
                  <Input
                    type="time"
                    value={incidentTime}
                    onChange={(e) => setIncidentTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Location *</Label>
                <Select value={location} onValueChange={setLocation} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rink_ice_surface">Rink - Ice Surface</SelectItem>
                    <SelectItem value="rink_bench">Rink - Player Bench</SelectItem>
                    <SelectItem value="rink_penalty_box">Rink - Penalty Box</SelectItem>
                    <SelectItem value="locker_room">Locker Room</SelectItem>
                    <SelectItem value="lobby">Lobby</SelectItem>
                    <SelectItem value="concession">Concession Area</SelectItem>
                    <SelectItem value="parking_lot">Parking Lot</SelectItem>
                    <SelectItem value="spectator_seating">Spectator Seating</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Activity at Time of Incident *</Label>
                <Textarea
                  placeholder="Describe activity..."
                  value={activityAtTime}
                  onChange={(e) => setActivityAtTime(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Type of Incident *</Label>
                  <Select value={incidentType} onValueChange={setIncidentType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select incident type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slip_fall">Slip/Fall</SelectItem>
                      <SelectItem value="collision">Collision</SelectItem>
                      <SelectItem value="equipment">Equipment Related</SelectItem>
                      <SelectItem value="medical_emergency">Medical Emergency</SelectItem>
                      <SelectItem value="property_damage">Property Damage</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Severity Level *</Label>
                  <Select value={severityLevel} onValueChange={setSeverityLevel} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minor">Minor</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="serious">Serious</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Injured Person Information */}
          <Card>
            <CardHeader>
              <CardTitle>Injured Person Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input
                    value={injuredName}
                    onChange={(e) => setInjuredName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Age *</Label>
                  <Input
                    type="number"
                    value={injuredAge}
                    onChange={(e) => setInjuredAge(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={injuredGender} onValueChange={setInjuredGender}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Phone Number *</Label>
                  <Input
                    type="tel"
                    value={injuredPhone}
                    onChange={(e) => setInjuredPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={injuredEmail}
                    onChange={(e) => setInjuredEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={injuredAddress}
                  onChange={(e) => setInjuredAddress(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Body Diagram */}
          <BodyDiagramSelector
            selectedParts={injuryLocations}
            onPartsChange={setInjuryLocations}
          />

          <Card>
            <CardHeader>
              <CardTitle>Additional Injury Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Describe any other details about the injuries..."
                value={additionalInjuryDetails}
                onChange={(e) => setAdditionalInjuryDetails(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Incident Description */}
          <Card>
            <CardHeader>
              <CardTitle>Incident Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Detailed Description of Incident *</Label>
                <Textarea
                  placeholder="Describe what happened, including circumstances leading to the incident..."
                  value={incidentDescription}
                  onChange={(e) => setIncidentDescription(e.target.value)}
                  rows={5}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Immediate Action Taken *</Label>
                <Textarea
                  placeholder="Describe first aid, medical attention, or other immediate actions taken..."
                  value={immediateActionTaken}
                  onChange={(e) => setImmediateActionTaken(e.target.value)}
                  rows={4}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Witness Information */}
          <Card>
            <CardHeader>
              <CardTitle>Witness Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Witness Name</Label>
                  <Input
                    value={witnessName}
                    onChange={(e) => setWitnessName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Witness Phone</Label>
                  <Input
                    type="tel"
                    value={witnessPhone}
                    onChange={(e) => setWitnessPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Witness Email</Label>
                  <Input
                    type="email"
                    value={witnessEmail}
                    onChange={(e) => setWitnessEmail(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical Information */}
          <Card>
            <CardHeader>
              <CardTitle>Medical Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Medical Attention Required *</Label>
                <Select value={medicalAttentionRequired} onValueChange={setMedicalAttentionRequired} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No medical attention needed</SelectItem>
                    <SelectItem value="first_aid">First aid provided on site</SelectItem>
                    <SelectItem value="transported_hospital">Transported to hospital</SelectItem>
                    <SelectItem value="ambulance">Ambulance called</SelectItem>
                    <SelectItem value="refused">Refused medical attention</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(medicalAttentionRequired === "transported_hospital" || medicalAttentionRequired === "ambulance") && (
                <div className="space-y-2">
                  <Label>Medical Facility Name</Label>
                  <Input
                    value={medicalFacility}
                    onChange={(e) => setMedicalFacility(e.target.value)}
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ambulance"
                  checked={ambulanceCalled}
                  onCheckedChange={(checked) => setAmbulanceCalled(checked as boolean)}
                />
                <Label htmlFor="ambulance" className="cursor-pointer">
                  Ambulance was called
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Report Completed By */}
          <Card className="bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Report Completed By
              </CardTitle>
              <CardDescription>✓ Staff information pre-populated from your login</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Staff Name *</Label>
                  <Input
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Position/Title *</Label>
                  <Input
                    value={staffPosition}
                    onChange={(e) => setStaffPosition(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Staff Phone *</Label>
                  <Input
                    type="tel"
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Staff Email *</Label>
                  <Input
                    type="email"
                    value={staffEmail}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Staff ID: {user?.id} | Logged in at: {format(new Date(), "h:mm:ss a")}
              </p>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Any additional information relevant to this incident..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={submitReport}
              disabled={saving}
              size="lg"
            >
              <Send className="h-4 w-4 mr-2" />
              Submit Incident Report
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
