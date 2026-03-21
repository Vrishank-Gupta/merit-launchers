import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Download, Award, TrendingUp, Target, BookOpen, ExternalLink, Clock, FileText } from "lucide-react";
import { Link } from "react-router-dom";

export default function JEE() {
  const keyHighlights = [
    { label: "Conducting Body", value: "National Testing Agency (NTA)" },
    { label: "Exam Levels", value: "JEE Main and JEE Advanced" },
    { label: "Mode of Exam", value: "Computer-Based Test (Online)" },
    { label: "JEE Main 2025 Session 1", value: "January 2025 (Tentative)" },
    { label: "JEE Main 2025 Session 2", value: "April 2025 (Tentative)" },
    { label: "JEE Advanced 2025", value: "May 2025 (Tentative)" },
    { label: "Eligibility (Main)", value: "Class 12 passed / appearing with PCM" },
    { label: "Exam Frequency", value: "Twice a year (Main); Once a year (Advanced)" },
    { label: "Paper Type", value: "MCQs and Numerical Value Questions" },
    { label: "Duration", value: "3 Hours" },
    { label: "Subjects", value: "Physics, Chemistry, Mathematics" },
    { label: "Marking Scheme", value: "+4 for correct answer, –1 for wrong answer (varies by paper)" },
    { label: "Official Website", value: "https://jeemain.nta.ac.in" }
  ];

  const papers = [
    { name: "Paper 1", description: "B.E./B.Tech (for engineering aspirants)" },
    { name: "Paper 2A", description: "B.Arch" },
    { name: "Paper 2B", description: "B.Planning" }
  ];

  const features = [
    {
      icon: BookOpen,
      title: "10 High-Quality Mock Tests",
      description: "Per subject designed by IIT/NIT-qualified educators"
    },
    {
      icon: TrendingUp,
      title: "Instant Score & Accuracy Report",
      description: "Know your real performance immediately"
    },
    {
      icon: Target,
      title: "Topic-wise Coverage",
      description: "Comprehensive practice across all topics"
    },
    {
      icon: Award,
      title: "All-India Benchmarking",
      description: "Compare your percentile with other aspirants nationwide"
    }
  ];

  const howItWorks = [
    { step: 1, text: "Download the Merit Launchers App" },
    { step: 2, text: "Register with your basic details" },
    { step: 3, text: "Select the JEE Course" },
    { step: 4, text: "Attempt your Free Mock Test instantly" },
    { step: 5, text: "Review your detailed report and rank" },
    { step: 6, text: "Upgrade to access 10 complete subject-wise mock papers with solutions" }
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
                  <Award className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold bg-gradient-primary bg-clip-text text-transparent">
                    Engineering Entrance Exam
                  </span>
                </div>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
                JEE <span className="bg-gradient-primary bg-clip-text text-transparent">2025</span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Master India's most prestigious engineering entrance exam with comprehensive mock tests and analytics
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="shadow-glow hover:shadow-premium transition-all duration-300" asChild>
                  <Link to="/contact">Start Free Test</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/contact">Contact Us</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* About JEE Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">
                  About <span className="bg-gradient-primary bg-clip-text text-transparent">JEE</span>
                </h2>
              </div>

              <Card className="shadow-card hover:shadow-premium transition-all duration-300 border-primary/20">
                <CardContent className="p-8">
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                    The Joint Entrance Examination (JEE) is India's most prestigious engineering entrance test, conducted by the National Testing Agency (NTA) for admission to top engineering institutes such as the IITs, NITs, IIITs, and other centrally funded technical institutions.
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                    JEE is held in two stages — <strong>JEE Main</strong> and <strong>JEE Advanced</strong>. Students who qualify for JEE Main become eligible to appear for JEE Advanced, the gateway to IITs.
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    For the latest official notifications, visit the NTA JEE website: <a href="https://jeemain.nta.ac.in" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://jeemain.nta.ac.in</a>
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Key Highlights Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">
                  JEE 2025 — <span className="bg-gradient-primary bg-clip-text text-transparent">Key Highlights</span>
                </h2>
              </div>

              <Card className="shadow-card hover:shadow-premium transition-all duration-300">
                <CardContent className="p-8">
                  <div className="grid md:grid-cols-2 gap-6">
                    {keyHighlights.map((item, index) => (
                      <div key={index} className="flex flex-col gap-2 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                        <span className="text-sm font-semibold text-primary">{item.label}</span>
                        <span className="text-muted-foreground">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Exam Structure */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">
                  Exam <span className="bg-gradient-primary bg-clip-text text-transparent">Structure</span>
                </h2>
                <p className="text-lg text-muted-foreground">JEE Main Papers</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {papers.map((paper, index) => (
                  <Card key={index} className="shadow-card hover:shadow-premium transition-all duration-300 group">
                    <CardContent className="p-6 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-primary rounded-full mb-4 shadow-glow group-hover:scale-110 transition-transform">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{paper.name}</h3>
                      <p className="text-muted-foreground">{paper.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">
                    Each subject (Physics, Chemistry, Mathematics) consists of two sections — <strong className="text-primary">Section A (MCQs)</strong> and <strong className="text-primary">Section B (Numerical questions)</strong>
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Eligibility Criteria */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">
                  Eligibility <span className="bg-gradient-primary bg-clip-text text-transparent">Criteria</span>
                </h2>
              </div>

              <Card className="shadow-card hover:shadow-premium transition-all duration-300">
                <CardContent className="p-8">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <p className="text-lg text-muted-foreground">
                        Candidates must have passed or be appearing in Class 12 (Science stream) with <strong>Physics and Mathematics</strong> as compulsory subjects
                      </p>
                    </div>
                    <div className="flex items-start gap-4">
                      <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <p className="text-lg text-muted-foreground">
                        One of the optional subjects: <strong>Chemistry / Biotechnology / Technical Vocational Subject</strong>
                      </p>
                    </div>
                    <div className="flex items-start gap-4">
                      <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <p className="text-lg text-muted-foreground">
                        There is <strong>no age limit</strong> for appearing in JEE Main (as per current NTA rules)
                      </p>
                    </div>
                    <div className="flex items-start gap-4">
                      <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <p className="text-lg text-muted-foreground">
                        Students can attempt JEE Main up to <strong>three consecutive years</strong> after Class 12
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Why Practice with Merit Launchers */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">
                  Why Practice JEE with <span className="bg-gradient-primary bg-clip-text text-transparent">Merit Launchers</span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                  Attempting mock tests through our app for JEE is not just about solving questions — it's about mastering time, accuracy, and exam temperament. The Merit Launchers App brings all of this into one seamless platform.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {features.map((feature, index) => (
                  <Card key={index} className="shadow-card hover:shadow-premium transition-all duration-300 group">
                    <CardContent className="p-8">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
                          <feature.icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                            {feature.title}
                          </h3>
                          <p className="text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Free Mock Test CTA */}
        <section className="py-16 bg-gradient-hero relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.1),transparent_70%)]"></div>
          
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-6 animate-float shadow-premium">
                <Target className="h-8 w-8 text-white" />
              </div>
              
              <h2 className="text-4xl font-bold mb-4">
                One Free <span className="bg-gradient-primary bg-clip-text text-transparent">JEE Mock Test</span>
              </h2>
              
              <p className="text-xl text-muted-foreground mb-8">
                Get started risk-free! Attempt one full-length JEE mock test absolutely free on the Merit Launchers App and experience the real exam before you commit.
              </p>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-card/80 backdrop-blur-sm p-6 rounded-xl shadow-card">
                  <Clock className="h-8 w-8 text-primary mx-auto mb-3" />
                  <p className="text-sm font-medium">Real exam conditions</p>
                </div>
                <div className="bg-card/80 backdrop-blur-sm p-6 rounded-xl shadow-card">
                  <TrendingUp className="h-8 w-8 text-primary mx-auto mb-3" />
                  <p className="text-sm font-medium">Instant feedback</p>
                </div>
                <div className="bg-card/80 backdrop-blur-sm p-6 rounded-xl shadow-card">
                  <Target className="h-8 w-8 text-primary mx-auto mb-3" />
                  <p className="text-sm font-medium">Identify improvement zones</p>
                </div>
              </div>
              
              <Button size="lg" className="shadow-glow hover:shadow-premium transition-all duration-300" asChild>
                <Link to="/contact" className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Start Your Free Test
                </Link>
              </Button>
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

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {howItWorks.map((item) => (
                  <Card key={item.step} className="shadow-card hover:shadow-premium transition-all duration-300 group">
                    <CardContent className="p-6 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-primary rounded-full mb-4 shadow-glow group-hover:scale-110 transition-transform">
                        <span className="text-xl font-bold text-white">{item.step}</span>
                      </div>
                      <p className="text-muted-foreground font-medium">{item.text}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Official Resources */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-4">
                Official <span className="bg-gradient-primary bg-clip-text text-transparent">JEE Resources</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                For official syllabus, updates, and bulletins, visit the National Testing Agency's website:
              </p>
              <Button size="lg" variant="outline" className="group" asChild>
                <a href="https://jeemain.nta.ac.in" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  Visit NTA JEE Website
                  <ExternalLink className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-4">
                Begin Your <span className="bg-gradient-primary bg-clip-text text-transparent">Engineering Journey</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Your path to IIT, NIT, or IIIT starts with focused practice and performance insights. With Merit Launchers, you get exactly that — real exam simulation, instant analytics, and continuous improvement.
              </p>
              <p className="text-xl font-semibold text-primary mb-8">
                Dream IIT. Practice Smart. Achieve with Merit Launchers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="shadow-glow hover:shadow-premium transition-all duration-300" asChild>
                  <Link to="/contact">Get Started</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/about">Learn More About Us</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
