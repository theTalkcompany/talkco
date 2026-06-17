import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const APP_URL = "https://talkco.lovable.app";

const redirect = (status: "approved" | "removed" | "already" | "invalid" | "error") =>
  Response.redirect(`${APP_URL}/letters/moderated?status=${status}`, 302);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) return redirect("invalid");

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: tok, error } = await admin
    .from("letter_moderation_tokens")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (error || !tok) return redirect("invalid");
  if (tok.used_at) return redirect("already");

  const newStatus = tok.action === "approve" ? "available" : "removed";
  const { error: upErr } = await admin
    .from("letters")
    .update({ status: newStatus })
    .eq("id", tok.letter_id);

  if (upErr) return redirect("error");

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

  return redirect(tok.action === "approve" ? "approved" : "removed");
});
