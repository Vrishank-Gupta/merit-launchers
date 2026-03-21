import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, Mail, Phone, AlertCircle, FileText, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReturnPolicy() {
  const refundEligible = [
    "Duplicate Payment: If the same payment was accidentally processed more than once",
    "Technical Error: If the payment was deducted, but the test access was not granted within 24 hours",
    "Unauthorized Transaction: If your account was charged without your authorization and verified proof is provided"
  ];

  const nonRefundable = [
    "Change of mind after purchasing a test series",
    "Incomplete use of the purchased content",
    "Dissatisfaction with test results or difficulty level",
    "Incorrect registration or account errors by the user",
    "Payment made through promotional offers or discounts"
  ];

  const refundSteps = [
    {
      step: 1,
      title: "Send an Email",
      description: "Email info@meritlaunchers.com with your full name, registered email, phone number, transaction ID or payment screenshot, and reason for refund request"
    },
    {
      step: 2,
      title: "Verification",
      description: "Our team will verify your request within 3–5 business days"
    },
    {
      step: 3,
      title: "Processing",
      description: "Approved refunds will be processed to your original payment method within 7–10 working days"
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
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold bg-gradient-primary bg-clip-text text-transparent">
                    Our Policies
                  </span>
                </div>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
                Refund & <span className="bg-gradient-primary bg-clip-text text-transparent">Cancellation Policy</span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                Transparency. Fairness. Trust.
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
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-4">Introduction</h2>
                      <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                        This Refund & Cancellation Policy applies to all purchases made on our website <strong>www.meritlaunchers.com</strong> or through the <strong>Merit Launchers App</strong>. By making a payment, you acknowledge that you have read and agreed to this policy.
                      </p>
                      <p className="text-lg text-muted-foreground leading-relaxed">
                        Our goal is to ensure transparency and fairness in every transaction, while maintaining the integrity of our digital services.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Digital Nature */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">
                  Digital Nature of <span className="bg-gradient-primary bg-clip-text text-transparent">Services</span>
                </h2>
              </div>

              <Card className="shadow-card hover:shadow-premium transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <AlertCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      All our products — including mock tests, question papers, and performance analytics — are <strong>digitally delivered</strong> and <strong>instantly accessible</strong> once the payment is successful. Because digital content cannot be returned once accessed, refunds are generally not provided after activation.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Refund Eligibility */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">
                  Refund <span className="bg-gradient-primary bg-clip-text text-transparent">Eligibility</span>
                </h2>
                <p className="text-lg text-muted-foreground">
                  A refund may be approved only under the following limited circumstances:
                </p>
              </div>

              <div className="space-y-4 mb-8">
                {refundEligible.map((item, index) => (
                  <Card key={index} className="shadow-card hover:shadow-premium transition-all duration-300 group">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        </div>
                        <p className="text-muted-foreground flex-1 pt-1.5">{item}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground font-medium">
                    All refund requests must be made within <strong className="text-primary">7 working days</strong> from the date of transaction.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Non-Refundable */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">
                  Non-Refundable <span className="bg-gradient-primary bg-clip-text text-transparent">Situations</span>
                </h2>
                <p className="text-lg text-muted-foreground">
                  Refunds will not be issued in the following cases:
                </p>
              </div>

              <div className="space-y-4">
                {nonRefundable.map((item, index) => (
                  <Card key={index} className="shadow-card hover:shadow-premium transition-all duration-300 group">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center">
                          <XCircle className="h-5 w-5 text-red-500" />
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

        {/* Cancellation Policy */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">
                  Cancellation <span className="bg-gradient-primary bg-clip-text text-transparent">Policy</span>
                </h2>
              </div>

              <Card className="shadow-card hover:shadow-premium transition-all duration-300">
                <CardContent className="p-8">
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                    Since our services are digital and instantly accessible, <strong>order cancellations are not possible</strong> once payment has been processed.
                  </p>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                    <p className="text-muted-foreground">
                      We encourage users to explore our <strong className="text-primary">Free Mock Test</strong> available for every course before purchasing any paid test series.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Refund Process */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">
                  Refund <span className="bg-gradient-primary bg-clip-text text-transparent">Process</span>
                </h2>
                <p className="text-lg text-muted-foreground">
                  To request a refund (if eligible):
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {refundSteps.map((item) => (
                  <Card key={item.step} className="shadow-card hover:shadow-premium transition-all duration-300 group">
                    <CardContent className="p-6 text-center">
                      <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-primary rounded-full mb-4 shadow-glow group-hover:scale-110 transition-transform">
                        <span className="text-2xl font-bold text-white">{item.step}</span>
                      </div>
                      <h3 className="text-lg font-semibold mb-3">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Dispute Resolution */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">
                  Dispute <span className="bg-gradient-primary bg-clip-text text-transparent">Resolution</span>
                </h2>
              </div>

              <Card className="shadow-card hover:shadow-premium transition-all duration-300">
                <CardContent className="p-8">
                  <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                    In case of any disagreement, users are encouraged to contact our support team first for a quick resolution.
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    All disputes shall be governed by the laws of India, under the jurisdiction of Delhi courts.
                  </p>
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
              <h2 className="text-4xl font-bold mb-4">
                Contact for <span className="bg-gradient-primary bg-clip-text text-transparent">Billing Queries</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                For refund or payment-related assistance, please reach us at:
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="shadow-card hover:shadow-premium transition-all duration-300">
                  <CardContent className="p-8">
                    <Mail className="h-10 w-10 text-primary mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Email Us</h3>
                    <Button variant="link" className="text-primary" asChild>
                      <a href="mailto:billing@meritlaunchers.com">billing@meritlaunchers.com</a>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="shadow-card hover:shadow-premium transition-all duration-300">
                  <CardContent className="p-8">
                    <Phone className="h-10 w-10 text-primary mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Call Us</h3>
                    <Button variant="link" className="text-primary" asChild>
                      <a href="tel:+919354549654">+91-9354549654</a>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Note */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="bg-primary/5 border-primary/20 shadow-card">
                <CardContent className="p-8 text-center">
                  <AlertCircle className="h-10 w-10 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-4">Important Note</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Merit Launchers reserves the right to amend or update this policy at any time. Any such change will be reflected on this page with a new effective date.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Final Message */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-6">
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Transparency. Fairness. Trust.
                </span>
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                At Merit Launchers, every payment is secure, every transaction is traceable, and every genuine concern is handled with care.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
