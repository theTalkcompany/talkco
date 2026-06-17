import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

/* ────────── Styled HTML page helper ────────── */
const page = (title: string, message: string, icon: string, tone: "purple" | "red") => {
  const primary = tone === "purple" ? "#7C3AED" : "#DC2626";
  const primaryLight = tone === "purple" ? "#F3E8FF" : "#FEE2E2";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — Talk</title>
<style>
*{box-sizing:border-box}
body{margin:0;font-family:'Manrope',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#FAF5FF;color:#1E1B4B;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
.card{max-width:460px;width:100%;background:#fff;padding:48px 36px;border-radius:20px;text-align:center;box-shadow:0 20px 60px -20px rgba(124,58,237,.18),0 1px 3px rgba(0,0,0,.06)}
.icon{width:72px;height:72px;margin:0 auto 20px;background:${primaryLight};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:32px;line-height:1}
h1{margin:0 0 12px;font-size:22px;font-weight:700;color:#1E1B4B}
p{margin:0;font-size:16px;line-height:1.6;color:#4C4B6E}
.brand{margin-top:28px;font-size:13px;font-weight:600;color:${primary};letter-spacing:.05em;text-transform:uppercase}
</style>
</head>
<body>
<div class="card">
<div class="icon">${icon}</div>
<h1>${title}</h1>
${message ? `<p>${message}</p>` : ""}
<div class="brand">Talk</div>
</div>
</body>
</html>`;
};

const htmlResponse = (body: string, status = 200) => {
  const headers = new Headers();
  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Headers", "authorization, x-client-info, apikey, content-type");
  headers.set("Cache-Control", "no-store");
  return new Response(body, { status, headers });
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return htmlResponse(page("Invalid link", "Missing token.", "⚠️", "red"), 200);
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
    return htmlResponse(page("Invalid link", "This moderation link is not valid.", "⚠️", "red"), 200);
  }

  if (tok.used_at) {
    return htmlResponse(
      page("This letter has already been reviewed ✓", "", "✓", "purple"),
      200,
    );
  }

  const newStatus = tok.action === "approve" ? "available" : "removed";
  const { error: upErr } = await admin
    .from("letters")
    .update({ status: newStatus })
    .eq("id", tok.letter_id);

  if (upErr) {
    return htmlResponse(page("Something went wrong", upErr.message, "⚠️", "red"), 200);
  }

  await admin
    .from("letter_moderation_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("token", token);

  await admin
    .from("letter_moderation_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("letter_id", tok.letter_id)
    .is("used_at", null);

  if (tok.action === "approve") {
    return htmlResponse(
      page("Letter approved 💌", "It will find its way to someone who needs it.", "💌", "purple"),
      200,
    );
  }

  return htmlResponse(page("Letter removed ✓", "", "✓", "purple"), 200);
});
