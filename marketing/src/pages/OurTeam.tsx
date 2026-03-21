import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Trophy, GraduationCap, Code, HeadphonesIcon, Mail, CheckCircle2, Target, Lightbulb, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OurTeam() {
  const academicFeatures = [
    "Every mock test matches the latest official pattern",
    "Question difficulty and weightage are balanced to reflect real exam conditions",
    "Solutions are clear, conceptual, and easy to understand",
    "Regular updates are made based on NTA, CBSE, SSC, and DSSSB notifications"
  ];

  const teamSections = [
    {
      icon: Trophy,
      title: "Leadership & Vision",
      color: "primary",
      description: "Our founders and academic leaders come with years of experience in competitive exam preparation. They've mentored thousands of students for top national exams like CUET, CLAT, CTET (I & II both), JEE, IPMAT, NEET, SSC, and DSSSB, helping them reach their dream colleges and careers.",
      quote: "We built Merit Launchers with a vision to combine real exam experience with analytics-driven learning. Every test, every question, and every feature is designed to help students perform their best."
    },
    {
      icon: GraduationCap,
      title: "Academic Team",
      color: "accent",
      description: "Our academic experts and paper-setters are highly qualified professionals — including IIT, IIM, NLU, and DU alumni — who specialize in creating accurate, syllabus-aligned, and up-to-date mock tests.",
      quote: "We don't just test knowledge — we build exam temperament."
    },
    {
      icon: Code,
      title: "Technical & Design Team",
      color: "secondary",
      description: "Our tech innovators work tirelessly to ensure that the Merit Launchers App runs smoothly, securely, and efficiently. They constantly enhance features such as instant scoring, analytics dashboards, ranking systems, and result reports — giving students a seamless digital experience.",
      quote: "Technology is our tool, but student success is our goal."
    },
    {
      icon: HeadphonesIcon,
      title: "Student Support Team",
      color: "primary",
      description: "Our friendly support team ensures every student gets the help they need — whether it's about payment, login, test access, or results. We respond quickly, because we know how important every practice test is in your preparation journey.",
      quote: ""
    }
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main>
        {/* Hero Section */}
        <section className="relative bg-gradient-hero py-12 overflow-hidden">
          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl font-bold mb-4">
                Our <span className="bg-gradient-primary bg-clip-text text-transparent">Team</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Meet the minds behind Merit Launchers
              </p>
            </div>
          </div>
        </section>

        {/* Team Overview */}
        <section className="py-8 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="shadow-card hover:shadow-premium transition-all duration-300 border-primary/20">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow">
                      <Heart className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xl text-muted-foreground leading-relaxed">
                        Our team is a blend of <strong>experienced educators</strong>, <strong>exam specialists</strong>, <strong>academic planners</strong>, and <strong>technology professionals</strong> — all united by a single goal:
                      </p>
                      <p className="text-2xl font-bold text-primary mt-4">
                        To make exam preparation smarter, simpler, and accessible to every student.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Team Sections */}
        {teamSections.map((section, index) => (
          <section key={index} className={`py-16 ${index % 2 === 0 ? 'bg-muted/30' : 'bg-background'}`}>
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <Card className="shadow-card hover:shadow-premium transition-all duration-300 group">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-6 mb-6">
                      <div className={`flex-shrink-0 w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform`}>
                        <section.icon className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-3xl font-bold mb-4 group-hover:text-primary transition-colors">
                          {section.title}
                        </h2>
                        <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                          {section.description}
                        </p>
                        
                        {section.title === "Academic Team" && (
                          <div className="space-y-3 mb-6">
                            <p className="font-semibold text-foreground mb-4">They ensure that:</p>
                            {academicFeatures.map((feature, idx) => (
                              <div key={idx} className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                <p className="text-muted-foreground">{feature}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {section.quote && (
                          <div className="bg-primary/5 border-l-4 border-primary rounded-r-lg p-6 mt-6">
                            <p className="text-lg italic text-foreground font-medium">
                              "{section.quote}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        ))}

        {/* Join Our Mission */}
        <section className="py-16 bg-gradient-hero relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.1),transparent_70%)]"></div>
          
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-6 animate-float shadow-premium">
                <Lightbulb className="h-8 w-8 text-white" />
              </div>
              
              <h2 className="text-4xl font-bold mb-4">
                Join Our <span className="bg-gradient-primary bg-clip-text text-transparent">Mission</span>
              </h2>
              
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                We're expanding our team! If you're an educator, content creator, or subject expert passionate about mentoring students, we'd love to collaborate.
              </p>
              
              <Button size="lg" className="shadow-glow hover:shadow-premium transition-all duration-300" asChild>
                <a href="mailto:info@meritlaunchers.com" className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Write to us at info@meritlaunchers.com
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Together We Launch Success */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-6 shadow-glow">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-4xl font-bold mb-6">
                  Together, We Launch <span className="bg-gradient-primary bg-clip-text text-transparent">Success</span>
                </h2>
              </div>

              <Card className="shadow-card hover:shadow-premium transition-all duration-300 border-primary/20">
                <CardContent className="p-8">
                  <p className="text-xl text-muted-foreground leading-relaxed text-center mb-6">
                    From setting the first question paper to improving the app's experience, everything we do begins with one purpose — <strong className="text-primary">helping students perform better than yesterday.</strong>
                  </p>
                  
                  <div className="bg-gradient-hero rounded-xl p-8 text-center">
                    <p className="text-2xl font-bold mb-2">
                      We're not just a team —
                    </p>
                    <p className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                      we're your academic partners in success.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">
                  Our <span className="bg-gradient-primary bg-clip-text text-transparent">Values</span>
                </h2>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <Card className="shadow-card hover:shadow-premium transition-all duration-300 group">
                  <CardContent className="p-8 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-primary rounded-full mb-4 shadow-glow group-hover:scale-110 transition-transform">
                      <GraduationCap className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Excellence</h3>
                    <p className="text-muted-foreground">
                      Delivering high-quality content that matches real exam standards
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-card hover:shadow-premium transition-all duration-300 group">
                  <CardContent className="p-8 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-primary rounded-full mb-4 shadow-glow group-hover:scale-110 transition-transform">
                      <Heart className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Dedication</h3>
                    <p className="text-muted-foreground">
                      Committed to every student's success journey
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-card hover:shadow-premium transition-all duration-300 group">
                  <CardContent className="p-8 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-primary rounded-full mb-4 shadow-glow group-hover:scale-110 transition-transform">
                      <Lightbulb className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Innovation</h3>
                    <p className="text-muted-foreground">
                      Constantly improving through technology and feedback
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-6">
                Ready to Start Your <span className="bg-gradient-primary bg-clip-text text-transparent">Success Journey?</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join thousands of students who trust our team to guide their preparation
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="shadow-glow hover:shadow-premium transition-all duration-300" asChild>
                  <a href="https://play.google.com/store/apps/details?id=co.robin.qibrw&hl=en" target="_blank" rel="noopener noreferrer">Download App</a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="/contact">Contact Us</a>
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
