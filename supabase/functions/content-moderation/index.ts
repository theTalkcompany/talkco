import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { content, userId, contentType = 'unknown', contentId = null, roomId = null } = await req.json();
    
    if (!content) {
      console.error('❌ No content provided for moderation');
      return new Response(JSON.stringify({ 
        error: 'Content is required',
        flagged: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🔍 Starting content moderation for:', {
      contentType,
      contentLength: content.length,
      contentPreview: content.substring(0, 50),
      userId: userId || 'unknown'
    });

    // PRIORITY 1: PRIMARY HARMFUL CONTENT DETECTION (Most Reliable)
    const lowerContent = content.toLowerCase().trim();
    console.log('🚨 PRIORITY CHECK: Scanning for harmful phrases in:', lowerContent);
    
    const criticalHarmfulPhrases = [
      // Direct self-harm encouragement
      'kill yourself', 'go kill yourself', 'kys', 'kill urself', 'off yourself',
      'end your life', 'end it all', 'hang yourself', 'jump off a bridge',
      'you should die', 'just die', 'go die', 'die already', 'nobody would miss you',
      
      // Indirect encouragement
      'world would be better without you', 'do everyone a favor and', 'stop wasting oxygen',
      'do us all a favor', 'remove yourself', 'take the easy way out'
    ];
    
    const foundCriticalPhrase = criticalHarmfulPhrases.find(phrase => lowerContent.includes(phrase));
    
    let primaryDetection = { flagged: false, severity: 'low', reason: '', categories: [], flaggedBy: 'none' };
    
    if (foundCriticalPhrase) {
      console.log('🚨 CRITICAL HARMFUL CONTENT DETECTED by primary system:', foundCriticalPhrase);
      primaryDetection = {
        flagged: true,
        severity: 'critical',
        reason: `Contains harmful encouragement: "${foundCriticalPhrase}"`,
        categories: ['harmful_content', 'self_harm_encouragement'],
        flaggedBy: 'ai_primary'
      };
      
      // Log to enhanced moderation table immediately
      try {
        await supabase.from('content_moderation_logs').insert({
          content_id: contentId,
          content_type: contentType,
          content_preview: content.substring(0, 100),
          flagged_by: 'ai_primary',
          severity: 'critical',
          reason: primaryDetection.reason,
          categories: primaryDetection.categories,
          action_taken: 'flagged'
        });
        console.log('✅ Logged critical content to moderation table');
      } catch (logError) {
        console.error('❌ Failed to log to moderation table:', logError);
      }
    }

    // PRIORITY 2: OpenAI Moderation API (Backup)
    let openaiDetection = { flagged: false, categories: [], flaggedBy: 'none' };
    
    if (!primaryDetection.flagged) {
      console.log('⚡ Primary detection clear, checking OpenAI moderation API...');
      
      try {
        const moderationResponse = await fetch('https://api.openai.com/v1/moderations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            input: content,
            model: 'omni-moderation-latest'
          })
        });

        if (moderationResponse.ok) {
          const moderationData = await moderationResponse.json();
          console.log('✅ OpenAI moderation response:', moderationData);
          
          if (moderationData.results?.[0]) {
            const result = moderationData.results[0];
            openaiDetection.flagged = result.flagged;
            
            if (result.categories) {
              openaiDetection.categories = Object.keys(result.categories).filter(
                category => result.categories[category]
              );
              openaiDetection.flaggedBy = 'ai_openai';
            }
            
            console.log('🔍 OpenAI moderation result:', { 
              flagged: openaiDetection.flagged, 
              categories: openaiDetection.categories 
            });
          }
        } else {
          console.error('❌ OpenAI moderation API error:', moderationResponse.status);
        }
      } catch (error) {
        console.error('❌ OpenAI moderation request failed:', error);
      }
    }

    // PRIORITY 3: GPT Analysis (Contextual Understanding)
    let gptAnalysis = { flagged: false, severity: 'low', reason: '', categories: [], flaggedBy: 'none' };
    
    if (!primaryDetection.flagged && !openaiDetection.flagged) {
      console.log('⚡ Primary and OpenAI clear, performing GPT analysis...');
    
      try {
        const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4.1-2025-04-14',
            messages: [
              {
                role: 'system',
                content: `You are a content moderation system for a mental health support platform. Analyze content for:
                - Self-harm encouragement (ANY suggestion someone should harm themselves)
                - Harassment, bullying, or targeted attacks
                - Hate speech or discrimination
                - Spam or inappropriate promotional content
                - Dangerous misinformation about mental health
                
                Be VERY strict about self-harm content. Respond ONLY with JSON:
                {"flagged": boolean, "severity": "low|medium|high|critical", "reason": "explanation", "categories": ["category1", "category2"]}`
              },
              {
                role: 'user',
                content: `Analyze this ${contentType} content: "${content}"`
              }
            ],
            max_completion_tokens: 200
          })
        });

        if (gptResponse.ok) {
          const gptData = await gptResponse.json();
          console.log('✅ GPT moderation response received');
          
          if (gptData.choices?.[0]?.message?.content) {
            try {
              gptAnalysis = JSON.parse(gptData.choices[0].message.content);
              gptAnalysis.flaggedBy = 'ai_gpt';
              console.log('🔍 GPT analysis result:', gptAnalysis);
            } catch (parseError) {
              console.error('❌ Error parsing GPT JSON:', parseError);
              console.log('Raw GPT response:', gptData.choices[0].message.content);
            }
          }
        } else {
          console.error('❌ GPT API error:', gptResponse.status);
        }
      } catch (error) {
        console.error('❌ GPT moderation failed:', error);
      }
    }

    // Final Decision Logic
    const shouldFlag = primaryDetection.flagged || openaiDetection.flagged || gptAnalysis.flagged;
    let finalSeverity = 'low';
    let finalReason = 'Content appears safe';
    let finalCategories: string[] = [];
    let flaggedBy = 'none';

    if (primaryDetection.flagged) {
      finalSeverity = primaryDetection.severity;
      finalReason = primaryDetection.reason;
      finalCategories = primaryDetection.categories;
      flaggedBy = primaryDetection.flaggedBy;
    } else if (openaiDetection.flagged) {
      finalSeverity = 'high';
      finalReason = `OpenAI flagged for: ${openaiDetection.categories.join(', ')}`;
      finalCategories = openaiDetection.categories;
      flaggedBy = openaiDetection.flaggedBy;
    } else if (gptAnalysis.flagged) {
      finalSeverity = gptAnalysis.severity;
      finalReason = gptAnalysis.reason;
      finalCategories = gptAnalysis.categories;
      flaggedBy = gptAnalysis.flaggedBy;
    }

    console.log('📊 FINAL MODERATION RESULT:', { 
      shouldFlag, 
      severity: finalSeverity, 
      reason: finalReason,
      flaggedBy,
      contentPreview: content.substring(0, 30) + '...'
    });

    // Create AI Report if Content is Flagged
    if (shouldFlag) {
      console.log('🚨 FLAGGED CONTENT - Creating report and logging...');

      // Enhanced logging to moderation table
      try {
        if (!primaryDetection.flagged) { // Only log if not already logged by primary detection
          await supabase.from('content_moderation_logs').insert({
            content_id: contentId,
            content_type: contentType,
            content_preview: content.substring(0, 100),
            flagged_by: flaggedBy,
            severity: finalSeverity,
            reason: finalReason,
            categories: finalCategories,
            action_taken: 'flagged'
          });
          console.log('✅ Enhanced moderation log created');
        }
      } catch (logError) {
        console.error('❌ Failed to create enhanced log:', logError);
      }

      // Create user report for admin review
      try {
        const reportData = {
          reported_by_user_id: '00000000-0000-0000-0000-000000000001', // System ID for AI reports
          reported_user_id: userId || null,
          content_type: contentType,
          content_preview: content.substring(0, 200),
          report_reason: 'harmful_content',
          description: `AI Detection: ${finalReason}. Severity: ${finalSeverity}. Flagged by: ${flaggedBy}`,
          status: 'pending',
          ai_flagged: true,
          flagged_content: content,
          severity: finalSeverity
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

        console.log('📝 Creating user report for admin review...');

        const { data: reportResult, error: reportError } = await supabase
          .from('user_reports')
          .insert(reportData)
          .select();

        if (reportError) {
          console.error('❌ Failed to create report:', reportError);
        } else {
          console.log('✅ Successfully created AI report for admin review:', reportResult?.[0]?.id);
        }
      } catch (error) {
        console.error('❌ Error creating AI report:', error);
      }
    }

    const response = {
      flagged: shouldFlag,
      severity: finalSeverity,
      reason: finalReason,
      categories: finalCategories,
      flagged_by: flaggedBy,
      openai_flagged: openaiDetection.flagged,
      gpt_flagged: gptAnalysis.flagged,
      primary_detection: primaryDetection.flagged
    };

    console.log('📤 Returning comprehensive moderation result:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Critical content moderation error:', error);
    return new Response(JSON.stringify({ 
      error: 'Moderation service unavailable',
      flagged: false,
      severity: 'low',
      reason: 'Service error - content not moderated'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});