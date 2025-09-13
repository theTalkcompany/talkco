import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Security Monitor Component
 * Tracks security-relevant user actions and logs them for audit purposes
 */
export const SecurityMonitor = () => {
  useEffect(() => {
    // Monitor failed requests (network errors that might indicate attacks)
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // Log suspicious 401/403 responses that might indicate unauthorized access attempts
        if ([401, 403].includes(response.status) && args[0]?.toString().includes('/rest/v1/')) {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            await supabase.from('security_events').insert({
              event_type: 'unauthorized_api_access',
              user_id: user?.id || null,
              ip_address: null,
              user_agent: navigator.userAgent,
              details: {
                url: args[0]?.toString(),
                status: response.status,
                timestamp: new Date().toISOString()
              }
            });
          } catch (logError) {
            console.error('Failed to log security event:', logError);
          }
        }
        
        return response;
      } catch (error) {
        return originalFetch(...args);
      }
    };

    // Monitor for XSS attempts by watching for suspicious script injections
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.tagName === 'SCRIPT' && !element.hasAttribute('data-allowed')) {
              // Potential XSS attempt detected
              try {
                supabase.from('security_events').insert({
                  event_type: 'potential_xss_attempt',
                  user_id: null,
                  ip_address: null,
                  user_agent: navigator.userAgent,
                  details: {
                    script_content: element.textContent?.substring(0, 500),
                    timestamp: new Date().toISOString()
                  }
                });
              } catch (logError) {
                console.error('Failed to log security event:', logError);
              }
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Cleanup
    return () => {
      window.fetch = originalFetch;
      observer.disconnect();
    };
  }, []);

  return null; // This is a monitoring component with no UI
};