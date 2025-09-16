import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, XCircle, Clock, Bot, Shield, UserX, AlertOctagon, Mail, Phone, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";

interface Report {
  id: string;
  reported_user_id: string;
  reported_by_user_id: string;
  room_id?: string;
  message_id?: string;
  post_id?: string;
  comment_id?: string;
  message_content?: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
  is_ai_flagged?: boolean;
  rooms?: {
    name: string;
  };
  reported_user_profile?: {
    full_name?: string;
    email?: string;
    phone?: string;
    display_name?: string;
  };
  reporter_profile?: {
    full_name?: string;
    email?: string;
    phone?: string;
    display_name?: string;
  };
}

const ReportsAdmin = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      // First fetch reports with rooms
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select(`
          *,
          rooms (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;

      if (!reportsData || reportsData.length === 0) {
        setReports([]);
        return;
      }

      // Get unique user IDs from reports
      const reportedUserIds = [...new Set(reportsData.map(r => r.reported_user_id))];
      const reporterUserIds = [...new Set(reportsData.map(r => r.reported_by_user_id))];
      const allUserIds = [...new Set([...reportedUserIds, ...reporterUserIds])];

      // Fetch profiles for all users involved
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, phone, display_name')
        .in('user_id', allUserIds);

      if (profilesError) {
        console.warn('Error fetching profiles:', profilesError);
      }

      // Create a map of user profiles for quick lookup
      const profilesMap = new Map();
      if (profilesData) {
        profilesData.forEach(profile => {
          profilesMap.set(profile.user_id, profile);
        });
      }

      // Combine reports with profile data
      const reportsWithProfiles = reportsData.map(report => ({
        ...report,
        reported_user_profile: profilesMap.get(report.reported_user_id),
        reporter_profile: profilesMap.get(report.reported_by_user_id)
      }));

      setReports(reportsWithProfiles as Report[]);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Error",
        description: "Failed to load reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId: string, status: 'resolved' | 'dismissed') => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({
          status,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Report updated",
        description: `Report has been ${status}`,
      });

      fetchReports();
    } catch (error) {
      console.error('Error updating report:', error);
      toast({
        title: "Error",
        description: "Failed to update report",
        variant: "destructive",
      });
    }
  };

  const banUser = async (userId: string, reportId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('user_moderation')
        .insert({
          user_id: userId,
          action_type: 'ban',
          reason: reason,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          notes: `Banned due to report ${reportId}`
        });

      if (error) throw error;

      // Also resolve the report
      await updateReportStatus(reportId, 'resolved');

      toast({
        title: "User banned",
        description: "User has been permanently banned from the platform",
      });
    } catch (error) {
      console.error('Error banning user:', error);
      toast({
        title: "Error",
        description: "Failed to ban user",
        variant: "destructive",
      });
    }
  };

  const warnUser = async (userId: string, reportId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('user_moderation')
        .insert({
          user_id: userId,
          action_type: 'warning',
          reason: reason,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          notes: `Warning issued due to report ${reportId}`,
          duration_hours: 168, // 7 days
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (error) throw error;

      // Also resolve the report
      await updateReportStatus(reportId, 'resolved');

      toast({
        title: "Warning issued",
        description: "User has been warned for their behavior",
      });
    } catch (error) {
      console.error('Error warning user:', error);
      toast({
        title: "Error",
        description: "Failed to warn user",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'resolved':
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" />Resolved</Badge>;
      case 'dismissed':
        return <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" />Dismissed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'harassment':
        return 'text-red-600';
      case 'inappropriate':
        return 'text-orange-600';
      case 'spam':
        return 'text-yellow-600';
      case 'harmful':
        return 'text-red-700';
      case 'Automated content moderation flag':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const isAIFlagged = (report: Report) => {
    return report.reported_by_user_id === report.reported_user_id || 
           report.reason === 'Automated content moderation flag' ||
           report.reason.toLowerCase().includes('automated');
  };

  const pendingReports = useMemo(() => reports.filter(r => r.status === 'pending'), [reports]);
  const resolvedReports = useMemo(() => reports.filter(r => r.status !== 'pending'), [reports]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <div className="text-muted-foreground">Loading reports...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-orange-600" />
        <h2 className="text-2xl font-bold">User Reports</h2>
        {pendingReports.length > 0 && (
          <Badge variant="destructive">{pendingReports.length} pending</Badge>
        )}
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Reports ({pendingReports.length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved Reports ({resolvedReports.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingReports.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  No pending reports. Great job keeping the community safe! 🎉
                </div>
              </CardContent>
            </Card>
          ) : (
            pendingReports.map((report) => (
              <Card key={report.id} className={`border-l-4 ${isAIFlagged(report) ? 'border-l-purple-500 bg-purple-50/50' : 'border-l-orange-500'}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {isAIFlagged(report) && (
                        <Bot className="h-4 w-4 text-purple-600" />
                      )}
                      {report.room_id 
                        ? `Report in #${report.rooms?.name || 'Unknown Room'}`
                        : report.post_id 
                          ? 'Report on Feed Post'
                          : 'Report on Comment'
                      }
                      {isAIFlagged(report) && (
                        <Badge variant="outline" className="text-purple-600 border-purple-300">
                          <Shield className="h-3 w-3 mr-1" />
                          AI Detected
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${getReasonColor(report.reason)}`}>
                        {report.reason === 'Automated content moderation flag' ? 'AI Moderation' : report.reason.charAt(0).toUpperCase() + report.reason.slice(1)}
                      </span>
                      {getStatusBadge(report.status)}
                    </div>
                  </div>
                  <CardDescription>
                    {isAIFlagged(report) ? 'Automatically flagged by AI moderation system' : 'User report'} • {format(new Date(report.created_at), 'PPp')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* User Information Section */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Reported User */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-red-700">
                        <UserX className="h-4 w-4" />
                        Reported User
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {report.reported_user_profile?.full_name || report.reported_user_profile?.display_name || 'Unknown User'}
                          </span>
                        </div>
                        {report.reported_user_profile?.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{report.reported_user_profile.email}</span>
                          </div>
                        )}
                        {report.reported_user_profile?.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{report.reported_user_profile.phone}</span>
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-2">
                          ID: <code className="bg-white px-1 rounded">{report.reported_user_id}</code>
                        </div>
                      </div>
                    </div>

                    {/* Reporter Information */}
                    {!isAIFlagged(report) && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                          <Shield className="h-4 w-4" />
                          Reported By
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {report.reporter_profile?.full_name || report.reporter_profile?.display_name || 'Unknown User'}
                            </span>
                          </div>
                          {report.reporter_profile?.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span>{report.reporter_profile.email}</span>
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground mt-2">
                            ID: <code className="bg-white px-1 rounded">{report.reported_by_user_id}</code>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Reported Content */}
                  {report.message_content && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        Reported {report.room_id ? 'Message' : report.post_id ? 'Post' : 'Comment'}:
                      </h4>
                      <div className="bg-muted p-4 rounded-md text-sm border-l-4 border-orange-500">
                        "{report.message_content}"
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button 
                      onClick={() => banUser(report.reported_user_id, report.id, report.reason)}
                      variant="destructive"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <UserX className="h-4 w-4" />
                      Ban User
                    </Button>
                    <Button 
                      onClick={() => warnUser(report.reported_user_id, report.id, report.reason)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 border-orange-500 text-orange-600 hover:bg-orange-50"
                    >
                      <AlertOctagon className="h-4 w-4" />
                      Warn User
                    </Button>
                    <Button 
                      onClick={() => updateReportStatus(report.id, 'resolved')}
                      variant="default"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Resolve
                    </Button>
                    <Button 
                      onClick={() => updateReportStatus(report.id, 'dismissed')}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Dismiss
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {resolvedReports.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  No resolved reports yet.
                </div>
              </CardContent>
            </Card>
          ) : (
            resolvedReports.map((report) => (
              <Card key={report.id} className="opacity-75">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {report.room_id 
                        ? `Report in #${report.rooms?.name || 'Unknown Room'}`
                        : report.post_id 
                          ? 'Report on Feed Post'
                          : 'Report on Comment'
                      }
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${getReasonColor(report.reason)}`}>
                        {report.reason.charAt(0).toUpperCase() + report.reason.slice(1)}
                      </span>
                      {getStatusBadge(report.status)}
                    </div>
                  </div>
                  <CardDescription>
                    Reported {format(new Date(report.created_at), 'PPp')}
                    {report.resolved_at && (
                      <> • {report.status.charAt(0).toUpperCase() + report.status.slice(1)} {format(new Date(report.resolved_at), 'PPp')}</>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {report.message_content && (
                    <div className="bg-muted p-3 rounded-md text-sm">
                      "{report.message_content}"
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsAdmin;