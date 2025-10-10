import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { getDailyQuote, type Quote } from "@/data/quotes";
import { supabase } from "@/integrations/supabase/client";
import AdminQuotes from "@/components/admin/AdminQuotes";
import { Button } from "@/components/ui/button";
import { Settings, Share2 } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useNativeShare } from "@/hooks/useNativeShare";
import { useHaptics } from "@/hooks/useHaptics";
import { useToast } from "@/hooks/use-toast";

const Quotes = () => {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const { isAdmin: userIsAdmin } = useUserRole();
  const { shareQuote } = useNativeShare();
  const { impact, notification } = useHaptics();
  const { toast } = useToast();

  const handleShare = async () => {
    if (!quote) return;
    
    await impact('light');
    const result = await shareQuote(quote.text, quote.author);
    
    if (result === 'clipboard') {
      toast({
        title: "Copied to clipboard",
        description: "Quote copied! Share it with someone who needs it.",
      });
      await notification('success');
    } else if (result) {
      await notification('success');
    }
  };

  useEffect(() => {
    const loadQuote = async () => {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      
      // Get personalized daily quote
      const dailyQuote = await getDailyQuote(userId);
      setQuote(dailyQuote);
      
      setLoading(false);
    };

    loadQuote();
  }, []);

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Quotes — Talk</title>
        </Helmet>
        <section className="surface-card p-6 max-w-2xl mx-auto text-center">
          <p>Loading your daily encouragement...</p>
        </section>
      </>
    );
  }

  if (showAdmin && userIsAdmin) {
    return (
      <>
        <Helmet>
          <title>Admin - Quotes — Talk</title>
        </Helmet>
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Quote Management</h1>
            <Button onClick={() => setShowAdmin(false)} variant="outline">
              Back to Quotes
            </Button>
          </div>
          <AdminQuotes />
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Quotes — Talk</title>
        <meta name="description" content="Receive a daily uplifting quote or poem to brighten your day." />
        <link rel="canonical" href="/quotes" />
      </Helmet>

      <section className="surface-card p-6 max-w-2xl mx-auto text-center">
        <div className="flex items-center justify-center mb-4">
          <h1 className="text-3xl font-bold">Today's Encouragement</h1>
          {userIsAdmin && (
            <Button
              onClick={() => setShowAdmin(true)}
              variant="ghost"
              size="sm"
              className="ml-4"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="mt-2 text-muted-foreground">Saved just for you today.</p>
        {quote && (
          <>
            <blockquote className="mt-6 text-xl leading-relaxed">"{quote.text}"</blockquote>
            <cite className="block mt-2 text-sm text-muted-foreground">— {quote.author}</cite>
            <Button 
              onClick={handleShare}
              variant="outline"
              className="mt-6 gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share Quote
            </Button>
          </>
        )}
        <p className="mt-6 text-sm text-muted-foreground">New quote unlocks tomorrow. Keep going—you're doing great.</p>
      </section>
    </>
  );
};

export default Quotes;