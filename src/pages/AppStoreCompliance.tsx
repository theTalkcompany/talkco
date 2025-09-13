import { Helmet } from "react-helmet-async";
import { Shield, AlertTriangle, Phone, Mail, FileText, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const AppStoreCompliance = () => {
  return (
    <>
      <Helmet>
        <title>App Store Compliance & Medical Disclaimers - Talk</title>
        <meta name="description" content="Important legal information, medical disclaimers, and compliance details for Talk mental health support platform." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="/app-store-compliance" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              App Store Compliance & Legal Information
            </h1>
            <p className="text-lg text-muted-foreground">
              Important information about our app's compliance, medical disclaimers, and regulatory details.
            </p>
          </div>

          <div className="space-y-8">
            {/* Medical Disclaimer */}
            <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                  <AlertTriangle className="h-5 w-5" />
                  Important Medical Disclaimer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-orange-800 dark:text-orange-200 space-y-3">
                  <p className="font-semibold">
                    Talk is NOT a substitute for professional medical advice, diagnosis, or treatment.
                  </p>
                  <ul className="space-y-2 list-disc pl-6">
                    <li>Our AI companion provides general mental health support and information only</li>
                    <li>We are not licensed mental health professionals or medical practitioners</li>
                    <li>Always seek the advice of qualified health professionals for medical concerns</li>
                    <li>Never disregard professional medical advice because of something you read in our app</li>
                    <li>In case of emergency or suicidal thoughts, contact emergency services immediately</li>
                  </ul>
                  <div className="bg-orange-100 dark:bg-orange-900/30 p-4 rounded-lg mt-4">
                    <p className="font-semibold text-sm">Emergency Contacts:</p>
                    <p className="text-sm">UK: Samaritans - 116 123 (free, 24/7)</p>
                    <p className="text-sm">Crisis Text Line UK - Text SHOUT to 85258</p>
                    <p className="text-sm">Emergency - Call 999</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Age Rating & Content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Age Rating & Content Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Age Rating: 17+</h3>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Mental health content</li>
                      <li>• Crisis support discussions</li>
                      <li>• User-generated content</li>
                      <li>• Community interactions</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Content Moderation</h3>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• AI-powered content filtering</li>
                      <li>• User reporting system</li>
                      <li>• Community guidelines enforcement</li>
                      <li>• Professional oversight protocols</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data & Privacy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Data Protection & Privacy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">GDPR Compliance</h3>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Right to access personal data</li>
                      <li>• Right to data portability</li>
                      <li>• Right to erasure ("right to be forgotten")</li>
                      <li>• Data minimization principles</li>
                      <li>• Consent management</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Data Security</h3>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• End-to-end encryption for conversations</li>
                      <li>• Secure cloud infrastructure (Supabase)</li>
                      <li>• Regular security audits</li>
                      <li>• No data sold to third parties</li>
                      <li>• Minimal data collection</li>
                    </ul>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 pt-4 border-t">
                  <Button variant="outline" asChild>
                    <Link to="/privacy-policy">View Privacy Policy</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/terms-of-service">View Terms of Service</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Technical Compliance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Technical & Regulatory Compliance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Platform Compliance</h3>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Apple App Store Guidelines compliance</li>
                      <li>• Google Play Store Policy compliance</li>
                      <li>• Accessibility (WCAG 2.1) standards</li>
                      <li>• Progressive Web App standards</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Healthcare Regulations</h3>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• No protected health information (PHI) storage</li>
                      <li>• Clear non-medical service disclaimers</li>
                      <li>• Crisis intervention protocols</li>
                      <li>• Professional resource referrals</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Compliance Contact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  For compliance inquiries, data protection requests, or regulatory concerns:
                </p>
                <div className="flex items-center gap-4">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href="mailto:talkco@outlook.com" className="text-primary hover:underline">
                    talkco@outlook.com
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default AppStoreCompliance;