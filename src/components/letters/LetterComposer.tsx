import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { containsCrisisLanguage } from "@/lib/crisisDetection";
import { Lightbulb, Mail, Loader2, Sparkles } from "lucide-react";

interface Props {
  userId: string;
  onSent?: () => void;
}

export default function LetterComposer({ userId, onSent }: Props) {
  const { toast } = useToast();
  const [opening, setOpening] = useState("Dear Stranger,");
  const [body, setBody] = useState("");
  const [closing, setClosing] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const wordCount = useMemo(
    () => body.trim().split(/\s+/).filter(Boolean).length,
    [body]
  );
  const canSend = wordCount >= 30 && !sending;

  const send = async () => {
    setSending(true);
    const flagged = containsCrisisLanguage(`${body} ${closing}`);
    const { data: inserted, error } = await supabase
      .from("letters")
      .insert({
        author_id: userId,
        opening: opening.trim() || "Dear Stranger,",
        body: body.trim(),
        closing: closing.trim() || null,
      })
      .select("id")
      .single();
    if (error) {
      setSending(false);
      toast({ title: "Couldn't send", description: error.message, variant: "destructive" });
      return;
    }

    // Fire-and-forget moderation email
    if (inserted?.id) {
      supabase.functions.invoke("submit-letter-review", {
        body: { letterId: inserted.id },
      }).catch((e) => console.error("submit-letter-review failed", e));
    }

    setSending(false);
    setSent(true);
    if (flagged) {
      toast({
        title: "Held for a gentle review",
        description: "Your letter mentioned something serious, so a moderator will glance at it before it's delivered. Thank you for reaching out.",
      });
    }
    onSent?.();
  };

  if (sent) {
    return (
      <Card className="letter-paper p-10 text-center max-w-2xl mx-auto animate-fade-in">
        <Mail className="mx-auto h-12 w-12 text-letter-ink mb-4" />
        <p className="font-handwriting text-3xl text-letter-ink leading-snug">
          Your letter has been sealed 💌
        </p>
        <p className="font-handwriting text-2xl text-letter-ink/80 mt-2">
          Someone out there will read this when they need it most.
        </p>
        <Button
          variant="outline"
          className="mt-8"
          onClick={() => {
            setSent(false);
            setBody("");
            setClosing("");
            setOpening("Dear Stranger,");
          }}
        >
          Write another
        </Button>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px] max-w-4xl mx-auto">
      <Card className="letter-paper p-6 sm:p-10 animate-fade-in">
        <Input
          value={opening}
          onChange={(e) => setOpening(e.target.value)}
          className="font-handwriting text-2xl bg-transparent border-0 border-b border-letter-ink/20 rounded-none px-0 focus-visible:ring-0 focus-visible:border-letter-ink/40 text-letter-ink placeholder:text-letter-ink/40"
          placeholder="Dear Stranger,"
        />
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write whatever feels true today…"
          rows={12}
          className="font-handwriting text-2xl leading-7 bg-transparent border-0 px-0 mt-4 focus-visible:ring-0 resize-none text-letter-ink placeholder:text-letter-ink/40"
          style={{ lineHeight: "1.75rem", fontSize: "1.5rem" }}
        />
        <Input
          value={closing}
          onChange={(e) => setClosing(e.target.value)}
          placeholder="With warmth, a stranger"
          className="font-handwriting text-2xl bg-transparent border-0 border-t border-letter-ink/20 rounded-none px-0 mt-4 focus-visible:ring-0 focus-visible:border-letter-ink/40 text-letter-ink placeholder:text-letter-ink/40"
        />
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-letter-ink/70">
            {wordCount} words {wordCount < 30 && <span>· at least 30 to send</span>}
            {wordCount >= 30 && wordCount < 50 && <span> · try for 50+</span>}
          </p>
          <Button onClick={send} disabled={!canSend} size="lg">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Seal & Send
          </Button>
        </div>
      </Card>

      <aside className="space-y-4">
        <Card className="p-5 bg-letter-lavender/40 border-letter-lavender">
          <div className="flex items-center gap-2 text-letter-ink font-semibold mb-2">
            <Lightbulb className="h-4 w-4" /> Not sure what to write?
          </div>
          <p className="text-sm text-letter-ink/80 leading-relaxed mb-2">Try:</p>
          <ul className="text-sm text-letter-ink/80 leading-relaxed space-y-1.5 list-disc list-inside marker:text-letter-ink/40">
            <li>something that helped you through a hard time</li>
            <li>words you wish someone had said to you</li>
            <li>a small moment of joy you want to share</li>
            <li>or simply — <em>I see you, and you matter.</em></li>
          </ul>
        </Card>

        <Card className="p-5 bg-letter-cream border-letter-ink/10">
          <p className="text-xs text-letter-ink/70 leading-relaxed">
            Letters are anonymous and delivered to one stranger. Please don't
            include personal contact details. If you're in crisis, please reach
            out to a helpline — your letter can wait.
          </p>
        </Card>
      </aside>
    </div>
  );
}
