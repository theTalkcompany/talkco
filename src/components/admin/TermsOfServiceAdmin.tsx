import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserRole } from "@/hooks/useUserRole";
import { AlertCircle, Eye, Save } from "lucide-react";
import { Link } from "react-router-dom";

interface TermsOfServiceData {
  id: string;
  content: string;
  last_updated: string;
  updated_by: string;
}

const TermsOfServiceAdmin = () => {
  const [termsOfService, setTermsOfService] = useState<TermsOfServiceData | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { isAdmin, loading: roleLoading } = useUserRole();

  useEffect(() => {
    const loadTermsOfService = async () => {
      try {
        const { data, error } = await supabase
          .from("terms_of_service")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (error) {
          console.error("Error loading terms of service:", error);
          toast({
            title: "Error",
            description: "Failed to load terms of service",
            variant: "destructive",
          });
          return;
        }

        setTermsOfService(data);
        setContent(data.content);
      } catch (error) {
        console.error("Error loading terms of service:", error);
        toast({
          title: "Error",
          description: "Failed to load terms of service",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      loadTermsOfService();
    } else if (!roleLoading) {
      setLoading(false);
    }
  }, [isAdmin, roleLoading, toast]);

  const handleSave = async () => {
    if (!isAdmin) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to update the terms of service",
          variant: "destructive",
        });
        return;
      }

      const updateData = {
        content,
        updated_by: user.id,
        last_updated: new Date().toISOString(),
      };

      if (termsOfService) {
        // Update existing terms of service
        const { error } = await supabase
          .from("terms_of_service")
          .update(updateData)
          .eq("id", termsOfService.id);

        if (error) throw error;
      } else {
        // Create new terms of service
        const { data, error } = await supabase
          .from("terms_of_service")
          .insert({
            ...updateData,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        setTermsOfService(data);
      }

      toast({
        title: "Success",
        description: "Terms of service updated successfully",
      });
    } catch (error) {
      console.error("Error saving terms of service:", error);
      toast({
        title: "Error",
        description: "Failed to save terms of service",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (roleLoading || loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-10 w-24" />
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Access Restricted
          </CardTitle>
          <CardDescription>
            Only administrators can edit the terms of service.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Terms of Service Management</CardTitle>
        <CardDescription>
          Edit the terms of service content for your application. This will be displayed to all users.
          {termsOfService && (
            <span className="block mt-2 text-sm">
              Last updated: {new Date(termsOfService.last_updated).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter terms of service content (Markdown supported)..."
          className="min-h-[400px] font-mono text-sm"
        />
        
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Terms of Service"}
          </Button>
          
          <Button variant="outline" asChild>
            <Link to="/terms-of-service" target="_blank">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Link>
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p><strong>Tip:</strong> This editor supports Markdown formatting. Use # for headings, ** for bold text, and - for bullet points.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TermsOfServiceAdmin;