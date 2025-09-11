import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PrivacyPolicyData {
  id: string;
  content: string;
  last_updated: string;
}

const PrivacyPolicy = () => {
  const [privacyPolicy, setPrivacyPolicy] = useState<PrivacyPolicyData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadPrivacyPolicy = async () => {
      try {
        const { data, error } = await supabase
          .from("privacy_policy")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (error) {
          console.error("Error loading privacy policy:", error);
          toast({
            title: "Error",
            description: "Failed to load privacy policy",
            variant: "destructive",
          });
          return;
        }

        setPrivacyPolicy(data);
      } catch (error) {
        console.error("Error loading privacy policy:", error);
        toast({
          title: "Error",
          description: "Failed to load privacy policy",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadPrivacyPolicy();
  }, [toast]);

  return (
    <>
      <Helmet>
        <title>Privacy Policy - Talk</title>
        <meta name="description" content="Privacy Policy for Talk mental health support platform. Learn how we protect and handle your personal information." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="/privacy-policy" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <Button variant="ghost" asChild className="mb-4">
              <Link to="/help" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Help
              </Link>
            </Button>
            
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Privacy Policy
            </h1>
            
            {privacyPolicy && (
              <p className="text-muted-foreground">
                Last updated: {new Date(privacyPolicy.last_updated).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            )}
          </div>

          <div className="prose prose-lg max-w-none">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : privacyPolicy ? (
              <div className="text-foreground space-y-6">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h2 className="text-2xl font-bold mb-4 text-foreground">{children}</h2>,
                    h2: ({ children }) => <h3 className="text-xl font-semibold mb-3 text-foreground">{children}</h3>,
                    h3: ({ children }) => <h4 className="text-lg font-semibold mb-2 text-foreground">{children}</h4>,
                    p: ({ children }) => <p className="mb-4 text-foreground leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
                    li: ({ children }) => <li className="text-foreground">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                  }}
                >
                  {privacyPolicy.content}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Privacy policy not found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;