import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TimeOffNotificationRequest {
  type: "submitted" | "approved" | "denied";
  staffEmail: string;
  staffName: string;
  requestDetails: {
    startDate: string;
    endDate: string;
    requestType: string;
    reason?: string;
  };
  managerResponse?: string;
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

const getRequestTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    vacation: 'Vacation',
    sick: 'Sick Leave',
    personal: 'Personal Day',
    unpaid: 'Unpaid Leave',
    other: 'Other',
  };
  return labels[type] || type;
};

const getEmailContent = (request: TimeOffNotificationRequest) => {
  const { type, staffName, requestDetails, managerResponse } = request;
  const startDate = formatDate(requestDetails.startDate);
  const endDate = formatDate(requestDetails.endDate);
  const requestType = getRequestTypeLabel(requestDetails.requestType);

  const subjects = {
    submitted: "Time Off Request Submitted",
    approved: "Time Off Request Approved ✓",
    denied: "Time Off Request Denied",
  };

  const messages = {
    submitted: `
      <p>Hi ${staffName},</p>
      <p>Your time off request has been submitted successfully and is pending manager approval.</p>
    `,
    approved: `
      <p>Hi ${staffName},</p>
      <p>Great news! Your time off request has been approved.</p>
    `,
    denied: `
      <p>Hi ${staffName},</p>
      <p>Unfortunately, your time off request has been denied.</p>
    `,
  };

  const statusColors = {
    submitted: "#3b82f6",
    approved: "#10b981",
    denied: "#ef4444",
  };

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, ${statusColors[type]} 0%, ${statusColors[type]}dd 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .request-details { background: white; padding: 20px; border-left: 4px solid ${statusColors[type]}; margin: 20px 0; border-radius: 4px; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: ${statusColors[type]}; }
          .reason-box { background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .manager-response { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Time Off Request</h1>
          </div>
          <div class="content">
            ${messages[type]}
            <div class="request-details">
              <div class="detail-row">
                <span class="detail-label">Request Type:</span>
                <span>${requestType}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Start Date:</span>
                <span>${startDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">End Date:</span>
                <span>${endDate}</span>
              </div>
            </div>
            ${requestDetails.reason ? `
              <div class="reason-box">
                <strong>Your Reason:</strong>
                <p style="margin: 10px 0 0 0;">${requestDetails.reason}</p>
              </div>
            ` : ''}
            ${managerResponse ? `
              <div class="manager-response">
                <strong>Manager's Response:</strong>
                <p style="margin: 10px 0 0 0;">${managerResponse}</p>
              </div>
            ` : ''}
            ${type === 'submitted' ? `
              <p style="margin-top: 20px;">
                You will receive another notification once a manager has reviewed your request.
              </p>
            ` : `
              <p style="margin-top: 20px;">
                Please log in to the scheduling system to view your updated schedule${type === 'approved' ? ' with your approved time off' : ''}.
              </p>
            `}
          </div>
          <div class="footer">
            <p>This is an automated notification from your scheduling system.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return { subject: subjects[type], html };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: TimeOffNotificationRequest = await req.json();
    console.log("Processing time off notification:", request);

    const { subject, html } = getEmailContent(request);

    const { data, error } = await resend.emails.send({
      from: "Schedule Notifications <onboarding@resend.dev>",
      to: [request.staffEmail],
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      throw error;
    }

    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in send-timeoff-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
