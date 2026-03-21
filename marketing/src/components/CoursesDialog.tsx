import { Link } from "react-router-dom";
import { GraduationCap, Scale, Atom, Microscope, FileText, BookOpen, TrendingUp, BookMarked } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const courses = [
  {
    name: "CUET",
    title: "Common University Entrance Test",
    icon: GraduationCap,
    path: "/courses/cuet",
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
  },
  {
    name: "CLAT",
    title: "Common Law Admission Test",
    icon: Scale,
    path: "/courses/clat",
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
  },
  {
    name: "JEE",
    title: "Joint Entrance Examination",
    icon: Atom,
    path: "/courses/jee",
    color: "text-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
  },
  {
    name: "NEET",
    title: "National Eligibility Entrance Test",
    icon: Microscope,
    path: "/courses/neet",
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-950/20",
  },
  {
    name: "SSC",
    title: "Staff Selection Commission",
    icon: FileText,
    path: "/courses/ssc",
    color: "text-red-500",
    bgColor: "bg-red-50 dark:bg-red-950/20",
  },
  {
    name: "DSSSB",
    title: "Delhi Subordinate Services",
    icon: BookOpen,
    path: "/courses/dsssb",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
  },
  {
    name: "IPMAT",
    title: "IIM Indore Aptitude Test",
    icon: TrendingUp,
    path: "/courses/ipmat",
    color: "text-cyan-500",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/20",
  },
  {
    name: "CTET Paper 1",
    title: "Central Teacher Eligibility Test",
    icon: BookMarked,
    path: "/courses/ctet-1",
    color: "text-pink-500",
    bgColor: "bg-pink-50 dark:bg-pink-950/20",
  },
  {
    name: "CTET Paper 2",
    title: "Central Teacher Eligibility Test",
    icon: BookMarked,
    path: "/courses/ctet-2",
    color: "text-indigo-500",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
  },
];

interface CoursesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CoursesDialog({ open, onOpenChange }: CoursesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            <span className="bg-gradient-primary bg-clip-text text-transparent">All Courses</span>
          </DialogTitle>
          <DialogDescription>
            Choose from our comprehensive collection of mock tests designed for your target exam
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {courses.map((course) => (
            <Link
              key={course.path}
              to={course.path}
              onClick={() => onOpenChange(false)}
            >
              <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-2 ${course.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                    <course.icon className={`h-6 w-6 ${course.color}`} />
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {course.name}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {course.title}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
