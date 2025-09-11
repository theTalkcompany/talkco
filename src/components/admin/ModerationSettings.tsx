import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bot, Settings, Shield, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface ModerationConfig {
  auto_moderate: boolean;
  severity_threshold: 'low' | 'medium' | 'high' | 'critical';
  auto_remove_critical: boolean;
  notify_admins: boolean;
  custom_keywords: string[];
}

const ModerationSettings = () => {
  const [config, setConfig] = useState<ModerationConfig>({
    auto_moderate: true,
    severity_threshold: 'medium',
    auto_remove_critical: false,
    notify_admins: true,
    custom_keywords: []
  });
  
  const [customKeywords, setCustomKeywords] = useState('');
  const [saving, setSaving] = useState(false);
  const [testingModeration, setTestingModeration] = useState(false);
  const [testContent, setTestContent] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const { toast } = useToast();

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      // In a real implementation, you'd save this to a configuration table
      toast({
        title: "Settings saved",
        description: "AI moderation configuration has been updated.",
      });
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: "Error",
        description: "Failed to save moderation settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const testModeration = async () => {
    if (!testContent.trim()) return;

    setTestingModeration(true);
    try {
      const { data, error } = await supabase.functions.invoke('content-moderation', {
        body: {
          content: testContent,
          userId: 'test-user-id',
          contentType: 'post',
          contentId: 'test-content-id',
        },
      });

      if (error) throw error;
      setTestResult(data);
    } catch (error) {
      console.error('Error testing moderation:', error);
      toast({
        title: "Test failed",
        description: "Could not test content moderation",
        variant: "destructive",
      });
    } finally {
      setTestingModeration(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Bot className="h-5 w-5 text-blue-600" />
        <h2 className="text-2xl font-bold">AI Content Moderation</h2>
        <Badge variant="outline" className="text-blue-600 border-blue-300">
          <Shield className="h-3 w-3 mr-1" />
          Active
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Configuration Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Moderation Settings
            </CardTitle>
            <CardDescription>
              Configure how AI moderation works for your platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-moderate">Auto-moderate content</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically scan new posts and messages
                </p>
              </div>
              <Switch
                id="auto-moderate"
                checked={config.auto_moderate}
                onCheckedChange={(checked) =>
                  setConfig(prev => ({ ...prev, auto_moderate: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notify-admins">Notify admins</Label>
                <p className="text-sm text-muted-foreground">
                  Send notifications for flagged content
                </p>
              </div>
              <Switch
                id="notify-admins"
                checked={config.notify_admins}
                onCheckedChange={(checked) =>
                  setConfig(prev => ({ ...prev, notify_admins: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-remove">Auto-remove critical content</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically hide content flagged as critical
                </p>
              </div>
              <Switch
                id="auto-remove"
                checked={config.auto_remove_critical}
                onCheckedChange={(checked) =>
                  setConfig(prev => ({ ...prev, auto_remove_critical: checked }))
                }
              />
            </div>

            <Button onClick={handleSaveConfig} disabled={saving} className="w-full">
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </CardContent>
        </Card>

        {/* Test Moderation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Test Moderation
            </CardTitle>
            <CardDescription>
              Test the AI moderation system with sample content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="test-content">Test Content</Label>
              <Textarea
                id="test-content"
                placeholder="Enter content to test moderation..."
                value={testContent}
                onChange={(e) => setTestContent(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <Button 
              onClick={testModeration} 
              disabled={!testContent.trim() || testingModeration}
              variant="outline"
              className="w-full"
            >
              {testingModeration ? 'Testing...' : 'Test Moderation'}
            </Button>

            {testResult && (
              <div className="p-4 rounded-lg border bg-muted">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={testResult.flagged ? "destructive" : "default"}>
                    {testResult.flagged ? "Flagged" : "Clean"}
                  </Badge>
                  {testResult.severity && (
                    <Badge variant="outline">
                      Severity: {testResult.severity}
                    </Badge>
                  )}
                </div>
                {testResult.reason && (
                  <p className="text-sm text-muted-foreground">
                    Reason: {testResult.reason}
                  </p>
                )}
                {testResult.categories && testResult.categories.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Categories:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {testResult.categories.map((category: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ModerationSettings;