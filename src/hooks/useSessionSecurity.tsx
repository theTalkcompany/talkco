import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export const useSessionSecurity = () => {
  const { toast } = useToast();

  // Session timeout warning (25 minutes)
  const SESSION_WARNING_TIME = 25 * 60 * 1000; // 25 minutes
  // Session timeout (30 minutes)
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  const logSecurityEvent = useCallback(async (eventType: string, details?: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('security_events').insert({
        event_type: eventType,
        user_id: user?.id || null,
        ip_address: null,
        user_agent: navigator.userAgent,
        details: {
          timestamp: new Date().toISOString(),
          ...details
        }
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }, []);

  const handleSessionTimeout = useCallback(async () => {
    await logSecurityEvent('session_timeout');
    await supabase.auth.signOut();
    toast({
      title: "Session Expired",
      description: "Your session has expired for security reasons. Please log in again.",
      variant: "destructive"
    });
  }, [logSecurityEvent, toast]);

  const handleSessionWarning = useCallback(() => {
    toast({
      title: "Session Expiring Soon",
      description: "Your session will expire in 5 minutes. Please save your work.",
      variant: "default"
    });
  }, [toast]);

  // Monitor for suspicious activity
  const detectSuspiciousActivity = useCallback(async () => {
    // Detect multiple rapid page changes (potential bot activity)
    const pageChangeCount = parseInt(sessionStorage.getItem('pageChangeCount') || '0');
    if (pageChangeCount > 50) {
      await logSecurityEvent('suspicious_activity', { 
        type: 'rapid_navigation',
        count: pageChangeCount 
      });
    }

    // Reset counter periodically
    if (pageChangeCount > 100) {
      sessionStorage.setItem('pageChangeCount', '0');
    }
  }, [logSecurityEvent]);

  useEffect(() => {
    let sessionWarningTimer: NodeJS.Timeout;
    let sessionTimeoutTimer: NodeJS.Timeout;
    let activityCheckTimer: NodeJS.Timeout;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          // Set up session timers
          sessionWarningTimer = setTimeout(handleSessionWarning, SESSION_WARNING_TIME);
          sessionTimeoutTimer = setTimeout(handleSessionTimeout, SESSION_TIMEOUT);
          
          // Set up activity monitoring
          activityCheckTimer = setInterval(detectSuspiciousActivity, 60000); // Check every minute
          
          // Log session start
          await logSecurityEvent('session_started');
        } else {
          // Clear timers when session ends
          clearTimeout(sessionWarningTimer);
          clearTimeout(sessionTimeoutTimer);
          clearInterval(activityCheckTimer);
        }
      }
    );

    // Track page navigation for suspicious activity detection
    const handlePageChange = () => {
      const count = parseInt(sessionStorage.getItem('pageChangeCount') || '0') + 1;
      sessionStorage.setItem('pageChangeCount', count.toString());
    };

    window.addEventListener('beforeunload', handlePageChange);

    return () => {
      subscription.unsubscribe();
      clearTimeout(sessionWarningTimer);
      clearTimeout(sessionTimeoutTimer);
      clearInterval(activityCheckTimer);
      window.removeEventListener('beforeunload', handlePageChange);
    };
  }, [handleSessionTimeout, handleSessionWarning, detectSuspiciousActivity, logSecurityEvent]);

  return { logSecurityEvent };
};