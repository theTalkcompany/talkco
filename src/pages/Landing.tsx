import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Users, Shield, Heart, Sparkles, Download, Apple } from "lucide-react";
import Logo from "@/components/branding/Logo";

export default function Landing() {
  const canonical = useMemo(() => `${window.location.origin}/landing`, []);

  return (
    <>
      <Helmet>
        <title>Talk - Your Mental Health Support Companion | Download Now</title>
        <meta 
          name="description" 
          content="Talk is your compassionate mental health support companion. Connect with an AI therapist, join supportive community rooms, and access crisis resources - all while maintaining complete anonymity. Download now on the App Store." 
        />
        <meta name="keywords" content="mental health app, therapy app, anonymous support, AI therapist, crisis support, wellness app, mental health support" />
        <link rel="canonical" href={canonical} />
        
        {/* Open Graph */}
        <meta property="og:title" content="Talk - Your Mental Health Support Companion" />
        <meta property="og:description" content="Connect with an AI therapist, join supportive community rooms, and access crisis resources - all anonymously." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonical} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Talk - Your Mental Health Support Companion" />
        <meta name="twitter:description" content="Connect with an AI therapist, join supportive community rooms, and access crisis resources - all anonymously." />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        {/* Hero Section */}
        <section className="relative py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="text-center space-y-8">
              <div className="flex justify-center mb-6">
                <Logo className="h-20 w-20" />
              </div>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
                Your Safe Space for
                <span className="block text-primary mt-2">Mental Wellness</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Talk is your compassionate mental health support companion. Connect with an AI therapist, 
                join supportive community rooms, and access crisis resources - all while maintaining complete anonymity.
              </p>
              
              {/* App Store Download Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
                <Button size="lg" className="gap-2 text-lg px-8 py-6">
                  <Apple className="h-6 w-6" />
                  Download on App Store
                </Button>
                <Button size="lg" variant="outline" className="gap-2 text-lg px-8 py-6">
                  <Download className="h-6 w-6" />
                  Coming to Google Play
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground pt-4">
                Available now on iOS • Android coming soon
              </p>
            </div>
          </div>
        </section>

        {/* Key Features Section */}
        <section className="py-16 px-4 bg-muted/50">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              Everything You Need for Mental Wellness
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Chat with Willow</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Your AI mental health companion available 24/7. Willow provides empathetic, 
                    evidence-based support whenever you need it.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Community Support</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Join anonymous community rooms and connect with others who understand. 
                    Share experiences and support each other.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <MessageCircle className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Share Your Thoughts</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Post anonymously to the community feed, share your journey, 
                    and receive support from others.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Heart className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Daily Inspiration</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Start each day with uplifting quotes and mental health tips. 
                    Build positive habits for your wellbeing.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Crisis Resources</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Quick access to professional crisis hotlines and emergency resources 
                    when you need immediate support.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Complete Anonymity</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Your privacy matters. Use Talk completely anonymously - 
                    no personal information required.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Why Choose Talk Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              Why Choose Talk?
            </h2>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>A Place Where You Can Be Yourself</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  In a world that often feels judgmental, Talk provides a safe, anonymous space 
                  where you can express yourself freely without fear of stigma.
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Professional Support, Accessible to All</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Whether it's 3 AM or the middle of the day, Willow is here to listen and provide 
                  evidence-based support. We believe mental health support should be accessible to everyone.
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>You're Not Alone</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Connect with a community of people who understand what you're going through. 
                  Share your story, support others, and grow together.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Download CTA Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-primary/10 to-secondary/10">
          <div className="container mx-auto max-w-4xl text-center space-y-8">
            <h2 className="text-4xl font-bold">
              Ready to Start Your Wellness Journey?
            </h2>
            <p className="text-xl text-muted-foreground">
              Download Talk today and take the first step towards better mental health.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="gap-2 text-lg px-8 py-6">
                <Apple className="h-6 w-6" />
                Download on App Store
              </Button>
              <Button size="lg" variant="outline" className="gap-2 text-lg px-8 py-6">
                <Download className="h-6 w-6" />
                Coming to Google Play
              </Button>
            </div>
          </div>
        </section>

        {/* Important Notice Section */}
        <section className="py-12 px-4 bg-muted">
          <div className="container mx-auto max-w-4xl">
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-destructive" />
                  Important Medical Disclaimer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>
                  Talk is designed to provide peer support and general mental wellness information. 
                  It is <strong>not a substitute for professional medical advice, diagnosis, or treatment</strong>.
                </p>
                <p>
                  If you are experiencing a mental health crisis or emergency, please contact emergency 
                  services immediately or reach out to a professional crisis hotline.
                </p>
                <div className="pt-4 border-t">
                  <p className="font-semibold text-foreground mb-2">Crisis Resources:</p>
                  <ul className="space-y-1">
                    <li>• UK: Call 999 (Emergency) or 116 123 (Samaritans)</li>
                    <li>• US: Call 988 (Suicide & Crisis Lifeline)</li>
                    <li>• International: Find resources in the app's Help section</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 border-t">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
              <p>© 2025 Talk. All rights reserved.</p>
              <div className="flex gap-6">
                <a href="/privacy-policy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
                <a href="/terms-of-service" className="hover:text-foreground transition-colors">
                  Terms of Service
                </a>
                <a href="/contact" className="hover:text-foreground transition-colors">
                  Contact
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
