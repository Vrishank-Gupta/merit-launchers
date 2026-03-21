import { Trophy, Target, Sparkles } from "lucide-react";
import studentsCelebrating from "@/assets/students-celebrating.jpg";

export default function SuccessStoriesSection() {
  return (
    <section className="py-2 md:py-3 bg-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{ 
          backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--primary)) 1px, transparent 0)`,
          backgroundSize: "40px 40px"
        }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-4 items-center">
          {/* Image Side */}
          <div className="relative order-2 lg:order-1">
            <div className="relative rounded-2xl overflow-hidden shadow-premium hover:shadow-glow transition-all duration-500">
              <img 
                src={studentsCelebrating} 
                alt="Students celebrating success with Merit Launchers"
                className="w-full h-auto hover:scale-105 transition-transform duration-700"
              />
              
              {/* Floating Achievement Cards */}
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-premium animate-float">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-foreground">2,500+</div>
                    <div className="text-xs text-muted-foreground">Top Rankers</div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-premium animate-float" style={{ animationDelay: "0.5s" }}>
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-gradient-warm rounded-lg flex items-center justify-center">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-foreground">98.5%</div>
                    <div className="text-xs text-muted-foreground">Avg Score</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Blur */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
          </div>

          {/* Content Side */}
          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center space-x-2 bg-accent/10 text-accent px-3 py-1 rounded-full mb-2 animate-fade-in text-xs md:text-sm">
              <Sparkles className="h-3 w-3" />
              <span className="font-medium">Real Results, Real Success</span>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold mb-2 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              Join <span className="bg-gradient-primary bg-clip-text text-transparent">50,000+ Students</span> Who Achieved Their Dreams
            </h2>

            <p className="text-sm text-muted-foreground mb-3 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              From struggling with basics to securing top ranks in competitive exams - 
              our students have transformed their futures with dedicated practice and 
              Merit Launchers' comprehensive mock test platform.
            </p>

            <div className="space-y-2">
              <div className="flex items-start space-x-3 p-3 bg-card rounded-lg shadow-card hover:shadow-premium transition-all duration-300 animate-fade-in" style={{ animationDelay: "0.3s" }}>
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-1">Top AIR Ranks</h3>
                  <p className="text-muted-foreground text-xs">
                    Our students consistently secure positions in top 100 across CUET, CLAT, JEE, and NEET
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-card rounded-lg shadow-card hover:shadow-premium transition-all duration-300 animate-fade-in" style={{ animationDelay: "0.4s" }}>
                <div className="flex-shrink-0 w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Target className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-1">Score Improvement</h3>
                  <p className="text-muted-foreground text-xs">
                    Average 40% score improvement within 3 months of regular practice
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-card rounded-lg shadow-card hover:shadow-premium transition-all duration-300 animate-fade-in" style={{ animationDelay: "0.5s" }}>
                <div className="flex-shrink-0 w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-1">Dream Colleges</h3>
                  <p className="text-muted-foreground text-xs">
                    95% of our students secure admission in their preferred colleges and universities
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
