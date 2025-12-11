import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ShiftNotificationRequest {
  type: "assignment" | "update" | "cancellation";
  staffEmail: string;
  staffName: string;
  shiftDetails: {
    date: string;
    startTime: string;
    endTime: string;
    role: string;
    area: string;
  };
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

const getEmailContent = (request: ShiftNotificationRequest) => {
  const { type, staffName, shiftDetails } = request;
  const formattedDate = formatDate(shiftDetails.date);
  const startTime = formatTime(shiftDetails.startTime);
  const endTime = formatTime(shiftDetails.endTime);

  const subjects = {
    assignment: "You've Been Assigned to a Shift",
    update: "Your Shift Has Been Updated",
    cancellation: "Shift Cancelled",
  };

  const messages = {
    assignment: `
      <p>Hi ${staffName},</p>
      <p>You have been assigned to a new shift:</p>
    `,
    update: `
      <p>Hi ${staffName},</p>
      <p>Your shift has been updated with the following details:</p>
    `,
    cancellation: `
      <p>Hi ${staffName},</p>
      <p>The following shift has been cancelled:</p>
    `,
  };

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .shift-details { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #667eea; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Shift Notification</h1>
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
            <p style="margin-top: 20px;">
              Please log in to the scheduling system to view more details or make any necessary changes.
            </p>
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
    const request: ShiftNotificationRequest = await req.json();
    console.log("Processing shift notification:", request);

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
    console.error("Error in send-shift-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
