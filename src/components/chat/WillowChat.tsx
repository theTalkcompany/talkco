import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Sparkles, Check, LifeBuoy, X } from "lucide-react";

type ChatMessage = { role: "user" | "assistant"; content: string; ts: number };

const SUGGESTED_PROMPTS = [
  "I'm feeling overwhelmed",
  "I had a hard day",
  "I can't sleep",
  "I just need to vent",
];

const CRISIS_KEYWORDS = [
  "kill myself", "kill me", "end my life", "want to die", "wanna die",
  "suicide", "suicidal", "self harm", "self-harm", "hurt myself",
  "cut myself", "don't want to be here", "dont want to be here",
  "no reason to live", "better off dead",
];

const STOP_WORDS = new Set([
  "the","a","an","and","or","but","of","to","in","on","for","with","is","am","i","im","i'm",
  "my","me","you","your","it","its","this","that","at","be","been","just","really","very",
  "so","like","feel","feeling","felt","have","has","had","do","does","did","not","no","get",
  "got","about","because","cause","cuz","when","then","than","too","also","still","keep",
  "any","some","what","why","how","can","cant","can't","won't","dont","don't",
]);

const formatRelative = (ts: number, now: number) => {
  const diff = Math.max(0, Math.floor((now - ts) / 1000));
  if (diff < 30) return "just now";
  if (diff < 60) return `${diff}s ago`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(ts).toLocaleDateString();
};

