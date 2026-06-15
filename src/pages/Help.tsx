import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Phone, MessageSquare, Globe, Users, Heart, AlertTriangle, ExternalLink, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CrisisResource {
  country: string;
  code: string;
  name: string;
  phone: string;
  description: string;
  website: string;
}

const COUNTRIES: { code: string; label: string; emergency?: string }[] = [
  { code: "ALL", label: "Show all countries" },
  { code: "GB", label: "United Kingdom", emergency: "999" },
  { code: "IE", label: "Ireland", emergency: "112" },
  { code: "US", label: "United States", emergency: "911" },
  { code: "CA", label: "Canada", emergency: "911" },
  { code: "AU", label: "Australia", emergency: "000" },
  { code: "NZ", label: "New Zealand", emergency: "111" },
  { code: "DE", label: "Germany", emergency: "112" },
  { code: "FR", label: "France", emergency: "112" },
  { code: "ES", label: "Spain", emergency: "112" },
  { code: "IT", label: "Italy", emergency: "112" },
  { code: "NL", label: "Netherlands", emergency: "112" },
  { code: "SE", label: "Sweden", emergency: "112" },
  { code: "NO", label: "Norway", emergency: "113" },
  { code: "IN", label: "India", emergency: "112" },
  { code: "ZA", label: "South Africa", emergency: "112" },
  { code: "BR", label: "Brazil", emergency: "188" },
  { code: "MX", label: "Mexico", emergency: "911" },
  { code: "JP", label: "Japan", emergency: "110" },
  { code: "SG", label: "Singapore", emergency: "999" },
];

const CRISIS_RESOURCES: CrisisResource[] = [
  { code: "GB", country: "United Kingdom", name: "Samaritans", phone: "116 123", description: "Free emotional support 24/7 for anyone in distress.", website: "https://www.samaritans.org/" },
  { code: "GB", country: "United Kingdom", name: "Shout", phone: "Text SHOUT to 85258", description: "Free, 24/7 confidential text support service.", website: "https://giveusashout.org/" },
  { code: "IE", country: "Ireland", name: "Samaritans Ireland", phone: "116 123", description: "24/7 free emotional support across the Republic of Ireland.", website: "https://www.samaritans.org/ireland/" },
  { code: "US", country: "United States", name: "988 Suicide & Crisis Lifeline", phone: "988", description: "24/7 crisis support. Call or text from anywhere in the US.", website: "https://988lifeline.org/" },
  { code: "US", country: "United States", name: "Crisis Text Line", phone: "Text HOME to 741741", description: "Free, 24/7 text-based support with a trained counselor.", website: "https://www.crisistextline.org/" },
  { code: "CA", country: "Canada", name: "Talk Suicide Canada", phone: "1-833-456-4566", description: "24/7 bilingual support for people in crisis.", website: "https://talksuicide.ca/" },
  { code: "AU", country: "Australia", name: "Lifeline", phone: "13 11 14", description: "24-hour crisis support and suicide prevention services.", website: "https://www.lifeline.org.au/" },
  { code: "AU", country: "Australia", name: "Beyond Blue", phone: "1300 22 4636", description: "Support for anxiety, depression and suicide prevention.", website: "https://www.beyondblue.org.au/" },
  { code: "NZ", country: "New Zealand", name: "Lifeline Aotearoa", phone: "0800 543 354", description: "24/7 confidential support.", website: "https://www.lifeline.org.nz/" },
  { code: "DE", country: "Germany", name: "Telefonseelsorge", phone: "0800 111 0 111", description: "Free, confidential 24/7 crisis support.", website: "https://www.telefonseelsorge.de/" },
  { code: "FR", country: "France", name: "SOS Amitié", phone: "09 72 39 40 50", description: "24/7 listening and support.", website: "https://www.sos-amitie.com/" },
  { code: "ES", country: "Spain", name: "Teléfono de la Esperanza", phone: "717 003 717", description: "24/7 emotional crisis support.", website: "https://telefonodelaesperanza.org/" },
  { code: "IT", country: "Italy", name: "Telefono Amico", phone: "02 2327 2327", description: "Daily listening service for emotional distress.", website: "https://www.telefonoamico.it/" },
  { code: "NL", country: "Netherlands", name: "113 Zelfmoordpreventie", phone: "113", description: "24/7 suicide prevention helpline.", website: "https://www.113.nl/" },
  { code: "SE", country: "Sweden", name: "Mind Självmordslinjen", phone: "90101", description: "Anonymous crisis chat and phone support.", website: "https://mind.se/" },
  { code: "NO", country: "Norway", name: "Mental Helse", phone: "116 123", description: "24/7 mental health support line.", website: "https://mentalhelse.no/" },
  { code: "IN", country: "India", name: "iCALL", phone: "9152987821", description: "Psychosocial support by trained counselors.", website: "https://icallhelpline.org/" },
  { code: "IN", country: "India", name: "Vandrevala Foundation", phone: "1860 2662 345", description: "Free, confidential 24/7 mental health support.", website: "https://www.vandrevalafoundation.com/" },
  { code: "ZA", country: "South Africa", name: "SADAG", phone: "0800 567 567", description: "Suicide crisis helpline, 24 hours.", website: "https://www.sadag.org/" },
  { code: "BR", country: "Brazil", name: "Centro de Valorização da Vida (CVV)", phone: "188", description: "24/7 emotional support and suicide prevention.", website: "https://www.cvv.org.br/" },
  { code: "MX", country: "Mexico", name: "SAPTEL", phone: "55 5259-8121", description: "24/7 psychological crisis support.", website: "http://www.saptel.org.mx/" },
  { code: "JP", country: "Japan", name: "TELL Lifeline", phone: "03-5774-0992", description: "English-language emotional support in Japan.", website: "https://telljp.com/" },
  { code: "SG", country: "Singapore", name: "Samaritans of Singapore", phone: "1767", description: "24-hour emotional support and crisis line.", website: "https://www.sos.org.sg/" },
];

