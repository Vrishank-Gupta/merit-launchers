import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Download, Award, TrendingUp, Target, BookOpen, ExternalLink, Clock, FileText } from "lucide-react";
import { Link } from "react-router-dom";

export default function NEET() {
  const keyHighlights = [
    { label: "Conducting Body", value: "National Testing Agency (NTA)" },
    { label: "Exam Level", value: "National" },
    { label: "Exam Date", value: "May 4, 2025 (Tentative)" },
    { label: "Mode of Exam", value: "Offline (Pen & Paper, OMR-based)" },
    { label: "Duration", value: "3 hours 20 minutes" },
    { label: "Subjects", value: "Physics, Chemistry, Biology (Botany + Zoology)" },
    { label: "Total Questions", value: "200 (180 to be attempted)" },
    { label: "Marking Scheme", value: "+4 for correct, –1 for incorrect, 0 for unattempted" },
    { label: "Total Marks", value: "720" },
    { label: "Eligibility", value: "Class 12 passed / appearing with Physics, Chemistry, Biology, and English" },
    { label: "Minimum Age", value: "17 years as on 31st December 2025" },
    { label: "Official Website", value: "https://neet.nta.nic.in" }
  ];

  const features = [
    {
      icon: BookOpen,
      title: "10 Full-Length Mock Tests",
      description: "Covering Physics, Chemistry, and Biology as per the latest NTA pattern"
    },
    {
      icon: TrendingUp,
      title: "Instant Scoring & Analysis",
      description: "Get detailed reports immediately after submission"
    },
    {
      icon: Clock,
      title: "Performance Tracker",
      description: "Measure improvement over time"
    },
    {
      icon: Award,
      title: "All-India Ranking System",
      description: "Know where you stand among other NEET aspirants"
    }
  ];

  const howItWorks = [
    { step: 1, text: "Download the Merit Launchers App" },
    { step: 2, text: "Register using your name and contact details" },
    { step: 3, text: "Select the NEET Course" },
    { step: 4, text: "Attempt your Free Mock Test instantly" },
    { step: 5, text: "Get Instant Results & Ranking" },
    { step: 6, text: "Upgrade to access 10 complete subject-wise tests with detailed analytics" }
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
                    Medical Entrance Exam
                  </span>
                </div>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
                NEET <span className="bg-gradient-primary bg-clip-text text-transparent">2025</span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Master the National Eligibility cum Entrance Test with comprehensive mock tests and detailed analytics
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

        {/* About NEET Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">
                  About <span className="bg-gradient-primary bg-clip-text text-transparent">NEET</span>
                </h2>
              </div>

              <Card className="shadow-card hover:shadow-premium transition-all duration-300 border-primary/20">
                <CardContent className="p-8">
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                    The National Eligibility cum Entrance Test (NEET-UG) is the sole national-level medical entrance examination conducted by the National Testing Agency (NTA) for admission to MBBS, BDS, AYUSH, Veterinary, and other medical courses across India.
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    It serves as a single-window exam for all medical aspirants, ensuring fair and transparent admissions to both government and private colleges. For official notifications and updates, visit the NTA NEET website.
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
                  NEET 2025 — <span className="bg-gradient-primary bg-clip-text text-transparent">Key Highlights</span>
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

        {/* Why NEET Matters */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">
                  Why NEET <span className="bg-gradient-primary bg-clip-text text-transparent">Matters</span>
                </h2>
              </div>

              <Card className="shadow-card hover:shadow-premium transition-all duration-300">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow">
                        <CheckCircle2 className="h-5 w-5 text-white" />
                      </div>
                      <p className="text-lg text-muted-foreground flex-1 pt-1.5">
                        NEET is the gateway to more than <strong>700+ medical colleges</strong> across India, including AIIMS, JIPMER, and AFMC
                      </p>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow">
                        <CheckCircle2 className="h-5 w-5 text-white" />
                      </div>
                      <p className="text-lg text-muted-foreground flex-1 pt-1.5">
                        It ensures uniform admission standards across the country
                      </p>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow">
                        <CheckCircle2 className="h-5 w-5 text-white" />
                      </div>
                      <p className="text-lg text-muted-foreground flex-1 pt-1.5">
                        One single exam score is accepted for nearly <strong>1 lakh+ MBBS seats</strong> and other allied courses
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                  Cracking NEET requires not only knowledge but also speed, precision, and stamina. The Merit Launchers App is designed to help medical aspirants master all three.
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
                One Free <span className="bg-gradient-primary bg-clip-text text-transparent">NEET Mock Test</span>
              </h2>
              
              <p className="text-xl text-muted-foreground mb-8">
                Try one full NEET mock test absolutely free on the Merit Launchers App! Experience the real NEET pattern, get your score instantly.
              </p>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-card/80 backdrop-blur-sm p-6 rounded-xl shadow-card">
                  <FileText className="h-8 w-8 text-primary mx-auto mb-3" />
                  <p className="text-sm font-medium">Real NEET pattern questions</p>
                </div>
                <div className="bg-card/80 backdrop-blur-sm p-6 rounded-xl shadow-card">
                  <Award className="h-8 w-8 text-primary mx-auto mb-3" />
                  <p className="text-sm font-medium">Instant score and ranking</p>
                </div>
                <div className="bg-card/80 backdrop-blur-sm p-6 rounded-xl shadow-card">
                  <TrendingUp className="h-8 w-8 text-primary mx-auto mb-3" />
                  <p className="text-sm font-medium">All from your phone</p>
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
                Official <span className="bg-gradient-primary bg-clip-text text-transparent">NEET Resources</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                For official bulletins, exam guidelines, and syllabus, visit:
              </p>
              <Button size="lg" variant="outline" className="group" asChild>
                <a href="https://neet.nta.nic.in" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  Visit NTA NEET Website
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
                Start Your <span className="bg-gradient-primary bg-clip-text text-transparent">Medical Journey Today</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Success in NEET begins with strong concepts and smart practice. With Merit Launchers, you get the exact exam experience, real-time analytics, and guided improvement.
              </p>
              <p className="text-xl font-semibold text-primary mb-8">
                Dream MBBS. Plan Smart. Practice with Merit Launchers.
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
