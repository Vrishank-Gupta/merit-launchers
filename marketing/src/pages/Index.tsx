import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { pageSeo } from "@/lib/seo";
import Marquee from "@/components/Marquee";
import HeroSection from "@/components/home/HeroSection";
import ExamTracksSection from "@/components/home/ExamTracksSection";
import AboutSection from "@/components/home/AboutSection";
import CoursesSection from "@/components/home/CoursesSection";
import SuccessStoriesSection from "@/components/home/SuccessStoriesSection";
import WhyChooseSection from "@/components/home/WhyChooseSection";
import ExpertsSection from "@/components/home/ExpertsSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import CTASection from "@/components/home/CTASection";

export default function Index() {
  return (
    <div className="min-h-screen">
      <SEO {...pageSeo.home} />
      <Navbar />
      <Marquee />
      <main>
        <HeroSection />
        <ExamTracksSection />
        <AboutSection />
        <CoursesSection />
        <SuccessStoriesSection />
        <WhyChooseSection />
        <ExpertsSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
