import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

interface ModerationRequest {
  content: string;
  userId: string;
  contentType: 'post' | 'comment' | 'chat_message';
  contentId: string;
  roomId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, userId, contentType, contentId, roomId }: ModerationRequest = await req.json();

    console.log('Moderating content:', { contentType, contentId, content: content.substring(0, 100) });

    // First, use OpenAI's moderation endpoint
    const moderationResponse = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: content,
      }),
    });

    const moderationData = await moderationResponse.json();
    const isFlagged = moderationData.results[0]?.flagged || false;
    const categories = moderationData.results[0]?.categories || {};

    console.log('OpenAI moderation result:', { isFlagged, categories });

    // Enhanced detection using GPT for context-aware moderation
    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: `You are a content moderator for a mental health support platform. Analyze content for:
1. Suicide encouragement or harmful suggestions
2. Bullying or harassment
3. Self-harm promotion
4. Inappropriate content for vulnerable users
5. Spam or malicious content

Respond with JSON: {"flagged": boolean, "severity": "low"|"medium"|"high"|"critical", "reason": "brief explanation", "categories": ["category1", "category2"]}`
          },
          {
            role: 'user',
            content: `Analyze this ${contentType} content: "${content}"`
          }
        ],
        max_completion_tokens: 200,
      }),
    });

    const gptData = await gptResponse.json();
    let gptAnalysis = { flagged: false, severity: 'low', reason: '', categories: [] };
    
    try {
      gptAnalysis = JSON.parse(gptData.choices[0].message.content);
    } catch (e) {
      console.error('Error parsing GPT response:', e);
    }

    console.log('GPT analysis result:', gptAnalysis);

    // Determine if content should be flagged (either OpenAI moderation or GPT flagged it)
    const shouldFlag = isFlagged || gptAnalysis.flagged;
    
    if (shouldFlag) {
      console.log('Content flagged, creating report...');
      
      // Create a report in the database
      const reportData: any = {
        reported_user_id: userId,
        reported_by_user_id: userId, // System report
        reason: gptAnalysis.reason || 'Automated content moderation flag',
        status: 'pending',
        message_content: content,
      };

      // Add specific content reference
      if (contentType === 'post') {
        reportData.post_id = contentId;
      } else if (contentType === 'comment') {
        reportData.comment_id = contentId;
      } else if (contentType === 'chat_message') {
        reportData.message_id = contentId;
        reportData.room_id = roomId;
      }

      const { data: report, error: reportError } = await supabase
        .from('reports')
        .insert(reportData)
        .select()
        .single();

      if (reportError) {
        console.error('Error creating report:', reportError);
        throw reportError;
      }

      console.log('Report created successfully:', report.id);

      // For critical content, we might want to take immediate action
      if (gptAnalysis.severity === 'critical') {
        // You could implement automatic content removal or user suspension here
        console.log('Critical content detected - immediate action may be required');
      }

      return new Response(JSON.stringify({
        flagged: true,
        severity: gptAnalysis.severity,
        reason: gptAnalysis.reason,
        reportId: report.id,
        categories: [...Object.keys(categories).filter(k => categories[k]), ...gptAnalysis.categories]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      flagged: false,
      message: 'Content passed moderation'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in content moderation:', error);
    return new Response(JSON.stringify({ 
      error: 'Content moderation failed',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});