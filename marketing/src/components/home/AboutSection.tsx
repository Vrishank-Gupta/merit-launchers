import { Target, Users, Award } from "lucide-react";

export default function AboutSection() {
  return (
    <section className="py-2 md:py-3 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-3">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            About <span className="bg-gradient-primary bg-clip-text text-transparent">Merit Launchers</span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground">
            We're on a mission to democratize competitive exam preparation by making high-quality mock tests accessible and affordable for every student in India. With cutting-edge analytics and instant results, we help you identify strengths, work on weaknesses, and achieve your dreams.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-3 mt-3">
          <div className="text-center group">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-2 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
              <Target className="h-6 w-6 text-primary group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Our Mission</h3>
            <p className="text-sm text-muted-foreground">
              Make quality exam preparation accessible to every student, regardless of their financial background.
            </p>
          </div>

          <div className="text-center group">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-accent/10 rounded-full mb-2 group-hover:bg-accent group-hover:scale-110 transition-all duration-300">
              <Users className="h-6 w-6 text-accent group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Our Community</h3>
            <p className="text-sm text-muted-foreground">
              Join thousands of students who trust Merit Launchers for their exam preparation journey.
            </p>
          </div>

          <div className="text-center group">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-secondary/10 rounded-full mb-2 group-hover:bg-secondary group-hover:scale-110 transition-all duration-300">
              <Award className="h-6 w-6 text-secondary group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Our Promise</h3>
            <p className="text-sm text-muted-foreground">
              Deliver accurate, exam-like mock tests with detailed analysis to boost your confidence.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
