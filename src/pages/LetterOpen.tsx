import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Heart, Mail, PenLine, X } from "lucide-react";

type Letter = {
  id: string;
  opening: string;
  body: string;
  closing: string | null;
};

type Stage = "loading" | "envelope" | "opening" | "letter" | "empty" | "unauth";

export default function LetterOpen() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stage, setStage] = useState<Stage>("loading");
  const [letter, setLetter] = useState<Letter | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user?.id ?? null;
      if (cancelled) return;
      if (!uid) {
        setStage("unauth");
        return;
      }
      setUserId(uid);

      // gentle delay so loading animation is felt
      await new Promise((r) => setTimeout(r, 1400));

      const { data, error } = await supabase.rpc("claim_random_letter");
      if (cancelled) return;
      if (error) {
        toast({
          title: "Couldn't fetch a letter",
          description: error.message,
          variant: "destructive",
        });
        setStage("empty");
        return;
      }
      if (!data) {
        setStage("empty");
        return;
      }
      setLetter(data as Letter);
      setStage("envelope");
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const openEnvelope = () => {
    setStage("opening");
    setTimeout(() => setStage("letter"), 1800);
  };

  const saveLetter = async () => {
    if (!letter || !userId || saved) return;
    const { error } = await supabase
      .from("saved_letters")
      .insert({ user_id: userId, letter_id: letter.id });
    if (error) {
      toast({
        title: "Couldn't save",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    setSaved(true);
    toast({ title: "Letter saved 💜", description: "Find it again in My Letters." });
  };

  return (
    <>
      <Helmet>
        <title>Your letter · Talkco</title>
        <meta name="description" content="Open a letter written for you by a stranger." />
      </Helmet>

      <style>{`
        @keyframes rock {
          0%, 100% { transform: rotate(-4deg); }
          50% { transform: rotate(4deg); }
        }
        @keyframes flap-open {
          0% { transform: rotateX(0deg); }
          100% { transform: rotateX(-180deg); }
        }
        @keyframes letter-rise {
          0% { transform: translateY(40px) scale(0.85); opacity: 0; }
          40% { opacity: 1; }
          100% { transform: translateY(-340px) scale(1); opacity: 1; }
        }
        @keyframes envelope-fade {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes paper-unfold {
          0% { transform: scaleY(0.4) translateY(20px); opacity: 0; }
          100% { transform: scaleY(1) translateY(0); opacity: 1; }
        }
        .envelope-rock { animation: rock 2.4s ease-in-out infinite; transform-origin: center bottom; }
        .flap-opening { animation: flap-open 1.2s ease-in-out forwards; transform-origin: top; backface-visibility: hidden; }
        .letter-rising { animation: letter-rise 1.6s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .envelope-fading { animation: envelope-fade 1.6s ease-out forwards; animation-delay: 0.6s; }
        .paper-unfolding { animation: paper-unfold 0.8s cubic-bezier(0.22, 1, 0.36, 1) both; transform-origin: top; }
      `}</style>

      <main
        className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden"
        style={{ background: "linear-gradient(180deg, #fdf8f0 0%, #f5ebd9 100%)" }}
      >
        {/* Close link */}
        <button
          onClick={() => navigate("/letters")}
          className="absolute top-5 right-5 text-letter-ink/60 hover:text-letter-ink text-sm flex items-center gap-1 z-50"
          aria-label="Close"
        >
          <X className="h-4 w-4" /> Close
        </button>

        {stage === "unauth" && (
          <div className="text-center max-w-md">
            <Mail className="mx-auto h-12 w-12 text-letter-ink/40 mb-4" />
            <p className="font-handwriting text-3xl text-letter-ink">Please sign in to receive a letter.</p>
            <Button className="mt-6" onClick={() => navigate("/auth")}>Sign in</Button>
          </div>
        )}

        {stage === "loading" && (
          <div className="text-center">
            <div className="envelope-rock inline-block">
              <Envelope />
            </div>
            <p className="font-handwriting text-2xl text-letter-ink/70 mt-8">
              Finding a letter just for you…
            </p>
          </div>
        )}

        {stage === "empty" && (
          <div className="text-center max-w-md animate-fade-in">
            <Mail className="mx-auto h-14 w-14 text-letter-ink/40 mb-5" />
            <p className="font-handwriting text-3xl text-letter-ink leading-snug">
              The mailbox is quiet right now 💌
            </p>
            <p className="font-handwriting text-2xl text-letter-ink/80 mt-3">
              Be the first to leave something for someone else.
            </p>
            <div className="flex gap-3 justify-center mt-8">
              <Button onClick={() => navigate("/letters")} variant="outline">Back</Button>
              <Button onClick={() => navigate("/letters?tab=write")}>
                <PenLine className="h-4 w-4" /> Write a letter
              </Button>
            </div>
          </div>
        )}

        {(stage === "envelope" || stage === "opening") && (
          <div className="text-center relative" style={{ perspective: "1400px" }}>
            <div
              className={`relative inline-block ${stage === "opening" ? "envelope-fading" : ""}`}
            >
              <Envelope opening={stage === "opening"} />
            </div>

            {stage === "envelope" && (
              <div className="mt-10 animate-fade-in">
                <p className="font-handwriting text-3xl text-letter-ink">
                  Someone wrote this for you 💌
                </p>
                <Button size="lg" className="mt-6 h-14 px-8 text-base" onClick={openEnvelope}>
                  Open your letter
                </Button>
              </div>
            )}

            {/* Letter sliding out */}
            {stage === "opening" && letter && (
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 letter-rising pointer-events-none"
                style={{ width: "min(420px, 80vw)" }}
              >
                <div
                  className="rounded-md shadow-2xl p-5 text-left"
                  style={{
                    background: "repeating-linear-gradient(transparent, transparent 26px, rgba(80,50,20,0.08) 27px)",
                    backgroundColor: "#fdf8ec",
                    border: "1px solid rgba(80,50,20,0.12)",
                  }}
                >
                  <p className="font-handwriting text-xl text-letter-ink">Dear Stranger,</p>
                  <p className="font-handwriting text-lg text-letter-ink/80 mt-2 line-clamp-3">
                    {letter.body}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {stage === "letter" && letter && (
          <div className="w-full max-w-2xl mx-auto paper-unfolding">
            <div
              className="rounded-lg shadow-2xl p-8 sm:p-12"
              style={{
                background: "repeating-linear-gradient(transparent, transparent 30px, rgba(80,50,20,0.08) 31px)",
                backgroundColor: "#fdf8ec",
                border: "1px solid rgba(80,50,20,0.15)",
              }}
            >
              <p className="font-handwriting text-3xl text-letter-ink">Dear Stranger,</p>
              <p
                className="font-handwriting text-2xl text-letter-ink mt-6 whitespace-pre-wrap"
                style={{ lineHeight: "31px" }}
              >
                {letter.body}
              </p>
              {letter.closing && (
                <p className="font-handwriting text-2xl text-letter-ink mt-8">{letter.closing}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
              <Button
                variant={saved ? "secondary" : "outline"}
                onClick={saveLetter}
                disabled={saved}
              >
                <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
                {saved ? "Saved 💜" : "Save this letter 💜"}
              </Button>
              <Button onClick={() => navigate("/letters?tab=write")}>
                <PenLine className="h-4 w-4" /> Write one back to the world ✍️
              </Button>
              <button
                onClick={() => navigate("/letters")}
                className="text-sm text-letter-ink/70 underline-offset-4 hover:underline px-3 py-2"
              >
                Close
              </button>
            </div>
            <p className="text-center text-xs text-letter-ink/60 mt-6">
              Once you leave this page, this letter is gone — unless you save it.
            </p>
          </div>
        )}
      </main>
    </>
  );
}

function Envelope({ opening = false }: { opening?: boolean }) {
  return (
    <svg
      width="220"
      height="160"
      viewBox="0 0 220 160"
      style={{ filter: "drop-shadow(0 12px 24px rgba(80,50,20,0.18))" }}
    >
      {/* Envelope body */}
      <rect x="10" y="40" width="200" height="110" rx="6" fill="#e9d9b8" stroke="#b89968" strokeWidth="1.5" />
      {/* Inner fold lines */}
      <path d="M10 150 L110 95 L210 150" fill="#e0cda3" stroke="#b89968" strokeWidth="1" />
      <path d="M10 40 L110 110 L210 40" fill="#f0e2c2" stroke="#b89968" strokeWidth="1" />
      {/* Top flap */}
      <g
        className={opening ? "flap-opening" : ""}
        style={{ transformOrigin: "110px 40px" }}
      >
        <path
          d="M10 40 L110 110 L210 40 Z"
          fill="#ecdcb7"
          stroke="#b89968"
          strokeWidth="1.5"
        />
      </g>
      {/* Wax seal */}
      {!opening && (
        <g>
          <circle cx="110" cy="95" r="16" fill="#a13a3a" stroke="#7a2828" strokeWidth="1.5" />
          <text
            x="110"
            y="100"
            textAnchor="middle"
            fontSize="14"
            fill="#fde8e8"
            fontFamily="serif"
            fontStyle="italic"
          >
            T
          </text>
        </g>
      )}
    </svg>
  );
}
