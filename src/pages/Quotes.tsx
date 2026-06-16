import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Heart, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { QUOTE_LIBRARY, PASTEL_BGS, type LibraryQuote } from "@/data/quoteLibrary";

const FAV_KEY = "talkco_favorite_quotes";

function quoteId(q: LibraryQuote) {
  return `${q.author}::${q.text}`.slice(0, 200);
}

function loadFavs(): string[] {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); } catch { return []; }
}

const QuoteCard = ({
  quote,
  index,
  isFav,
  onToggleFav,
}: {
  quote: LibraryQuote;
  index: number;
  isFav: boolean;
  onToggleFav: (q: LibraryQuote) => void;
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const bg = PASTEL_BGS[index % PASTEL_BGS.length];

  const handleShare = async () => {
    const text = `"${quote.text}" — ${quote.author}`;
    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      toast({ title: "Copied", description: "Quote copied to clipboard." });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // user cancelled — no-op
    }
  };

  return (
    <article className={`rounded-2xl border p-5 ${bg} animate-fade-in`}>
      <blockquote className="text-base sm:text-lg leading-relaxed text-foreground/90">
        "{quote.text}"
      </blockquote>
      <cite className="mt-3 block text-sm font-medium text-foreground/70 not-italic">
        — {quote.author}
      </cite>
      <div className="mt-4 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleFav(quote)}
          aria-pressed={isFav}
          className="gap-1.5"
        >
          <Heart className={`h-4 w-4 ${isFav ? "fill-rose-500 text-rose-500" : ""}`} />
          {isFav ? "Saved" : "Save"}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleShare} className="gap-1.5">
          {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
          Share
        </Button>
      </div>
    </article>
  );
};

const Quotes = () => {
  const [favs, setFavs] = useState<string[]>([]);

  useEffect(() => { setFavs(loadFavs()); }, []);

  const toggleFav = (q: LibraryQuote) => {
    const id = quoteId(q);
    setFavs((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev];
      localStorage.setItem(FAV_KEY, JSON.stringify(next));
      return next;
    });
  };

  const favSet = useMemo(() => new Set(favs), [favs]);
  const savedQuotes = useMemo(
    () => QUOTE_LIBRARY.filter((q) => favSet.has(quoteId(q))),
    [favSet],
  );

  return (
    <>
      <Helmet>
        <title>Quotes — Talkco</title>
        <meta name="description" content="A calming feed of mental health and wellbeing quotes. Save your favourites and share what speaks to you." />
        <link rel="canonical" href="/quotes" />
      </Helmet>

      <section className="max-w-2xl mx-auto px-1 sm:px-0">
        <header className="text-center mb-5">
          <h1 className="text-3xl font-bold">Quiet Words</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Take a breath. Read one. Save the ones that stay with you.
          </p>
        </header>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="all">All quotes</TabsTrigger>
            <TabsTrigger value="saved">
              Saved {savedQuotes.length > 0 && `(${savedQuotes.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3">
            {QUOTE_LIBRARY.map((q, i) => (
              <QuoteCard
                key={quoteId(q)}
                quote={q}
                index={i}
                isFav={favSet.has(quoteId(q))}
                onToggleFav={toggleFav}
              />
            ))}
          </TabsContent>

          <TabsContent value="saved" className="space-y-3">
            {savedQuotes.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-card/50 p-8 text-center">
                <Heart className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-2 font-medium">No saved quotes yet</p>
                <p className="text-sm text-muted-foreground">
                  Tap the heart on any quote to keep it here.
                </p>
              </div>
            ) : (
              savedQuotes.map((q, i) => (
                <QuoteCard
                  key={quoteId(q)}
                  quote={q}
                  index={i}
                  isFav
                  onToggleFav={toggleFav}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </section>
    </>
  );
};

export default Quotes;
