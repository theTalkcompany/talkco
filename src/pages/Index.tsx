import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { getDailyQuote, type Quote } from "@/data/quotes";
import { useState, useEffect } from "react";
import { Heart, MessageCircle, Shield, Users, Zap, ArrowRight } from "lucide-react";
const Index = () => {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const loadQuote = async () => {
      try {
        const dailyQuote = await getDailyQuote();
        setQuote(dailyQuote);
      } catch (error) {
        console.error("Failed to load quote:", error);
      } finally {
        setLoading(false);
      }
    };
    loadQuote();
  }, []);
  const features = [{
    icon: Shield,
    title: "Safe & Anonymous",
    description: "Share your thoughts without revealing your identity. Your privacy is our priority."
  }, {
    icon: MessageCircle,
    title: "AI Support 24/7",
    description: "Chat with Willow, our empathetic AI assistant, available whenever you need support."
  }, {
    icon: Users,
    title: "Community Chat",
    description: "Connect with others in supportive group conversations and community rooms."
  }, {
    icon: Heart,
    title: "Daily Inspiration",
    description: "Receive uplifting quotes and encouragement to brighten your day."
  }];
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

      {/* Hero Section */}
      <section className="rounded-2xl bg-gradient-primary p-8 md:p-12 shadow-glow hover-tilt mb-8">
        <div className="max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6 text-white">
            A safe, anonymous space to 
            <span className="block text-white">
              talk and heal
            </span>
          </h1>
          <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl">
            Share your thoughts without showing your face. Connect with people, group chat, or talk to an AI. You matter here.
          </p>
          <div className="flex flex-wrap gap-4 mb-6">
            <Button size="lg" variant="hero" asChild className="group">
              <Link to="/chat" className="focus-ring">
                Start a Talk 
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="bg-white/10 border-white/20 hover:bg-white/20 text-white">
              <Link to="/feed" className="focus-ring">Explore the Feed</Link>
            </Button>
          </div>
          
        </div>
      </section>

      {/* Features Grid */}
      <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {features.map((feature, index) => <article key={index} className="surface-card p-6 text-center group">
            <div className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-gradient-primary">
              <feature.icon className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
          </article>)}
      </section>

      {/* Main Content Cards */}
      <section className="grid md:grid-cols-2 gap-8">
        <article className="surface-card p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Today's Encouragement</h2>
              <p className="text-muted-foreground">Your personal daily quote, saved just for you.</p>
            </div>
          </div>
          
          {loading ? <div className="space-y-3">
              <div className="loading-skeleton h-4 w-full"></div>
              <div className="loading-skeleton h-4 w-3/4"></div>
              <div className="loading-skeleton h-3 w-1/2"></div>
            </div> : quote ? <>
              <blockquote className="text-lg leading-relaxed mb-4 italic border-l-4 border-primary pl-4">
                "{quote.text}"
              </blockquote>
              <cite className="block text-sm text-muted-foreground font-medium">— {quote.author}</cite>
            </> : <p className="text-muted-foreground">Unable to load today's quote. Please try again later.</p>}
          
          <div className="mt-8">
            <Button variant="soft" asChild className="group">
              <Link to="/quotes" className="focus-ring">
                View All Quotes 
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </article>

        <article className="surface-card p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">What You Can Do</h2>
              <p className="text-muted-foreground">Discover all the ways Talk can support your mental health journey.</p>
            </div>
          </div>
          
          <ul className="space-y-4 mb-8">
            <li className="flex items-start gap-3">
              <MessageCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-foreground/90">Post anonymously and receive kind, supportive advice</span>
            </li>
            <li className="flex items-start gap-3">
              <Users className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-foreground/90">Join community rooms for live conversations with peers</span>
            </li>
            <li className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-foreground/90">Talk to Willow, our friendly AI for immediate support</span>
            </li>
            
          </ul>
          
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link to="/feed" className="focus-ring">Visit Feed</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/help" className="focus-ring">Get Help</Link>
            </Button>
          </div>
        </article>
      </section>

      {/* Professional Support Section */}
      <section className="surface-card p-8 mb-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Need Professional Support?</h2>
          <p className="text-muted-foreground mb-6">
            If you're in immediate danger or need professional help, these resources are available 24/7.
          </p>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="glass-card p-6 text-left">
              <h3 className="font-semibold mb-3 text-lg">Crisis Resources</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
                  <span>US: 988 Suicide & Crisis Lifeline — Call or text 988</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
                  <span>UK & ROI: Samaritans — Call 116 123</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
                  <span>AU: Lifeline — 13 11 14</span>
                </li>
              </ul>
            </div>
            <div className="glass-card p-6 text-left">
              <h3 className="font-semibold mb-3 text-lg">Find a Professional</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Search for licensed therapists and counselors in your area.
              </p>
              <a className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium focus-ring rounded-md" href="https://www.psychologytoday.com/" target="_blank" rel="noreferrer">
                Psychology Today directory
                <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link to="/help" className="focus-ring">View All Resources</Link>
          </Button>
        </div>
      </section>
    </>;
};
export default Index;