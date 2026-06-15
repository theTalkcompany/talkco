import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Sparkles, Check } from "lucide-react";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SUGGESTED_PROMPTS = [
  "I'm feeling overwhelmed",
  "I had a hard day",
  "I'm struggling to sleep",
  "I just need to vent",
];

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
    { role: "assistant", content: "Hi, I'm Willow. I'm here to listen and support you. What's on your mind today?" },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [justSent, setJustSent] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, sending]);

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || sending) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setSending(true);
    setJustSent(true);
    window.setTimeout(() => setJustSent(false), 900);

    // Increment Willow session counter for profile stat
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (uid) {
        const key = `talkco_willow_sessions_${uid}`;
        localStorage.setItem(key, String(Number(localStorage.getItem(key) || 0) + 1));
      }
    } catch {}

    try {
      const { data, error } = await supabase.functions.invoke("willow-chat", {
        body: { messages: nextMessages },
      });

      if (error || !data) {
        throw new Error(error?.message || "Failed to reach Willow. Please try again.");
      }

      const reply = (data as any).reply as string;
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <section aria-label="Willow chat" className="mt-4 animate-fade-in">
      <div className="surface-card rounded-lg border p-3 sm:p-4 flex flex-col">
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
              <div
                className={`rounded-2xl px-3 py-2 max-w-[80%] text-sm leading-relaxed ${
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

        {/* Suggested prompts */}
        {messages.length <= 2 && !sending && (
          <div className="flex flex-wrap gap-2 mt-3">
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                className="text-xs sm:text-sm px-3 py-1.5 rounded-full border bg-background hover:bg-accent/30 hover:border-primary/40 transition-all focus-ring"
              >
                {p}
              </button>
            ))}
          </div>
        )}

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
      </div>
    </section>
  );
};

export default WillowChat;
