import { Link } from "react-router-dom";
import Logo from "@/components/branding/Logo";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { Skeleton } from "@/components/ui/skeleton";

interface PolicyData {
  id: string;
  content: string;
  last_updated: string;
}

const Footer = () => {
  const [termsData, setTermsData] = useState<PolicyData | null>(null);
  const [privacyData, setPrivacyData] = useState<PolicyData | null>(null);
  const [loading, setLoading] = useState({ terms: true, privacy: true });

  useEffect(() => {
    const loadPolicies = async () => {
      try {
        const [termsResult, privacyResult] = await Promise.all([
          supabase
            .from("terms_of_service")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(1)
            .single(),
          supabase
            .from("privacy_policy")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(1)
            .single()
        ]);

        if (!termsResult.error) setTermsData(termsResult.data);
        if (!privacyResult.error) setPrivacyData(privacyResult.data);
      } catch (error) {
        console.error("Error loading policies:", error);
      } finally {
        setLoading({ terms: false, privacy: false });
      }
    };

    loadPolicies();
  }, []);

  const navigationLinks = [
    { to: "/", label: "Home" },
    { to: "/chat", label: "Chat" },
    { to: "/help", label: "Get Help" },
    { to: "/quotes", label: "Quotes" },
    { to: "/profile", label: "Profile" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <footer className="border-t bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Logo className="h-8 w-8" />
              <span className="font-bold text-lg text-primary">Talk</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your mental health support companion. We're here to listen, support, and guide you through your journey.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Navigation</h3>
            <ul className="space-y-2">
              {navigationLinks.map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="text-sm text-muted-foreground hover:text-primary transition-colors text-left">
                      Privacy Policy
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Privacy Policy</DialogTitle>
                    </DialogHeader>
                    <div className="prose prose-sm max-w-none">
                      {loading.privacy ? (
                        <div className="space-y-3">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      ) : privacyData ? (
                        <ReactMarkdown>{privacyData.content}</ReactMarkdown>
                      ) : (
                        <p>Privacy policy not available.</p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </li>
              <li>
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="text-sm text-muted-foreground hover:text-primary transition-colors text-left">
                      Terms of Service
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Terms of Service</DialogTitle>
                    </DialogHeader>
                    <div className="prose prose-sm max-w-none">
                      {loading.terms ? (
                        <div className="space-y-3">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      ) : termsData ? (
                        <ReactMarkdown>{termsData.content}</ReactMarkdown>
                      ) : (
                        <p>Terms of service not available.</p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/contact" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link 
                  to="/help" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">Crisis Hotline: 988</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t pt-6 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Talk. All rights reserved. Not a substitute for professional medical advice.
            </p>
            <p className="text-xs text-muted-foreground">
              If you're in crisis, call emergency services or text 988 (US)
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;