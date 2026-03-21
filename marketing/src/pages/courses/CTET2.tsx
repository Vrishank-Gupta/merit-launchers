import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { BookOpen, Download, FileText, CheckCircle2, Users, GraduationCap, Target, TrendingUp } from "lucide-react";

const CTET2 = () => {
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
              CTET Paper II (Class VI–VIII)
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Prepare for Upper Primary Stage Teaching with Expert-Designed Mock Tests and Comprehensive Practice Material
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
              <h2 className="text-3xl md:text-4xl font-bold">About CTET Paper II</h2>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              The Central Teacher Eligibility Test (CTET) Paper II is designed for candidates aspiring to teach Classes VI–VIII (Upper Primary Stage). It evaluates conceptual clarity, subject expertise, and teaching aptitude for secondary-level teaching positions in schools across India. Conducted twice a year by CBSE, CTET ensures that only qualified educators enter the teaching profession.
            </p>
          </div>
        </div>
      </section>

      {/* Key Highlights Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            CTET Paper II — Key Highlights
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
                      <td className="px-6 py-4 text-muted-foreground">Online (CBT)</td>
                    </tr>
                    <tr className="hover:bg-accent/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-primary">Exam Date</td>
                      <td className="px-6 py-4 text-muted-foreground">July 2026 & December 2026 (Tentative)</td>
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
                      <td className="px-6 py-4 text-muted-foreground">+1 per correct answer, No negative marking</td>
                    </tr>
                    <tr className="hover:bg-accent/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-primary">Eligibility</td>
                      <td className="px-6 py-4 text-muted-foreground">Graduation with B.Ed or 4-year integrated B.A./B.Sc.Ed or B.A.Ed/B.Sc.Ed</td>
                    </tr>
                    <tr className="hover:bg-accent/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-primary">Purpose</td>
                      <td className="px-6 py-4 text-muted-foreground">To qualify for teaching Classes VI–VIII</td>
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
              <h2 className="text-3xl md:text-4xl font-bold">CTET Paper II — Exam Structure</h2>
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
                      <td className="px-6 py-4">Subject-Specific (Any one): Mathematics & Science OR Social Studies/Social Science</td>
                      <td className="px-6 py-4 text-center">60</td>
                      <td className="px-6 py-4 text-center">60</td>
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
                Why Practice CTET Paper II with Merit Launchers
              </h2>
              <p className="text-lg text-muted-foreground">
                Get real exam practice for CTET Paper II through Merit Launchers App, built with precision and guided by experienced educators.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-primary/20">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">10 Full-Length Mock Tests</h3>
                <p className="text-muted-foreground">
                  For each optional subject (Math & Science / Social Studies).
                </p>
              </Card>

              <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-primary/20">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Pedagogy-Focused Questions</h3>
                <p className="text-muted-foreground">
                  Crafted by education experts to match real exam standards.
                </p>
              </Card>

              <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-primary/20">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Instant Performance Reports</h3>
                <p className="text-muted-foreground">
                  Track your progress with detailed analytics and graphs.
                </p>
              </Card>

              <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-primary/20">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Affordable Plans</h3>
                <p className="text-muted-foreground">
                  With lifetime access to your test history.
                </p>
              </Card>

              <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-primary/20">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Free Mock Test</h3>
                <p className="text-muted-foreground">
                  Free CTET Paper II Mock Test for all first-time users.
                </p>
              </Card>

              <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-primary/20">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Expert Guidance</h3>
                <p className="text-muted-foreground">
                  Learn from experienced educators and teaching professionals.
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
                { step: "2", text: "Register and select the CTET Paper II Course" },
                { step: "3", text: "Attempt your Free Mock Test" },
                { step: "4", text: "Review your results and topic analysis" },
                { step: "5", text: "Upgrade for access to all advanced tests and analytics" }
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
              For syllabus, notifications, and updates, visit the CBSE CTET official website.
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
              Begin Your Teaching Career
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Crack CTET with confidence and qualify for a teaching career in upper primary schools. With Merit Launchers, test yourself under real conditions, analyze results, and move closer to your goal.
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

export default CTET2;
