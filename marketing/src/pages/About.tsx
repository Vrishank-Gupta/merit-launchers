import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Target, Users, Award, Heart, TrendingUp, Shield, CheckCircle, Sparkles, Globe, Zap, BookOpen, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="min-h-screen">
      <SEO 
        title="About Us - Merit Launchers | Expert Test Preparation Platform"
        description="Learn about Merit Launchers - India's leading mock test platform. Our mission is to make quality test preparation accessible and affordable for every student preparing for competitive exams."
        keywords="about merit launchers, test preparation platform, competitive exam preparation, online mock tests India"
      />
      <Navbar />
      
      <main>
        {/* Hero Section */}
        <section className="relative bg-gradient-hero py-12 overflow-hidden">
          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                About <span className="bg-gradient-primary bg-clip-text text-transparent">Merit Launchers</span>
              </h1>
              
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                India's trusted online test preparation platform
              </p>
            </div>
          </div>
        </section>

        {/* Combined Info Section */}
        <section className="py-8 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 gap-6">
                {/* What We Offer */}
                <div className="bg-card p-6 rounded-xl shadow-card">
                  <h2 className="text-2xl font-bold mb-4">
                    What We <span className="bg-gradient-primary bg-clip-text text-transparent">Offer</span>
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    High-quality, exam-specific mock tests, performance analytics, and real-time feedback through our user-friendly Merit Launchers App.
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Whether you're aiming for <strong>CUET, CLAT, CTET, JEE, IPMAT, NEET, SSC, or DSSSB</strong>, we provide everything you need to practice, analyze, and improve.
                  </p>
                </div>

                {/* Mission */}
                <div className="bg-card p-6 rounded-xl shadow-card">
                  <h2 className="text-2xl font-bold mb-4">
                    Our <span className="bg-gradient-primary bg-clip-text text-transparent">Mission</span>
                  </h2>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">Provide exam-pattern-based mock tests</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">Deliver instant performance feedback</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">Promote affordable learning</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">Encourage self-paced preparation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">Update content based on latest trends</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Vision & Values Combined */}
        <section className="py-8 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Vision */}
                <div className="bg-card p-6 rounded-xl shadow-card group">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary transition-all duration-300">
                    <Target className="h-6 w-6 text-primary group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Our Vision</h3>
                  <p className="text-sm text-muted-foreground">
                    Make quality exam preparation accessible, affordable, and intelligent for every learner in India.
                  </p>
                </div>

                {/* Belief */}
                <div className="bg-card p-6 rounded-xl shadow-card group">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent transition-all duration-300">
                    <Shield className="h-6 w-6 text-accent group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">What We Believe</h3>
                  <p className="text-sm text-muted-foreground">
                    Every student deserves a fair chance to succeed through consistent practice and honest self-assessment.
                  </p>
                </div>

                {/* Team */}
                <div className="bg-card p-6 rounded-xl shadow-card group">
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-secondary transition-all duration-300">
                    <Users className="h-6 w-6 text-secondary group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Expert Team</h3>
                  <p className="text-sm text-muted-foreground">
                    Experienced educators, exam analysts, and subject matter experts from reputed institutions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Students Choose Us */}
        <section className="py-8 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold mb-6 text-center">
                Why Students Choose <span className="bg-gradient-primary bg-clip-text text-transparent">Us</span>
              </h2>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-card p-4 rounded-lg shadow-card">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Real Exam Experience</h3>
                  <p className="text-sm text-muted-foreground">
                    Mock tests mirror actual exam format
                  </p>
                </div>

                <div className="bg-card p-4 rounded-lg shadow-card">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center mb-3">
                    <Zap className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Instant Analytics</h3>
                  <p className="text-sm text-muted-foreground">
                    Real-time performance insights
                  </p>
                </div>

                <div className="bg-card p-4 rounded-lg shadow-card">
                  <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center mb-3">
                    <Sparkles className="h-5 w-5 text-secondary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Smart Learning</h3>
                  <p className="text-sm text-muted-foreground">
                    Detailed solutions included
                  </p>
                </div>

                <div className="bg-card p-4 rounded-lg shadow-card">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Affordable</h3>
                  <p className="text-sm text-muted-foreground">
                    No hidden fees
                  </p>
                </div>

                <div className="bg-card p-4 rounded-lg shadow-card">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center mb-3">
                    <Zap className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Mobile-First</h3>
                  <p className="text-sm text-muted-foreground">
                    Practice anytime, anywhere
                  </p>
                </div>

                <div className="bg-card p-4 rounded-lg shadow-card">
                  <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center mb-3">
                    <TrendingUp className="h-5 w-5 text-secondary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">All-India Ranking</h3>
                  <p className="text-sm text-muted-foreground">
                    Compare nationally
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-8 bg-gradient-primary text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4 text-white">
                Ready to Begin?
              </h2>
              <p className="text-lg text-white/90 mb-6">
                Join thousands preparing smarter with Merit Launchers
              </p>
              <Button size="lg" variant="secondary" asChild>
                <Link to="/fee-structure">Start Free Test</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
