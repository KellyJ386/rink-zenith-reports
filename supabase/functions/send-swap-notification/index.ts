import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SwapNotificationRequest {
  type: "requested" | "approved" | "denied";
  recipientEmail: string;
  recipientName: string;
  requesterName: string;
  shiftDetails: {
    date: string;
    startTime: string;
    endTime: string;
    role: string;
    area: string;
  };
  managerNotes?: string;
}

const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const period = hour >= 12 ? 'PM' : 'AM';
  return `${displayHour}:${minutes} ${period}`;
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

const getEmailContent = (request: SwapNotificationRequest) => {
  const { type, recipientName, requesterName, shiftDetails, managerNotes } = request;
  const formattedDate = formatDate(shiftDetails.date);
  const startTime = formatTime(shiftDetails.startTime);
  const endTime = formatTime(shiftDetails.endTime);

  const subjects = {
    requested: "Shift Swap Request",
    approved: "Shift Swap Approved ✓",
    denied: "Shift Swap Request Denied",
  };

  const messages = {
    requested: `
      <p>Hi ${recipientName},</p>
      <p><strong>${requesterName}</strong> has requested to swap the following shift with you:</p>
    `,
    approved: `
      <p>Hi ${recipientName},</p>
      <p>Great news! Your shift swap request has been approved by management.</p>
      <p><strong>You are now assigned to the following shift:</strong></p>
    `,
    denied: `
      <p>Hi ${recipientName},</p>
      <p>Unfortunately, your shift swap request has been denied by management.</p>
      <p><strong>Original shift details:</strong></p>
    `,
  };

  const statusColors = {
    requested: "#3b82f6",
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
          .shift-details { background: white; padding: 20px; border-left: 4px solid ${statusColors[type]}; margin: 20px 0; border-radius: 4px; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: ${statusColors[type]}; }
          .manager-notes { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Shift Swap Notification</h1>
          </div>
          <div class="content">
            ${messages[type]}
            <div class="shift-details">
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span>${formattedDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span>${startTime} - ${endTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Role:</span>
                <span>${shiftDetails.role}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Area:</span>
                <span>${shiftDetails.area}</span>
              </div>
            </div>
            ${managerNotes ? `
              <div class="manager-notes">
                <strong>Manager's Notes:</strong>
                <p style="margin: 10px 0 0 0;">${managerNotes}</p>
              </div>
            ` : ''}
            ${type === 'requested' ? `
              <p style="margin-top: 20px;">
                Please log in to the scheduling system to review this request. A manager will need to approve the swap before it becomes final.
              </p>
            ` : `
              <p style="margin-top: 20px;">
                Please log in to the scheduling system to view your updated schedule.
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
    const request: SwapNotificationRequest = await req.json();
    console.log("Processing swap notification:", request);

    const { subject, html } = getEmailContent(request);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Schedule Notifications <onboarding@resend.dev>",
        to: [request.recipientEmail],
        subject,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend error:", data);
      throw new Error(data.message || "Failed to send email");
    }

    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in send-swap-notification:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
