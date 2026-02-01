import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";
import { isValidEmail, escapeHtmlForEmail } from "../_shared/email-validation.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await authSupabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      });
    }

    const { measurementId, facilityId }: NotificationRequest = await req.json();

    // Initialize Supabase client with service role for database access
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get measurement details
    const { data: measurement, error: measurementError } = await supabase
      .from("ice_depth_measurements")
      .select(`
        *,
        facilities (name),
        rinks (name)
      `)
      .eq("id", measurementId)
      .single();

    if (measurementError || !measurement) {
      console.error("Measurement fetch error:", measurementError);
      throw new Error("Failed to fetch measurement details");
    }

    // Get operator name separately
    const { data: operatorProfile } = await supabase
      .from("profiles")
      .select("name")
      .eq("user_id", measurement.operator_id)
      .maybeSingle();

    const operatorName = operatorProfile?.name || "Unknown Operator";

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

    // Prepare email content with sanitized values
    const safeFacilityName = escapeHtmlForEmail(measurement.facilities.name);
    const safeRinkName = escapeHtmlForEmail(measurement.rinks.name);
    const safeOperatorName = escapeHtmlForEmail(operatorName);
    const safeStatus = escapeHtmlForEmail(measurement.status);

    const statusIcon = measurement.status === "critical" ? "🔴" : 
                       measurement.status === "warning" ? "⚠️" : "✅";
    
    const emailSubject = `${statusIcon} Ice Depth Measurement Alert - ${safeFacilityName}`;
    
    const emailHtml = `
      <h2>New Ice Depth Measurement</h2>
      <p><strong>Facility:</strong> ${safeFacilityName}</p>
      <p><strong>Rink:</strong> ${safeRinkName}</p>
      <p><strong>Operator:</strong> ${safeOperatorName}</p>
      <p><strong>Date:</strong> ${new Date(measurement.measurement_date).toLocaleString()}</p>
      <p><strong>Status:</strong> ${safeStatus.toUpperCase()}</p>
      
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
          This measurement has been flagged as ${safeStatus}. Please review and take appropriate action.
        </div>
      ` : ""}
    `;

    // Send emails to all recipients using Resend API, filtering invalid emails
    const validRecipients = recipients.filter(r => r.email && isValidEmail(r.email));
    
    if (validRecipients.length === 0) {
      console.log("No valid recipient emails found");
      return new Response(
        JSON.stringify({ message: "No valid recipient emails to notify" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const emailPromises = validRecipients.map(async (recipient) => {
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
