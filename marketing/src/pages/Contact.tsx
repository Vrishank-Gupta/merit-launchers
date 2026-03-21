import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Mail, Phone, MapPin, Clock, Facebook, Instagram, Youtube, MessageCircle, Send, User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message Sent Successfully!",
      description: "We'll get back to you within 24 hours.",
    });
    setFormData({ name: "", email: "", phone: "", message: "" });
  };

  const handleWhatsApp = () => {
    window.open("https://wa.me/919354902925", "_blank");
  };

  return (
    <div className="min-h-screen">
      <SEO 
        title="Contact Us - Merit Launchers | Get Support & Start Preparation"
        description="Get in touch with Merit Launchers. Contact us for course inquiries, technical support, or partnership opportunities. Email: info@meritlaunchers.com | Phone: +91 93549 02925"
        keywords="contact merit launchers, support, mock test help, course inquiry, customer service"
      />
      <Navbar />
      
      <main>
        {/* Hero Section */}
        <section className="relative bg-gradient-hero py-12 overflow-hidden">
          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl font-bold mb-4">
                We're Here to Help You <span className="bg-gradient-primary bg-clip-text text-transparent">Succeed</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Reach out anytime for course inquiries, support, or partnerships
              </p>
            </div>
          </div>
        </section>

        {/* Contact Cards */}
        <section className="py-8 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">
                  Reach <span className="bg-gradient-primary bg-clip-text text-transparent">Us At</span>
                </h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Address */}
                <div className="bg-card p-6 rounded-xl shadow-card hover:shadow-premium transition-all duration-300 group">
                  <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                    <MapPin className="h-7 w-7 text-primary group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-semibold text-lg mb-3">Office Address</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Merit Launchers<br />
                    First Floor G7/112 Rohini<br />
                    New Delhi – 110089<br />
                    India
                  </p>
                </div>

                {/* Phone */}
                <div className="bg-card p-6 rounded-xl shadow-card hover:shadow-premium transition-all duration-300 group">
                  <div className="w-14 h-14 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent group-hover:scale-110 transition-all duration-300">
                    <Phone className="h-7 w-7 text-accent group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-semibold text-lg mb-3">Call or WhatsApp</h3>
                  <a href="tel:+919354549654" className="text-muted-foreground hover:text-primary transition-colors block mb-2 font-medium">
                    +91-9354549654
                  </a>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-2"
                    onClick={handleWhatsApp}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp Us
                  </Button>
                </div>

                {/* Email */}
                <div className="bg-card p-6 rounded-xl shadow-card hover:shadow-premium transition-all duration-300 group">
                  <div className="w-14 h-14 bg-secondary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-secondary group-hover:scale-110 transition-all duration-300">
                    <Mail className="h-7 w-7 text-secondary group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-semibold text-lg mb-3">Email</h3>
                  <a href="mailto:info@meritlaunchers.com" className="text-muted-foreground hover:text-primary transition-colors break-all">
                    info@meritlaunchers.com
                  </a>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Website */}
                <div className="bg-card p-6 rounded-xl shadow-card hover:shadow-premium transition-all duration-300 group">
                  <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                    <svg className="h-7 w-7 text-primary group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-lg mb-3">Website</h3>
                  <a href="https://www.meritlaunchers.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                    www.meritlaunchers.com
                  </a>
                </div>

                {/* Working Hours */}
                <div className="bg-card p-6 rounded-xl shadow-card hover:shadow-premium transition-all duration-300 group">
                  <div className="w-14 h-14 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent group-hover:scale-110 transition-all duration-300">
                    <Clock className="h-7 w-7 text-accent group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-semibold text-lg mb-3">Working Hours</h3>
                  <p className="text-muted-foreground">
                    <strong>All seven days</strong><br />
                    9:00 AM to 7:00 PM
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Student Queries Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-primary p-1 rounded-2xl">
                <div className="bg-background p-8 rounded-2xl">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-3">For Student Queries</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        If you're a student facing any difficulty in <strong>logging in, accessing mock tests, or making payments</strong>, please mention your <strong>registered email or phone number</strong> in your message so our support team can help quickly.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">
                  Send Us a <span className="bg-gradient-primary bg-clip-text text-transparent">Message</span>
                </h2>
                <p className="text-muted-foreground">
                  Fill out the form below and we'll get back to you within 24 hours
                </p>
              </div>

              <div className="bg-card p-8 rounded-2xl shadow-card">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        Full Name
                      </label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4 text-primary" />
                        Email Address
                      </label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" />
                      Phone Number
                    </label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 XXXXX XXXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-primary" />
                      Your Message
                    </label>
                    <Textarea
                      id="message"
                      placeholder="Please include your registered email/phone if you're a student seeking support..."
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full shadow-glow hover:shadow-premium transition-all duration-300"
                  >
                    <Send className="h-5 w-5 mr-2" />
                    Send Message
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Stay Connected - Social Media */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-4">
                Stay <span className="bg-gradient-primary bg-clip-text text-transparent">Connected</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Follow us on our official platforms for updates, exam notifications, and learning tips
              </p>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Facebook */}
                <a 
                  href="https://facebook.com/MeritLaunchers" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group bg-card p-6 rounded-xl shadow-card hover:shadow-premium transition-all duration-300 border border-transparent hover:border-primary/20"
                >
                  <div className="w-14 h-14 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500 group-hover:scale-110 transition-all duration-300">
                    <Facebook className="h-7 w-7 text-blue-500 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-semibold">Facebook</h3>
                  <p className="text-sm text-muted-foreground mt-1">@MeritLaunchers</p>
                </a>

                {/* Instagram */}
                <a 
                  href="https://instagram.com/MeritLaunchers" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group bg-card p-6 rounded-xl shadow-card hover:shadow-premium transition-all duration-300 border border-transparent hover:border-primary/20"
                >
                  <div className="w-14 h-14 bg-pink-500/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-pink-500 group-hover:scale-110 transition-all duration-300">
                    <Instagram className="h-7 w-7 text-pink-500 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-semibold">Instagram</h3>
                  <p className="text-sm text-muted-foreground mt-1">@MeritLaunchers</p>
                </a>

                {/* YouTube */}
                <a 
                  href="https://YouTube.com/@MeritLaunchers" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group bg-card p-6 rounded-xl shadow-card hover:shadow-premium transition-all duration-300 border border-transparent hover:border-primary/20"
                >
                  <div className="w-14 h-14 bg-red-500/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-red-500 group-hover:scale-110 transition-all duration-300">
                    <Youtube className="h-7 w-7 text-red-500 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-semibold">YouTube</h3>
                  <p className="text-sm text-muted-foreground mt-1">@MeritLaunchers</p>
                </a>

                {/* Telegram/WhatsApp Channel */}
                <div className="group bg-card p-6 rounded-xl shadow-card border border-dashed border-muted">
                  <div className="w-14 h-14 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="h-7 w-7 text-green-500" />
                  </div>
                  <h3 className="font-semibold">Telegram / WhatsApp</h3>
                  <p className="text-sm text-muted-foreground mt-1">Coming Soon</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="bg-card p-4 rounded-2xl shadow-card">
                <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground font-semibold">Find Us Here</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      First Floor G7/112 Rohini<br />
                      New Delhi – 110089
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
