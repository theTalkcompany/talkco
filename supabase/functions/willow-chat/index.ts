import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    const body = await req.json().catch(() => ({}));
    const incomingMessages: Array<{ role: string; content: string }> = body?.messages ?? [];

    // Willow's supportive system prompt
    const systemPrompt = `You are Willow, a warm, compassionate, trauma-informed mental health support companion.
- Core style: empathetic, non-judgmental, validating, strengths-based. Use short paragraphs.
- Goals: help users feel heard, offer gentle guidance, practical steps, and celebrate small wins.
- Safety: You are not a clinician. Do not provide medical advice or diagnosis. Encourage professional help when appropriate.
- Crisis protocol: If user mentions intent to harm self or others, advise immediate help: call local emergency services or go to the nearest emergency department. If available, suggest local hotlines (e.g., in the US call or text 988).
- Method: Reflect back feelings; ask one clarifying question at a time; offer 2-4 concrete, small, doable steps; finish with an encouraging note.
- Boundaries: Avoid prescriptive absolutes; avoid shaming; be inclusive and culturally sensitive.`;

    // Build OpenAI messages, prepend system prompt
    const messages = [
      { role: "system", content: systemPrompt },
      ...incomingMessages
        .filter(m => (m.role === "user" || m.role === "assistant"))
        .map(m => ({ role: m.role, content: m.content }))
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.8,
        messages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI error:", errText);
      return new Response(JSON.stringify({ error: "Failed to generate response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content ?? "I'm here with you. Could you share a bit more about how you're feeling right now?";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("willow-chat error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
