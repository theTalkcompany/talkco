import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Heart, Loader2, Mail, PenLine } from "lucide-react";

type Letter = {
  id: string;
  opening: string;
  body: string;
  closing: string | null;
};

interface Props {
  userId: string;
  onWriteBack?: () => void;
}

export default function LetterReceiver({ userId, onWriteBack }: Props) {
  const { toast } = useToast();
  const [stage, setStage] = useState<"idle" | "loading" | "opening" | "open" | "empty">("idle");
  const [letter, setLetter] = useState<Letter | null>(null);
  const [saved, setSaved] = useState(false);

  const requestLetter = async () => {
    setStage("loading");
    setSaved(false);
    // gentle delay so it feels like searching
    await new Promise((r) => setTimeout(r, 1400));
    const { data, error } = await supabase.rpc("claim_random_letter");
    if (error) {
      toast({ title: "Couldn't fetch a letter", description: error.message, variant: "destructive" });
      setStage("idle");
      return;
    }
    if (!data) {
      setStage("empty");
      return;
    }
    setLetter(data as Letter);
    setStage("opening");
    setTimeout(() => setStage("open"), 1200);
  };

  const save = async () => {
    if (!letter || saved) return;
    const { error } = await supabase
      .from("saved_letters")
      .insert({ user_id: userId, letter_id: letter.id });
    if (error) {
      toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
      return;
    }
    setSaved(true);
    toast({ title: "Letter saved 💜", description: "Find it again in My Letters." });
  };

  if (stage === "idle") {
    return (
      <div className="text-center max-w-md mx-auto">
        <Button size="lg" onClick={requestLetter} className="h-14 px-8 text-base">
          <Mail className="h-5 w-5" /> I need a letter
        </Button>
        <p className="text-sm text-muted-foreground mt-4">
          You'll receive one anonymous letter, written for someone like you.
        </p>
      </div>
    );
  }

  if (stage === "loading") {
    return (
      <Card className="p-10 text-center max-w-md mx-auto bg-letter-cream border-letter-ink/10">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-letter-ink/60" />
        <p className="font-handwriting text-2xl text-letter-ink mt-4">
          Finding a letter just for you…
        </p>
      </Card>
    );
  }

  if (stage === "empty") {
    return (
      <Card className="p-10 text-center max-w-md mx-auto bg-letter-cream border-letter-ink/10">
        <Mail className="mx-auto h-10 w-10 text-letter-ink/50 mb-3" />
        <p className="font-handwriting text-2xl text-letter-ink">
          The mailbox is quiet right now —
        </p>
        <p className="font-handwriting text-xl text-letter-ink/80 mt-1">
          but you could be the first to leave something for someone else.
        </p>
        <Button className="mt-6" onClick={onWriteBack}>
          <PenLine className="h-4 w-4" /> Write a letter
        </Button>
      </Card>
    );
  }

  // opening / open
  return (
    <div className="max-w-2xl mx-auto">
      <div className="relative" style={{ perspective: "1200px" }}>
        {stage === "opening" && (
          <div className="relative h-64 mx-auto w-full max-w-md">
            <div
              className="absolute inset-0 rounded-lg bg-letter-lavender border border-letter-ink/15 origin-top"
              style={{
                transformStyle: "preserve-3d",
                animation: "envelope-flap 1.1s ease-in forwards",
                clipPath: "polygon(0 0, 100% 0, 50% 60%)",
              }}
            />
            <div className="absolute inset-x-0 bottom-0 h-2/3 rounded-b-lg bg-letter-cream border border-letter-ink/15" />
            <Mail className="absolute inset-0 m-auto h-10 w-10 text-letter-ink/50" />
          </div>
        )}
        {stage === "open" && letter && (
          <Card
            className="letter-paper p-8 sm:p-10 animate-fade-in"
            style={{ animation: "letter-rise 0.6s ease-out both" }}
          >
            <p className="font-handwriting text-2xl text-letter-ink">{letter.opening}</p>
            <p className="font-handwriting text-2xl text-letter-ink mt-4 whitespace-pre-wrap leading-7" style={{ lineHeight: "1.75rem" }}>
              {letter.body}
            </p>
            {letter.closing && (
              <p className="font-handwriting text-2xl text-letter-ink mt-6">{letter.closing}</p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-8 pt-4 border-t border-letter-ink/10">
              <Button
                variant={saved ? "secondary" : "outline"}
                onClick={save}
                disabled={saved}
              >
                <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
                {saved ? "Saved" : "Save this letter"}
              </Button>
              <Button onClick={onWriteBack}>
                <PenLine className="h-4 w-4" /> Write one back to the world
              </Button>
            </div>
            <p className="text-xs text-letter-ink/60 mt-4">
              Once you leave this page, this letter is gone — unless you save it.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
