import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, XCircle, Clock, Bot, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

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
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          rooms (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports((data || []) as Report[]);
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

  const pendingReports = reports.filter(r => r.status === 'pending');
  const resolvedReports = reports.filter(r => r.status !== 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading reports...</div>
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
                <CardContent className="space-y-4">
                  {report.message_content && (
                    <div>
                      <h4 className="font-medium mb-2">
                        Reported {report.room_id ? 'Message' : report.post_id ? 'Post' : 'Comment'}:
                      </h4>
                      <div className="bg-muted p-3 rounded-md text-sm">
                        "{report.message_content}"
                      </div>
                    </div>
                  )}
                  
                  <div className="text-sm text-muted-foreground">
                    <p>Reported User ID: <code className="bg-muted px-1 rounded">{report.reported_user_id}</code></p>
                    <p>Reported By: <code className="bg-muted px-1 rounded">{report.reported_by_user_id}</code></p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={() => updateReportStatus(report.id, 'resolved')}
                      variant="default"
                      size="sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Resolve
                    </Button>
                    <Button 
                      onClick={() => updateReportStatus(report.id, 'dismissed')}
                      variant="outline"
                      size="sm"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
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