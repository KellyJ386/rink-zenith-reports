import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  measurementId: string;
  facilityId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { measurementId, facilityId }: NotificationRequest = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get measurement details
    const { data: measurement, error: measurementError } = await supabase
      .from("ice_depth_measurements")
      .select(`
        *,
        facilities (name),
        rinks (name),
        profiles (name)
      `)
      .eq("id", measurementId)
      .single();

    if (measurementError || !measurement) {
      throw new Error("Failed to fetch measurement details");
    }

    // Get notification recipients for this facility
    const { data: recipients, error: recipientsError } = await supabase
      .from("notification_recipients")
      .select("*")
      .eq("facility_id", facilityId)
      .eq("is_active", true);

    if (recipientsError) {
      throw new Error("Failed to fetch recipients");
    }

    if (!recipients || recipients.length === 0) {
      console.log("No active recipients found for this facility");
      return new Response(
        JSON.stringify({ message: "No recipients to notify" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Prepare email content
    const statusIcon = measurement.status === "critical" ? "🔴" : 
                       measurement.status === "warning" ? "⚠️" : "✅";
    
    const emailSubject = `${statusIcon} Ice Depth Measurement Alert - ${measurement.facilities.name}`;
    
    const emailHtml = `
      <h2>New Ice Depth Measurement</h2>
      <p><strong>Facility:</strong> ${measurement.facilities.name}</p>
      <p><strong>Rink:</strong> ${measurement.rinks.name}</p>
      <p><strong>Operator:</strong> ${measurement.profiles.name}</p>
      <p><strong>Date:</strong> ${new Date(measurement.measurement_date).toLocaleString()}</p>
      <p><strong>Status:</strong> ${measurement.status.toUpperCase()}</p>
      
      <h3>Measurements Summary</h3>
      <ul>
        <li><strong>Minimum Depth:</strong> ${measurement.min_depth}" </li>
        <li><strong>Maximum Depth:</strong> ${measurement.max_depth}" </li>
        <li><strong>Average Depth:</strong> ${measurement.avg_depth}" </li>
        <li><strong>Standard Deviation:</strong> ${measurement.std_deviation}" </li>
      </ul>
      
      ${measurement.status !== "good" ? `
        <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin-top: 20px;">
          <strong>⚠️ Action Required:</strong><br/>
          This measurement has been flagged as ${measurement.status}. Please review and take appropriate action.
        </div>
      ` : ""}
    `;

    // Send emails to all recipients using Resend API
    const emailPromises = recipients
      .filter(r => r.email)
      .map(async (recipient) => {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Ice Depth Alert <onboarding@resend.dev>",
            to: [recipient.email],
            subject: emailSubject,
            html: emailHtml,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to send email to ${recipient.email}`);
        }
        
        return response.json();
      });

    const results = await Promise.allSettled(emailPromises);
    
    const successCount = results.filter(r => r.status === "fulfilled").length;
    const failureCount = results.filter(r => r.status === "rejected").length;

    console.log(`Notifications sent: ${successCount} succeeded, ${failureCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount,
        failed: failureCount 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-ice-depth-notification:", error);
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
