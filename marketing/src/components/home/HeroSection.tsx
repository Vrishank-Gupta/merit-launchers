import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Zap, TrendingUp, Award, Users } from "lucide-react";
import examHall from "@/assets/exam-hall.png";
import CoursesDialog from "@/components/CoursesDialog";

export default function HeroSection() {
  const [coursesDialogOpen, setCoursesDialogOpen] = useState(false);

  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }}></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-secondary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-4 items-center py-2 md:py-3">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1 rounded-full mb-1 animate-fade-in text-xs md:text-sm">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">One Free Mock Test for Every Course</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 animate-fade-in-up leading-tight" style={{ animationDelay: "0.1s" }}>
              <span className="bg-gradient-primary bg-clip-text text-transparent">Practice Smart.</span>
              <br />
              <span className="text-foreground">Perform Better.</span>
              <br />
              <span className="text-secondary">Launch Your Merit.</span>
            </h1>

            {/* Subheading */}
            <p className="text-sm md:text-base text-muted-foreground mb-3 max-w-2xl mx-auto lg:mx-0 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              India's comprehensive mock test platform for CUET, CLAT, JEE, NEET, SSC, DSSSB & more. 
              Get instant results, detailed analytics, and expert guidance.
            </p>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2 animate-fade-in-up mb-3" style={{ animationDelay: "0.3s" }}>
            <Button 
              size="default" 
              className="shadow-glow hover:shadow-premium transition-all duration-300 text-sm md:text-base px-6 py-5 animate-pulse-glow"
              asChild
            >
              <a href="https://play.google.com/store/apps/details?id=co.robin.qibrw&hl=en" target="_blank" rel="noopener noreferrer">
                <Zap className="mr-2 h-5 w-5" />
                Take Free Mock Test Now
              </a>
            </Button>
              
              <Button 
                size="default" 
                variant="outline"
                className="text-sm md:text-base px-6 py-5 border-2 hover:border-primary hover:bg-primary/5"
                onClick={() => setCoursesDialogOpen(true)}
              >
                View All Courses
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 max-w-md mx-auto lg:mx-0 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start space-x-2 mb-1">
                  <Users className="h-5 w-5 text-primary" />
                  <div className="text-2xl font-bold text-primary">50K+</div>
                </div>
                <div className="text-xs text-muted-foreground">Students</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start space-x-2 mb-1">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  <div className="text-2xl font-bold text-accent">95%</div>
                </div>
                <div className="text-xs text-muted-foreground">Success</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start space-x-2 mb-1">
                  <Award className="h-5 w-5 text-secondary" />
                  <div className="text-2xl font-bold text-secondary">10K+</div>
                </div>
                <div className="text-xs text-muted-foreground">Tests</div>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <div className="relative rounded-2xl overflow-hidden shadow-premium hover:shadow-glow transition-all duration-500 hover:scale-105">
              <img 
                src={examHall} 
                alt="Students taking exam in Merit Launchers test center" 
                className="w-full h-auto"
              />
              {/* Floating Stats Cards */}
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-premium animate-float">
                <div className="text-2xl font-bold text-primary">100%</div>
                <div className="text-xs text-muted-foreground">Free Test</div>
              </div>
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-premium animate-float" style={{ animationDelay: "0.5s" }}>
                <div className="text-2xl font-bold text-accent">7+</div>
                <div className="text-xs text-muted-foreground">Exam Types</div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-accent/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "1s" }}></div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pb-2 animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
          <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 shadow-card hover:shadow-premium transition-all duration-300 hover:scale-105 text-center">
            <div className="text-2xl font-bold text-primary mb-1">50,000+</div>
            <div className="text-xs text-muted-foreground">Active Students</div>
          </div>
          <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 shadow-card hover:shadow-premium transition-all duration-300 hover:scale-105 text-center">
            <div className="text-2xl font-bold text-primary mb-1">10,000+</div>
            <div className="text-xs text-muted-foreground">Mock Tests</div>
          </div>
          <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 shadow-card hover:shadow-premium transition-all duration-300 hover:scale-105 text-center">
            <div className="text-2xl font-bold text-primary mb-1">95%</div>
            <div className="text-xs text-muted-foreground">Success Rate</div>
          </div>
          <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 shadow-card hover:shadow-premium transition-all duration-300 hover:scale-105 text-center">
            <div className="text-2xl font-bold text-primary mb-1">7+</div>
            <div className="text-sm text-muted-foreground">Exam Categories</div>
          </div>
        </div>
      </div>

      <CoursesDialog open={coursesDialogOpen} onOpenChange={setCoursesDialogOpen} />
    </section>
  );
}
