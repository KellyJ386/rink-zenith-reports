import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SignupRequest {
  name: string;
  email: string;
  facilityName: string;
  phone: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, facilityName, phone }: SignupRequest = await req.json();

    if (!name || !email || !facilityName) {
      throw new Error("Missing required fields");
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email address");
    }

    // Sanitize inputs
    const sanitize = (str: string) =>
      str.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c] || c));

    const safeName = sanitize(name.slice(0, 100));
    const safeEmail = sanitize(email.slice(0, 255));
    const safeFacility = sanitize(facilityName.slice(0, 200));
    const safePhone = sanitize((phone || "Not provided").slice(0, 30));

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const notificationEmail = Deno.env.get("SIGNUP_NOTIFICATION_EMAIL");

    if (!notificationEmail) {
      throw new Error("Notification email not configured");
    }

    const emailResponse = await resend.emails.send({
      from: "Rink Reports <onboarding@resend.dev>",
      to: [notificationEmail],
      subject: `New Sign Up Interest: ${safeName} - ${safeFacility}`,
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px;">
          <div style="background: linear-gradient(135deg, #002244, #69BE28); padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🏒 New Sign Up Interest</h1>
          </div>
          <div style="background: white; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #334155;">Name</td><td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #475569;">${safeName}</td></tr>
              <tr><td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #334155;">Email</td><td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #475569;"><a href="mailto:${safeEmail}">${safeEmail}</a></td></tr>
              <tr><td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #334155;">Facility</td><td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #475569;">${safeFacility}</td></tr>
              <tr><td style="padding: 12px 0; font-weight: 600; color: #334155;">Phone</td><td style="padding: 12px 0; color: #475569;">${safePhone}</td></tr>
            </table>
            <p style="margin-top: 20px; color: #94a3b8; font-size: 12px;">Submitted at ${new Date().toISOString()}</p>
          </div>
        </div>
      `,
    });

    console.log("Signup notification sent:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-signup-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