const deriveTitle = (messages: ChatMessage[]): string => {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "New conversation";
  const words = firstUser.content
    .toLowerCase()
    .replace(/[^\w\s']/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOP_WORDS.has(w));
  const keywords = words.slice(0, 4).join(" ");
  if (!keywords) {
    const trimmed = firstUser.content.trim().slice(0, 40);
    return `Talking about ${trimmed}`;
  }
  return `Talking about ${keywords}`;
};

const WillowAvatar = ({ size = "md" }: { size?: "sm" | "md" }) => (
  <Avatar className={size === "md" ? "h-9 w-9" : "h-7 w-7"}>
    <AvatarFallback className="bg-gradient-primary text-primary-foreground">
      <Sparkles className={size === "md" ? "h-4 w-4" : "h-3 w-3"} />
    </AvatarFallback>
  </Avatar>
);

const WillowChat = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi, I'm Willow. I'm here to listen and support you. What's on your mind today?", ts: Date.now() },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [justSent, setJustSent] = useState(false);
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [now, setNow] = useState(Date.now());
  const sessionCountedRef = useRef(false);
  const sessionIdRef = useRef(`sess_${Date.now()}`);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Tick to refresh relative timestamps
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, sending]);

  const sessionTitle = useMemo(() => {
    const userMsgs = messages.filter((m) => m.role === "user").length;
    if (userMsgs < 2) return null;
    return deriveTitle(messages);
  }, [messages]);

  // Persist session title as it evolves
  useEffect(() => {
    if (!sessionTitle) return;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) return;
      const key = `talkco_willow_session_titles_${uid}`;
      try {
        const arr = JSON.parse(localStorage.getItem(key) || "[]") as Array<{ id: string; title: string; updatedAt: number }>;
        const idx = arr.findIndex((s) => s.id === sessionIdRef.current);
        const entry = { id: sessionIdRef.current, title: sessionTitle, updatedAt: Date.now() };
        if (idx >= 0) arr[idx] = entry; else arr.unshift(entry);
        localStorage.setItem(key, JSON.stringify(arr.slice(0, 50)));
      } catch {}
    })();
  }, [sessionTitle]);

  const incrementSessionCount = async () => {
    if (sessionCountedRef.current) return;
    sessionCountedRef.current = true;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) return;
      const key = `talkco_willow_sessions_${uid}`;
      localStorage.setItem(key, String(Number(localStorage.getItem(key) || 0) + 1));
      window.dispatchEvent(new StorageEvent("storage", { key }));
    } catch {}
  };

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || sending || sessionEnded) return;

    const lowered = text.toLowerCase();
    const isCrisis = CRISIS_KEYWORDS.some((k) => lowered.includes(k));
    if (isCrisis) setCrisisDetected(true);

    const userMsg: ChatMessage = { role: "user", content: text, ts: Date.now() };
    const nextMessages: ChatMessage[] = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setSending(true);
    setJustSent(true);
    window.setTimeout(() => setJustSent(false), 900);

    void incrementSessionCount();

    try {
      const { data, error } = await supabase.functions.invoke("willow-chat", {
        body: { messages: nextMessages.map(({ role, content }) => ({ role, content })) },
      });

      if (error || !data) {
        throw new Error(error?.message || "Failed to reach Willow. Please try again.");
      }

      const reply = (data as any).reply as string;
      setMessages((prev) => [...prev, { role: "assistant", content: reply, ts: Date.now() }]);
    } catch (err) {
      console.error(err);
      toast({
        title: "Something went wrong",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleChipTap = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const handleEndSession = () => {
    if (sessionEnded) return;
    setSessionEnded(true);
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "Take care of yourself. I'm here whenever you need me 💜",
        ts: Date.now(),
      },
    ]);
    toast({ title: "Session saved", description: sessionTitle || "Your conversation has been saved." });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <section aria-label="Willow chat" className="mt-4 animate-fade-in">
      <div className="surface-card rounded-lg border p-3 sm:p-4 flex flex-col">
        {/* Header with session title + end button */}
        <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Current session</p>
            <p className="text-sm font-medium truncate">
              {sessionTitle || "New conversation"}
            </p>
          </div>
          {!sessionEnded && messages.some((m) => m.role === "user") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEndSession}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              End session
            </Button>
          )}
        </div>

        {/* Crisis banner */}
        {crisisDetected && (
          <div className="mb-3 rounded-lg border border-primary/40 bg-primary/5 p-3 animate-fade-in">
            <div className="flex items-start gap-3">
              <LifeBuoy className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="font-medium">You're not alone — support is here.</p>
                <p className="text-muted-foreground mt-0.5">
                  If you're in crisis or thinking of hurting yourself, please reach out to a trained person right now.
                </p>
                <Link
                  to="/help"
                  className="inline-block mt-2 text-primary font-medium underline underline-offset-2"
                >
                  Open Get Help →
                </Link>
              </div>
            </div>
          </div>
        )}

        <div
          className="max-h-[55vh] min-h-[280px] overflow-y-auto space-y-3 px-1"
          aria-live="polite"
        >
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-2 animate-fade-in ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "assistant" && <WillowAvatar />}
              <div className={`flex flex-col max-w-[80%] ${m.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === "assistant"
                      ? "bg-muted text-foreground rounded-tl-sm"
                      : "bg-primary text-primary-foreground rounded-tr-sm"
                  }`}
                >
                  {m.role === "assistant" && (
                    <p className="text-[11px] font-medium opacity-70 mb-0.5">Willow</p>
                  )}
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 px-1">
                  {formatRelative(m.ts, now)}
                </span>
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex gap-2 items-end">
              <WillowAvatar />
              <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-typing-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-typing-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-typing-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {sessionEnded ? (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={() => {
                sessionCountedRef.current = false;
                sessionIdRef.current = `sess_${Date.now()}`;
                setSessionEnded(false);
                setCrisisDetected(false);
                setMessages([
                  { role: "assistant", content: "Welcome back. What would you like to talk about today?", ts: Date.now() },
                ]);
              }}
            >
              Start a new session
            </Button>
          </div>
        ) : (
          <>
            {/* Suggested prompt chips — always visible until session ends */}
            <div className="flex flex-wrap gap-2 mt-3">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => handleChipTap(p)}
                  disabled={sending}
                  className="text-xs sm:text-sm px-3 py-1.5 rounded-full border bg-background hover:bg-accent/30 hover:border-primary/40 transition-all focus-ring disabled:opacity-50"
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="mt-3 grid gap-2">
              <label htmlFor="willow-input" className="sr-only">Message Willow</label>
              <div className="relative">
                <Textarea
                  id="willow-input"
                  ref={inputRef}
                  placeholder="Share what's going on…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                  rows={2}
                  className="pr-14 resize-none text-base"
                />
                <Button
                  onClick={() => sendMessage()}
                  disabled={sending || !input.trim()}
                  size="icon"
                  variant="hero"
                  className="absolute right-2 bottom-2 h-10 w-10 rounded-full"
                  aria-label="Send message"
                >
                  {justSent ? (
                    <Check className="h-4 w-4 animate-check-pop" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground text-center">
                Willow is an AI companion, not a substitute for professional care.
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default WillowChat;
