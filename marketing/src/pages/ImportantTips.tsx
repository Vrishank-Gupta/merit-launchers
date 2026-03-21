import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, ExternalLink, Shield, CreditCard, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function ImportantTips() {
  const tips = [
    {
      icon: ExternalLink,
      title: "Clickable Policy Links",
      description: "Make both 'Privacy Policy' and 'Terms & Conditions' clickable links that open in new browser tabs, so users don't lose their page progress."
    },
    {
      icon: Shield,
      title: "App Download or Registration",
      subtitle: "(Highly Recommended)",
      description: "When users sign up on our Merit Launchers App or click to download/install, you should display a short line like:",
      example: '"By continuing, you agree to our Privacy Policy and Terms & Conditions."'
    },
    {
      icon: CreditCard,
      title: "Payment or Checkout Pages",
      description: "On the payment screen (where users pay to unlock test series), add a small note such as:",
      example: '"Your payment is processed securely. Please review our Privacy Policy and Terms & Conditions before proceeding."',
      note: "This builds trust and ensures legal transparency for online transactions."
    },
    {
      icon: FileText,
      title: "Optional: Separate Legal Section in Footer",
      description: "If you'd like a cleaner look, you can group these under one dropdown or mini-section in the footer:",
      subtitle: "Legal Information",
      list: [
        "Privacy Policy",
        "Terms & Conditions",
        "Refund & Cancellation Policy"
      ]
    }
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
                  <Lightbulb className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold bg-gradient-primary bg-clip-text text-transparent">
                    Best Practices
                  </span>
                </div>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
                Important <span className="bg-gradient-primary bg-clip-text text-transparent">Tips</span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                Essential guidelines for website development and user experience
              </p>
            </div>
          </div>
        </section>

        {/* Tips Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="space-y-8">
                {tips.map((tip, index) => (
                  <Card key={index} className="shadow-card hover:shadow-premium transition-all duration-300 group">
                    <CardContent className="p-8">
                      <div className="flex items-start gap-6">
                        <div className="flex-shrink-0 w-14 h-14 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
                          <tip.icon className="h-7 w-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">
                                {index + 1}. {tip.title}
                              </h3>
                              {tip.subtitle && (
                                <p className="text-sm text-primary font-semibold mt-1">{tip.subtitle}</p>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                            {tip.description}
                          </p>

                          {tip.example && (
                            <div className="bg-primary/5 border-l-4 border-primary rounded-r-lg p-4 mb-4">
                              <p className="text-foreground italic font-medium">
                                {tip.example}
                              </p>
                            </div>
                          )}

                          {tip.note && (
                            <p className="text-muted-foreground italic">
                              {tip.note}
                            </p>
                          )}

                          {tip.list && (
                            <div className="mt-4">
                              <ul className="space-y-2">
                                {tip.list.map((item, idx) => (
                                  <li key={idx} className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                                    <span className="text-muted-foreground">{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Quick Links Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">
                  Related <span className="bg-gradient-primary bg-clip-text text-transparent">Pages</span>
                </h2>
                <p className="text-lg text-muted-foreground">
                  Access our important policy documents
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <Card className="shadow-card hover:shadow-premium transition-all duration-300 group">
                  <CardContent className="p-6 text-center">
                    <Shield className="h-10 w-10 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-lg font-semibold mb-3">Privacy Policy</h3>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/privacy-policy">View Policy</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="shadow-card hover:shadow-premium transition-all duration-300 group">
                  <CardContent className="p-6 text-center">
                    <FileText className="h-10 w-10 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-lg font-semibold mb-3">Terms & Conditions</h3>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/terms-conditions">View Terms</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="shadow-card hover:shadow-premium transition-all duration-300 group">
                  <CardContent className="p-6 text-center">
                    <CreditCard className="h-10 w-10 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-lg font-semibold mb-3">Refund Policy</h3>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/return-policy">View Policy</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Implementation Note */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <Card className="bg-gradient-hero border-primary/20">
                <CardContent className="p-8 text-center">
                  <Lightbulb className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-4">Implementation Note</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    These tips ensure legal compliance, build user trust, and provide transparency across the Merit Launchers platform. Following these guidelines helps create a better user experience while maintaining professional standards.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
