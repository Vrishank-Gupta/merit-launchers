import { MonitorCheck, BrainCircuit, ChartColumnBig, Clock4, ArrowRight } from "lucide-react";
import studentStudying from "@/assets/student-studying.jpg";
import digitalLearning from "@/assets/digital-learning.jpg";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: MonitorCheck,
    title: "Real Exam Simulation",
    description: "Our mock tests replicate actual exam environments so students become familiar with patterns and reduce anxiety.",
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
  },
  {
    icon: BrainCircuit,
    title: "Expert-Designed Tests",
    description: "All mock tests are created by experienced educators to maintain accuracy, relevance, and quality.",
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-950/20",
  },
  {
    icon: ChartColumnBig,
    title: "Detailed Performance Analysis",
    description: "After every test, students receive clear insights that help them identify weak areas and improve effectively.",
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
  },
  {
    icon: Clock4,
    title: "Flexible Learning",
    description: "Students can access tests anytime, making preparation more convenient, disciplined, and efficient.",
    color: "text-cyan-500",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/20",
  },
];

export default function WhyChooseSection() {
  return (
    <section className="py-2 md:py-3 bg-muted/30 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-3">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">
            Why Choose <span className="bg-gradient-primary bg-clip-text text-transparent">Merit Launchers</span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            Merit Launchers stands out through student-focused preparation, exam-level
            practice, and clear feedback that helps students improve with confidence.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-4 rounded-xl bg-card shadow-card hover:shadow-premium transition-all duration-300 hover:-translate-y-2 animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-2 ${feature.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`h-5 w-5 ${feature.color}`} />
              </div>
              <h3 className="text-base font-semibold mb-1 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-xs text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-primary/15 bg-gradient-to-r from-primary/8 via-background to-accent/8 p-6 shadow-card">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <h3 className="text-2xl font-bold">Achieve Your Goals With Confidence</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
                Success in competitive exams depends on consistent practice and the
                right guidance. Merit Launchers supports that journey with online
                CUET mock tests, CUET online test series, online CLAT mock tests,
                online NDA mock tests, and IPMAT online preparation in one
                structured ecosystem.
              </p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
                With our structured approach and advanced test series, students can
                build confidence, improve accuracy, and move closer to their desired
                results.
              </p>
            </div>
            <div className="rounded-2xl bg-background/85 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                Built For Momentum
              </p>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li>Practice in real exam flow before the real exam arrives.</li>
                <li>See mistakes quickly and improve with targeted feedback.</li>
                <li>Stay flexible with anytime access across devices.</li>
              </ul>
              <Button className="mt-5" asChild>
                <a href="https://www.meritlaunchers.com/portal/" target="_blank" rel="noopener noreferrer">
                  Start Your Preparation Journey
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Image Showcase */}
        <div className="grid md:grid-cols-2 gap-3 mt-3">
          <div className="relative group">
            <div className="relative rounded-2xl overflow-hidden shadow-premium hover:shadow-glow transition-all duration-500">
              <img 
                src={studentStudying} 
                alt="Student preparing for exams with Merit Launchers"
                className="w-full h-[300px] object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                <div className="text-white">
                  <h3 className="text-xl font-bold mb-1">Study Smart</h3>
                  <p className="text-xs text-white/90">Practice with purpose using our analytics-driven approach</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="relative rounded-2xl overflow-hidden shadow-premium hover:shadow-glow transition-all duration-500">
              <img 
                src={digitalLearning} 
                alt="Digital learning platform for competitive exams"
                className="w-full h-[300px] object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                <div className="text-white">
                  <h3 className="text-xl font-bold mb-1">Learn Anywhere</h3>
                  <p className="text-xs text-white/90">Access your tests on any device, anytime you want</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
