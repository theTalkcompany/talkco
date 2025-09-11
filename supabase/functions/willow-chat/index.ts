import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not set");
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json().catch(() => ({}));
    const incomingMessages: Array<{ role: string; content: string }> = body?.messages ?? [];

    // Load Willow's configuration from database
    const { data: config, error: configError } = await supabase
      .from('willow_config')
      .select('system_prompt, custom_knowledge, additional_instructions')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (configError) {
      console.error("Error loading config:", configError);
      throw new Error("Failed to load Willow configuration");
    }

    // Build the complete system prompt with all configuration sections
    let systemPrompt = config.system_prompt || "You are Willow, a compassionate AI mental health companion.";
    
    console.log("Base system prompt loaded:", systemPrompt.substring(0, 100) + "...");
    
    if (config.custom_knowledge && config.custom_knowledge.trim()) {
      systemPrompt += `\n\n=== CUSTOM KNOWLEDGE BASE ===\n${config.custom_knowledge.trim()}\n=== END CUSTOM KNOWLEDGE ===`;
      console.log("Custom knowledge added:", config.custom_knowledge.trim().substring(0, 100) + "...");
    }
    
    if (config.additional_instructions && config.additional_instructions.trim()) {
      systemPrompt += `\n\n=== ADDITIONAL INSTRUCTIONS ===\n${config.additional_instructions.trim()}\n=== END ADDITIONAL INSTRUCTIONS ===`;
      console.log("Additional instructions added:", config.additional_instructions.trim().substring(0, 100) + "...");
    }
    
    console.log("Final system prompt length:", systemPrompt.length, "characters");

    // Build OpenAI messages, prepend system prompt
    const conversationLength = incomingMessages.length;
    const recentMessages = conversationLength > 20 ? incomingMessages.slice(-20) : incomingMessages;
    
    // Analyze conversation for crisis patterns
    const crisisKeywords = ['kill myself', 'end my life', 'want to die', 'suicide', 'kill me'];
    const hasCrisisHistory = recentMessages.some(msg => 
      msg.role === 'user' && crisisKeywords.some(keyword => 
        msg.content.toLowerCase().includes(keyword)
      )
    );
    const hasProvidedCrisisInfo = recentMessages.some(msg => 
      msg.role === 'assistant' && (
        msg.content.toLowerCase().includes('professional help') ||
        msg.content.toLowerCase().includes('crisis hotline') ||
        msg.content.toLowerCase().includes('emergency') ||
        msg.content.toLowerCase().includes('988') ||
        msg.content.toLowerCase().includes('therapist')
      )
    );

    // Create enhanced system prompt with anti-repetition instructions
    const antiRepetitionPrompt = `
CRITICAL CONVERSATION RULES:
- NEVER repeat advice, questions, or suggestions you've already given in this conversation
- ALWAYS acknowledge and build upon what the user has shared previously  
- If the user has already answered a question, don't ask it again
- Reference specific details from earlier in our conversation
- Vary your language and approach - avoid using the same phrases repeatedly
- Listen carefully to what the user is actually saying right now
- If you're unsure what to say, ask the user what would be most helpful right now

${hasCrisisHistory && hasProvidedCrisisInfo ? `
CRITICAL CRISIS RESPONSE RULE:
- You have ALREADY provided crisis/professional help information in this conversation
- DO NOT repeat crisis hotlines, emergency numbers, or "seek professional help" advice
- Focus on emotional support, validation, and exploring what the user needs right now
- Ask what specific support would be most helpful instead of repeating crisis resources
` : ''}

CONVERSATION MEMORY: This conversation has ${conversationLength} messages. Pay close attention to the flow and avoid circular conversations.`;

    console.log(`Crisis analysis: hasCrisisHistory=${hasCrisisHistory}, hasProvidedCrisisInfo=${hasProvidedCrisisInfo}`);

    const messages = [
      { role: "system", content: systemPrompt + antiRepetitionPrompt },
      ...recentMessages
        .filter(m => (m.role === "user" || m.role === "assistant"))
        .map(m => ({ role: m.role, content: m.content }))
    ];

    console.log(`Conversation length: ${conversationLength}, using last ${recentMessages.length} messages`);
    console.log("Recent conversation context:", recentMessages.slice(-4).map(m => `${m.role}: ${m.content.substring(0, 50)}...`));

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini-2025-04-14",
        max_tokens: 500,
        temperature: 0.4,
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
