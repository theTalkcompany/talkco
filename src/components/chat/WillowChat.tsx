import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

 type ChatMessage = { role: "user" | "assistant"; content: string };

const WillowChat = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi, I'm Willow. I'm here to listen and support you. What's on your mind today?" },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setSending(true);

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
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <section aria-label="Willow chat" className="mt-4">
      <div className="surface-card rounded-lg border p-4">
        <div className="max-h-[50vh] overflow-y-auto space-y-3" aria-live="polite">
          {messages.map((m, idx) => (
            <div key={idx} className={m.role === "assistant" ? "bg-muted border rounded-lg p-3" : "border rounded-lg p-3"}>
              <p className="text-sm text-muted-foreground mb-1">{m.role === "assistant" ? "Willow" : "You"}</p>
              <p className="whitespace-pre-wrap text-foreground">{m.content}</p>
            </div>
          ))}
          {sending && (
            <div className="bg-muted/60 border rounded-lg p-3 animate-pulse">
              <p className="text-sm text-muted-foreground mb-1">Willow</p>
              <p>Typing…</p>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="mt-4 grid gap-2">
          <label htmlFor="willow-input" className="sr-only">Message Willow</label>
          <Textarea
            id="willow-input"
            placeholder="Share what's going on. Press Enter to send, Shift+Enter for a new line."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
          />
          <div className="flex justify-end">
            <Button onClick={sendMessage} disabled={sending || !input.trim()}>
              {sending ? "Sending…" : "Send"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WillowChat;
