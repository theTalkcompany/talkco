import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Shield, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';

interface BackupAdmin {
  id: string;
  email: string;
  created_at: string;
  activated_at: string | null;
}

export const BackupAdminManager = () => {
  const [backupAdmins, setBackupAdmins] = useState<BackupAdmin[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { userRole, loading: roleLoading } = useUserRole();

  useEffect(() => {
    if (userRole === 'admin') {
      loadBackupAdmins();
    }
  }, [userRole]);

  const loadBackupAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('backup_admins')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBackupAdmins(data || []);
    } catch (error) {
      console.error('Error loading backup admins:', error);
      toast({
        title: 'Error',
        description: 'Failed to load backup admins',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addBackupAdmin = async () => {
    if (!newAdminEmail.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('backup_admins')
        .insert({
          email: newAdminEmail.toLowerCase().trim()
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Backup admin added successfully',
      });

      setNewAdminEmail('');
      loadBackupAdmins();
    } catch (error: any) {
      console.error('Error adding backup admin:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add backup admin',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const removeBackupAdmin = async (id: string) => {
    try {
      const { error } = await supabase
        .from('backup_admins')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Backup admin removed successfully',
      });

      loadBackupAdmins();
    } catch (error) {
      console.error('Error removing backup admin:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove backup admin',
        variant: 'destructive',
      });
    }
  };

  if (roleLoading || loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (userRole !== 'admin') {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Access restricted to administrators only.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Backup Admin Management
        </CardTitle>
        <CardDescription>
          Manage backup administrators who can be automatically promoted to admin if needed.
          Backup admins will be promoted to full admin on their first login.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Backup Admin */}
        <div className="space-y-2">
          <Label htmlFor="admin-email">Add Backup Administrator</Label>
          <div className="flex gap-2">
            <Input
              id="admin-email"
              type="email"
              placeholder="admin@example.com"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addBackupAdmin()}
            />
            <Button 
              onClick={addBackupAdmin} 
              disabled={submitting || !newAdminEmail.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </div>

        {/* Backup Admins List */}
        <div className="space-y-3">
          <h3 className="font-semibold">Current Backup Administrators</h3>
          
          {backupAdmins.length === 0 ? (
            <p className="text-muted-foreground text-sm">No backup administrators configured.</p>
          ) : (
            <div className="space-y-2">
              {backupAdmins.map((admin) => (
                <div key={admin.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{admin.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Added: {new Date(admin.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {admin.activated_at ? (
                      <Badge variant="default" className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        Activated
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBackupAdmin(admin.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security Note */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Security Note:</strong> Backup administrators will automatically receive 
            full admin privileges when they first sign up or log in to the platform. Only add 
            trusted individuals as backup administrators.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};