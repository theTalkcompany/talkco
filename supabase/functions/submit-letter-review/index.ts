import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const REVIEWER_EMAIL = "talkco@outlook.com";
const FROM = "Talk Letters <letters@thetalkcompany.co.uk>";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY missing");

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (!claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { letterId } = await req.json();
    if (!letterId || typeof letterId !== "string") {
      return new Response(JSON.stringify({ error: "letterId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: letter, error: letterErr } = await admin
      .from("letters").select("*").eq("id", letterId).single();
    if (letterErr || !letter) throw letterErr ?? new Error("Letter not found");
    if (letter.author_id !== claims.claims.sub) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create approve/reject tokens
    const approveToken = crypto.randomUUID() + "-" + crypto.randomUUID();
    const rejectToken = crypto.randomUUID() + "-" + crypto.randomUUID();
    await admin.from("letter_moderation_tokens").insert([
      { letter_id: letter.id, token: approveToken, action: "approve" },
      { letter_id: letter.id, token: rejectToken, action: "reject" },
    ]);

    const base = `${SUPABASE_URL}/functions/v1/moderate-letter`;
    const approveUrl = `${base}?token=${approveToken}`;
    const rejectUrl = `${base}?token=${rejectToken}`;

    const flagged = (letter.flagged_keywords ?? []).length > 0;
    const submittedAt = new Date(letter.created_at).toLocaleString("en-GB", { timeZone: "UTC" }) + " UTC";

    const escape = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const banner = flagged ? `
      <div style="background:#fee2e2;border:2px solid #dc2626;color:#7f1d1d;padding:14px;border-radius:8px;margin-bottom:18px;font-family:system-ui,sans-serif">
        <strong>🚨 Auto-flagged for crisis language:</strong> ${escape((letter.flagged_keywords ?? []).join(", "))}
      </div>` : "";

    const html = `
<!doctype html><html><body style="background:#faf7f2;padding:24px;font-family:Georgia,serif;color:#3b3024">
  <div style="max-width:600px;margin:0 auto;background:#fffaf0;border:1px solid #e8dfcf;border-radius:12px;padding:28px">
    ${banner}
    <h2 style="margin-top:0">💌 New Letter to Approve</h2>
    <p style="color:#766857;font-size:13px;margin:0 0 18px">${letter.word_count ?? 0} words · submitted ${escape(submittedAt)}</p>
    <div style="background:#fff;padding:20px;border-radius:8px;border:1px solid #ece3d0;white-space:pre-wrap;line-height:1.6;font-size:16px">
      <p style="margin:0 0 10px"><strong>${escape(letter.opening)}</strong></p>
      <p style="margin:0 0 10px">${escape(letter.body)}</p>
      ${letter.closing ? `<p style="margin:0">${escape(letter.closing)}</p>` : ""}
    </div>
    <div style="margin-top:28px;text-align:center">
      <a href="${approveUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:14px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:6px">✅ Approve this letter</a>
      <a href="${rejectUrl}" style="display:inline-block;background:#dc2626;color:#fff;padding:14px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:6px">❌ Reject this letter</a>
    </div>
    <p style="color:#999;font-size:12px;margin-top:24px;text-align:center">Each link is one-time use.</p>
  </div>
</body></html>`;

    const resend = new Resend(RESEND_API_KEY);

    await resend.emails.send({
      from: FROM,
      to: [REVIEWER_EMAIL],
      subject: flagged
        ? "🚨 Crisis-flagged letter needs review — Talk"
        : "💌 New Letter to Approve — Talk",
      html,
    });

    // Confirmation to writer
    const { data: userRow } = await admin.auth.admin.getUserById(letter.author_id);
    const writerEmail = userRow?.user?.email;
    if (writerEmail) {
      await resend.emails.send({
        from: FROM,
        to: [writerEmail],
        subject: "Your letter has been sealed 💌",
        html: `<div style="font-family:Georgia,serif;color:#3b3024;background:#faf7f2;padding:32px">
          <div style="max-width:480px;margin:0 auto;background:#fffaf0;padding:28px;border-radius:12px;border:1px solid #e8dfcf">
            <h2 style="margin-top:0">Your letter has been sealed 💌</h2>
            <p style="line-height:1.6">We'll review it shortly and once approved it will find its way to someone who needs it.</p>
            <p style="line-height:1.6;color:#766857">Thank you for taking the time to write.</p>
          </div>
        </div>`,
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("submit-letter-review error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
