import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { pageSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Is there really a free mock test?",
    answer:
      "Yes. Merit Launchers offers one complete, full-length free mock test for every exam category on the platform — including CUET, CLAT, JEE, NEET, SSC, DSSSB, CTET Paper I, CTET Paper II, and IPMAT. You can download the app and attempt the free test without any payment. The free test includes all sections, a timed exam environment, instant results, detailed solutions, and an all-India ranking.",
  },
  {
    question: "How do I pay and get access to the full test series?",
    answer:
      "Payment is simple and secure. You can pay online using UPI, debit card, credit card, or net banking. Once your payment is confirmed, your test series unlocks instantly — no waiting period. You can access all papers in that series from the Merit Launchers app on your Android device at any time.",
  },
  {
    question: "Can I get a refund after purchasing a test series?",
    answer:
      "Refunds are considered in specific cases such as duplicate payments or verified technical failures that completely prevented access to the purchased content. We do not offer refunds for change of mind, partial usage, or changes to the exam pattern by the conducting body. Please read our full Refund & Return Policy on the website before purchasing.",
  },
  {
    question: "Will the tests be updated if NTA, SSC, or DSSSB changes the exam pattern?",
    answer:
      "Yes. Our academic team actively monitors official exam notifications from NTA, SSC, DSSSB, CLAT Consortium, and all other conducting bodies. Whenever the syllabus, pattern, or marking scheme changes, we review and update our test series accordingly. Students who have already purchased access will receive updated papers automatically in the app.",
  },
  {
    question: "Do I get solutions and all-India ranking after each test?",
    answer:
      "Yes. After submitting every test, you receive a comprehensive score report that includes your total score, section-wise performance breakdown, correct answers with detailed explanations by subject experts, time-spent analysis per question, and an all-India ranking so you can benchmark yourself against thousands of other students preparing for the same exam.",
  },
  {
    question: "Which exams does Merit Launchers cover?",
    answer:
      "Merit Launchers provides mock test series for CUET (UG), CLAT, JEE Main, NEET UG, SSC (CGL/CHSL), DSSSB, CTET Paper I, CTET Paper II, and IPMAT. We are continuously working on adding more exam categories to the platform.",
  },
  {
    question: "Is the app available on iOS or only Android?",
    answer:
      "Currently, the Merit Launchers app is available on Android via the Google Play Store. We are working on expanding to additional platforms. In the meantime, the web portal at meritlaunchers.com is accessible on any browser — including Safari on iPhone and iPad.",
  },
  {
    question: "How do I access my tests after purchase?",
    answer:
      "After completing payment, open the Merit Launchers app on your Android device and sign in with the same account used during purchase. Your purchased test series will appear in your library and you can start or resume any paper at any time. Your results, receipts, and progress are also accessible through the web portal.",
  },
  {
    question: "How is Merit Launchers different from other mock test platforms?",
    answer:
      "Merit Launchers focuses on affordability without compromising quality. We offer one free full-length test for every course so you can evaluate the quality before paying. Our tests are designed to mirror the exact pattern, difficulty level, and timing of the real exam. We provide instant results, expert-written solutions, and an all-India ranking — all in a single affordable package.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map((faq) => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer,
    },
  })),
};

export default function FAQ() {
  const appLink = "https://play.google.com/store/apps/details?id=co.robin.qibrw&hl=en";

  return (
    <div className="min-h-screen flex flex-col">
      <SEO {...pageSeo.faq} jsonLd={faqJsonLd} pageEvent={{ name: 'faq_page_view' }} />
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
                Everything you need to know about Merit Launchers mock tests
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
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pt-2 text-sm leading-relaxed">
                      {faq.answer}
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
                Email us at{" "}
                <a href="mailto:info@meritlaunchers.com" className="text-primary hover:underline font-medium">
                  info@meritlaunchers.com
                </a>{" "}
                and we'll get back to you within 24 hours.
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
              <h2 className="text-3xl font-bold mb-4">Start with a Free Mock Test</h2>
              <p className="text-lg mb-6 text-white/90">
                Download the Merit Launchers app and attempt your first full-length test at no cost.
              </p>
              <Button size="lg" variant="secondary" asChild>
                <a
                  href={appLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('play_store_click', { source: 'faq_cta' })}
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download App — It's Free
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
