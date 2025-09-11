import { Helmet } from "react-helmet-async";
import { Phone, MessageSquare, Globe, Users, Heart, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Help = () => {
  const crisisResources = [
    {
      country: "United States",
      name: "988 Suicide & Crisis Lifeline",
      phone: "988",
      description: "24/7 crisis support. Call or text from anywhere in the US.",
      website: "https://988lifeline.org/"
    },
    {
      country: "United Kingdom & Ireland",
      name: "Samaritans",
      phone: "116 123",
      description: "Free emotional support 24/7 for anyone in distress.",
      website: "https://www.samaritans.org/"
    },
    {
      country: "Australia",
      name: "Lifeline",
      phone: "13 11 14",
      description: "24-hour crisis support and suicide prevention services.",
      website: "https://www.lifeline.org.au/"
    },
    {
      country: "Canada",
      name: "Talk Suicide Canada",
      phone: "1-833-456-4566",
      description: "24/7 bilingual support for people in crisis.",
      website: "https://talksuicide.ca/"
    }
  ];

  const onlineResources = [
    {
      name: "Psychology Today",
      description: "Find licensed therapists, psychologists, and psychiatrists in your area",
      url: "https://www.psychologytoday.com/",
      icon: Users
    },
    {
      name: "BetterHelp",
      description: "Professional counseling and therapy online",
      url: "https://www.betterhelp.com/",
      icon: MessageSquare
    },
    {
      name: "Crisis Text Line",
      description: "Text HOME to 741741 for free, 24/7 crisis support",
      url: "https://www.crisistextline.org/",
      icon: MessageSquare
    },
    {
      name: "7 Cups",
      description: "Free emotional support through trained listeners",
      url: "https://www.7cups.com/",
      icon: Heart
    }
  ];

  return (
    <>
      <Helmet>
        <title>Get Help — Talk</title>
        <meta name="description" content="Find professional mental health resources and crisis support. Access hotlines, therapy resources, and emergency help." />
        <link rel="canonical" href="/help" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Professional Mental Health Support",
          description: "Comprehensive mental health resources and crisis support"
        })}</script>
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Emergency Alert */}
        <section className="surface-card p-6 border-destructive bg-destructive/5">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold text-destructive mb-2">Emergency</h2>
              <p className="text-foreground/90 mb-4">
                If you're in immediate danger or having thoughts of self-harm, please contact emergency services 
                or go to your nearest emergency room right away.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-destructive text-destructive-foreground rounded-full text-sm font-medium">
                  US: 911
                </span>
                <span className="px-3 py-1 bg-destructive text-destructive-foreground rounded-full text-sm font-medium">
                  UK: 999
                </span>
                <span className="px-3 py-1 bg-destructive text-destructive-foreground rounded-full text-sm font-medium">
                  AU: 000
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Page Header */}
        <section className="text-center">
          <h1 className="text-4xl font-extrabold mb-4">Professional Support Resources</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            You don't have to face mental health challenges alone. Here are trusted resources 
            to help you find the support you need.
          </p>
        </section>

        {/* Crisis Hotlines */}
        <section className="surface-card p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-gradient-primary">
              <Phone className="h-6 w-6 text-primary-foreground" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Crisis Support Hotlines</h2>
            <p className="text-muted-foreground">Free, confidential support available 24/7</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {crisisResources.map((resource, index) => (
              <div key={index} className="glass-card p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">{resource.name}</h3>
                  <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                    {resource.country}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <span className="font-mono text-lg font-semibold">{resource.phone}</span>
                </div>
                <p className="text-sm text-muted-foreground">{resource.description}</p>
                <a
                  href={resource.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline text-sm focus-ring rounded-md"
                >
                  Visit website <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Online Resources */}
        <section className="surface-card p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-gradient-primary">
              <Globe className="h-6 w-6 text-primary-foreground" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Online Resources</h2>
            <p className="text-muted-foreground">Professional therapy and support services online</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {onlineResources.map((resource, index) => (
              <div key={index} className="glass-card p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <resource.icon className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{resource.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{resource.description}</p>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary hover:underline font-medium focus-ring rounded-md"
                    >
                      Learn more <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Additional Support */}
        <section className="surface-card p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-gradient-primary">
              <Heart className="h-6 w-6 text-primary-foreground" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Additional Ways to Get Support</h2>
            <p className="text-muted-foreground">Explore other options for mental health support</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center space-y-3">
              <Users className="h-8 w-8 text-primary mx-auto" />
              <h3 className="font-semibold">Support Groups</h3>
              <p className="text-sm text-muted-foreground">
                Find local or online support groups for specific challenges
              </p>
            </div>
            <div className="text-center space-y-3">
              <MessageSquare className="h-8 w-8 text-primary mx-auto" />
              <h3 className="font-semibold">Peer Support</h3>
              <p className="text-sm text-muted-foreground">
                Connect with others who understand your experiences
              </p>
            </div>
            <div className="text-center space-y-3">
              <Heart className="h-8 w-8 text-primary mx-auto" />
              <h3 className="font-semibold">Self-Care Resources</h3>
              <p className="text-sm text-muted-foreground">
                Tools and techniques for managing your mental health daily
              </p>
            </div>
          </div>
        </section>

        {/* Back to Talk */}
        <section className="text-center surface-card p-8">
          <h2 className="text-2xl font-bold mb-4">Continue Your Journey with Talk</h2>
          <p className="text-muted-foreground mb-6">
            Remember, Talk is here for you too. Connect with our supportive community 
            and chat with Willow, our AI assistant, anytime you need someone to listen.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="hero" asChild>
              <Link to="/chat" className="focus-ring">Chat with Willow</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/feed" className="focus-ring">Join Community</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/" className="focus-ring">Back to Home</Link>
            </Button>
          </div>
        </section>
      </div>
    </>
  );
};

export default Help;