import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Download, Award, TrendingUp, Target, BookOpen, ExternalLink, Clock, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";

export default function IPMAT() {
  const keyHighlights = [
    { label: "Conducting Body", value: "IIM Indore / IIM Rohtak" },
    { label: "Exam Level", value: "National" },
    { label: "Mode of Exam", value: "Computer-Based Test (CBT)" },
    { label: "Tentative Exam Dates", value: "May 2025 (Indore) / June 2025 (Rohtak)" },
    { label: "Duration", value: "2 hours (Indore) / 2.5 hours (Rohtak)" },
    { label: "Eligibility", value: "Class 12 passed / appearing with minimum 60% marks (55% for SC/ST/PwD)" },
    { label: "Age Limit", value: "Candidates must be born on or after August 1, 2005 (for 2025 exam)" },
    { label: "Sections (IIM Indore)", value: "Quantitative Aptitude (MCQ), Quantitative Aptitude (Short Answer), Verbal Ability" },
    { label: "Sections (IIM Rohtak)", value: "Quantitative Aptitude, Logical Reasoning, Verbal Ability" },
    { label: "Marking Scheme", value: "+4 for correct answer, –1 for incorrect answer (no negative for short-answer questions)" }
  ];

  const whyChoose = [
    "Direct entry into a 5-year Integrated Program (BBA + MBA) at India's top IIMs",
    "A holistic curriculum blending business, management, and leadership development",
    "Excellent placement opportunities, internships, and global exposure through IIM networks",
    "No need to appear for CAT after IPM — students automatically progress to MBA after completing the initial phase"
  ];

  const features = [
    {
      icon: BookOpen,
      title: "10 Full-Length Mock Tests",
      description: "Designed as per the latest IIM Indore and Rohtak patterns"
    },
    {
      icon: TrendingUp,
      title: "Instant Score & Analytics",
      description: "Get detailed insight into your accuracy, speed, and score/percentile"
    },
    {
      icon: Clock,
      title: "Section-Wise Performance Analysis",
      description: "With time tracking and accuracy ratios"
    },
    {
      icon: Target,
      title: "Concept-Based Feedback",
      description: "Learn not just what you missed, but why"
    },
    {
      icon: Award,
      title: "All-India Comparison",
      description: "Benchmark your performance with aspirants nationwide"
    }
  ];

  const howItWorks = [
    { step: 1, text: "Download the Merit Launchers App" },
    { step: 2, text: "Register using your email or mobile number" },
    { step: 3, text: "Select the IPMAT Course" },
    { step: 4, text: "Attempt your Free Mock Test immediately" },
    { step: 5, text: "Get your Instant Score & Ranking" },
    { step: 6, text: "Upgrade to access the complete series of 10 full mock tests with detailed solutions" }
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
                  <Briefcase className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold bg-gradient-primary bg-clip-text text-transparent">
                    IIM Management Program
                  </span>
                </div>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
                IPMAT <span className="bg-gradient-primary bg-clip-text text-transparent">2025</span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Your gateway to IIM's 5-year Integrated Program in Management (BBA + MBA)
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

        {/* About IPMAT Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">
                  About <span className="bg-gradient-primary bg-clip-text text-transparent">IPMAT</span>
                </h2>
              </div>

              <Card className="shadow-card hover:shadow-premium transition-all duration-300 border-primary/20">
                <CardContent className="p-8">
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                    The Integrated Program in Management Aptitude Test (IPMAT) is a national-level entrance examination conducted by the Indian Institutes of Management (IIMs) — primarily <strong>IIM Indore</strong> and <strong>IIM Rohtak</strong> — for admission to their 5-year Integrated Program in Management (IPM), a dual degree program (BBA + MBA).
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    It is one of the most prestigious gateways for Class 12 students aspiring to begin their journey toward IIM-level management education right after school.
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
                  IPMAT 2025 — <span className="bg-gradient-primary bg-clip-text text-transparent">Key Highlights</span>
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

        {/* Why Choose IPMAT */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">
                  Why Choose <span className="bg-gradient-primary bg-clip-text text-transparent">IPMAT?</span>
                </h2>
              </div>

              <div className="space-y-4">
                {whyChoose.map((item, index) => (
                  <Card key={index} className="shadow-card hover:shadow-premium transition-all duration-300 group">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow">
                          <CheckCircle2 className="h-5 w-5 text-white" />
                        </div>
                        <p className="text-lg text-muted-foreground flex-1 pt-1.5">{item}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Why Practice with Merit Launchers */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">
                  Why Practice IPMAT with <span className="bg-gradient-primary bg-clip-text text-transparent">Merit Launchers</span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                  Cracking IPMAT requires a sharp mix of logical thinking, speed, and strong fundamentals in Quantitative and Verbal Aptitude. The Merit Launchers App is crafted to help students master all these aspects through structured, exam-level practice.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                  <Card key={index} className="shadow-card hover:shadow-premium transition-all duration-300 group">
                    <CardContent className="p-8">
                      <div className="flex flex-col items-center text-center gap-4">
                        <div className="flex-shrink-0 w-14 h-14 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
                          <feature.icon className="h-7 w-7 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                            {feature.title}
                          </h3>
                          <p className="text-muted-foreground text-sm">{feature.description}</p>
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
                One Free <span className="bg-gradient-primary bg-clip-text text-transparent">IPMAT Mock Test</span>
              </h2>
              
              <p className="text-xl text-muted-foreground mb-8">
                Get a real taste of IPMAT before you commit! Attempt one full IPMAT mock test absolutely free on the Merit Launchers App and experience the real exam format, interface, and performance report.
              </p>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-card/80 backdrop-blur-sm p-6 rounded-xl shadow-card">
                  <Clock className="h-8 w-8 text-primary mx-auto mb-3" />
                  <p className="text-sm font-medium">Timed conditions</p>
                </div>
                <div className="bg-card/80 backdrop-blur-sm p-6 rounded-xl shadow-card">
                  <TrendingUp className="h-8 w-8 text-primary mx-auto mb-3" />
                  <p className="text-sm font-medium">Instant percentile</p>
                </div>
                <div className="bg-card/80 backdrop-blur-sm p-6 rounded-xl shadow-card">
                  <Target className="h-8 w-8 text-primary mx-auto mb-3" />
                  <p className="text-sm font-medium">Improvement areas</p>
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
                Official <span className="bg-gradient-primary bg-clip-text text-transparent">IPMAT Resources</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                For syllabus, eligibility, and latest notifications, visit:
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="outline" className="group" asChild>
                  <a href="https://www.iimidr.ac.in" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    IIM Indore IPMAT
                    <ExternalLink className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="group" asChild>
                  <a href="https://www.iimrohtak.ac.in" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    IIM Rohtak IPMAT
                    <ExternalLink className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-4">
                Begin Your <span className="bg-gradient-primary bg-clip-text text-transparent">IIM Journey</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Start preparing early, prepare smartly, and step into India's top management institutions right after Class 12.
              </p>
              <p className="text-xl font-semibold text-primary mb-8">
                Dream IIM. Start Young. Achieve with Merit Launchers.
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
