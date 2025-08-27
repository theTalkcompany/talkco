import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { getDailyQuote, isAdmin, type Quote } from "@/data/quotes";
import { supabase } from "@/integrations/supabase/client";
import AdminQuotes from "@/components/admin/AdminQuotes";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

const Quotes = () => {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [userIsAdmin, setUserIsAdmin] = useState(false);

  useEffect(() => {
    const loadQuoteAndCheckAdmin = async () => {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      
      // Check if user is admin
      const adminStatus = await isAdmin();
      setUserIsAdmin(adminStatus);
      
      // Get personalized daily quote
      const dailyQuote = await getDailyQuote(userId);
      setQuote(dailyQuote);
      
      setLoading(false);
    };

    loadQuoteAndCheckAdmin();
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
          </>
        )}
        <p className="mt-6 text-sm text-muted-foreground">New quote unlocks tomorrow. Keep going—you're doing great.</p>
      </section>
    </>
  );
};

export default Quotes;