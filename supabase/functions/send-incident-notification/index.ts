import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface IncidentNotificationRequest {
  incidentNumber: string;
  incidentDate: string;
  incidentTime: string;
  location: string;
  incidentType: string;
  severityLevel: string;
  injuredPersonName: string;
  incidentDescription: string;
  staffName: string;
  facilityName: string;
  recipientEmails: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      });
    }

    const {
      incidentNumber,
      incidentDate,
      incidentTime,
      location,
      incidentType,
      severityLevel,
      injuredPersonName,
      incidentDescription,
      staffName,
      facilityName,
      recipientEmails,
    }: IncidentNotificationRequest = await req.json();

    console.log("Sending incident notification:", incidentNumber);

    // Format incident type and location for display
    const formatText = (text: string) => 
      text.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    const severityColor = {
      minor: "#22c55e",
      moderate: "#f59e0b",
      serious: "#ef4444",
      critical: "#dc2626"
    }[severityLevel] || "#6b7280";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Incident Report - ${incidentNumber}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">⚠️ Incident Report</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">${facilityName}</p>
          </div>

          <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid ${severityColor};">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h2 style="margin: 0; font-size: 20px; color: #111827;">Incident Details</h2>
                <span style="background: ${severityColor}; color: white; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                  ${severityLevel}
                </span>
              </div>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500; width: 40%;">Incident Number:</td>
                  <td style="padding: 8px 0; font-weight: 600; color: #111827;">${incidentNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Date & Time:</td>
                  <td style="padding: 8px 0; font-weight: 600; color: #111827;">${incidentDate} at ${incidentTime}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Location:</td>
                  <td style="padding: 8px 0; font-weight: 600; color: #111827;">${formatText(location)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Type:</td>
                  <td style="padding: 8px 0; font-weight: 600; color: #111827;">${formatText(incidentType)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Injured Person:</td>
                  <td style="padding: 8px 0; font-weight: 600; color: #111827;">${injuredPersonName}</td>
                </tr>
              </table>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
                Incident Description
              </h3>
              <p style="margin: 0; color: #4b5563; white-space: pre-wrap;">${incidentDescription}</p>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
                Reported By
              </h3>
              <p style="margin: 0; color: #4b5563; font-weight: 500;">${staffName}</p>
            </div>

            ${severityLevel === 'critical' || severityLevel === 'serious' ? `
              <div style="background: #fef2f2; border: 2px solid #fecaca; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0; color: #991b1b; font-weight: 600; font-size: 14px;">
                  🚨 This is a ${severityLevel} incident requiring immediate attention and follow-up action.
                </p>
              </div>
            ` : ''}

            <div style="text-align: center; padding: 20px 0; border-top: 2px solid #e5e7eb; margin-top: 20px;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                Please review this incident report and take appropriate action.
              </p>
              <a href="${supabaseUrl}" 
                 style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 10px;">
                View in Dashboard
              </a>
            </div>
          </div>

          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p style="margin: 0;">This is an automated notification from ${facilityName}</p>
            <p style="margin: 5px 0 0 0;">Incident Management System</p>
          </div>
        </body>
      </html>
    `;

    // Send to all recipients
    const emailPromises = recipientEmails.map(email =>
      resend.emails.send({
        from: "Incident Report <onboarding@resend.dev>",
        to: [email],
        subject: `${severityLevel === 'critical' || severityLevel === 'serious' ? '🚨 URGENT - ' : ''}Incident Report: ${incidentNumber} - ${formatText(incidentType)}`,
        html: emailHtml,
      })
    );

    const results = await Promise.all(emailPromises);
    console.log("Emails sent successfully:", results);

    return new Response(
      JSON.stringify({ success: true, emailsSent: results.length }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error sending incident notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
