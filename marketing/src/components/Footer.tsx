import { Link, useNavigate } from "react-router-dom";
import { Facebook, Youtube, Instagram, Twitter, Linkedin, Mail, Phone, MapPin, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/merit-launchers-logo.png";

const ScrollToTopLink = ({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) => {
  const navigate = useNavigate();
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(to);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  return (
    <a href={to} onClick={handleClick} className={className}>
      {children}
    </a>
  );
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* About Section */}
          <div>
            <img src={logo} alt="Merit Launchers" className="h-12 w-auto mb-4" />
            <p className="text-sm opacity-90 mb-4">
              Launch Your Future with India's most comprehensive mock test platform.
            </p>
            <div className="space-y-2">
              <Button variant="outline" className="bg-transparent border-white/30 hover:bg-white/10 w-full" asChild>
                <a href="https://play.google.com/store/apps/details?id=co.robin.qibrw&hl=en" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                  <Download className="h-4 w-4" />
                  Download App
                </a>
              </Button>
            <Button variant="outline" className="bg-transparent border-white/30 hover:bg-white/10 w-full" asChild>
              <a href="https://play.google.com/store/apps/details?id=co.robin.qibrw&hl=en" target="_blank" rel="noopener noreferrer">Get Started</a>
            </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><ScrollToTopLink to="/" className="text-sm opacity-90 hover:opacity-100 hover:text-primary transition-all">Home</ScrollToTopLink></li>
              <li><ScrollToTopLink to="/about" className="text-sm opacity-90 hover:opacity-100 hover:text-primary transition-all">About Us</ScrollToTopLink></li>
              <li><ScrollToTopLink to="/blog" className="text-sm opacity-90 hover:opacity-100 hover:text-primary transition-all">Blog</ScrollToTopLink></li>
              <li><ScrollToTopLink to="/contact" className="text-sm opacity-90 hover:opacity-100 hover:text-primary transition-all">Contact Us</ScrollToTopLink></li>
              <li><ScrollToTopLink to="/faq" className="text-sm opacity-90 hover:opacity-100 hover:text-primary transition-all">FAQ</ScrollToTopLink></li>
              <li><ScrollToTopLink to="/fee-structure" className="text-sm opacity-90 hover:opacity-100 hover:text-primary transition-all">Fee Structure</ScrollToTopLink></li>
            </ul>
          </div>

          {/* Popular Courses */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Popular Courses</h3>
            <ul className="space-y-2">
              <li><ScrollToTopLink to="/courses/cuet" className="text-sm opacity-90 hover:opacity-100 hover:text-primary transition-all">CUET Mock Tests</ScrollToTopLink></li>
              <li><ScrollToTopLink to="/courses/clat" className="text-sm opacity-90 hover:opacity-100 hover:text-primary transition-all">CLAT Preparation</ScrollToTopLink></li>
              <li><ScrollToTopLink to="/courses/ctet-1" className="text-sm opacity-90 hover:opacity-100 hover:text-primary transition-all">CTET Paper I</ScrollToTopLink></li>
              <li><ScrollToTopLink to="/courses/ctet-2" className="text-sm opacity-90 hover:opacity-100 hover:text-primary transition-all">CTET Paper II</ScrollToTopLink></li>
              <li><ScrollToTopLink to="/courses/jee" className="text-sm opacity-90 hover:opacity-100 hover:text-primary transition-all">JEE Practice Tests</ScrollToTopLink></li>
              <li><ScrollToTopLink to="/courses/neet" className="text-sm opacity-90 hover:opacity-100 hover:text-primary transition-all">NEET Mock Series</ScrollToTopLink></li>
              <li><ScrollToTopLink to="/courses/ipmat" className="text-sm opacity-90 hover:opacity-100 hover:text-primary transition-all">IPMAT Preparation</ScrollToTopLink></li>
              <li><ScrollToTopLink to="/courses/ssc" className="text-sm opacity-90 hover:opacity-100 hover:text-primary transition-all">SSC Exams</ScrollToTopLink></li>
              <li><ScrollToTopLink to="/courses/dsssb" className="text-sm opacity-90 hover:opacity-100 hover:text-primary transition-all">DSSSB Tests</ScrollToTopLink></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2 text-sm opacity-90">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>New Delhi, India</span>
              </li>
              <li className="flex items-center space-x-2 text-sm opacity-90">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <a href="mailto:info@meritlaunchers.com" className="hover:text-primary transition-colors break-all">
                  info@meritlaunchers.com
                </a>
              </li>
              <li className="flex items-center space-x-2 text-sm opacity-90">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <a href="tel:+919354902925" className="hover:text-primary transition-colors">
                  +91 93549 02925
                </a>
              </li>
            </ul>

            {/* Social Media */}
            <div className="flex items-center space-x-3 mt-4">
              <a href="https://www.facebook.com/61583046760574/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://www.youtube.com/@merit_launchers" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors" aria-label="YouTube">
                <Youtube className="h-5 w-5" />
              </a>
              <a href="https://www.instagram.com/merit_launchers/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://x.com/meritlaunchers" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors" aria-label="X">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://www.linkedin.com/company/merit-launchers/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-6 mt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm opacity-75">
              © {currentYear} Merit Launchers. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm opacity-75">
              <ScrollToTopLink to="/privacy-policy" className="hover:opacity-100 hover:text-primary transition-all">Privacy Policy</ScrollToTopLink>
              <ScrollToTopLink to="/terms-conditions" className="hover:opacity-100 hover:text-primary transition-all">Terms & Conditions</ScrollToTopLink>
              <ScrollToTopLink to="/return-policy" className="hover:opacity-100 hover:text-primary transition-all">Return Policy</ScrollToTopLink>
              <ScrollToTopLink to="/external-links" className="hover:opacity-100 hover:text-primary transition-all">External Links</ScrollToTopLink>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
