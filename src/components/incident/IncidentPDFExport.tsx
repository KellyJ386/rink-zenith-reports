import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface IncidentData {
  incident_number: string;
  facility_name: string;
  report_date: string;
  report_time: string;
  incident_date: string;
  incident_time: string;
  location: string;
  activity_at_time: string;
  incident_type: string;
  severity_level: string;
  injured_person_name: string;
  injured_person_age: number;
  injured_person_gender: string;
  injured_person_phone: string;
  injured_person_email: string;
  injured_person_address: string;
  injury_locations: string[];
  additional_injury_details: string;
  incident_description: string;
  immediate_action_taken: string;
  witness_name: string;
  witness_phone: string;
  witness_email: string;
  medical_attention_required: string;
  medical_facility_name: string;
  ambulance_called: boolean;
  staff_name: string;
  staff_position: string;
  staff_phone: string;
  staff_email: string;
  additional_notes: string;
}

interface IncidentPDFExportProps {
  incident: IncidentData;
}

export default function IncidentPDFExport({ incident }: IncidentPDFExportProps) {
  const formatText = (text: string) =>
    text.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

  const getSeverityColor = (severity: string) => {
    const colors = {
      minor: "bg-green-100 text-green-800 border-green-300",
      moderate: "bg-yellow-100 text-yellow-800 border-yellow-300",
      serious: "bg-orange-100 text-orange-800 border-orange-300",
      critical: "bg-red-100 text-red-800 border-red-300",
    };
    return colors[severity as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <div id="incident-pdf-content" className="bg-white text-black p-8 max-w-4xl mx-auto print:p-0">
      <style>
        {`
          @media print {
            @page { size: A4; margin: 1cm; }
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .no-print { display: none !important; }
            .page-break { page-break-before: always; }
          }
        `}
      </style>

      {/* Header */}
      <div className="text-center mb-8 pb-6 border-b-4 border-red-600">
        <h1 className="text-3xl font-bold text-red-600 mb-2">INCIDENT REPORT</h1>
        <p className="text-xl font-semibold">{incident.facility_name}</p>
        <div className="mt-4 flex justify-center gap-4">
          <div className="text-sm">
            <span className="font-semibold">Report ID:</span> {incident.incident_number}
          </div>
          <div className="text-sm">
            <span className="font-semibold">Date:</span> {format(new Date(incident.report_date), "MMM dd, yyyy")}
          </div>
          <div className="text-sm">
            <span className="font-semibold">Time:</span> {incident.report_time}
          </div>
        </div>
      </div>

      {/* Incident Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2">
        <h2 className="text-xl font-bold mb-4 text-gray-800">INCIDENT SUMMARY</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 font-semibold">Severity Level</p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold border ${getSeverityColor(incident.severity_level)}`}>
              {incident.severity_level.toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-semibold">Incident Type</p>
            <p className="font-medium">{formatText(incident.incident_type)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-semibold">Date of Incident</p>
            <p className="font-medium">{format(new Date(incident.incident_date), "MMMM dd, yyyy")}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-semibold">Time of Incident</p>
            <p className="font-medium">{incident.incident_time}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-semibold">Location</p>
            <p className="font-medium">{formatText(incident.location)}</p>
          </div>
        </div>
      </div>

      {/* Injured Person Information */}
      <div className="mb-6 p-4 border-2 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-gray-800">INJURED PERSON INFORMATION</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 font-semibold">Full Name</p>
            <p className="font-medium">{incident.injured_person_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-semibold">Age</p>
            <p className="font-medium">{incident.injured_person_age}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-semibold">Gender</p>
            <p className="font-medium">{formatText(incident.injured_person_gender)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-semibold">Phone</p>
            <p className="font-medium">{incident.injured_person_phone}</p>
          </div>
          {incident.injured_person_email && (
            <div>
              <p className="text-sm text-gray-600 font-semibold">Email</p>
              <p className="font-medium">{incident.injured_person_email}</p>
            </div>
          )}
          {incident.injured_person_address && (
            <div className="col-span-2">
              <p className="text-sm text-gray-600 font-semibold">Address</p>
              <p className="font-medium">{incident.injured_person_address}</p>
            </div>
          )}
        </div>
      </div>

      {/* Injury Locations */}
      {incident.injury_locations && incident.injury_locations.length > 0 && (
        <div className="mb-6 p-4 border-2 rounded-lg">
          <h2 className="text-xl font-bold mb-4 text-gray-800">INJURY LOCATIONS</h2>
          <div className="flex flex-wrap gap-2">
            {incident.injury_locations.map((location) => (
              <span
                key={location}
                className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium border border-red-300"
              >
                {formatText(location)}
              </span>
            ))}
          </div>
          {incident.additional_injury_details && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 font-semibold mb-2">Additional Details</p>
              <p className="text-sm whitespace-pre-wrap">{incident.additional_injury_details}</p>
            </div>
          )}
        </div>
      )}

      <div className="page-break"></div>

      {/* Incident Description */}
      <div className="mb-6 p-4 border-2 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-gray-800">INCIDENT DESCRIPTION</h2>
        <div className="mb-4">
          <p className="text-sm text-gray-600 font-semibold mb-2">Activity at Time of Incident</p>
          <p className="text-sm whitespace-pre-wrap">{incident.activity_at_time}</p>
        </div>
        <div className="mb-4">
          <p className="text-sm text-gray-600 font-semibold mb-2">Detailed Description</p>
          <p className="text-sm whitespace-pre-wrap">{incident.incident_description}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 font-semibold mb-2">Immediate Action Taken</p>
          <p className="text-sm whitespace-pre-wrap">{incident.immediate_action_taken}</p>
        </div>
      </div>

      {/* Witness Information */}
      {incident.witness_name && (
        <div className="mb-6 p-4 border-2 rounded-lg">
          <h2 className="text-xl font-bold mb-4 text-gray-800">WITNESS INFORMATION</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 font-semibold">Name</p>
              <p className="font-medium">{incident.witness_name}</p>
            </div>
            {incident.witness_phone && (
              <div>
                <p className="text-sm text-gray-600 font-semibold">Phone</p>
                <p className="font-medium">{incident.witness_phone}</p>
              </div>
            )}
            {incident.witness_email && (
              <div>
                <p className="text-sm text-gray-600 font-semibold">Email</p>
                <p className="font-medium">{incident.witness_email}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Medical Information */}
      <div className="mb-6 p-4 border-2 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-gray-800">MEDICAL INFORMATION</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600 font-semibold">Medical Attention Required</p>
            <p className="font-medium">{formatText(incident.medical_attention_required)}</p>
          </div>
          {incident.medical_facility_name && (
            <div>
              <p className="text-sm text-gray-600 font-semibold">Medical Facility</p>
              <p className="font-medium">{incident.medical_facility_name}</p>
            </div>
          )}
          {incident.ambulance_called && (
            <div className="bg-yellow-50 p-3 rounded border border-yellow-300">
              <p className="text-sm font-bold text-yellow-800">🚑 Ambulance was called</p>
            </div>
          )}
        </div>
      </div>

      {/* Report Completed By */}
      <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-gray-800">REPORT COMPLETED BY</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 font-semibold">Staff Name</p>
            <p className="font-medium">{incident.staff_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-semibold">Position</p>
            <p className="font-medium">{incident.staff_position}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-semibold">Phone</p>
            <p className="font-medium">{incident.staff_phone}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-semibold">Email</p>
            <p className="font-medium">{incident.staff_email}</p>
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      {incident.additional_notes && (
        <div className="mb-6 p-4 border-2 rounded-lg">
          <h2 className="text-xl font-bold mb-4 text-gray-800">ADDITIONAL NOTES</h2>
          <p className="text-sm whitespace-pre-wrap">{incident.additional_notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-6 border-t-2 text-center text-sm text-gray-600">
        <p className="mb-2">
          This incident report was generated on {format(new Date(), "MMMM dd, yyyy 'at' h:mm a")}
        </p>
        <p className="font-semibold">{incident.facility_name} - Incident Management System</p>
        <p className="mt-4 text-xs">
          This document contains confidential information. Handle according to facility privacy policies.
        </p>
      </div>
    </div>
  );
}
