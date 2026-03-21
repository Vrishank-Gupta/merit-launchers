import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Zap, ArrowRight, CheckCircle } from "lucide-react";
import CoursesDialog from "@/components/CoursesDialog";

export default function CTASection() {
  const [coursesDialogOpen, setCoursesDialogOpen] = useState(false);

  return (
    <section className="py-2 md:py-3 bg-gradient-primary relative overflow-hidden">
      {/* Animated Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center text-white">
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full mb-2 animate-fade-in text-xs md:text-sm">
            <Zap className="h-3 w-3" />
            <span className="font-medium">Start Your Journey Today</span>
          </div>

          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 animate-fade-in-up leading-tight" style={{ animationDelay: "0.1s" }}>
            Ready to Launch Your Merit?
          </h2>

          <p className="text-sm md:text-base mb-3 text-white/90 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            Join thousands of successful students who transformed their exam preparation 
            with Merit Launchers. Start with a completely free mock test today!
          </p>

          {/* Benefits List */}
          <div className="grid md:grid-cols-3 gap-2 mb-3 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center justify-center space-x-2 text-white/90">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs font-medium">No Credit Card Required</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-white/90">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs font-medium">Instant Access to Free Test</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-white/90">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs font-medium">Full Analytics & Solutions</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 animate-fade-in-up mb-3" style={{ animationDelay: "0.4s" }}>
            <Button 
              size="default" 
              variant="secondary"
              className="shadow-premium hover:shadow-glow transition-all duration-300 text-sm px-6 py-5 hover:scale-105"
              asChild
            >
              <a href="https://play.google.com/store/apps/details?id=co.robin.qibrw&hl=en" target="_blank" rel="noopener noreferrer">
                <Zap className="mr-2 h-4 w-4" />
                Get Free Mock Test
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            
            <Button 
              size="default" 
              variant="outline"
              className="text-sm px-6 py-5 border-2 border-white bg-transparent text-white hover:bg-white hover:text-primary transition-all duration-300"
              onClick={() => setCoursesDialogOpen(true)}
            >
              View All Courses
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-3 border-t border-white/20 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold mb-1">100%</div>
              <div className="text-xs text-white/80">Free to Start</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold mb-1">1</div>
              <div className="text-xs text-white/80">Free Test</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold mb-1">24/7</div>
              <div className="text-xs text-white/80">Access</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold mb-1">∞</div>
              <div className="text-xs text-white/80">Practice Time</div>
            </div>
          </div>
        </div>
      </div>

      <CoursesDialog open={coursesDialogOpen} onOpenChange={setCoursesDialogOpen} />
    </section>
  );
}
