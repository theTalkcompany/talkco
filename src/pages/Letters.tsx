import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Mail, PenLine, Inbox, Heart, Feather, Clock, Sparkles } from "lucide-react";
import LetterComposer from "@/components/letters/LetterComposer";
import LetterReceiver from "@/components/letters/LetterReceiver";
import MyLetters from "@/components/letters/MyLetters";

export default function Letters() {
  const [userId, setUserId] = useState<string | null>(null);
  const [waitingCount, setWaitingCount] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [tab, setTab] = useState("home");
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
      setChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchCount = async () => {
      const { data } = await supabase.rpc("get_letters_stats");
      if (data && typeof data === "object") {
        const s = data as { available?: number };
        setWaitingCount(s.available ?? 0);
      }
    };
    fetchCount();
    const t = setInterval(fetchCount, 30000);
    return () => clearInterval(t);
  }, []);


  if (checked && !userId) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center p-6" style={{ background: "var(--gradient-letter)" }}>
        <Card className="max-w-md p-8 text-center bg-letter-cream border-letter-ink/10">
          <Mail className="h-10 w-10 mx-auto mb-3 text-letter-ink/60" />
          <h1 className="font-handwriting text-3xl text-letter-ink">Letters to Strangers</h1>
          <p className="mt-3 text-letter-ink/80">Sign in to write or receive a letter.</p>
          <Button className="mt-6" onClick={() => navigate("/auth")}>Sign in</Button>
        </Card>
      </main>
    );
  }

  return (
    <>
      <Helmet>
        <title>Letters to Strangers · Talkco</title>
        <meta name="description" content="Write a letter for a stranger who needs it. Request one when you do. Anonymous, gentle, one-of-a-kind letters." />
        <link rel="canonical" href="/letters" />
      </Helmet>

      <main className="min-h-screen" style={{ background: "var(--gradient-letter)" }}>
        <section className="container mx-auto px-4 py-10 sm:py-14">
          <header className="text-center max-w-2xl mx-auto mb-10 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-letter-cream/80 border border-letter-ink/10 text-letter-ink text-xs font-medium">
              💌 A quieter corner of Talkco
            </div>
            <h1 className="font-handwriting text-5xl sm:text-6xl text-letter-ink mt-4 leading-tight">
              Letters to Strangers
            </h1>
            <p className="font-handwriting text-2xl text-letter-ink/80 mt-3">
              Write a letter for a stranger who needs it.<br />Request one when you do.
            </p>
          </header>

          <Tabs value={tab} onValueChange={setTab} className="max-w-4xl mx-auto">
            <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto bg-letter-cream/70 border border-letter-ink/10">
              <TabsTrigger value="home"><Mail className="h-4 w-4 mr-1" /> Home</TabsTrigger>
              <TabsTrigger value="write"><PenLine className="h-4 w-4 mr-1" /> Write</TabsTrigger>
              <TabsTrigger value="mine"><Heart className="h-4 w-4 mr-1" /> Mine</TabsTrigger>
            </TabsList>

            <TabsContent value="home" className="mt-8">
              <div className="grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
                <Card className="p-8 bg-letter-cream border-letter-ink/10 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setTab("write")}>
                  <PenLine className="h-8 w-8 text-letter-ink mb-3" />
                  <h2 className="font-handwriting text-3xl text-letter-ink">Write a Letter</h2>
                  <p className="text-sm text-letter-ink/80 mt-2">
                    Leave a few warm words for someone you'll never meet.
                  </p>
                  <Button className="mt-5">Start writing</Button>
                </Card>

                <Card className="p-8 bg-letter-lavender/60 border-letter-ink/10 hover:shadow-lg transition-shadow">
                  <Inbox className="h-8 w-8 text-letter-ink mb-3" />
                  <h2 className="font-handwriting text-3xl text-letter-ink">I need a letter</h2>
                  <p className="text-sm text-letter-ink/80 mt-2">
                    Open one anonymous letter, written for someone like you.
                  </p>
                  <div className="mt-5">
                    {userId && <LetterReceiver userId={userId} onWriteBack={() => setTab("write")} />}
                  </div>
                </Card>
              </div>

              <p className="text-center text-xs text-letter-ink/60 mt-10 max-w-md mx-auto">
                Letters are anonymous and reviewed for safety. Each letter is
                delivered to one stranger only — like a real one.
              </p>
            </TabsContent>

            <TabsContent value="write" className="mt-8">
              {userId && <LetterComposer userId={userId} onSent={() => { /* stay on tab to show confirmation */ }} />}
            </TabsContent>

            <TabsContent value="mine" className="mt-8">
              {userId && <MyLetters userId={userId} />}
            </TabsContent>
          </Tabs>

          <div className="text-center mt-12">
            <Link to="/chat" className="text-sm text-letter-ink/70 underline-offset-4 hover:underline">
              Back to Talkco
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
