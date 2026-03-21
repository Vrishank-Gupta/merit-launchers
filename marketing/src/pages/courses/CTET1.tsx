import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { BookOpen, Download, FileText, CheckCircle2, Users, GraduationCap, Target, TrendingUp, BookMarked, Brain } from "lucide-react";

const CTET1 = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6 animate-fade-in">
            <div className="inline-block px-4 py-2 bg-primary/10 rounded-full mb-4">
              <span className="text-primary font-semibold">Central Teacher Eligibility Test</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent leading-tight">
              CTET Paper I (Class I–V)
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Prepare for Primary Stage Teaching with Expert-Designed Mock Tests and Comprehensive Practice Material
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button size="lg" className="group">
                <Download className="mr-2 h-5 w-5 group-hover:animate-bounce" />
                Download App
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/fee-structure">View Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="h-8 w-8 text-primary" />
              <h2 className="text-3xl md:text-4xl font-bold">About CTET Paper I</h2>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              The Central Teacher Eligibility Test (CTET) is a national-level examination conducted by the Central Board of Secondary Education (CBSE) to assess the eligibility of candidates aspiring to become teachers in Classes I–V (Paper I) and Classes VI–VIII (Paper II) in central and state government schools, Kendriya Vidyalayas (KVs), Navodaya Vidyalayas (NVs), and private institutions accepting CTET scores. For official notifications and updates, visit the CBSE CTET official website.
            </p>
          </div>
        </div>
      </section>

      {/* Key Highlights Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            CTET Paper I — Key Highlights
          </h2>
          <div className="max-w-5xl mx-auto">
            <Card className="overflow-hidden border-primary/20 shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <tbody className="divide-y divide-border">
                    <tr className="hover:bg-accent/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-primary">Conducting Body</td>
                      <td className="px-6 py-4 text-muted-foreground">Central Board of Secondary Education (CBSE)</td>
                    </tr>
                    <tr className="hover:bg-accent/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-primary">Exam Level</td>
                      <td className="px-6 py-4 text-muted-foreground">National</td>
                    </tr>
                    <tr className="hover:bg-accent/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-primary">Mode of Exam</td>
                      <td className="px-6 py-4 text-muted-foreground">Online (Computer-Based Test)</td>
                    </tr>
                    <tr className="hover:bg-accent/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-primary">Exam Date</td>
                      <td className="px-6 py-4 text-muted-foreground">July 2026 & December 2026 (twice a year) (Tentative)</td>
                    </tr>
                    <tr className="hover:bg-accent/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-primary">Duration</td>
                      <td className="px-6 py-4 text-muted-foreground">2 Hours 30 Minutes</td>
                    </tr>
                    <tr className="hover:bg-accent/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-primary">Type of Questions</td>
                      <td className="px-6 py-4 text-muted-foreground">Objective (Multiple Choice Questions)</td>
                    </tr>
                    <tr className="hover:bg-accent/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-primary">Total Questions</td>
                      <td className="px-6 py-4 text-muted-foreground">150</td>
                    </tr>
                    <tr className="hover:bg-accent/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-primary">Marking Scheme</td>
                      <td className="px-6 py-4 text-muted-foreground">+1 for each correct answer, No negative marking</td>
                    </tr>
                    <tr className="hover:bg-accent/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-primary">Eligibility</td>
                      <td className="px-6 py-4 text-muted-foreground">Candidates with Senior Secondary (or equivalent) and 2-year D.El.Ed or 4-year B.El.Ed</td>
                    </tr>
                    <tr className="hover:bg-accent/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-primary">Purpose</td>
                      <td className="px-6 py-4 text-muted-foreground">To qualify for teaching Classes I–V (Primary Stage)</td>
                    </tr>
                    <tr className="hover:bg-accent/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-primary">Validity of Certificate</td>
                      <td className="px-6 py-4 text-muted-foreground">Lifetime</td>
                    </tr>
                    <tr className="hover:bg-accent/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-primary">Official Website</td>
                      <td className="px-6 py-4">
                        <a href="https://ctet.nic.in/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          Click here to visit the CTET official website
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Exam Structure Section */}
      <section className="py-20 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <FileText className="h-8 w-8 text-primary" />
              <h2 className="text-3xl md:text-4xl font-bold">CTET Paper I — Exam Structure</h2>
            </div>
            <Card className="overflow-hidden border-primary/20 shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-primary/10">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold text-primary">Subjects</th>
                      <th className="px-6 py-4 text-center font-semibold text-primary">No. of Questions</th>
                      <th className="px-6 py-4 text-center font-semibold text-primary">Marks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr className="hover:bg-accent/5 transition-colors">
                      <td className="px-6 py-4">Child Development and Pedagogy</td>
                      <td className="px-6 py-4 text-center">30</td>
                      <td className="px-6 py-4 text-center">30</td>
                    </tr>
                    <tr className="hover:bg-accent/5 transition-colors">
                      <td className="px-6 py-4">Language I (Compulsory)</td>
                      <td className="px-6 py-4 text-center">30</td>
                      <td className="px-6 py-4 text-center">30</td>
                    </tr>
                    <tr className="hover:bg-accent/5 transition-colors">
                      <td className="px-6 py-4">Language II (Compulsory)</td>
                      <td className="px-6 py-4 text-center">30</td>
                      <td className="px-6 py-4 text-center">30</td>
                    </tr>
                    <tr className="hover:bg-accent/5 transition-colors">
                      <td className="px-6 py-4">Mathematics</td>
                      <td className="px-6 py-4 text-center">30</td>
                      <td className="px-6 py-4 text-center">30</td>
                    </tr>
                    <tr className="hover:bg-accent/5 transition-colors">
                      <td className="px-6 py-4">Environmental Studies (EVS)</td>
                      <td className="px-6 py-4 text-center">30</td>
                      <td className="px-6 py-4 text-center">30</td>
                    </tr>
                    <tr className="bg-primary/5 font-semibold">
                      <td className="px-6 py-4">Total</td>
                      <td className="px-6 py-4 text-center">150</td>
                      <td className="px-6 py-4 text-center">150</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Practice Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Practice CTET Paper I with Merit Launchers
              </h2>
              <p className="text-lg text-muted-foreground">
                Prepare smartly for CTET with Merit Launchers App, designed to give real exam exposure through expertly created mock tests.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-primary/20">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">10 Full-Length Mock Tests</h3>
                <p className="text-muted-foreground">
                  Aligned with the latest CTET pattern for comprehensive practice.
                </p>
              </Card>

              <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-primary/20">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Instant Score Reports</h3>
                <p className="text-muted-foreground">
                  Get immediate performance analytics to track your progress.
                </p>
              </Card>

              <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-primary/20">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Pedagogy-based Questions</h3>
                <p className="text-muted-foreground">
                  As per CBSE CTET framework for authentic exam experience.
                </p>
              </Card>

              <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-primary/20">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <BookMarked className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Topic-wise Tests</h3>
                <p className="text-muted-foreground">
                  For Child Development, EVS, and Teaching Aptitude mastery.
                </p>
              </Card>

              <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-primary/20">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Affordable Plans</h3>
                <p className="text-muted-foreground">
                  Flexible online access at budget-friendly pricing.
                </p>
              </Card>

              <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-primary/20">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Free Mock Test</h3>
                <p className="text-muted-foreground">
                  Available for all new users to experience the platform.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">How It Works</h2>
            <div className="space-y-6">
              {[
                { step: "1", text: "Download and install the Merit Launchers App" },
                { step: "2", text: "Register and select the 'CTET Paper I Course'" },
                { step: "3", text: "Attempt your Free Mock Test" },
                { step: "4", text: "Get instant results and detailed analysis" },
                { step: "5", text: "Upgrade to unlock all 10 full-length tests and advanced analytics" }
              ].map((item) => (
                <Card key={item.step} className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-primary/20">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                      {item.step}
                    </div>
                    <p className="text-lg">{item.text}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Official Resources Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Official CTET Resources</h2>
            <p className="text-lg text-muted-foreground">
              For exam notifications, syllabus, and updates, visit the CBSE CTET official website.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button size="lg" variant="outline" asChild>
                <a href="https://ctet.nic.in/" target="_blank" rel="noopener noreferrer">
                  Visit Official Website
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/fee-structure">View Fee Structure</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-accent/10 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-5xl font-bold leading-tight">
              Begin Your Teaching Journey
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Qualify for CTET Paper I with confidence. Prepare smartly with Merit Launchers and achieve your dream of becoming a primary school teacher.
            </p>
            <div className="pt-6">
              <Button size="lg" className="group">
                <Download className="mr-2 h-5 w-5 group-hover:animate-bounce" />
                Download the Merit Launchers App
              </Button>
            </div>
            <p className="text-sm text-muted-foreground italic">
              Begin your journey. Experience smart preparation.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CTET1;
