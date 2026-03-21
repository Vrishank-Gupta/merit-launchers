import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQ() {
  const appLink = "https://play.google.com/store/apps/details?id=co.robin.qibrw&hl=en";

  const faqs = [
    {
      question: "Is there really a free mock test?",
      answer: "Yes, one full mock for each course is free in the app.",
    },
    {
      question: "How do I pay and get access?",
      answer: "Pay online via UPI/cards; tests unlock instantly.",
    },
    {
      question: "Can I get a refund?",
      answer: "Only in limited cases (duplicate/technical). See policy.",
    },
    {
      question: "Will the tests change if NTA/SSC/DSSSB updates pattern?",
      answer: "Yes, we review and update regularly.",
    },
    {
      question: "Do I get solutions and ranking?",
      answer: "Yes, correct answers and all-India ranking are included.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="FAQ - Merit Launchers | Frequently Asked Questions"
        description="Find answers to common questions about Merit Launchers mock tests. Learn about free tests, payment methods, refund policy, test updates, solutions and rankings."
        keywords="merit launchers FAQ, mock test questions, test preparation help, free mock test, refund policy, test solutions"
      />
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-primary text-white py-10">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl font-bold mb-3">
                Frequently Asked Questions
              </h1>
              <p className="text-lg text-white/90">
                Quick answers to common questions
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-8 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Accordion type="single" collapsible className="w-full space-y-3">
                {faqs.map((faq, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`item-${index}`}
                    className="bg-card border border-border rounded-lg px-6 shadow-sm"
                  >
                    <AccordionTrigger className="text-left font-semibold hover:text-primary">
                      Q{index + 1}: {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pt-2 text-sm">
                      A: {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-8 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Still Have Questions?</h2>
              <p className="text-muted-foreground mb-6">
                Email: <a href="mailto:info@meritlaunchers.com" className="text-primary hover:underline font-medium">info@meritlaunchers.com</a>
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button size="default" variant="default" asChild>
                  <Link to="/contact">Contact Us</Link>
                </Button>
                <Button size="default" variant="outline" asChild>
                  <Link to="/fee-structure">View Fees</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-8 bg-gradient-primary text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Begin Your Journey</h2>
              <p className="text-lg mb-6 text-white/90">
                Download the Merit Launchers App
              </p>
              <Button size="lg" variant="secondary" asChild>
                <a href={appLink} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-5 w-5" />
                  Download App
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}