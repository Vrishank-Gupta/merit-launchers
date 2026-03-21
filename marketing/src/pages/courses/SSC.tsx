import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Download, Award, TrendingUp, Users, Target, BookOpen, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

export default function SSC() {
  const examsList = [
    "SSC Combined Graduate Level (CGL)",
    "SSC Combined Higher Secondary Level (CHSL)",
    "SSC CPO (Sub-Inspector in Delhi Police & CAPFs)",
    "SSC MTS (Multi-Tasking Staff)",
    "SSC GD Constable",
    "SSC Stenographer"
  ];

  const keyHighlights = [
    { label: "Conducting Body", value: "Staff Selection Commission (SSC)" },
    { label: "Exam Level", value: "National" },
    { label: "Mode of Exams", value: "Computer-Based Tests (Online)" },
    { label: "Eligibility", value: "10th / 12th / Graduate (depending on post)" },
    { label: "Frequency", value: "Conducted annually for various posts" },
    { label: "Selection Process", value: "Tier-wise Examinations + Skill/Document Verification" },
    { label: "Official Website", value: "https://ssc.gov.in" }
  ];

  const whyPopular = [
    "Opportunity to join central government services with job security and steady career growth",
    "Attractive salary packages, allowances, and pension benefits",
    "Multiple entry levels — from Matric (10th) to Graduate",
    "Transparent selection process under NTA-like digital systems"
  ];

  const features = [
    {
      icon: BookOpen,
      title: "10+ Full-Length Mock Tests",
      description: "Following the latest SSC patterns (Tier I level)"
    },
    {
      icon: TrendingUp,
      title: "Instant Results & Analysis",
      description: "For General Intelligence, Reasoning, Quantitative Aptitude, English, and General Awareness"
    },
    {
      icon: Award,
      title: "Low-Cost Subscription",
      description: "Quality preparation at a nominal fee"
    },
    {
      icon: Users,
      title: "National Benchmarking",
      description: "See how you rank among thousands of SSC aspirants"
    }
  ];

  const howItWorks = [
    { step: 1, text: "Download the Merit Launchers App" },
    { step: 2, text: "Register using your email or mobile number" },
    { step: 3, text: "Select the SSC Course" },
    { step: 4, text: "Attempt your Free Mock Test immediately" },
    { step: 5, text: "View Instant Scores & Rankings" },
    { step: 6, text: "Upgrade to access 10 complete test papers and performance insights" }
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
                    Staff Selection Commission
                  </span>
                </div>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
                SSC <span className="bg-gradient-primary bg-clip-text text-transparent">Exams</span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Master SSC CGL, CHSL, MTS, CPO, and more with targeted mock tests designed to match the real exam experience
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="shadow-glow hover:shadow-premium transition-all duration-300" asChild>
                  <Link to="/fee-structure">Start Free Test</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/contact">Contact Us</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* About SSC Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">
                  About <span className="bg-gradient-primary bg-clip-text text-transparent">SSC Exams</span>
                </h2>
              </div>

              <Card className="shadow-card hover:shadow-premium transition-all duration-300 border-primary/20">
                <CardContent className="p-8">
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                    The Staff Selection Commission (SSC) conducts some of India's most sought-after recruitment examinations for various Group B and C posts in central government ministries, departments, and organizations.
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                    These exams offer stable, respected, and rewarding government careers to lakhs of aspirants every year.
                  </p>
                  
                  <div className="space-y-3 mt-8">
                    <h3 className="text-xl font-semibold mb-4">Popular SSC Exams:</h3>
                    {examsList.map((exam, index) => (
                      <div key={index} className="flex items-start gap-3 group">
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                        <span className="text-muted-foreground">{exam}</span>
                      </div>
                    ))}
                  </div>
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
                  SSC 2025 — <span className="bg-gradient-primary bg-clip-text text-transparent">Key Highlights</span>
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

        {/* Why SSC is Popular */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">
                  Why SSC Exams Are <span className="bg-gradient-primary bg-clip-text text-transparent">Popular</span>
                </h2>
              </div>

              <div className="grid gap-6">
                {whyPopular.map((reason, index) => (
                  <Card key={index} className="shadow-card hover:shadow-premium transition-all duration-300 group">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow">
                          <CheckCircle2 className="h-5 w-5 text-white" />
                        </div>
                        <p className="text-lg text-muted-foreground flex-1 pt-1.5">{reason}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Why Prepare with Merit Launchers */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">
                  Why Prepare with <span className="bg-gradient-primary bg-clip-text text-transparent">Merit Launchers</span>
                </h2>
                <p className="text-lg text-muted-foreground">
                  Strategic preparation with targeted mock tests and analysis for all SSC exams
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
                One Free <span className="bg-gradient-primary bg-clip-text text-transparent">SSC Mock Test</span>
              </h2>
              
              <p className="text-xl text-muted-foreground mb-8">
                Try before you subscribe! Attempt one full SSC mock test absolutely free on the Merit Launchers App.
              </p>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-card/80 backdrop-blur-sm p-6 rounded-xl shadow-card">
                  <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-3" />
                  <p className="text-sm font-medium">Experience the real SSC online test interface</p>
                </div>
                <div className="bg-card/80 backdrop-blur-sm p-6 rounded-xl shadow-card">
                  <Award className="h-8 w-8 text-primary mx-auto mb-3" />
                  <p className="text-sm font-medium">Get your all-India ranking</p>
                </div>
                <div className="bg-card/80 backdrop-blur-sm p-6 rounded-xl shadow-card">
                  <TrendingUp className="h-8 w-8 text-primary mx-auto mb-3" />
                  <p className="text-sm font-medium">Instant score and analysis</p>
                </div>
              </div>
              
              <Button size="lg" className="shadow-glow hover:shadow-premium transition-all duration-300" asChild>
                <Link to="/fee-structure" className="flex items-center gap-2">
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
                Official <span className="bg-gradient-primary bg-clip-text text-transparent">SSC Resources</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                For official notifications, exam calendars, and syllabus, visit:
              </p>
              <Button size="lg" variant="outline" className="group" asChild>
                <a href="https://ssc.gov.in" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  Visit SSC Official Website
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
                Secure Your <span className="bg-gradient-primary bg-clip-text text-transparent">Government Career</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Start your SSC journey today with practice that matches the real exam experience.
              </p>
              <p className="text-lg text-muted-foreground mb-8">
                The MeritLaunchers App is your smart companion for mastering every tier with confidence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="shadow-glow hover:shadow-premium transition-all duration-300" asChild>
                  <Link to="/fee-structure">Start Free Test</Link>
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
