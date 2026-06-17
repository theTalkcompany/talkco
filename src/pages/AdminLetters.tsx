import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Check, X, Flag, Mail } from "lucide-react";
import { format } from "date-fns";

type Letter = {
  id: string;
  opening: string;
  body: string;
  closing: string | null;
  word_count: number | null;
  status: string;
  flagged_keywords: string[] | null;
  created_at: string;
};

const REVIEWER_EMAIL = "demo@talkco.app";

export default function AdminLetters() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [stats, setStats] = useState({ pending: 0, available: 0, delivered: 0 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setAllowed(data.user?.email === REVIEWER_EMAIL);
    });
  }, []);

  const load = async () => {
    setLoading(true);
    const [{ data: pending }, { data: stat }] = await Promise.all([
      supabase.rpc("admin_list_pending_letters"),
      supabase.rpc("get_letters_stats"),
    ]);
    if (pending) setLetters(pending as Letter[]);
    if (stat) {
      const s = stat as { available: number; pending: number; delivered: number };
      setStats({ available: s.available, pending: s.pending, delivered: s.delivered });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (allowed) load();
  }, [allowed]);

  const moderate = async (id: string, action: "approve" | "reject" | "flag") => {
    setBusy(id);
    const { error } = await supabase.rpc("admin_moderate_letter", {
      _letter_id: id,
      _action: action,
    });
    setBusy(null);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title:
        action === "approve"
          ? "Approved · added to the pool"
          : action === "reject"
          ? "Rejected · removed quietly"
          : "Flagged for welfare follow-up",
    });
    load();
  };

  if (allowed === null) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center p-6">
        <Card className="max-w-md p-8 text-center">
          <h1 className="text-xl font-semibold">Not available</h1>
          <p className="text-sm text-muted-foreground mt-2">
            This page is for the letters reviewer only.
          </p>
          <Button className="mt-6" onClick={() => navigate("/letters")}>Back to Letters</Button>
        </Card>
      </main>
    );
  }

  return (
    <>
      <Helmet>
        <title>Letters · Moderation</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <main className="min-h-screen" style={{ background: "var(--gradient-letter)" }}>
        <div className="container mx-auto px-4 py-10 max-w-4xl">
          <header className="mb-6">
            <h1 className="font-handwriting text-4xl text-letter-ink">Letter moderation</h1>
            <p className="text-sm text-letter-ink/70 mt-1">
              {stats.pending} pending approval · {stats.available} approved in pool · {stats.delivered} delivered
            </p>
          </header>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : letters.length === 0 ? (
            <Card className="p-10 text-center bg-letter-cream border-letter-ink/10">
              <Mail className="h-8 w-8 mx-auto mb-2 text-letter-ink/60" />
              <p className="text-letter-ink/80">The queue is empty. Nicely done.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {letters.map((l) => (
                <Card key={l.id} className="p-6 bg-letter-cream border-letter-ink/10">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{l.word_count ?? 0} words</Badge>
                      <Badge variant="outline">{format(new Date(l.created_at), "PP p")}</Badge>
                      {l.flagged_keywords && l.flagged_keywords.length > 0 && (
                        <Badge variant="destructive">
                          Crisis language: {l.flagged_keywords.join(", ")}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="font-handwriting text-xl text-letter-ink">{l.opening}</p>
                  <p className="font-handwriting text-lg text-letter-ink mt-2 whitespace-pre-wrap leading-relaxed">
                    {l.body}
                  </p>
                  {l.closing && (
                    <p className="font-handwriting text-lg text-letter-ink mt-3">{l.closing}</p>
                  )}

                  <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-letter-ink/10">
                    <Button
                      size="sm"
                      onClick={() => moderate(l.id, "approve")}
                      disabled={busy === l.id}
                    >
                      <Check className="h-4 w-4" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moderate(l.id, "reject")}
                      disabled={busy === l.id}
                    >
                      <X className="h-4 w-4" /> Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => moderate(l.id, "flag")}
                      disabled={busy === l.id}
                    >
                      <Flag className="h-4 w-4" /> Flag for follow-up
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
