import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Mail, Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface Props {
  userId: string;
}

type Written = {
  id: string;
  opening: string;
  body: string;
  status: string;
  created_at: string;
  delivered_at: string | null;
};

type Saved = {
  id: string;
  saved_at: string;
  letter: {
    id: string;
    opening: string;
    body: string;
    closing: string | null;
  };
};

export default function MyLetters({ userId }: Props) {
  const [written, setWritten] = useState<Written[]>([]);
  const [saved, setSaved] = useState<Saved[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [w, s] = await Promise.all([
      supabase
        .from("letters")
        .select("id, opening, body, status, created_at, delivered_at")
        .eq("author_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("saved_letters")
        .select("id, saved_at, letter:letters(id, opening, body, closing)")
        .eq("user_id", userId)
        .order("saved_at", { ascending: false }),
    ]);
    if (w.data) setWritten(w.data as Written[]);
    if (s.data) setSaved(s.data as unknown as Saved[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [userId]);

  const unsave = async (savedId: string) => {
    await supabase.from("saved_letters").delete().eq("id", savedId);
    setSaved((prev) => prev.filter((x) => x.id !== savedId));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="written" className="max-w-2xl mx-auto">
      <TabsList className="grid grid-cols-2 w-full">
        <TabsTrigger value="written">
          Written · {written.length}
        </TabsTrigger>
        <TabsTrigger value="received">
          Saved · {saved.length}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="written" className="space-y-3 mt-4">
        {written.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">
            <Mail className="h-8 w-8 mx-auto mb-2 opacity-60" />
            You haven't written a letter yet.
          </Card>
        )}
        {written.map((l) => (
          <Card key={l.id} className="p-4 bg-letter-cream/60 border-letter-ink/10">
            <div className="flex items-center justify-between mb-2">
              <p className="font-handwriting text-xl text-letter-ink">{l.opening}</p>
              <Badge variant={l.status === "delivered" ? "default" : l.status === "held_for_review" ? "destructive" : "secondary"}>
                {l.status === "delivered" ? "Delivered" : l.status === "held_for_review" ? "Held for review" : "Awaiting reader"}
              </Badge>
            </div>
            <p className="text-sm text-letter-ink/80 line-clamp-2">{l.body}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Sent {format(new Date(l.created_at), "PP")}
              {l.delivered_at && ` · Read ${format(new Date(l.delivered_at), "PP")}`}
            </p>
          </Card>
        ))}
      </TabsContent>

      <TabsContent value="received" className="space-y-3 mt-4">
        {saved.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">
            <Heart className="h-8 w-8 mx-auto mb-2 opacity-60" />
            No saved letters yet. Heart a letter to keep it here.
          </Card>
        )}
        {saved.map((s) => (
          <Card key={s.id} className="letter-paper p-6">
            <p className="font-handwriting text-xl text-letter-ink">{s.letter?.opening}</p>
            <p className="font-handwriting text-lg text-letter-ink mt-2 whitespace-pre-wrap" style={{ lineHeight: "1.6rem" }}>
              {s.letter?.body}
            </p>
            {s.letter?.closing && (
              <p className="font-handwriting text-lg text-letter-ink mt-3">{s.letter.closing}</p>
            )}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-letter-ink/10">
              <p className="text-xs text-letter-ink/60">Saved {format(new Date(s.saved_at), "PP")}</p>
              <Button variant="ghost" size="sm" onClick={() => unsave(s.id)}>
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </Button>
            </div>
          </Card>
        ))}
      </TabsContent>
    </Tabs>
  );
}
