import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const page = (title: string, message: string, color: string) => `
<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;font-family:Georgia,serif;background:#faf7f2;color:#3b3024;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px">
  <div style="max-width:480px;background:#fffaf0;padding:40px;border-radius:16px;border:1px solid #e8dfcf;text-align:center">
    <div style="font-size:48px;margin-bottom:12px">${color}</div>
    <h1 style="margin:0 0 12px;font-size:24px">${title}</h1>
    <p style="line-height:1.6;color:#5a4d3a;margin:0">${message}</p>
  </div>
</body></html>`;

serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return new Response(page("Invalid link", "Missing token.", "⚠️"), {
      status: 400, headers: { "Content-Type": "text/html" },
    });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: tok, error } = await admin
    .from("letter_moderation_tokens")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (error || !tok) {
    return new Response(page("Invalid link", "This moderation link is not valid.", "⚠️"), {
      status: 404, headers: { "Content-Type": "text/html" },
    });
  }

  if (tok.used_at) {
    return new Response(
      page("Already actioned", "This letter has already been moderated.", "✓"),
      { status: 200, headers: { "Content-Type": "text/html" } },
    );
  }

  const newStatus = tok.action === "approve" ? "available" : "removed";
  const { error: upErr } = await admin
    .from("letters")
    .update({ status: newStatus })
    .eq("id", tok.letter_id);
  if (upErr) {
    return new Response(page("Something went wrong", upErr.message, "⚠️"), {
      status: 500, headers: { "Content-Type": "text/html" },
    });
  }

  await admin
    .from("letter_moderation_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("token", token);

  // Invalidate the opposite token for this letter too
  await admin
    .from("letter_moderation_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("letter_id", tok.letter_id)
    .is("used_at", null);

  if (tok.action === "approve") {
    return new Response(
      page("Letter approved 💌", "It will be delivered to someone who needs it.", "✅"),
      { headers: { "Content-Type": "text/html" } },
    );
  }
  return new Response(
    page("Letter rejected", "It has been removed.", "❌"),
    { headers: { "Content-Type": "text/html" } },
  );
});
