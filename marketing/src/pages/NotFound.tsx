import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";

const POPULAR_COURSES = [
  { to: "/courses/cuet", label: "CUET" },
  { to: "/courses/clat", label: "CLAT" },
  { to: "/courses/nda", label: "NDA" },
  { to: "/courses/ipmat", label: "IPMAT" },
  { to: "/courses/jee", label: "JEE" },
  { to: "/courses/neet", label: "NEET" },
];

const NotFound = () => (
  <div className="min-h-screen flex flex-col">
    <SEO
      title="Page Not Found | Merit Launchers"
      description="The page you are looking for does not exist. Browse Merit Launchers mock test series for CUET, CLAT, NDA, IPMAT, JEE, NEET and more."
      robots="noindex, follow"
    />
    <Navbar />
    <main className="flex-1 flex items-center justify-center py-16">
      <div className="container mx-auto px-4 text-center max-w-xl">
        <p className="text-sm font-semibold text-primary mb-2">404</p>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">We couldn't find that page</h1>
        <p className="text-muted-foreground mb-8">
          The link may be outdated or mistyped. Try one of our mock test series instead.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {POPULAR_COURSES.map((course) => (
            <Button key={course.to} variant="outline" size="sm" asChild>
              <Link to={course.to}>{course.label}</Link>
            </Button>
          ))}
        </div>
        <Button asChild>
          <Link to="/">Go to homepage</Link>
        </Button>
      </div>
    </main>
    <Footer />
  </div>
);

export default NotFound;
