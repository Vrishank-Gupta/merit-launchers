import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Lock, Eye, Link as LinkIcon, RefreshCw, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
  const informationCollected = [
    "Personal Details: Name, email, phone number, and basic demographic data",
    "Login Data: Username, password, and app activity (to provide better performance analytics)",
    "Payment Information: Details required for online transactions (processed securely through trusted third-party gateways)",
    "Usage Data: Pages visited, time spent, mock tests attempted, and performance reports"
  ];

  const howWeUse = [
    "Provide access to mock tests and result analytics",
    "Improve app performance and user experience",
    "Process payments and generate receipts",
    "Send important notifications, exam updates, or promotional offers (optional)",
    "Ensure account security and prevent unauthorized access"
  ];

  const yourRights = [
    "Access and update your personal data",
    "Request deletion of your account",
    "Opt out of promotional emails or messages"
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main>
        {/* Hero Section */}
        <section className="relative bg-gradient-hero py-24 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(6,182,212,0.15),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(251,146,60,0.15),transparent_50%)]"></div>
          
          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-gradient-primary p-1 rounded-full mb-6 animate-float">
                <div className="bg-background px-6 py-2 rounded-full flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold bg-gradient-primary bg-clip-text text-transparent">
                    Your Privacy Matters
                  </span>
                </div>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
                Privacy <span className="bg-gradient-primary bg-clip-text text-transparent">Policy</span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                We are committed to protecting your personal information and your right to privacy
              </p>
            </div>
          </div>
        </section>

        {/* Introduction */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="shadow-card hover:shadow-premium transition-all duration-300 border-primary/20">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-4">Introduction</h2>
                      <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                        Welcome to <strong>Merit Launchers</strong>. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, and safeguard your data when you visit our website <strong>www.meritlaunchers.com</strong> or use our <strong>Merit Launchers App</strong>.
                      </p>
                      <p className="text-lg text-muted-foreground leading-relaxed">
                        By accessing or using our website or app, you agree to the terms of this Privacy Policy.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Information We Collect */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-6 shadow-glow">
                  <Eye className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-4xl font-bold mb-4">
                  Information We <span className="bg-gradient-primary bg-clip-text text-transparent">Collect</span>
                </h2>
                <p className="text-lg text-muted-foreground">
                  We collect the following information when you interact with us:
                </p>
              </div>

              <div className="space-y-4 mb-8">
                {informationCollected.map((item, index) => (
                  <Card key={index} className="shadow-card hover:shadow-premium transition-all duration-300 group">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-muted-foreground flex-1 pt-1.5">{item}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-muted-foreground font-medium">
                      We do not store any sensitive payment data like card numbers or CVV codes on our servers.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How We Use Your Information */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">
                  How We Use Your <span className="bg-gradient-primary bg-clip-text text-transparent">Information</span>
                </h2>
              </div>

              <div className="grid gap-4">
                {howWeUse.map((item, index) => (
                  <Card key={index} className="shadow-card hover:shadow-premium transition-all duration-300 group">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow">
                          <CheckCircle2 className="h-5 w-5 text-white" />
                        </div>
                        <p className="text-muted-foreground flex-1 pt-1.5">{item}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Your Rights */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">
                  Your <span className="bg-gradient-primary bg-clip-text text-transparent">Rights</span>
                </h2>
                <p className="text-lg text-muted-foreground">You have the right to:</p>
              </div>

              <div className="space-y-4 mb-8">
                {yourRights.map((item, index) => (
                  <Card key={index} className="shadow-card hover:shadow-premium transition-all duration-300 group">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
                          <CheckCircle2 className="h-5 w-5 text-white" />
                        </div>
                        <p className="text-lg text-muted-foreground flex-1 pt-1.5">{item}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-gradient-hero border-primary/20">
                <CardContent className="p-8 text-center">
                  <p className="text-lg text-muted-foreground mb-6">
                    To exercise these rights, contact us at:
                  </p>
                  <Button size="lg" variant="default" className="shadow-glow hover:shadow-premium transition-all duration-300" asChild>
                    <a href="mailto:info@meritlaunchers.com" className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      info@meritlaunchers.com
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Third-Party Links */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="shadow-card hover:shadow-premium transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow">
                      <LinkIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-4">Third-Party Links</h2>
                      <p className="text-lg text-muted-foreground leading-relaxed">
                        Our site may contain links to external websites (e.g., NTA, SSC, DSSSB). We are not responsible for the privacy practices or content of these external sites.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Policy Updates */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="shadow-card hover:shadow-premium transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow">
                      <RefreshCw className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-4">Policy Updates</h2>
                      <p className="text-lg text-muted-foreground leading-relaxed">
                        This Privacy Policy may be updated periodically. The latest version will always be available on this page, along with the effective date.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 bg-gradient-hero relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.1),transparent_70%)]"></div>
          
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-6 shadow-premium">
                <Mail className="h-8 w-8 text-white" />
              </div>
              
              <h2 className="text-4xl font-bold mb-4">
                Contact <span className="bg-gradient-primary bg-clip-text text-transparent">Us</span>
              </h2>
              
              <p className="text-xl text-muted-foreground mb-8">
                For any privacy-related concerns or questions, reach us at:
              </p>
              
              <Button size="lg" className="shadow-glow hover:shadow-premium transition-all duration-300" asChild>
                <a href="mailto:info@meritlaunchers.com" className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  info@meritlaunchers.com
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
