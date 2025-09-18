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

    // Initialize moderation variables
    let isFlagged = false;
    let categories = {};
    
    // Try OpenAI's moderation endpoint, but don't rely on it completely
    try {
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

      if (moderationResponse.ok) {
        const moderationData = await moderationResponse.json();
        if (moderationData.results && Array.isArray(moderationData.results) && moderationData.results.length > 0) {
          isFlagged = moderationData.results[0]?.flagged || false;
          categories = moderationData.results[0]?.categories || {};
          console.log('OpenAI moderation result:', { isFlagged, categories });
        }
      } else {
        const errorData = await moderationResponse.json();
        console.log('OpenAI moderation API error (continuing with GPT analysis):', errorData);
      }
    } catch (error) {
      console.log('OpenAI moderation API failed (continuing with GPT analysis):', error.message);
    }

    console.log('OpenAI moderation result:', { isFlagged, categories });

    // Enhanced detection using GPT for context-aware moderation
    let gptAnalysis = { flagged: false, severity: 'low', reason: '', categories: [] };
    
    try {
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
1. Suicide encouragement or harmful suggestions (including phrases like "kill yourself", "end it all", etc.)
2. Bullying or harassment (including threats, insults, or intimidation)
3. Self-harm promotion (encouraging cutting, substance abuse, etc.)
4. Inappropriate content for vulnerable users (explicit content, triggers)
5. Spam or malicious content

Be especially strict with suicide-related content. ANY encouragement of self-harm or suicide should be flagged as critical.

CRITICAL: Content like "go kill yourself" or "kill yourself" MUST ALWAYS be flagged as critical.

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

      if (gptResponse.ok) {
        const gptData = await gptResponse.json();
        
        if (gptData.choices && gptData.choices.length > 0 && gptData.choices[0].message) {
          try {
            gptAnalysis = JSON.parse(gptData.choices[0].message.content);
            console.log('GPT analysis successful:', gptAnalysis);
          } catch (parseError) {
            console.error('Error parsing GPT JSON response:', parseError);
            console.log('GPT raw response:', gptData.choices[0].message.content);
            
            // Fallback: check for obvious harmful content manually
            const lowerContent = content.toLowerCase();
            if (lowerContent.includes('kill yourself') || lowerContent.includes('go kill') || lowerContent.includes('end it all') ||
                lowerContent.includes('kys') || lowerContent.includes('hang yourself') || lowerContent.includes('jump off')) {
              gptAnalysis = {
                flagged: true,
                severity: 'critical',
                reason: 'Contains explicit harmful encouragement (AI detected)',
                categories: ['harmful_content']
              };
              console.log('🚨 CRITICAL CONTENT DETECTED by JSON parsing fallback');
            }
          }
        } else {
          console.error('Invalid GPT response structure:', gptData);
        }
      } else {
        const errorData = await gptResponse.json();
        console.error('GPT API error:', errorData);
      }
    } catch (error) {
      console.error('GPT moderation failed:', error);
      
      // Critical fallback for obvious harmful content
      const lowerContent = content.toLowerCase();
      if (lowerContent.includes('kill yourself') || lowerContent.includes('go kill') || lowerContent.includes('end it all') || 
          lowerContent.includes('kys') || lowerContent.includes('hang yourself') || lowerContent.includes('jump off')) {
        gptAnalysis = {
          flagged: true,
          severity: 'critical',
          reason: 'Contains explicit harmful encouragement (AI detected)',
          categories: ['harmful_content']
        };
        console.log('🚨 CRITICAL CONTENT DETECTED by fallback analysis');
      }
    }

    console.log('Final analysis - OpenAI flagged:', isFlagged, 'GPT flagged:', gptAnalysis.flagged);

    // Determine if content should be flagged (either OpenAI moderation or GPT flagged it)
    const shouldFlag = isFlagged || gptAnalysis.flagged;
    
    if (shouldFlag) {
      console.log('Content flagged, creating report...');
      
    // Create a report in the database
      const reportData: any = {
        reported_user_id: userId,
        reported_by_user_id: '00000000-0000-0000-0000-000000000000', // System/AI report
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
        categories: [...Object.keys(categories || {}).filter(k => categories && categories[k]), ...gptAnalysis.categories]
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