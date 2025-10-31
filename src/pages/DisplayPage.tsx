import { Helmet } from "react-helmet-async";
import { Apple } from "lucide-react";

const DisplayPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20">
      <Helmet>
        <title>Talk - Your Safe Space for Mental Wellness</title>
        <meta name="description" content="Talk is a free mental health support app. Connect with an AI therapist, join supportive community rooms, and access crisis resources - all while maintaining complete anonymity." />
      </Helmet>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          {/* Logo and Header */}
          <div className="space-y-6">
            <div className="flex justify-center">
              <img 
                src="/lovable-uploads/Talk_logo_512X512.png" 
                alt="Talk App Logo" 
                className="w-32 h-32 rounded-3xl shadow-2xl"
              />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Your Safe Space for Mental Wellness
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Talk is your compassionate mental health support companion. Connect with an AI therapist, join supportive community rooms, and access crisis resources - all while maintaining complete anonymity.
            </p>
          </div>

          {/* Download Button */}
          <div className="flex justify-center">
            <a
              href="https://apps.apple.com/app/talk"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-xl text-lg font-semibold transition-all hover:scale-105 shadow-lg"
            >
              <Apple className="w-6 h-6" />
              Download Free on App Store
            </a>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-8 pt-8">
            <div className="bg-card/50 backdrop-blur p-8 rounded-2xl border border-border/50 shadow-lg">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">Chat with Willow</h3>
              <p className="text-muted-foreground">
                Talk to Willow, our empathetic AI therapist, available 24/7 to listen and provide support whenever you need it.
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur p-8 rounded-2xl border border-border/50 shadow-lg">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">Community Support</h3>
              <p className="text-muted-foreground">
                Join supportive community rooms to connect with others who understand what you're going through.
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur p-8 rounded-2xl border border-border/50 shadow-lg">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">Complete Anonymity</h3>
              <p className="text-muted-foreground">
                Share your thoughts without revealing your identity. Your privacy is our priority.
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur p-8 rounded-2xl border border-border/50 shadow-lg">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">Daily Inspiration</h3>
              <p className="text-muted-foreground">
                Receive uplifting quotes and encouragement to brighten your day and keep you motivated.
              </p>
            </div>
          </div>

          {/* What You Can Do Section */}
          <div className="bg-card/50 backdrop-blur p-10 rounded-2xl border border-border/50 shadow-lg space-y-6">
            <h2 className="text-3xl font-bold">What You Can Do on Talk</h2>
            <div className="space-y-4 text-left max-w-2xl mx-auto">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <p className="text-muted-foreground">Share your thoughts and feelings anonymously in the community feed</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <p className="text-muted-foreground">Chat with Willow, our AI therapist, anytime you need someone to talk to</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <p className="text-muted-foreground">Join group chat rooms focused on specific topics and support needs</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <p className="text-muted-foreground">Access immediate crisis resources and professional help information</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <p className="text-muted-foreground">Get daily quotes and encouragement to support your mental wellness journey</p>
              </div>
            </div>
          </div>

          {/* Free and Available */}
          <div className="space-y-6 pt-8">
            <h2 className="text-3xl font-bold">Free and Available Now</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Talk is completely free to download and use. No subscriptions, no hidden fees - just genuine support when you need it most.
            </p>
            <div className="flex justify-center pt-4">
              <a
                href="https://apps.apple.com/app/talk"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-xl text-lg font-semibold transition-all hover:scale-105 shadow-lg"
              >
                <Apple className="w-6 h-6" />
                Get Started Free
              </a>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 mt-12">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Important:</strong> Talk is designed for peer support and encouragement. It is not a substitute for professional medical advice, diagnosis, or treatment. If you are experiencing a mental health crisis, please contact emergency services or a crisis helpline immediately.
            </p>
          </div>

          {/* Footer */}
          <div className="pt-12 text-sm text-muted-foreground space-x-4">
            <a href="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="/terms-of-service" className="hover:text-foreground transition-colors">Terms of Service</a>
            <span>•</span>
            <a href="/contact" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisplayPage;
