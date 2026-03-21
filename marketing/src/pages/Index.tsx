import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import Marquee from "@/components/Marquee";
import HeroSection from "@/components/home/HeroSection";
import AboutSection from "@/components/home/AboutSection";
import CoursesSection from "@/components/home/CoursesSection";
import SuccessStoriesSection from "@/components/home/SuccessStoriesSection";
import WhyChooseSection from "@/components/home/WhyChooseSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import CTASection from "@/components/home/CTASection";

export default function Index() {
  return (
    <div className="min-h-screen">
      <SEO 
        title="Merit Launchers - Launch Your Future | Mock Tests for CUET, CLAT, JEE, NEET"
        description="Practice smart with Merit Launchers. Affordable mock tests for CUET, CLAT, JEE, NEET, SSC, DSSSB, CTET, IPMAT. Get instant results, detailed analytics, and expert guidance. Free mock test for every course!"
        keywords="CUET mock test, CLAT practice series, JEE mock test 2025, NEET online test, SSC mock test, DSSSB preparation, CTET mock test, IPMAT preparation"
      />
      <Navbar />
      <Marquee />
      <main>
        <HeroSection />
        <AboutSection />
        <CoursesSection />
        <SuccessStoriesSection />
        <WhyChooseSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
