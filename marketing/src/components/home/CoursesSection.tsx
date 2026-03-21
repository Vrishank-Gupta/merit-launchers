import { Link } from "react-router-dom";
import { GraduationCap, Scale, Atom, Microscope, FileText, BookOpen, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const courses = [
  {
    name: "CUET",
    title: "Common University Entrance Test",
    icon: GraduationCap,
    description: "Comprehensive mock tests for all domains with detailed solutions",
    path: "/courses/cuet",
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
  },
  {
    name: "CLAT",
    title: "Common Law Admission Test",
    icon: Scale,
    description: "Legal reasoning and aptitude tests designed by experts",
    path: "/courses/clat",
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
  },
  {
    name: "JEE",
    title: "Joint Entrance Examination",
    icon: Atom,
    description: "Physics, Chemistry & Maths practice with difficulty analysis",
    path: "/courses/jee",
    color: "text-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
  },
  {
    name: "NEET",
    title: "National Eligibility Entrance Test",
    icon: Microscope,
    description: "Medical entrance exam preparation with NCERT focus",
    path: "/courses/neet",
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-950/20",
  },
  {
    name: "SSC",
    title: "Staff Selection Commission",
    icon: FileText,
    description: "Mock tests for CGL, CHSL, MTS & other SSC exams",
    path: "/courses/ssc",
    color: "text-red-500",
    bgColor: "bg-red-50 dark:bg-red-950/20",
  },
  {
    name: "DSSSB",
    title: "Delhi Subordinate Services",
    icon: BookOpen,
    description: "Complete test series for teaching and non-teaching posts",
    path: "/courses/dsssb",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
  },
  {
    name: "IPMAT",
    title: "IIM Indore Aptitude Test",
    icon: TrendingUp,
    description: "Quantitative & verbal ability tests for management aspirants",
    path: "/courses/ipmat",
    color: "text-cyan-500",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/20",
  },
];

export default function CoursesSection() {
  return (
    <section className="py-2 md:py-3 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-3">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            Popular <span className="bg-gradient-primary bg-clip-text text-transparent">Courses</span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            Choose from our comprehensive collection of mock tests designed specifically for your target exam
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {courses.map((course, index) => (
            <Card 
              key={course.path}
              className="group hover:shadow-premium transition-all duration-300 hover:-translate-y-1 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-3 ${course.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                  <course.icon className={`h-6 w-6 ${course.color}`} />
                </div>
                <CardTitle className="text-xl">{course.name}</CardTitle>
                <CardDescription className="text-sm">{course.title}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{course.description}</p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all" asChild>
                  <Link to={course.path}>
                    Explore Tests
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
