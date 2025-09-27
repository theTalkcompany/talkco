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
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Talk</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 600;">Welcome to Talk! 🎉</h1>
            <p style="margin: 12px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Hi ${displayName}, your journey starts here!</p>
          </div>
          
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
              Welcome to Talk - your safe space for mental wellness, meaningful conversations, and personal growth.
            </p>

            <h2 style="margin: 32px 0 16px 0; color: #1f2937; font-size: 20px; font-weight: 600;">🌟 What You Can Do</h2>
            
            <div style="margin: 24px 0;">
              <div style="display: flex; align-items: flex-start; margin-bottom: 20px;">
                <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 16px; flex-shrink: 0;">
                  <span style="color: white; font-size: 18px;">💬</span>
                </div>
                <div>
                  <h3 style="margin: 0 0 6px 0; color: #1f2937; font-size: 16px; font-weight: 600;">Chat & Connect</h3>
                  <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">Join community rooms, chat with Willow (our AI companion), or connect with others in a supportive environment.</p>
                </div>
              </div>
              
              <div style="display: flex; align-items: flex-start; margin-bottom: 20px;">
                <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 16px; flex-shrink: 0;">
                  <span style="color: white; font-size: 18px;">📰</span>
                </div>
                <div>
                  <h3 style="margin: 0 0 6px 0; color: #1f2937; font-size: 16px; font-weight: 600;">Share & Explore</h3>
                  <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">Share your thoughts in the community feed, discover insights from others, and engage in meaningful discussions.</p>
                </div>
              </div>
              
              <div style="display: flex; align-items: flex-start; margin-bottom: 20px;">
                <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 16px; flex-shrink: 0;">
                  <span style="color: white; font-size: 18px;">💭</span>
                </div>
                <div>
                  <h3 style="margin: 0 0 6px 0; color: #1f2937; font-size: 16px; font-weight: 600;">Daily Inspiration</h3>
                  <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">Get motivated with daily quotes, reflections, and positive affirmations to brighten your day.</p>
                </div>
              </div>
              
              <div style="display: flex; align-items: flex-start; margin-bottom: 20px;">
                <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 16px; flex-shrink: 0;">
                  <span style="color: white; font-size: 18px;">🛡️</span>
                </div>
                <div>
                  <h3 style="margin: 0 0 6px 0; color: #1f2937; font-size: 16px; font-weight: 600;">Get Support</h3>
                  <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">Access crisis resources, connect with support networks, and find help when you need it most.</p>
                </div>
              </div>
            </div>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 32px 0;">
              <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 16px; font-weight: 600;">🚨 Crisis Support Available 24/7</h3>
              <p style="margin: 0 0 8px 0; color: #374151; font-size: 14px;">If you're in crisis, immediate help is available:</p>
              <p style="margin: 0; color: #dc2626; font-weight: 600; font-size: 16px;">Call 988 (Suicide & Crisis Lifeline)</p>
            </div>

            <p style="margin: 32px 0 16px 0; color: #374151; font-size: 16px; line-height: 1.6;">
              We're excited to have you as part of our community. Remember, taking care of your mental health is a journey, and we're here to support you every step of the way.
            </p>

            <div style="text-align: center; margin: 32px 0;">
              <a href="https://a3b3903e-b0af-4757-9c15-bc69dfbc625d.lovableproject.com" style="display: inline-block; background: linear-gradient(135deg, #667eea, #764ba2); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 16px;">Start Your Journey</a>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
            
            <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
              This is an automated message from Talk. If you didn't create this account, you can safely ignore this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const { error } = await resend.emails.send({
      from: "Talk <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to Talk - Your Mental Wellness Journey Begins!",
      html,
    });

    if (error) {
      throw error;
    }

    console.log(`Welcome email sent successfully to ${email}`);

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