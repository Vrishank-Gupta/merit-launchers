import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

interface CourseSidebarProps {
  courseName: string;
  courseTitle: string;
  officialWebsite?: string;
}

export default function CourseSidebar({ courseName, courseTitle, officialWebsite }: CourseSidebarProps) {
  return (
    <aside className="lg:sticky lg:top-24 space-y-4">
      <Card className="p-6 border-primary/20 shadow-card">
        <h2 className="text-2xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
          {courseName}
        </h2>
        <p className="text-muted-foreground mb-6">{courseTitle}</p>
        
        <div className="space-y-3">
          <Button size="lg" className="w-full group shadow-glow" asChild>
            <a 
              href="https://play.google.com/store/apps/details?id=co.robin.qibrw&hl=en" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2"
            >
              <Download className="h-5 w-5 group-hover:animate-bounce" />
              Download App
            </a>
          </Button>
          
          <Button size="lg" variant="outline" className="w-full" asChild>
            <Link to="/fee-structure">View Pricing</Link>
          </Button>
          
          {officialWebsite && (
            <Button size="lg" variant="outline" className="w-full group" asChild>
              <a href={officialWebsite} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                Official Website
                <ExternalLink className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </a>
            </Button>
          )}
        </div>
      </Card>
      
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <h3 className="font-semibold mb-3">Quick Links</h3>
        <nav className="space-y-2">
          <a href="#about" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
            About {courseName}
          </a>
          <a href="#key-highlights" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
            Key Highlights
          </a>
          <a href="#why-practice" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
            Why Practice With Us
          </a>
          <a href="#how-it-works" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
            How It Works
          </a>
        </nav>
      </Card>
    </aside>
  );
}
