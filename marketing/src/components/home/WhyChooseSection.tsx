import { Zap, TrendingUp, Clock, BarChart3, Award, Shield, Smartphone, Target } from "lucide-react";
import studentStudying from "@/assets/student-studying.jpg";
import digitalLearning from "@/assets/digital-learning.jpg";

const features = [
  {
    icon: Zap,
    title: "Instant Results",
    description: "Get your scores immediately after completing the test",
    color: "text-yellow-500",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
  },
  {
    icon: BarChart3,
    title: "Detailed Analytics",
    description: "Track performance with comprehensive breakdowns",
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
  },
  {
    icon: Target,
    title: "Accessible to All",
    description: "Premium quality for every student",
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-950/20",
  },
  {
    icon: Clock,
    title: "Real Exam Experience",
    description: "Timed tests with exact exam patterns",
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    description: "Monitor improvement with performance graphs",
    color: "text-cyan-500",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/20",
  },
  {
    icon: Award,
    title: "Expert Solutions",
    description: "Detailed explanations by subject experts",
    color: "text-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
  },
  {
    icon: Smartphone,
    title: "Mobile Friendly",
    description: "Practice on any device, anytime",
    color: "text-pink-500",
    bgColor: "bg-pink-50 dark:bg-pink-950/20",
  },
  {
    icon: Shield,
    title: "Secure Platform",
    description: "Your data is safe and protected",
    color: "text-red-500",
    bgColor: "bg-red-50 dark:bg-red-950/20",
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
            Powerful features designed to give you the best exam preparation experience
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
