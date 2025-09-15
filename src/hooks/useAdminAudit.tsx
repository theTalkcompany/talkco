import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getIPInfo } from '@/utils/ipUtils';

/**
 * Hook for auditing admin actions and sensitive data access
 */
export const useAdminAudit = () => {
  const logAdminAction = useCallback(async (
    action: string, 
    targetUserId?: string, 
    details?: any
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const ipInfo = await getIPInfo();
      
      await supabase.from('security_events').insert({
        event_type: `admin_${action}`,
        user_id: user?.id || null,
        ip_address: ipInfo.ip,
        user_agent: navigator.userAgent,
        details: {
          timestamp: new Date().toISOString(),
          location: ipInfo.location,
          target_user_id: targetUserId,
          action_type: action,
          ...details
        }
      });
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  }, []);

  const logProfileAccess = useCallback(async (profileUserId: string) => {
    await logAdminAction('profile_access', profileUserId, {
      accessed_profile_id: profileUserId
    });
  }, [logAdminAction]);

  const logDataExport = useCallback(async (dataType: string, recordCount: number) => {
    await logAdminAction('data_export', undefined, {
      data_type: dataType,
      record_count: recordCount
    });
  }, [logAdminAction]);

  const logConfigChange = useCallback(async (configType: string, oldValue: any, newValue: any) => {
    await logAdminAction('config_change', undefined, {
      config_type: configType,
      old_value: oldValue,
      new_value: newValue
    });
  }, [logAdminAction]);

  return {
    logAdminAction,
    logProfileAccess,
    logDataExport,
    logConfigChange
  };
};