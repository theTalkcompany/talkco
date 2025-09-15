import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserRole, useUserRole } from "@/hooks/useUserRole";
import { useAdminAudit } from "@/hooks/useAdminAudit";
import { getIPInfo } from "@/utils/ipUtils";

interface UserWithRole {
  user_id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export const UserRoleManager = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { logAdminAction, logProfileAccess } = useAdminAudit();

  const loadUsersWithRoles = async () => {
    try {
      // Log admin accessing user list
      await logAdminAction('user_list_access', undefined, {
        access_type: 'user_roles_list'
      });
      
      // Get all user roles with profile information
      const { data: rolesData, error } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          role,
          created_at,
          profiles!inner(email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const usersWithRoles = rolesData?.map(item => ({
        user_id: item.user_id,
        email: (item.profiles as any)?.email || 'No email',
        role: item.role as UserRole,
        created_at: item.created_at
      })) || [];

      // Log profile access for each user viewed
      for (const user of usersWithRoles) {
        await logProfileAccess(user.user_id);
      }

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    // CLIENT-SIDE: Verify admin status before attempting update
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can modify user roles",
        variant: "destructive"
      });
      return;
    }

    // Prevent self-role modification
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id === userId) {
      toast({
        title: "Access Denied",
        description: "You cannot modify your own role",
        variant: "destructive"
      });
      return;
    }

    try {
      // Log the attempted role change before executing
      const ipInfo = await getIPInfo();
      await supabase.from('security_events').insert({
        event_type: 'role_change_attempt',
        user_id: user?.id,
        ip_address: ipInfo.ip,
        user_agent: navigator.userAgent,
        details: {
          target_user_id: userId,
          new_role: newRole,
          location: ipInfo.location,
          timestamp: new Date().toISOString()
        }
      });

      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) {
        // Log failed role change
        await supabase.from('security_events').insert({
          event_type: 'role_change_failed',
          user_id: user?.id,
          ip_address: ipInfo.ip,
          user_agent: navigator.userAgent,
          details: {
            target_user_id: userId,
            new_role: newRole,
            error_message: error.message,
            location: ipInfo.location,
            timestamp: new Date().toISOString()
          }
        });

        // Handle specific RLS policy violation
        if (error.message?.includes('row-level security')) {
          toast({
            title: "Access Denied", 
            description: "Insufficient permissions to modify user roles",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }

      // Log successful role change
      await supabase.from('security_events').insert({
        event_type: 'role_change_success',
        user_id: user?.id,
        ip_address: ipInfo.ip,
        user_agent: navigator.userAgent,
        details: {
          target_user_id: userId,
          new_role: newRole,
          location: ipInfo.location,
          timestamp: new Date().toISOString()
        }
      });

      toast({
        title: "Success",
        description: "User role updated successfully"
      });

      loadUsersWithRoles();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role. Please check your permissions.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (!roleLoading && isAdmin) {
      loadUsersWithRoles();
    }
  }, [isAdmin, roleLoading]);

  if (roleLoading || loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-muted-foreground">
            Access restricted to administrators only.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Role Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {users.map((user) => (
          <div key={user.user_id} className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="font-medium">{user.email}</div>
              <div className="text-sm text-muted-foreground">
                Joined: {new Date(user.created_at).toLocaleDateString()}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'moderator' ? 'default' : 'secondary'}>
                {user.role}
              </Badge>
              <Select
                value={user.role}
                onValueChange={(newRole: UserRole) => updateUserRole(user.user_id, newRole)}
                disabled={!isAdmin}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No users found
          </div>
        )}
      </CardContent>
    </Card>
  );
};