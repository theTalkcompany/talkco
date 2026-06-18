import { useEffect, useMemo, useState } from "react";
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

type Stage =
  | "loading"      // 0–2s: envelope rocking, searching
  | "flap"         // 2–3s: flap lifts open
  | "rising"       // 3–4.5s: paper rises out, unfolding
  | "transition"   // 4.5–5.2s: envelope fades, letter scales up
  | "reading"      // letter visible, text fades in line by line
  | "empty"
  | "unauth";

export default function LetterOpen() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stage, setStage] = useState<Stage>("loading");
  const [letter, setLetter] = useState<Letter | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [visibleLines, setVisibleLines] = useState(0);

  // Fetch letter
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

      const { data, error } = await supabase.rpc("claim_random_letter");
      if (cancelled) return;

      if (error) {
        console.error("[LetterOpen] claim_random_letter error:", error);
        toast({
          title: "Couldn't fetch a letter",
          description: error.message,
          variant: "destructive",
        });
        setStage("empty");
        return;
      }

      // RPC may return single object or array depending on PostgREST
      const row = Array.isArray(data) ? data[0] : data;
      if (!row || !row.body) {
        setStage("empty");
        return;
      }

      setLetter({
        id: row.id,
        opening: row.opening ?? "Dear Stranger,",
        body: row.body,
        closing: row.closing ?? null,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  // Drive animation stages once letter is loaded
  useEffect(() => {
    if (!letter || stage !== "loading") return;
    const t1 = setTimeout(() => setStage("flap"), 2000);
    const t2 = setTimeout(() => setStage("rising"), 3000);
    const t3 = setTimeout(() => setStage("transition"), 4500);
    const t4 = setTimeout(() => setStage("reading"), 5400);
    return () => {
      [t1, t2, t3, t4].forEach(clearTimeout);
    };
  }, [letter, stage]);

  // Split body into lines for staggered fade-in
  const lines = useMemo(() => {
    if (!letter) return [];
    // split by sentences (rough) so we get a line-by-line reveal
    return letter.body
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [letter]);

  useEffect(() => {
    if (stage !== "reading") return;
    setVisibleLines(1); // opening + first line in immediately
    let i = 1;
    const interval = setInterval(() => {
      i++;
      setVisibleLines(i);
      if (i >= lines.length + 2) clearInterval(interval);
    }, 450);
    return () => clearInterval(interval);
  }, [stage, lines.length]);

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

  const showingEnvelope =
    stage === "loading" || stage === "flap" || stage === "rising" || stage === "transition";

  return (
    <>
      <Helmet>
        <title>Your letter · Talkco</title>
        <meta name="description" content="Open a letter written for you by a stranger." />
      </Helmet>

      <style>{`
        @keyframes rock {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        @keyframes flap-open {
          0% { transform: rotateX(0deg); }
          100% { transform: rotateX(-175deg); }
        }
        @keyframes paper-rise {
          0%   { transform: translate(-50%, 10%) scaleY(0.35); opacity: 0; }
          25%  { opacity: 1; }
          60%  { transform: translate(-50%, -55%) scaleY(0.85); }
          100% { transform: translate(-50%, -110%) scaleY(1); opacity: 1; }
        }
        @keyframes envelope-out {
          0%   { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(80px) scale(0.85); opacity: 0; }
        }
        @keyframes letter-grow {
          0%   { transform: translate(-50%, -110%) scale(1); }
          100% { transform: translate(-50%, -50%) scale(1.15); }
        }
        @keyframes line-in {
          0%   { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .anim-rock { animation: rock 2s ease-in-out infinite; transform-origin: center bottom; }
        .anim-flap { animation: flap-open 1s cubic-bezier(0.4, 0, 0.2, 1) forwards; transform-origin: top center; }
        .anim-rise { animation: paper-rise 1.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .anim-envelope-out { animation: envelope-out 0.9s ease-in forwards; }
        .anim-letter-grow { animation: letter-grow 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .anim-line { animation: line-in 0.6s ease-out forwards; }

        .stage {
          perspective: 1400px;
          position: relative;
          width: 280px;
          height: 200px;
        }
      `}</style>

      <main
        className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden"
        style={{ background: "linear-gradient(180deg, #fdf8f0 0%, #f5ebd9 100%)" }}
      >
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
            <p className="font-handwriting text-3xl text-letter-ink">
              Please sign in to receive a letter.
            </p>
            <Button className="mt-6" onClick={() => navigate("/auth")}>Sign in</Button>
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

        {showingEnvelope && (
          <div className="flex flex-col items-center">
            <div className="stage">
              {/* Envelope */}
              <div
                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${
                  stage === "loading" ? "anim-rock" : ""
                } ${stage === "transition" ? "anim-envelope-out" : ""}`}
              >
                <Envelope flapOpen={stage === "flap" || stage === "rising" || stage === "transition"} />
              </div>

              {/* Folded paper rising from envelope */}
              {(stage === "rising" || stage === "transition") && letter && (
                <div
                  className="absolute left-1/2 top-1/2 anim-rise"
                  style={{ width: 200, transformOrigin: "center bottom", zIndex: 5 }}
                >
                  <div
                    className="rounded-sm shadow-xl px-3 py-3 text-left"
                    style={{
                      background: "#fdf8ec",
                      border: "1px solid rgba(80,50,20,0.18)",
                      minHeight: 140,
                    }}
                  >
                    <p
                      className="font-handwriting text-letter-ink"
                      style={{ fontSize: 13, lineHeight: "16px" }}
                    >
                      {letter.opening}
                    </p>
                    <p
                      className="font-handwriting text-letter-ink/80 mt-1"
                      style={{ fontSize: 11, lineHeight: "14px" }}
                    >
                      {letter.body.slice(0, 80)}…
                    </p>
                  </div>
                </div>
              )}
            </div>

            <p className="font-handwriting text-2xl text-letter-ink/70 mt-10 text-center">
              {stage === "loading"
                ? "Finding a letter just for you…"
                : stage === "flap"
                ? "Opening…"
                : "A letter for you 💌"}
            </p>
          </div>
        )}

        {stage === "reading" && letter && (
          <div className="w-full max-w-2xl mx-auto animate-fade-in">
            <div
              className="rounded-lg shadow-2xl p-8 sm:p-12"
              style={{
                background:
                  "repeating-linear-gradient(transparent, transparent 30px, rgba(80,50,20,0.08) 31px)",
                backgroundColor: "#fdf8ec",
                border: "1px solid rgba(80,50,20,0.15)",
                minHeight: "60vh",
              }}
            >
              <p
                className="font-handwriting text-3xl text-letter-ink anim-line"
                style={{ animationDelay: "0ms" }}
              >
                {letter.opening}
              </p>

              <div className="mt-6 space-y-3">
                {lines.map((line, i) => (
                  <p
                    key={i}
                    className="font-handwriting text-2xl text-letter-ink anim-line"
                    style={{
                      lineHeight: "34px",
                      opacity: visibleLines > i ? undefined : 0,
                      animationDelay: `${i * 350}ms`,
                    }}
                  >
                    {line}
                  </p>
                ))}
              </div>

              {letter.closing && (
                <p
                  className="font-handwriting text-2xl text-letter-ink mt-10 anim-line"
                  style={{
                    opacity: visibleLines > lines.length ? undefined : 0,
                    animationDelay: `${lines.length * 350 + 200}ms`,
                  }}
                >
                  {letter.closing}
                </p>
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
              <Button variant="ghost" onClick={() => navigate("/letters")}>
                Close
              </Button>
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

function Envelope({ flapOpen = false }: { flapOpen?: boolean }) {
  return (
    <svg
      width="260"
      height="190"
      viewBox="0 0 260 190"
      style={{ filter: "drop-shadow(0 14px 28px rgba(80,50,20,0.22))", overflow: "visible" }}
    >
      {/* Back of envelope (behind paper) */}
      <rect x="10" y="50" width="240" height="130" rx="8" fill="#e9d9b8" stroke="#b89968" strokeWidth="1.5" />
      {/* Inner fold lines */}
      <path d="M10 180 L130 115 L250 180" fill="#e0cda3" stroke="#b89968" strokeWidth="1" />
      {/* Front pocket (in front of paper for tucked look) */}
      <path
        d="M10 180 L130 115 L250 180 L250 180 L10 180 Z"
        fill="#e0cda3"
        stroke="#b89968"
        strokeWidth="1"
      />
      {/* Top flap — animates open */}
      <g
        className={flapOpen ? "anim-flap" : ""}
        style={{ transformOrigin: "130px 50px", transformBox: "fill-box" as never }}
      >
        <path
          d="M10 50 L130 130 L250 50 Z"
          fill="#ecdcb7"
          stroke="#b89968"
          strokeWidth="1.5"
        />
        {/* Wax seal on flap */}
        {!flapOpen && (
          <g>
            <circle cx="130" cy="110" r="18" fill="#a13a3a" stroke="#7a2828" strokeWidth="1.5" />
            <text
              x="130"
              y="116"
              textAnchor="middle"
              fontSize="16"
              fill="#fde8e8"
              fontFamily="serif"
              fontStyle="italic"
            >
              T
            </text>
          </g>
        )}
      </g>
    </svg>
  );
}
