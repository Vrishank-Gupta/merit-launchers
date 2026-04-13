import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import CourseSidebar from "@/components/courses/CourseSidebar";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { BookOpen, Download, FileText, CheckCircle2, Users, GraduationCap, Target, TrendingUp, Award, BarChart } from "lucide-react";
import { pageSeo } from "@/lib/seo";

const CUET = () => {
  useEffect(() => {
    const timer = setTimeout(() => {
      const keyHighlightsSection = document.getElementById('key-highlights');
      if (keyHighlightsSection) {
        keyHighlightsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <SEO
        {...pageSeo.cuet}
        pageEvent={{ name: 'course_page_view', params: { exam: 'CUET' } }}
      />
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="grid lg:grid-cols-[300px_1fr] gap-8">
          <CourseSidebar
            courseName="CUET"
            courseTitle="Common University Entrance Test"
            officialWebsite="https://cuet.nta.nic.in"
          />

          <main className="space-y-12">
            <section className="rounded-3xl border border-primary/15 bg-gradient-to-r from-primary/8 via-background to-accent/10 p-6 shadow-card">
              <div className="max-w-3xl space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">CUET Mock Test Series</p>
                <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">{pageSeo.cuet.h1}</h1>
                <p className="text-base leading-7 text-muted-foreground">
                  Practice subject-wise CUET papers with realistic exam flow, clear analytics, and one subject unlock that covers every paper inside that subject.
                </p>
              </div>
            </section>
            {/* About Section */}
            <section id="about">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="h-7 w-7 text-primary" />
                <h2 className="text-3xl font-bold">About CUET</h2>
              </div>
              <Card className="mb-5 border-primary/20 bg-gradient-to-r from-primary/10 via-background to-accent/10 p-5 shadow-card">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Pricing</p>
                    <p className="mt-2 text-2xl font-bold">Rs 499* per subject</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.22em] text-muted-foreground">*GST extra</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Unlock a subject once and access every paper under that subject in the student portal.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-background/80 px-4 py-3 text-sm shadow-sm">
                    <p className="font-semibold text-foreground">One subject unlock = full subject access</p>
                    <p className="text-muted-foreground">No separate payment per paper.</p>
                  </div>
                </div>
              </Card>
              <div className="space-y-3 text-muted-foreground leading-relaxed">
                <p>
                  The Common University Entrance Test (CUET-UG) is a national-level computer-based test conducted by the National Testing Agency (NTA) for admission to undergraduate programs offered by Central, State, Deemed, and Private Universities across India.
                </p>
                <p>
                  The CUET brings all universities under a single platform, ensuring equal opportunities for every student through one standardized exam.
                </p>
              </div>
            </section>

            {/* Key Highlights Section */}
            <section id="key-highlights">
              <h2 className="text-3xl font-bold mb-6">CUET 2026 — Key Highlights</h2>
              <Card className="overflow-hidden border-primary/20 shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <tbody className="divide-y divide-border">
                      <tr className="hover:bg-accent/5 transition-colors">
                        <td className="px-6 py-3 font-semibold text-primary">Conducting Body</td>
                        <td className="px-6 py-3 text-muted-foreground">National Testing Agency (NTA)</td>
                      </tr>
                      <tr className="hover:bg-accent/5 transition-colors">
                        <td className="px-6 py-3 font-semibold text-primary">Mode of Exam</td>
                        <td className="px-6 py-3 text-muted-foreground">Computer Based Test (CBT)</td>
                      </tr>
                      <tr className="hover:bg-accent/5 transition-colors">
                        <td className="px-6 py-3 font-semibold text-primary">Exam Dates (2026)</td>
                        <td className="px-6 py-3 text-muted-foreground">May 11 – May 31, 2026</td>
                      </tr>
                      <tr className="hover:bg-accent/5 transition-colors">
                        <td className="px-6 py-3 font-semibold text-primary">Admit Card</td>
                        <td className="px-6 py-3 text-muted-foreground">Early May 2026</td>
                      </tr>
                      <tr className="hover:bg-accent/5 transition-colors">
                        <td className="px-6 py-3 font-semibold text-primary">Result Declaration</td>
                        <td className="px-6 py-3 text-muted-foreground">Last week of July 2026</td>
                      </tr>
                      <tr className="hover:bg-accent/5 transition-colors">
                        <td className="px-6 py-3 font-semibold text-primary">Eligibility</td>
                        <td className="px-6 py-3 text-muted-foreground">Class 12 passed / appearing from a recognized board</td>
                      </tr>
                      <tr className="hover:bg-accent/5 transition-colors">
                        <td className="px-6 py-3 font-semibold text-primary">Subjects</td>
                        <td className="px-6 py-3 text-muted-foreground">Up to 5 subjects — Languages, Domain-specific, and General Test</td>
                      </tr>
                      <tr className="hover:bg-accent/5 transition-colors">
                        <td className="px-6 py-3 font-semibold text-primary">Question Type</td>
                        <td className="px-6 py-3 text-muted-foreground">Multiple Choice Questions (MCQs)</td>
                      </tr>
                      <tr className="hover:bg-accent/5 transition-colors">
                        <td className="px-6 py-3 font-semibold text-primary">Marking Scheme</td>
                        <td className="px-6 py-3 text-muted-foreground">+5 for correct, –1 for incorrect, 0 for unattempted</td>
                      </tr>
                      <tr className="hover:bg-accent/5 transition-colors">
                        <td className="px-6 py-3 font-semibold text-primary">Duration</td>
                        <td className="px-6 py-3 text-muted-foreground">60 minutes per subject paper</td>
                      </tr>
                      <tr className="hover:bg-accent/5 transition-colors">
                        <td className="px-6 py-3 font-semibold text-primary">Participating Universities</td>
                        <td className="px-6 py-3 text-muted-foreground">250+ (Central, State, Deemed, and Private)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>

            {/* Important Dates Section */}
            <section id="important-dates">
              <h2 className="text-3xl font-bold mb-6">CUET UG 2026 — Important Dates</h2>
              <Card className="overflow-hidden border-primary/20 shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-primary/8 border-b border-primary/20">
                        <th className="px-6 py-3 text-left font-semibold text-primary">Event</th>
                        <th className="px-6 py-3 text-left font-semibold text-primary">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr className="hover:bg-accent/5 transition-colors">
                        <td className="px-6 py-3 text-muted-foreground">Registration Start Date</td>
                        <td className="px-6 py-3 font-medium">January 3, 2026</td>
                      </tr>
                      <tr className="hover:bg-accent/5 transition-colors">
                        <td className="px-6 py-3 text-muted-foreground">Application Correction Window</td>
                        <td className="px-6 py-3 font-medium">February 9 – 11, 2026</td>
                      </tr>
                      <tr className="hover:bg-accent/5 transition-colors">
                        <td className="px-6 py-3 text-muted-foreground">City Intimation Slip</td>
                        <td className="px-6 py-3 font-medium">Last week of April 2026 (tentative)</td>
                      </tr>
                      <tr className="hover:bg-accent/5 transition-colors">
                        <td className="px-6 py-3 text-muted-foreground">Admit Card Release</td>
                        <td className="px-6 py-3 font-medium">Early May 2026</td>
                      </tr>
                      <tr className="bg-primary/5 hover:bg-primary/8 transition-colors">
                        <td className="px-6 py-3 font-semibold text-primary">CUET UG 2026 Exam</td>
                        <td className="px-6 py-3 font-semibold text-primary">May 11 – May 31, 2026</td>
                      </tr>
                      <tr className="hover:bg-accent/5 transition-colors">
                        <td className="px-6 py-3 text-muted-foreground">Provisional Answer Key</td>
                        <td className="px-6 py-3 font-medium">Third week of June 2026</td>
                      </tr>
                      <tr className="hover:bg-accent/5 transition-colors">
                        <td className="px-6 py-3 text-muted-foreground">Result Declaration</td>
                        <td className="px-6 py-3 font-medium">Last week of July 2026</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
              <p className="text-xs text-muted-foreground mt-3 italic">* Dates are as announced by NTA and subject to change. Check cuet.nta.nic.in regularly for updates.</p>
            </section>

            {/* Additional Info */}
            <section>
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-primary/20">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <GraduationCap className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Eligibility</h3>
                  <p className="text-sm text-muted-foreground">
                    Students who have passed or are appearing in Class 12 (or equivalent) are eligible.
                  </p>
                </Card>

                <Card className="p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-primary/20">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Registration</h3>
                  <p className="text-sm text-muted-foreground">
                    Completely online via cuet.nta.nic.in. Students may choose up to 5 subjects.
                  </p>
                </Card>

                <Card className="p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-primary/20">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Frequency</h3>
                  <p className="text-sm text-muted-foreground">
                    Conducted once every year, usually between May–June.
                  </p>
                </Card>
              </div>
            </section>

            {/* Why Practice Section */}
            <section id="why-practice">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-3">Why Practice CUET with Merit Launchers?</h2>
                <p className="text-muted-foreground">
                  Preparing yourself with the Merit Launchers App ensures you experience CUET exactly the way it is conducted by NTA — and much more
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-primary/20">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">10+ Full-Length Mock Tests</h3>
                  <p className="text-sm text-muted-foreground">
                    Minimum 10 mock tests per subject following the latest NTA patterns.
                  </p>
                </Card>

                <Card className="p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-primary/20">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <BarChart className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Instant Results & Analytics</h3>
                  <p className="text-sm text-muted-foreground">
                    Know your exact score/percentile and weak areas immediately after test submission.
                  </p>
                </Card>

                <Card className="p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-primary/20">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">All-India Ranking System</h3>
                  <p className="text-sm text-muted-foreground">
                    Compare your performance with other aspirants nationwide.
                  </p>
                </Card>

                <Card className="p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-primary/20">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Affordable Plans</h3>
                  <p className="text-sm text-muted-foreground">
                    High-quality preparation at a nominal online fee.
                  </p>
                </Card>

                <Card className="p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-primary/20">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Solution Review Mode</h3>
                  <p className="text-sm text-muted-foreground">
                    See detailed answers after each test to learn from mistakes.
                  </p>
                </Card>

                <Card className="p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-primary/20">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Real Test Interface</h3>
                  <p className="text-sm text-muted-foreground">
                    Experience CUET exactly as conducted by NTA.
                  </p>
                </Card>
              </div>
            </section>

            {/* Free Mock Test */}
            <section className="bg-gradient-to-br from-primary/10 via-accent/5 to-background p-8 rounded-xl">
              <div className="text-center space-y-4">
                <div className="inline-block px-4 py-2 bg-primary/20 rounded-full mb-2">
                  <span className="text-primary font-semibold">Try Before You Decide</span>
                </div>
                <h2 className="text-3xl font-bold">Get One Free Mock Test!</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Take one full CUET mock test absolutely free on the Merit Launchers App. Experience the real test interface, scoring pattern, and analytics — without paying a rupee.
                </p>
                <Button size="lg" className="group mt-4">
                  <Download className="mr-2 h-5 w-5 group-hover:animate-bounce" />
                  Start Your Free Test
                </Button>
              </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works">
              <h2 className="text-3xl font-bold mb-6">How does it work?</h2>
              <div className="space-y-4">
                {[
                  { step: "1", text: "Download and install the Merit Launchers App" },
                  { step: "2", text: "Register using your email or phone number" },
                  { step: "3", text: "Choose the CUET Course" },
                  { step: "4", text: "Attempt your Free Mock Test instantly" },
                  { step: "5", text: "View your score, solution, and national ranking" },
                  { step: "6", text: "Upgrade to access a minimum of 10 full subject-wise test papers and continue your preparation journey" }
                ].map((item) => (
                  <Card key={item.step} className="p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-primary/20">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold flex-shrink-0">
                        {item.step}
                      </div>
                      <p>{item.text}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            {/* Final CTA */}
            <section className="bg-gradient-to-br from-primary/10 via-accent/10 to-background p-8 rounded-xl text-center">
              <h2 className="text-3xl font-bold mb-3">Start Now</h2>
              <p className="text-muted-foreground mb-2">
                Don't wait for the exam announcement — start preparing today with India's smartest online test series.
              </p>
              <p className="text-muted-foreground font-semibold mb-4">
                Evaluate. Improve. Excel.
              </p>
              <Button size="lg" className="group" asChild>
                <a href="https://www.meritlaunchers.com/portal/" target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-5 w-5 group-hover:animate-bounce" />
                  Download the Merit Launchers App
                </a>
              </Button>
              <p className="text-sm text-muted-foreground italic mt-4">
                Begin your journey. Experience smart preparation.
              </p>
            </section>
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CUET;
