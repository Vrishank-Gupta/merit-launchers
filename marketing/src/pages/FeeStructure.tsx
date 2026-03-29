import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, CreditCard, Shield, TrendingUp } from "lucide-react";
import { pageSeo } from "@/lib/seo";

export default function FeeStructure() {
  const appLink = "https://play.google.com/store/apps/details?id=co.robin.qibrw&hl=en";

  const feeData = [
    { course: "CUET (UG)", tests: "All papers inside one chosen subject", fee: "Rs 499* per subject", freeMock: "Yes" },
    { course: "IPMAT", tests: "Full course access", fee: "Rs 2,499*", freeMock: "Yes" },
    { course: "CLAT", tests: "Full course access", fee: "Rs 499*", freeMock: "Yes" },
    { course: "CTET", tests: "Full course access", fee: "Rs 499*", freeMock: "Yes" },
    { course: "JEE", tests: "Full course access", fee: "Rs 499*", freeMock: "Yes" },
    { course: "NEET", tests: "Full course access", fee: "Rs 499*", freeMock: "Yes" },
    { course: "SSC / DSSSB", tests: "Full course access", fee: "Rs 499*", freeMock: "Yes" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SEO {...pageSeo.feeStructure} />
      <Navbar />

      <main className="flex-grow">
        <section className="bg-gradient-primary py-10 text-white">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="mb-3 text-4xl font-bold">Fee Structure</h1>
              <p className="text-lg text-white/90">Affordable excellence in test preparation</p>
            </div>
          </div>
        </section>

        <section className="bg-background py-8">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-6xl">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse overflow-hidden rounded-lg bg-card text-sm shadow-lg">
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
                      <tr key={index} className="border-b border-border transition-colors hover:bg-accent/50">
                        <td className="px-4 py-3 font-medium">{item.course}</td>
                        <td className="px-4 py-3">{item.tests}</td>
                        <td className="px-4 py-3 font-semibold text-primary">{item.fee}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              item.freeMock === "Yes"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                          >
                            {item.freeMock}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                *GST extra. CUET purchases unlock one subject at a time, while every other course unlocks in full.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-secondary/30 py-8">
          <div className="container mx-auto px-4">
            <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-4">
              <div className="rounded-lg bg-card p-4 text-center shadow-card">
                <CreditCard className="mx-auto mb-2 h-8 w-8 text-primary" />
                <h3 className="mb-1 text-sm font-semibold">Secure Payments</h3>
                <p className="text-xs text-muted-foreground">UPI and cards accepted</p>
              </div>
              <div className="rounded-lg bg-card p-4 text-center shadow-card">
                <CheckCircle className="mx-auto mb-2 h-8 w-8 text-primary" />
                <h3 className="mb-1 text-sm font-semibold">Instant Activation</h3>
                <p className="text-xs text-muted-foreground">Immediate access after purchase</p>
              </div>
              <div className="rounded-lg bg-card p-4 text-center shadow-card">
                <Shield className="mx-auto mb-2 h-8 w-8 text-primary" />
                <h3 className="mb-1 text-sm font-semibold">Transparent</h3>
                <p className="text-xs text-muted-foreground">No hidden costs</p>
              </div>
              <div className="rounded-lg bg-card p-4 text-center shadow-card">
                <TrendingUp className="mx-auto mb-2 h-8 w-8 text-primary" />
                <h3 className="mb-1 text-sm font-semibold">Regular Updates</h3>
                <p className="text-xs text-muted-foreground">Aligned to current exam patterns</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-background py-8">
          <div className="container mx-auto px-4">
            <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
              <div className="rounded-lg bg-card p-6 shadow-card">
                <h2 className="mb-4 text-2xl font-bold">Refund Policy</h2>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">No refunds after activation.</p>
                  <p className="text-muted-foreground">Refunds are allowed only for duplicate or technical issues.</p>
                  <p className="text-muted-foreground">
                    Request help via{" "}
                    <a href="mailto:info@meritlaunchers.com" className="text-primary hover:underline">
                      info@meritlaunchers.com
                    </a>{" "}
                    within 7 days.
                  </p>
                  <p className="text-muted-foreground">Processing time: 7 to 10 working days.</p>
                  <p className="mt-3 text-sm">
                    <Link to="/return-policy" className="text-primary hover:underline">
                      View full policy
                    </Link>
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-gradient-primary p-6 text-center text-white shadow-card">
                <h2 className="mb-4 text-2xl font-bold">Free Mock Test</h2>
                <p className="mb-4">Try one free full-length test before purchasing.</p>
                <Button size="lg" variant="secondary" asChild>
                  <a href={appLink} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-5 w-5" />
                    Take free test
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gradient-primary py-8 text-white">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-4 text-3xl font-bold">Start Smart</h2>
              <p className="mb-6 text-lg text-white/90">
                Join thousands of students preparing with Merit Launchers.
              </p>
              <Button size="lg" variant="secondary" asChild>
                <a href={appLink} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-5 w-5" />
                  Begin journey
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
