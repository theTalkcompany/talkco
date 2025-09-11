import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Save } from "lucide-react";
import ModerationSettings from "./ModerationSettings";
import { UserRoleManager } from "./UserRoleManager";
import PrivacyPolicyAdmin from "./PrivacyPolicyAdmin";

interface WillowConfig {
  id: string;
  system_prompt: string;
  custom_knowledge: string;
  additional_instructions: string;
}

const WillowAdmin = () => {
  const [config, setConfig] = useState<WillowConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('willow_config')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      setConfig(data);
    } catch (error) {
      console.error('Error loading config:', error);
      toast({
        title: "Error",
        description: "Failed to load Willow configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!config) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('willow_config')
        .update({
          system_prompt: config.system_prompt,
          custom_knowledge: config.custom_knowledge,
          additional_instructions: config.additional_instructions,
        })
        .eq('id', config.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Willow configuration updated successfully",
      });
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!config) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">No configuration found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Willow AI Configuration</h2>
          <p className="text-muted-foreground">Customize Willow's personality and knowledge base</p>
        </div>
        <Button onClick={saveConfig} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

        <Tabs defaultValue="prompt" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="prompt">System Prompt</TabsTrigger>
            <TabsTrigger value="knowledge">Custom Knowledge</TabsTrigger>
            <TabsTrigger value="instructions">Additional Instructions</TabsTrigger>
            <TabsTrigger value="moderation">Content Moderation</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
          </TabsList>

        <TabsContent value="prompt">
          <Card>
            <CardHeader>
              <CardTitle>System Prompt</CardTitle>
              <CardDescription>
                This defines Willow's core personality, behavior, and approach to conversations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="system-prompt">System Prompt</Label>
                <Textarea
                  id="system-prompt"
                  value={config.system_prompt}
                  onChange={(e) => setConfig({ ...config, system_prompt: e.target.value })}
                  rows={15}
                  className="font-mono text-sm"
                  placeholder="Enter Willow's system prompt..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge">
          <Card>
            <CardHeader>
              <CardTitle>Custom Knowledge</CardTitle>
              <CardDescription>
                Add specific information, facts, or context that you want Willow to know about.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="custom-knowledge">Custom Knowledge Base</Label>
                <Textarea
                  id="custom-knowledge"
                  value={config.custom_knowledge}
                  onChange={(e) => setConfig({ ...config, custom_knowledge: e.target.value })}
                  rows={10}
                  className="font-mono text-sm"
                  placeholder="Add specific information Willow should know..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instructions">
          <Card>
            <CardHeader>
              <CardTitle>Additional Instructions</CardTitle>
              <CardDescription>
                Add specific behavioral instructions or guidelines for Willow.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="additional-instructions">Additional Instructions</Label>
                <Textarea
                  id="additional-instructions"
                  value={config.additional_instructions}
                  onChange={(e) => setConfig({ ...config, additional_instructions: e.target.value })}
                  rows={8}
                  className="font-mono text-sm"
                  placeholder="Add specific instructions or guidelines..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="moderation">
          <ModerationSettings />
        </TabsContent>
        
          <TabsContent value="users">
            <UserRoleManager />
          </TabsContent>

          <TabsContent value="privacy">
            <PrivacyPolicyAdmin />
          </TabsContent>
        </Tabs>
    </div>
  );
};

export default WillowAdmin;