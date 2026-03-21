import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, UserCheck, CreditCard, Copyright, AlertTriangle, Users, RefreshCw, Scale, Mail, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsConditions() {
  const servicesOffered = [
    "Online mock tests for CUET, CLAT, JEE, IPMAT, NEET, SSC, and DSSSB",
    "Question papers with detailed solutions",
    "Performance analytics and reports",
    "All content is for educational and practice purposes only"
  ];

  const userConduct = [
    { type: "do", text: "Avoid sharing test credentials with others" },
    { type: "do", text: "Not engage in hacking, spamming, or data misuse" },
    { type: "do", text: "Use the platform ethically for self-learning and improvement" }
  ];

  const liabilityExclusions = [
    "Technical issues or downtime",
    "Errors or omissions in content",
    "Any decisions made based on test scores or analytics"
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
                  <Scale className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold bg-gradient-primary bg-clip-text text-transparent">
                    Legal Terms
                  </span>
                </div>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
                Terms & <span className="bg-gradient-primary bg-clip-text text-transparent">Conditions</span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                Please read these terms carefully before using our platform
              </p>
            </div>
          </div>
        </section>

        {/* Acceptance of Terms */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="shadow-card hover:shadow-premium transition-all duration-300 border-primary/20">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-4">Acceptance of Terms</h2>
                      <p className="text-lg text-muted-foreground leading-relaxed">
                        By accessing <strong>www.meritlaunchers.com</strong> or using the <strong>Merit Launchers App</strong>, you agree to these Terms & Conditions. If you do not agree, please discontinue using our platform.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Services Offered */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-6 shadow-glow">
                  <UserCheck className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-4xl font-bold mb-4">
                  Services <span className="bg-gradient-primary bg-clip-text text-transparent">Offered</span>
                </h2>
                <p className="text-lg text-muted-foreground">
                  Merit Launchers provides:
                </p>
              </div>

              <div className="grid gap-4">
                {servicesOffered.map((item, index) => (
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
            </div>
          </div>
        </section>

        {/* Registration & Account */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="shadow-card hover:shadow-premium transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-4">Registration & Account</h2>
                      <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                        You must register with a valid email or phone number to access our services. You are responsible for maintaining the confidentiality of your account credentials.
                      </p>
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                        <p className="text-muted-foreground">
                          <strong className="text-destructive">Warning:</strong> Any misuse of the app or attempt to tamper with test data will lead to suspension or permanent account deletion.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Payment & Refunds */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="shadow-card hover:shadow-premium transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-4">Payment & Refunds</h2>
                      <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                        All fees for mock tests and subscriptions are <strong>non-refundable</strong> once payment is confirmed, except in cases of technical failure or duplicate transactions.
                      </p>
                      <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                        Payments are processed securely through certified third-party gateways.
                      </p>
                      <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="p-6">
                          <p className="text-muted-foreground">
                            In case of issues, users can email <strong className="text-primary">info@meritlaunchers.com</strong> with proof of payment.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Content & Intellectual Property */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="shadow-card hover:shadow-premium transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow">
                      <Copyright className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-4">Content & Intellectual Property</h2>
                      <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                        All test papers, questions, solutions, and content available on the website and app are the intellectual property of Merit Launchers.
                      </p>
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                        <p className="text-muted-foreground">
                          <strong className="text-destructive">Strictly Prohibited:</strong> Reproduction, resale, or redistribution of any material without written permission.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Limitation of Liability */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-6 shadow-glow">
                  <AlertTriangle className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-4xl font-bold mb-4">
                  Limitation of <span className="bg-gradient-primary bg-clip-text text-transparent">Liability</span>
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  While we strive to provide accurate and updated content, Merit Launchers is not responsible for any loss or damage arising from:
                </p>
              </div>

              <div className="space-y-4 mb-8">
                {liabilityExclusions.map((item, index) => (
                  <Card key={index} className="shadow-card hover:shadow-premium transition-all duration-300 group">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center">
                          <XCircle className="h-5 w-5 text-yellow-600" />
                        </div>
                        <p className="text-muted-foreground flex-1 pt-1.5">{item}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground text-lg">
                    Our services are tools for practice — <strong className="text-primary">final results depend on your preparation and effort.</strong>
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* User Conduct */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">
                  User <span className="bg-gradient-primary bg-clip-text text-transparent">Conduct</span>
                </h2>
                <p className="text-lg text-muted-foreground">Users must:</p>
              </div>

              <div className="grid gap-4">
                {userConduct.map((item, index) => (
                  <Card key={index} className="shadow-card hover:shadow-premium transition-all duration-300 group">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
                          <CheckCircle2 className="h-5 w-5 text-white" />
                        </div>
                        <p className="text-muted-foreground flex-1 pt-1.5">{item.text}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Changes to Services */}
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
                      <h2 className="text-2xl font-bold mb-4">Changes to Services</h2>
                      <p className="text-lg text-muted-foreground leading-relaxed">
                        Merit Launchers reserves the right to modify, suspend, or discontinue any aspect of our services at any time without prior notice. We are not liable for any modifications or discontinuations.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Governing Law */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="shadow-card hover:shadow-premium transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow">
                      <Scale className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-4">Governing Law</h2>
                      <p className="text-lg text-muted-foreground leading-relaxed">
                        These Terms & Conditions are governed by the laws of <strong>India</strong>, and all disputes shall be subject to the exclusive jurisdiction of courts in <strong>Delhi</strong>.
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
                Questions About Our <span className="bg-gradient-primary bg-clip-text text-transparent">Terms?</span>
              </h2>
              
              <p className="text-xl text-muted-foreground mb-8">
                For any questions or clarifications, feel free to contact us:
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
