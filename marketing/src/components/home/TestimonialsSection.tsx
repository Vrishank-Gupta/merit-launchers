import { Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    name: "Priya Sharma",
    exam: "CUET 2024",
    image: "PS",
    rating: 5,
    text: "Merit Launchers' mock tests helped me understand the exact pattern and difficulty level of CUET. The detailed analytics showed me exactly where to improve. Highly recommend!",
  },
  {
    name: "Rahul Verma",
    exam: "CLAT 2024",
    image: "RV",
    rating: 5,
    text: "The best part? One free mock test to start with! The quality is exceptional. Got into my dream law college thanks to Merit Launchers.",
  },
  {
    name: "Ananya Singh",
    exam: "JEE 2024",
    image: "AS",
    rating: 5,
    text: "Instant results and topic-wise analysis helped me focus on my weak areas. The questions are challenging and exactly like JEE. Highly effective!",
  },
  {
    name: "Karan Patel",
    exam: "NEET 2024",
    image: "KP",
    rating: 5,
    text: "I tried multiple platforms but Merit Launchers stood out for its accuracy and detailed solutions. The mobile app is super smooth. Thank you for helping me crack NEET!",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-2 md:py-3 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-3">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            What Our <span className="bg-gradient-primary bg-clip-text text-transparent">Students Say</span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            Join thousands of successful students who achieved their dreams with Merit Launchers
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={testimonial.name}
              className="relative overflow-hidden group hover:shadow-premium transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/10 group-hover:text-primary/20 transition-colors" />
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold">
                    {testimonial.image}
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.exam}</div>
                  </div>
                </div>

                <div className="flex mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  "{testimonial.text}"
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
