import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, CreditCard, Clock, Shield, TrendingUp } from "lucide-react";

export default function FeeStructure() {
  const appLink = "https://play.google.com/store/apps/details?id=co.robin.qibrw&hl=en";

  const feeData = [
    { course: "CUET (UG) per subject", tests: "10 Full Tests", fee: "₹499 plus Taxes per Subject", freeMock: "Yes" },
    { course: "CLAT (Law)", tests: "10 Full Tests", fee: "₹299 plus Taxes", freeMock: "Yes" },
    { course: "CTET -I", tests: "10 Full Tests each", fee: "₹299 plus Taxes each", freeMock: "Yes" },
    { course: "CTET-II", tests: "10 Full Tests each", fee: "₹299 plus Taxes each", freeMock: "Yes" },
    { course: "JEE (Engineering) per subject", tests: "10 Full Tests", fee: "₹149 plus Taxes", freeMock: "No" },
    { course: "IPMAT (IIMs)", tests: "10 Full Tests", fee: "₹299 plus Taxes", freeMock: "No" },
    { course: "NEET (Medical) per subject", tests: "10 Full Tests", fee: "₹149 plus Taxes", freeMock: "No" },
    { course: "SSC (CGL, CHSL, CPO, etc.)", tests: "10 Full Tests", fee: "₹249 plus Taxes", freeMock: "Yes" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="Fee Structure - Merit Launchers | Affordable Mock Test Pricing"
        description="Transparent and affordable pricing for Merit Launchers mock tests. CUET ₹99, CLAT ₹299, CTET ₹299, JEE ₹149, NEET ₹149, SSC ₹249. Each course includes 10 full-length tests with detailed analytics."
        keywords="mock test fees, test series pricing, affordable test preparation, CUET fee, CLAT fee, JEE mock test price, NEET test series cost"
      />
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-primary text-white py-10">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl font-bold mb-3">
                Fee Structure
              </h1>
              <p className="text-lg text-white/90">
                Affordable Excellence in Test Preparation
              </p>
            </div>
          </div>
        </section>

        {/* Fee Table */}
        <section className="py-8 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-card rounded-lg overflow-hidden shadow-lg text-sm">
                  <thead>
                    <tr className="bg-primary text-primary-foreground">
                      <th className="px-4 py-3 text-left font-semibold">Course</th>
                      <th className="px-4 py-3 text-left font-semibold">Tests</th>
                      <th className="px-4 py-3 text-left font-semibold">Fee</th>
                      <th className="px-4 py-3 text-left font-semibold">Free</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeData.map((item, index) => (
                      <tr key={index} className="border-b border-border hover:bg-accent/50 transition-colors">
                        <td className="px-4 py-3 font-medium">{item.course}</td>
                        <td className="px-4 py-3">{item.tests}</td>
                        <td className="px-4 py-3 font-semibold text-primary">{item.fee}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            item.freeMock === "Yes" 
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                          }`}>
                            {item.freeMock}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Each plan includes unlimited access, detailed analytics, and full explanations
              </p>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-8 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-card p-4 rounded-lg shadow-card text-center">
                  <CreditCard className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h3 className="text-sm font-semibold mb-1">Secure Payments</h3>
                  <p className="text-xs text-muted-foreground">UPI, Cards accepted</p>
                </div>
                <div className="bg-card p-4 rounded-lg shadow-card text-center">
                  <CheckCircle className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h3 className="text-sm font-semibold mb-1">Instant Activation</h3>
                  <p className="text-xs text-muted-foreground">Immediate access</p>
                </div>
                <div className="bg-card p-4 rounded-lg shadow-card text-center">
                  <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h3 className="text-sm font-semibold mb-1">Transparent</h3>
                  <p className="text-xs text-muted-foreground">No hidden costs</p>
                </div>
                <div className="bg-card p-4 rounded-lg shadow-card text-center">
                  <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h3 className="text-sm font-semibold mb-1">Regular Updates</h3>
                  <p className="text-xs text-muted-foreground">Latest patterns</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Refund & Free Test */}
        <section className="py-8 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
              {/* Refund Policy */}
              <div className="bg-card p-6 rounded-lg shadow-card">
                <h2 className="text-2xl font-bold mb-4">Refund Policy</h2>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">• No refunds after activation</p>
                  <p className="text-muted-foreground">• Refunds only for duplicate/technical issues</p>
                  <p className="text-muted-foreground">• Request via <a href="mailto:info@meritlaunchers.com" className="text-primary hover:underline">info@meritlaunchers.com</a> within 7 days</p>
                  <p className="text-muted-foreground">• Processing: 7-10 working days</p>
                  <p className="text-sm mt-3">
                    <Link to="/return-policy" className="text-primary hover:underline">View full policy</Link>
                  </p>
                </div>
              </div>

              {/* Free Test */}
              <div className="bg-gradient-primary p-6 rounded-lg shadow-card text-white text-center">
                <h2 className="text-2xl font-bold mb-4">Free Mock Test</h2>
                <p className="mb-4">
                  Try one free full-length test before purchasing
                </p>
                <Button size="lg" variant="secondary" asChild>
                  <a href={appLink} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-5 w-5" />
                    Take Free Test
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-8 bg-gradient-primary text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Start Smart</h2>
              <p className="text-lg mb-6 text-white/90">
                Join thousands preparing with Merit Launchers
              </p>
              <Button size="lg" variant="secondary" asChild>
                <a href={appLink} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-5 w-5" />
                  Begin Journey
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