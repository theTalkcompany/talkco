// Ensures a demo user exists for App Store reviewers / testing.
// Public function - no JWT required.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DEMO_EMAIL = "demo@talkco.app";
const DEMO_PASSWORD = "DemoUser!2026";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Check if user already exists
    const { data: list } = await admin.auth.admin.listUsers();
    const existing = list?.users?.find((u) => u.email === DEMO_EMAIL);

    let userId = existing?.id;

    if (!existing) {
      const { data: created, error: createErr } =
        await admin.auth.admin.createUser({
          email: DEMO_EMAIL,
          password: DEMO_PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: "Demo User" },
        });
      if (createErr) throw createErr;
      userId = created.user!.id;

      await admin.from("profiles").upsert(
        {
          user_id: userId,
          email: DEMO_EMAIL,
          full_name: "Demo User",
          phone: "0000000000",
          address: "Demo",
          date_of_birth: "2000-01-01",
        },
        { onConflict: "user_id" },
      );
    } else {
      // Reset password in case it drifted
      await admin.auth.admin.updateUserById(existing.id, {
        password: DEMO_PASSWORD,
      });
    }

    return new Response(
      JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
