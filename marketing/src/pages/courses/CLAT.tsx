import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CheckCircle, Download, TrendingUp, Award, BookOpen, BarChart, Clock, Users, Sparkles, ArrowRight, ExternalLink } from "lucide-react";

export default function CLAT() {
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
                  <Award className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold bg-gradient-primary bg-clip-text text-transparent">
                    Common Law Admission Test
                  </span>
                </div>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
                <span className="bg-gradient-primary bg-clip-text text-transparent">CLAT</span> Preparation
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                Crack CLAT with confidence and secure a seat in one of India's premier National Law Universities
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="shadow-glow hover:shadow-premium transition-all duration-300" asChild>
                  <Link to="/fee-structure">Start Free Mock Test</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#" className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Download App
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* About CLAT */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">
                  About <span className="bg-gradient-primary bg-clip-text text-transparent">CLAT</span>
                </h2>
              </div>
              
              <div className="bg-card p-8 rounded-2xl shadow-card">
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  The <strong>Common Law Admission Test (CLAT)</strong> is a national-level entrance examination for admission to undergraduate (UG) and postgraduate (PG) law programs offered by the <strong>22 National Law Universities (NLUs)</strong> and several other private and government institutions in India.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  The exam is conducted annually by the <strong>Consortium of National Law Universities (CNLU)</strong>, headquartered at NLSIU Bengaluru. For official updates and notifications, visit the Consortium of NLUs website.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CLAT 2026 Key Highlights */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">
                  CLAT 2026 <span className="bg-gradient-primary bg-clip-text text-transparent">Key Highlights</span>
                </h2>
              </div>
              
              <div className="bg-card rounded-2xl shadow-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <tbody className="divide-y divide-border">
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 font-semibold">Conducting Body</td>
                        <td className="px-6 py-4 text-muted-foreground">Consortium of National Law Universities (CNLU)</td>
                      </tr>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 font-semibold">Exam Level</td>
                        <td className="px-6 py-4 text-muted-foreground">National</td>
                      </tr>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 font-semibold">Mode of Exam</td>
                        <td className="px-6 py-4 text-muted-foreground">Offline (Pen & Paper)</td>
                      </tr>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 font-semibold">Exam Date (Tentative)</td>
                        <td className="px-6 py-4 text-muted-foreground">December 2025</td>
                      </tr>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 font-semibold">Duration</td>
                        <td className="px-6 py-4 text-muted-foreground">2 Hours (120 Minutes)</td>
                      </tr>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 font-semibold">Type of Questions</td>
                        <td className="px-6 py-4 text-muted-foreground">Objective (Multiple Choice Questions)</td>
                      </tr>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 font-semibold">Total Questions</td>
                        <td className="px-6 py-4 text-muted-foreground">120</td>
                      </tr>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 font-semibold">Marking Scheme</td>
                        <td className="px-6 py-4 text-muted-foreground">+1 for each correct answer, –0.25 for wrong answers</td>
                      </tr>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 font-semibold">Eligibility (UG)</td>
                        <td className="px-6 py-4 text-muted-foreground">Class 12 passed / appearing with minimum 45% marks (40% for SC/ST)</td>
                      </tr>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 font-semibold">Courses Offered</td>
                        <td className="px-6 py-4 text-muted-foreground">5-year Integrated LL.B. Programs (BA LL.B., BBA LL.B., etc.)</td>
                      </tr>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 font-semibold">Participating Institutions</td>
                        <td className="px-6 py-4 text-muted-foreground">22 NLUs + 60+ affiliated private universities</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CLAT Exam Structure */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">
                  CLAT Exam <span className="bg-gradient-primary bg-clip-text text-transparent">Structure (UG)</span>
                </h2>
                <p className="text-lg text-muted-foreground">
                  The CLAT UG exam tests comprehension, reasoning, and legal aptitude through five sections
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-card p-6 rounded-xl shadow-card hover:shadow-premium transition-all duration-300 border border-transparent hover:border-primary/20">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">1. English Language</h3>
                  <p className="text-muted-foreground text-sm">
                    Reading comprehension, grammar, and vocabulary
                  </p>
                </div>

                <div className="bg-card p-6 rounded-xl shadow-card hover:shadow-premium transition-all duration-300 border border-transparent hover:border-primary/20">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                    <TrendingUp className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">2. Current Affairs & GK</h3>
                  <p className="text-muted-foreground text-sm">
                    National and international events
                  </p>
                </div>

                <div className="bg-card p-6 rounded-xl shadow-card hover:shadow-premium transition-all duration-300 border border-transparent hover:border-primary/20">
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                    <Award className="h-6 w-6 text-secondary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">3. Legal Reasoning</h3>
                  <p className="text-muted-foreground text-sm">
                    Legal principles, case-based analysis
                  </p>
                </div>

                <div className="bg-card p-6 rounded-xl shadow-card hover:shadow-premium transition-all duration-300 border border-transparent hover:border-primary/20">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">4. Logical Reasoning</h3>
                  <p className="text-muted-foreground text-sm">
                    Analytical and critical reasoning
                  </p>
                </div>

                <div className="bg-card p-6 rounded-xl shadow-card hover:shadow-premium transition-all duration-300 border border-transparent hover:border-primary/20 md:col-span-2 lg:col-span-1">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                    <BarChart className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">5. Quantitative Techniques</h3>
                  <p className="text-muted-foreground text-sm">
                    Elementary mathematics up to Class 10 level
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Practice CLAT with Merit Launchers */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">
                  Why Practice CLAT with <span className="bg-gradient-primary bg-clip-text text-transparent">Merit Launchers</span>
                </h2>
                <p className="text-lg text-muted-foreground">
                  Our Merit Launchers App offers the most exam-accurate and time-tested mock series to help law aspirants master every section with confidence
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="flex items-start gap-4 bg-card p-6 rounded-xl shadow-card hover:shadow-premium transition-all duration-300">
                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">10+ Full-Length Mock Tests</h3>
                    <p className="text-muted-foreground text-sm">
                      Designed on the latest CLAT pattern
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-card p-6 rounded-xl shadow-card hover:shadow-premium transition-all duration-300">
                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Instant Scores/Percentile Reports</h3>
                    <p className="text-muted-foreground text-sm">
                      Right after submission
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-card p-6 rounded-xl shadow-card hover:shadow-premium transition-all duration-300">
                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Updated Current Affairs Section</h3>
                    <p className="text-muted-foreground text-sm">
                      Aligned with CLAT's latest trend
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-card p-6 rounded-xl shadow-card hover:shadow-premium transition-all duration-300">
                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Legal Reasoning Questions</h3>
                    <p className="text-muted-foreground text-sm">
                      Drafted by experts from NLU backgrounds
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-card p-6 rounded-xl shadow-card hover:shadow-premium transition-all duration-300">
                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Nominal Fee Plans</h3>
                    <p className="text-muted-foreground text-sm">
                      Affordable for every aspirant
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-card p-6 rounded-xl shadow-card hover:shadow-premium transition-all duration-300">
                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Performance Tracking Dashboard</h3>
                    <p className="text-muted-foreground text-sm">
                      Monitor your progress over time
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-primary p-1 rounded-2xl">
                <div className="bg-background p-8 rounded-2xl text-center">
                  <Award className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-3">One Free CLAT Mock Test</h3>
                  <p className="text-lg text-muted-foreground mb-6">
                    All new visitors can attempt one full CLAT Mock Test absolutely free on the Merit Launchers App. Practice under exam conditions, get instant results, and see where you stand among national-level aspirants.
                  </p>
                  <Button size="lg" className="shadow-glow hover:shadow-premium transition-all duration-300" asChild>
                    <Link to="/fee-structure">Get Your Free Mock Test</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">
                  How It <span className="bg-gradient-primary bg-clip-text text-transparent">Works</span>
                </h2>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4 bg-card p-6 rounded-xl shadow-card hover:shadow-premium transition-all duration-300">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Download and Install</h3>
                    <p className="text-muted-foreground">
                      Download the Merit Launchers App from your app store
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-card p-6 rounded-xl shadow-card hover:shadow-premium transition-all duration-300">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Register and Select</h3>
                    <p className="text-muted-foreground">
                      Register and select "CLAT Course"
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-card p-6 rounded-xl shadow-card hover:shadow-premium transition-all duration-300">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Attempt Free Mock Test</h3>
                    <p className="text-muted-foreground">
                      Take your first CLAT mock test for free
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-card p-6 rounded-xl shadow-card hover:shadow-premium transition-all duration-300">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Check Your Score</h3>
                    <p className="text-muted-foreground">
                      Get instant results and detailed analytics
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-card p-6 rounded-xl shadow-card hover:shadow-premium transition-all duration-300">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                    5
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Upgrade for More</h3>
                    <p className="text-muted-foreground">
                      Access 10+ full practice tests and exclusive analytics
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Official Resources */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">
                  Official CLAT <span className="bg-gradient-primary bg-clip-text text-transparent">Resources</span>
                </h2>
                <p className="text-muted-foreground">
                  For official announcements, syllabus updates, and exam details
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <a 
                  href="https://consortiumofnlus.ac.in/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group bg-card p-6 rounded-xl shadow-card hover:shadow-premium transition-all duration-300 border border-transparent hover:border-primary/20"
                >
                  <ExternalLink className="h-8 w-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                    CLAT Official Website
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Visit Consortium of NLUs
                  </p>
                </a>

                <Link 
                  to="/fee-structure"
                  className="group bg-card p-6 rounded-xl shadow-card hover:shadow-premium transition-all duration-300 border border-transparent hover:border-primary/20"
                >
                  <ArrowRight className="h-8 w-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                    Fee Structure
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    View our affordable pricing
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-gradient-hero relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.1),transparent_70%)]"></div>
          
          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Your Law Career <span className="bg-gradient-primary bg-clip-text text-transparent">Begins Here!</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Begin your journey & Experience smart preparation. Practice, analyze, and perfect your performance with Merit Launchers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8 shadow-glow hover:shadow-premium transition-all duration-300" asChild>
                  <a href="#" className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Download Merit Launchers App
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8" asChild>
                  <Link to="/fee-structure">View Pricing</Link>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-6 italic">
                "You have to test yourself to best yourself"
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
