import { Helmet } from "react-helmet-async";
import { getDailyQuote } from "@/data/quotes";

const Quotes = () => {
  const quote = getDailyQuote();

  return (
    <>
      <Helmet>
        <title>Quotes — Talk</title>
        <meta name="description" content="Receive a daily uplifting quote or poem to brighten your day." />
        <link rel="canonical" href="/quotes" />
      </Helmet>

      <section className="surface-card p-6 max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold">Today’s Encouragement</h1>
        <p className="mt-2 text-muted-foreground">Saved just for you today.</p>
        <blockquote className="mt-6 text-xl leading-relaxed">“{quote.text}”</blockquote>
        <cite className="block mt-2 text-sm text-muted-foreground">— {quote.author}</cite>
        <p className="mt-6 text-sm text-muted-foreground">New quote unlocks tomorrow. Keep going—you’re doing great.</p>
      </section>
    </>
  );
};

export default Quotes;
