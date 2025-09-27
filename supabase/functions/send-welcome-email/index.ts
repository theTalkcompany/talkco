import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeRequest {
  email: string;
  name?: string;
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const { email, name }: WelcomeRequest = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Missing 'email'" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const displayName = name && name.trim().length > 0 ? name.trim() : email.split("@")[0];

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111">
        <h1 style="margin-bottom: 8px;">Welcome to Talk, ${displayName}! 🎉</h1>
        <p style="margin: 0 0 16px 0; color: #444;">Your signup was successful.</p>

        <h2 style="margin: 24px 0 8px;">What is Talk?</h2>
        <p style="margin: 0 0 12px 0; color: #444;">
          Talk is your space to reflect, chat, and learn. Explore the Feed for insights,
          start a private Chat to journal your thoughts, and browse Quotes for daily motivation.
        </p>

        <h2 style="margin: 24px 0 8px;">What you can do</h2>
        <ul style="margin: 0 0 16px 20px; color: #444;">
          <li>Sign in securely and manage your profile</li>
          <li>Join the conversation in Chat</li>
          <li>Get inspired in Quotes</li>
          <li>Stay up-to-date via the Feed</li>
        </ul>

        <p style="margin-top: 24px; color: #444;">We’re excited to have you with us. If you didn’t create this account, you can safely ignore this email.</p>

        <p style="margin-top: 24px; color: #777; font-size: 12px;">This is an automated message from Talk.</p>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: "Talk <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to Talk!",
      html,
    });

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error("send-welcome-email error:", err);
    return new Response(JSON.stringify({ error: err?.message || "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
