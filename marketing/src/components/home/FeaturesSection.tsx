import { Zap, TrendingUp, Clock, BarChart3, Award, Download, Lock, Target } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Instant Results",
    description: "Get your scores and detailed analysis immediately after completing the test",
    color: "text-yellow-500",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
  },
  {
    icon: BarChart3,
    title: "Detailed Analytics",
    description: "Track your performance with subject-wise, topic-wise, and difficulty-wise breakdowns",
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
  },
  {
    icon: Target,
    title: "Accessible Platform",
    description: "Premium quality mock tests accessible to every student. Start with one free test!",
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-950/20",
  },
  {
    icon: Clock,
    title: "Real Exam Experience",
    description: "Timed tests with the exact pattern, difficulty level, and interface of actual exams",
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    description: "Monitor your improvement over time with comprehensive performance graphs",
    color: "text-cyan-500",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/20",
  },
  {
    icon: Award,
    title: "Expert Solutions",
    description: "Detailed explanations for every question, prepared by subject matter experts",
    color: "text-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
  },
  {
    icon: Download,
    title: "Mobile App",
    description: "Practice anywhere, anytime with our user-friendly Android and iOS apps",
    color: "text-pink-500",
    bgColor: "bg-pink-50 dark:bg-pink-950/20",
  },
  {
    icon: Lock,
    title: "Secure & Reliable",
    description: "Your data is safe with us. Practice with confidence on our secure platform",
    color: "text-red-500",
    bgColor: "bg-red-50 dark:bg-red-950/20",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Choose <span className="bg-gradient-primary bg-clip-text text-transparent">Merit Launchers</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to give you the best exam preparation experience
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-6 rounded-lg bg-card shadow-card hover:shadow-premium transition-all duration-300 hover:-translate-y-1 animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-lg mb-4 ${feature.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`h-7 w-7 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
