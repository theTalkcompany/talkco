import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { getDailyQuote, type Quote } from "@/data/quotes";
import { useState, useEffect } from "react";
const Index = () => {
  const [quote, setQuote] = useState<Quote | null>(null);
  useEffect(() => {
    const loadQuote = async () => {
      const dailyQuote = await getDailyQuote();
      setQuote(dailyQuote);
    };
    loadQuote();
  }, []);
  return <>
      <Helmet>
        <title>Talk — Anonymous Mental Health Support</title>
        <meta name="description" content="Find anonymous support, share openly, chat with others, and receive a daily uplifting quote on Talk." />
        <link rel="canonical" href="/" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Talk",
          url: "/",
          description: "Anonymous mental health support platform"
        })}</script>
      </Helmet>

      <section className="rounded-2xl bg-gradient-primary p-8 md:p-12 shadow-glow hover-tilt">
        <div className="max-w-3xl text-primary-foreground">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">A safe, anonymous space to talk and heal</h1>
          <p className="mt-4 text-lg md:text-xl opacity-90">Share your thoughts without showing your face. Connect with people, group chat, or talk to an AI. You matter here.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="hero" asChild>
              <Link to="/chat">Start a Talk</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/feed">Explore the Feed</Link>
            </Button>
          </div>
          <p className="mt-3 text-sm opacity-90">
            Already have an account? <Link to="/auth" className="underline">Log in</Link>
          </p>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-6 mt-8">
        <article className="surface-card p-6">
          <h2 className="text-2xl font-bold">Today's Encouragement</h2>
          <p className="mt-3 text-muted-foreground">Your daily quote is saved for today.</p>
          {quote ? <>
              <blockquote className="mt-4 text-lg leading-relaxed">"{quote.text}"</blockquote>
              <cite className="block mt-2 text-sm text-muted-foreground">— {quote.author}</cite>
            </> : <p className="mt-4 text-muted-foreground">Loading your daily quote...</p>}
          <div className="mt-6">
            <Button variant="soft" asChild>
              <Link to="/quotes">Open Quotes</Link>
            </Button>
          </div>
        </article>

        <article className="surface-card p-6">
          <h2 className="text-2xl font-bold">What you can do</h2>
          <ul className="mt-3 space-y-2 text-muted-foreground list-disc pl-5">
            <li>Post anonymously and receive kind advice</li>
            <li>Join community rooms for live conversations</li>
            <li>Talk to Willow, our friendly AI system for quick support any time</li>
            <li>Find professional resources when you need them</li>
          </ul>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" asChild><Link to="/feed">Visit Feed</Link></Button>
            <Button variant="ghost" asChild><Link to="/help">Get Help</Link></Button>
          </div>
        </article>
      </section>
    </>;
};
export default Index;