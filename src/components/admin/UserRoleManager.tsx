import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@/hooks/useUserRole";

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

  const loadUsersWithRoles = async () => {
    try {
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
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User role updated successfully"
      });

      loadUsersWithRoles();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadUsersWithRoles();
  }, []);

  if (loading) {
    return <div className="p-4">Loading users...</div>;
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