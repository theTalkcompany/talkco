import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface ModerationResult {
  flagged: boolean;
  severity?: string;
  reason?: string;
  reportId?: string;
  categories?: string[];
}

export const useContentModeration = () => {
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const moderateContent = async (
    content: string,
    userId: string,
    contentType: 'post' | 'comment' | 'chat_message',
    contentId: string,
    roomId?: string
  ): Promise<ModerationResult> => {
    console.log('🔍 Starting content moderation:', { content, contentType, contentId });
    setIsChecking(true);
    
    try {
      console.log('📞 Calling content-moderation function...');
      const { data, error } = await supabase.functions.invoke('content-moderation', {
        body: {
          content,
          userId,
          contentType,
          contentId,
          roomId,
        },
      });

      console.log('📥 Moderation response:', { data, error });

      if (error) {
        console.error('❌ Moderation error:', error);
        throw error;
      }

      const result = data as ModerationResult;
      
      console.log('🚨 Moderation result:', result);
      
      if (result.flagged) {
        console.log('🚨 CONTENT FLAGGED!', result);
        toast({
          title: "Content Flagged",
          description: "Your content has been flagged for review by our moderation system.",
          variant: "destructive",
        });
      } else {
        console.log('✅ Content passed moderation');
      }

      return result;
    } catch (error) {
      console.error('❌ Error moderating content:', error);
      // Don't block content creation if moderation fails
      return { flagged: false };
    } finally {
      setIsChecking(false);
    }
  };

  return {
    moderateContent,
    isChecking,
  };
};