const LOCATION_KEY = "talkco_help_country";

const Help = () => {
  const [country, setCountry] = useState<string>("ALL");

  useEffect(() => {
    const saved = localStorage.getItem(LOCATION_KEY);
    if (saved) setCountry(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCATION_KEY, country);
  }, [country]);

  const filtered = useMemo(() => {
    if (country === "ALL") return CRISIS_RESOURCES;
    return CRISIS_RESOURCES.filter((r) => r.code === country);
  }, [country]);

  const selectedEmergency = COUNTRIES.find((c) => c.code === country)?.emergency;

  const onlineResources = [
    { name: "Psychology Today", description: "Find licensed therapists, psychologists, and psychiatrists in your area", url: "https://www.psychologytoday.com/", icon: Users },
    { name: "BetterHelp", description: "Professional counseling and therapy online", url: "https://www.betterhelp.com/", icon: MessageSquare },
    { name: "7 Cups", description: "Free emotional support through trained listeners", url: "https://www.7cups.com/", icon: Heart },
    { name: "Crisis Text Line", description: "Free 24/7 text-based support in multiple countries", url: "https://www.crisistextline.org/", icon: MessageSquare },
  ];

  return (
    <>
      <Helmet>
        <title>Get Help — Talk</title>
        <meta name="description" content="Find professional mental health resources and crisis support in your country." />
        <link rel="canonical" href="/help" />
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fade-in">
        {/* Location prompt */}
        <section className="surface-card p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
            <div className="flex-1">
              <label htmlFor="country-select" className="block font-semibold mb-1">Where are you based?</label>
              <p className="text-sm text-muted-foreground mb-3">
                We'll show you crisis hotlines available in your country.
              </p>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger id="country-select" className="w-full sm:w-72 min-h-[44px]">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Emergency */}
        <section className="surface-card p-4 sm:p-6 border-destructive bg-destructive/5">
          <div className="flex items-start gap-3 sm:gap-4">
            <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold text-destructive mb-2">Emergency</h2>
              <p className="text-foreground/90 mb-4">
                If you're in immediate danger or having thoughts of self-harm, please contact emergency services or go to your nearest emergency room right away.
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedEmergency ? (
                  <span className="px-3 py-1.5 bg-destructive text-destructive-foreground rounded-full text-sm font-semibold">
                    Emergency: {selectedEmergency}
                  </span>
                ) : (
                  <>
                    <span className="px-3 py-1 bg-destructive text-destructive-foreground rounded-full text-sm font-medium">US: 911</span>
                    <span className="px-3 py-1 bg-destructive text-destructive-foreground rounded-full text-sm font-medium">UK: 999</span>
                    <span className="px-3 py-1 bg-destructive text-destructive-foreground rounded-full text-sm font-medium">EU: 112</span>
                    <span className="px-3 py-1 bg-destructive text-destructive-foreground rounded-full text-sm font-medium">AU: 000</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Page Header */}
        <section className="text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">Professional Support Resources</h1>
          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            You don't have to face mental health challenges alone.
          </p>
        </section>

        {/* Crisis Hotlines */}
        <section className="surface-card p-5 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-gradient-primary">
              <Phone className="h-6 w-6 text-primary-foreground" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-1">Crisis Support Hotlines</h2>
            <p className="text-muted-foreground text-sm">
              {country === "ALL" ? "Free, confidential support around the world" : `Free, confidential support in ${COUNTRIES.find(c => c.code === country)?.label}`}
            </p>
          </div>

          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              We don't have a verified hotline listed for this country yet. Please dial your local emergency number, or pick "Show all countries" to view international options.
            </p>
          ) : (
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
              {filtered.map((resource, index) => (
                <div key={index} className="glass-card p-5 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-lg">{resource.name}</h3>
                    <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full flex-shrink-0">
                      {resource.country}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="font-mono text-base font-semibold">{resource.phone}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{resource.description}</p>
                  <a
                    href={resource.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline text-sm focus-ring rounded-md"
                  >
                    Visit website <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Online Resources */}
        <section className="surface-card p-5 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-gradient-primary">
              <Globe className="h-6 w-6 text-primary-foreground" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-1">Online Resources</h2>
            <p className="text-muted-foreground text-sm">Professional therapy and support services online</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {onlineResources.map((resource, index) => (
              <div key={index} className="glass-card p-5 space-y-3 animate-fade-in">
                <div className="flex items-start gap-3">
                  <resource.icon className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{resource.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{resource.description}</p>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline font-medium text-sm focus-ring rounded-md"
                    >
                      Learn more <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Back to Talk */}
        <section className="text-center surface-card p-5 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-3">Continue your journey with Talk</h2>
          <p className="text-muted-foreground mb-5 text-sm sm:text-base">
            Connect with our supportive community and chat with Willow anytime.
          </p>
          <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
            <Button variant="hero" asChild className="min-h-[44px]">
              <Link to="/chat" className="focus-ring">Chat with Willow</Link>
            </Button>
            <Button variant="outline" asChild className="min-h-[44px]">
              <Link to="/feed" className="focus-ring">Join Community</Link>
            </Button>
            <Button variant="ghost" asChild className="min-h-[44px]">
              <Link to="/" className="focus-ring">Back to Home</Link>
            </Button>
          </div>
        </section>
      </div>
    </>
  );
};

export default Help;
