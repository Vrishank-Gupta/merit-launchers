import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { BookOpen, Download, FileText, CheckCircle2, Users, GraduationCap, Target, TrendingUp, Award, Shield } from "lucide-react";

const DSSSB = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6 animate-fade-in">
            <div className="inline-block px-4 py-2 bg-primary/10 rounded-full mb-4">
              <span className="text-primary font-semibold">Government of NCT of Delhi</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent leading-tight">
              DSSSB Preparation
            </h1>
            <p className="text-xl text-muted-foreground">
              Delhi Subordinate Services Selection Board
            </p>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Secure Your Dream Government Teaching and Administrative Career in Delhi
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
              <h2 className="text-3xl md:text-4xl font-bold">About DSSSB</h2>
            </div>
            <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
              <p>
                The Delhi Subordinate Services Selection Board (DSSSB) conducts recruitment examinations for various teaching and non-teaching posts under the Government of NCT of Delhi.
              </p>
              <p>
                These exams open doors to secure, respected, and long-term careers in Delhi's educational and administrative departments — including posts like TGT, PGT, PRT, Clerk, Assistant, Librarian, Counselor, and more.
              </p>
              <p>
                All exams are conducted online under strict supervision to ensure transparency and fairness.
              </p>
              <p>
                For official notices and updates, visit the{" "}
                <a href="https://dsssb.delhi.gov.in" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                  DSSSB official website
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Highlights Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            DSSSB 2025 — Key Highlights
          </h2>
          <div className="max-w-5xl mx-auto">
            <Card className="overflow-hidden border-primary/20 shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <tbody className="divide-y divide-border">
                    <tr className="hover:bg-accent/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-primary">Conducting Body</td>
                      <td className="px-6 py-4 text-muted-foreground">Delhi Subordinate Services Selection Board (DSSSB)</td>
                    </tr>
                    <tr className="hover:bg-accent/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-primary">Exam Level</td>
                      <td className="px-6 py-4 text-muted-foreground">State (Delhi Govt.)</td>
                    </tr>
                    <tr className="hover:bg-accent/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-primary">Mode of Exam</td>
                      <td className="px-6 py-4 text-muted-foreground">Online (Computer-Based Test)</td>
                    </tr>
                    <tr className="hover:bg-accent/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-primary">Frequency</td>
                      <td className="px-6 py-4 text-muted-foreground">Conducted throughout the year (as per vacancy advertisements)</td>
                    </tr>
                    <tr className="hover:bg-accent/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-primary">Eligibility</td>
                      <td className="px-6 py-4 text-muted-foreground">10th / 12th / Graduate / B.Ed. or as per post requirement</td>
                    </tr>
                    <tr className="hover:bg-accent/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-primary">Selection Process</td>
                      <td className="px-6 py-4 text-muted-foreground">Tier-I, Tier-II, Skill Test (as applicable)</td>
                    </tr>
                    <tr className="hover:bg-accent/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-primary">Exam Duration</td>
                      <td className="px-6 py-4 text-muted-foreground">2 hours per paper</td>
                    </tr>
                    <tr className="hover:bg-accent/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-primary">Marking Scheme</td>
                      <td className="px-6 py-4 text-muted-foreground">+1 for correct, no negative marking (for most posts)</td>
                    </tr>
                    <tr className="hover:bg-accent/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-primary">Official Website</td>
                      <td className="px-6 py-4">
                        <a href="https://dsssb.delhi.gov.in" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          https://dsssb.delhi.gov.in
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

      {/* Popular DSSSB Exams Section */}
      <section className="py-20 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Award className="h-8 w-8 text-primary" />
              <h2 className="text-3xl md:text-4xl font-bold">Popular DSSSB Exams</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "TGT (Trained Graduate Teacher)",
                "PGT (Post Graduate Teacher)",
                "PRT (Primary Teacher)",
                "Assistant Teacher (Nursery)",
                "Clerk / LDC / UDC Posts"
              ].map((exam, index) => (
                <Card key={index} className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-lg font-medium">{exam}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Practice Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Prepare DSSSB with Merit Launchers
              </h2>
              <p className="text-lg text-muted-foreground">
                The Merit Launchers App offers structured and exam-accurate mock tests to help aspirants crack DSSSB exams with confidence.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-primary/20">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">10 Full-Length Mock Tests</h3>
                <p className="text-muted-foreground">
                  Minimum 10 DSSSB mock tests for major posts like TGT, PGT, and PRT.
                </p>
              </Card>

              <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-primary/20">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Instant Scorecards & Analysis</h3>
                <p className="text-muted-foreground">
                  Get immediate results to gauge your performance accurately.
                </p>
              </Card>

              <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-primary/20">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Latest Syllabus Coverage</h3>
                <p className="text-muted-foreground">
                  Questions based on General Awareness, Reasoning, Numerical Ability, Teaching Aptitude, and Subject Knowledge.
                </p>
              </Card>

              <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-primary/20">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Low-Cost Subscription</h3>
                <p className="text-muted-foreground">
                  Affordable pricing for every student aspiring for government jobs.
                </p>
              </Card>

              <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-primary/20">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">All-India Ranking</h3>
                <p className="text-muted-foreground">
                  Compare yourself with other DSSSB aspirants nationwide.
                </p>
              </Card>

              <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-primary/20">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Exam-Accurate Interface</h3>
                <p className="text-muted-foreground">
                  Experience the exact DSSSB online exam environment.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Free Mock Test Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-accent/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-block px-4 py-2 bg-primary/20 rounded-full mb-4">
              <span className="text-primary font-semibold">Start Smart</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold">One Free DSSSB Mock Test</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              No payment needed! Attempt one full DSSSB mock test absolutely free on the Merit Launchers App and experience the exact DSSSB online exam interface.
            </p>
            <p className="text-lg text-muted-foreground">
              Get your results instantly, analyze your strengths and weaknesses, and prepare confidently for your target post.
            </p>
            <div className="pt-6">
              <Button size="lg" className="group">
                <Download className="mr-2 h-5 w-5 group-hover:animate-bounce" />
                Start Your Free Test
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">How It Works</h2>
            <div className="space-y-6">
              {[
                { step: "1", text: "Download the Merit Launchers App" },
                { step: "2", text: "Register using your mobile number or email" },
                { step: "3", text: "Select the DSSSB Course" },
                { step: "4", text: "Attempt your Free Mock Test" },
                { step: "5", text: "Check Instant Scores, Explanations & Ranking" },
                { step: "6", text: "Upgrade to get at least 10 complete mock papers with in-depth performance analytics" }
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
      <section className="py-20 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Official DSSSB Resources</h2>
            <p className="text-lg text-muted-foreground">
              For notifications, syllabus, exam calendar, and result updates, visit the official website
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button size="lg" variant="outline" asChild>
                <a href="https://dsssb.delhi.gov.in" target="_blank" rel="noopener noreferrer">
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
              Launch Your Government Teaching Career
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Crack DSSSB with confidence. Prepare the smart way with Merit Launchers, your trusted companion for online test preparation.
            </p>
            <p className="text-lg text-muted-foreground">
              Get real exam experience, instant results, and data-driven feedback to achieve your teaching career goals.
            </p>
            <div className="pt-6">
              <Button size="lg" className="group">
                <Download className="mr-2 h-5 w-5 group-hover:animate-bounce" />
                Download the Merit Launchers App
              </Button>
            </div>
            <p className="text-sm text-muted-foreground italic">
              Your DSSSB journey begins with one click. Begin your journey. Experience smart preparation.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DSSSB;
