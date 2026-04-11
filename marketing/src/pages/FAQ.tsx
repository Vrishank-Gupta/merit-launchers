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

const faqSections = [
  {
    title: "Getting Started & Platform Access",
    items: [
      {
        id: 1,
        question: "Why Are Students Choosing Merit Launchers for Exam Preparation?",
        answer:
          "Students today prefer structured platforms because they eliminate confusion and provide clear direction throughout the preparation journey. Instead of studying randomly, learners follow a step-by-step roadmap with regular practice and performance tracking. This clarity reduces anxiety and builds confidence over time. When students feel guided, they stay consistent and focused on their goals. Begin your preparation journey today and bring clarity to your study plan.",
      },
      {
        id: 2,
        question: "How does Merit Launchers help students prepare for competitive exams?",
        answer:
          "Preparation becomes easier with curated study plans, regular assessments, and performance insights. Students can identify weak areas and improve them systematically. As they notice steady progress, their confidence grows, and preparation becomes less stressful. This structured approach ensures that effort translates into results. Take the next step in your preparation and start learning with a clear strategy today.",
      },
      {
        id: 3,
        question: "Can an iPhone user also access Merit Launchers app?",
        answer:
          "iPhone users can access all Merit Launchers facilities by visiting the official website www.meritlaunchers.com, ensuring they don't miss out on any preparation resources. While the mobile application is currently available only for Android users, the website offers a complete and smooth experience. Additionally, the iOS version of the app is expected to launch soon, making access even more convenient for Apple users.",
      },
      {
        id: 4,
        question: "Which exams can students prepare for on Merit Launchers?",
        answer:
          "Students can prepare for CUET, CLAT, NDA, IPMAT, JEE, NEET, SSC, CTET, and DSSSB through structured resources and test series. This wide coverage allows students to focus on their goals without switching platforms. Having everything in one place brings clarity and confidence. Choose your target exam today and start preparing with the right direction.",
      },
      {
        id: 5,
        question: "Who can use the Merit Launchers platform?",
        answer:
          "The platform is designed for school students, aspirants, and drop-year candidates preparing for competitive exams. Whether someone is starting fresh or improving scores, structured guidance supports every stage. It builds discipline and keeps students motivated throughout the journey. Take control of your preparation today and move forward with confidence.",
      },
      {
        id: 6,
        question: "Can a student attempt mock test on the desktop or laptop also?",
        answer:
          "Yes, students can attempt mock tests on desktop, laptop, or mobile devices, giving them complete flexibility. This is especially helpful for long-duration exams, where comfort plays an important role in performance. A smooth testing experience allows students to focus fully without distractions. Start your preparation today and attempt your first mock test on your preferred device.",
      },
    ],
  },
  {
    title: "Mock Tests & Performance Growth",
    items: [
      {
        id: 7,
        question: "How many times can a student attempt a single mock test?",
        answer:
          "Students get access to multiple full-length mock tests that simulate real exam conditions. Repeated attempts help refine strategies, improve accuracy, and build familiarity with exam patterns. Each attempt boosts confidence and reduces fear of the unknown. Start practicing today and gain confidence with every mock test attempt.",
      },
      {
        id: 8,
        question: "How do mock tests improve exam performance and confidence?",
        answer:
          "Mock tests help students understand exam patterns, improve time management, and identify strengths and weaknesses. More importantly, they prepare students mentally for the real exam. Familiarity with the format reduces anxiety and builds confidence. Experience real exam conditions today by attempting a mock test.",
      },
      {
        id: 9,
        question: "How often should students attempt mock tests?",
        answer:
          "Students should begin with one mock test per week and increase frequency as exams approach. This gradual increase builds stamina and reduces pressure. A consistent routine ensures better preparation. Plan your testing schedule today and build a strong preparation habit.",
      },
      {
        id: 10,
        question: "What are the benefits of online mock tests?",
        answer:
          "Online mock tests provide flexibility, instant feedback, and detailed performance analysis. They allow students to practice anytime and track progress easily. This data-driven approach helps students improve smarter, not just harder. Start your preparation today and experience the advantages of modern learning.",
      },
      {
        id: 11,
        question: "How can students analyze their test performance?",
        answer:
          "Students should review accuracy, time taken, and mistakes after each test. Understanding errors helps avoid repetition and improves strategy. This builds confidence over time. Analyze your last test today and turn your mistakes into strengths.",
      },
      {
        id: 12,
        question: "How can students track their preparation progress?",
        answer:
          "Students can track their progress by analyzing scores, accuracy rates, and time management across multiple tests. Performance dashboards provide a clear picture of improvement over time. This helps students understand where they stand, set realistic goals, and stay motivated throughout their preparation journey. Start your preparation today and monitor your progress step by step.",
      },
      {
        id: 13,
        question: "What should students do after completing a mock test?",
        answer:
          "Students should analyze mistakes, revise weak topics, and improve strategies. This is where real learning happens. Each test becomes a step toward improvement. Review your latest test today and improve your next performance.",
      },
      {
        id: 14,
        question: "How can performance analysis help improve scores?",
        answer:
          "Performance analysis helps identify mistakes and refine strategies. This targeted improvement leads to better scores and stronger confidence. Use your performance insights today to improve your next score.",
      },
      {
        id: 15,
        question: "Are online mock tests better than traditional practice tests?",
        answer:
          "Online tests offer instant feedback, analytics, and real exam simulation. This makes preparation more effective and engaging compared to traditional methods. Start your preparation today and upgrade your learning experience.",
      },
      {
        id: 16,
        question: "How can students improve weak areas using mock tests?",
        answer:
          "Students can identify weak areas through test analysis and focus on improving them with targeted practice. This builds confidence and reduces fear of difficult topics. Work on your weak areas today and turn them into strengths.",
      },
      {
        id: 17,
        question: "How can regular mock tests improve overall exam performance?",
        answer:
          "Regular practice reinforces concepts, improves problem-solving skills, and builds confidence. It helps students develop a consistent study routine and reduces last-minute stress. Over time, continuous effort leads to better understanding and higher performance in exams.",
      },
    ],
  },
  {
    title: "CUET Preparation",
    items: [
      {
        id: 18,
        question: "Who conducts the CUET exam?",
        answer:
          "The CUET exam is conducted by the National Testing Agency (NTA), ensuring a fair and standardized admission process for students across India. Knowing the exam authority helps students stay updated with accurate information and avoid confusion. This clarity builds confidence and direction in preparation. Stay informed today and align your preparation with official CUET guidelines.",
      },
      {
        id: 19,
        question: "Who is eligible to appear for the CUET exam?",
        answer:
          "Students who have completed or are appearing for their Class 12 examinations from a recognized board are eligible for CUET, depending on course requirements. Understanding eligibility early reduces stress and helps students plan better. This clarity allows them to focus fully on preparation. Check your eligibility today and start preparing with confidence and clarity.",
      },
      {
        id: 20,
        question: "What subjects are included in the CUET exam?",
        answer:
          "CUET includes language tests, domain-specific subjects, and a general test. Students can choose subjects based on their desired course and university requirements. This flexibility allows them to align preparation with their goals. Knowing the structure in advance builds confidence. Plan your subjects today and create a focused CUET preparation strategy.",
      },
      {
        id: 21,
        question: "How should students prepare for CUET effectively?",
        answer:
          "Effective preparation requires concept clarity, regular revision, and consistent practice. Students should follow a disciplined routine and track their progress. When preparation is structured, students feel more confident and less stressed. Small improvements lead to big results. Build your CUET strategy today and start preparing with a clear, focused approach.",
      },
      {
        id: 22,
        question: "Are mock tests useful for CUET preparation?",
        answer:
          "Yes, mock tests are extremely helpful as they familiarize students with the exam pattern and improve time management. They also help identify weak areas and build confidence. Regular testing reduces fear and boosts performance. Attempt a CUET mock test today and experience real exam readiness.",
      },
      {
        id: 23,
        question: "How many mock tests should students attempt before CUET?",
        answer:
          "Students should aim to attempt multiple full-length mock tests to gain proper exam exposure. Practicing regularly helps refine strategies and improve accuracy. Each test builds confidence and reduces exam fear. Start completing your CUET mock tests today and strengthen your preparation step by step.",
      },
      {
        id: 24,
        question: "How can students improve their CUET score?",
        answer:
          "Improving scores requires consistent practice, regular revision, and analyzing mistakes. Students who learn from errors and avoid repeating them see steady improvement. This builds confidence and motivation. Focus on improving your weak areas today and move closer to your target CUET score.",
      },
      {
        id: 25,
        question: "What are the common mistakes students make during CUET preparation?",
        answer:
          "Common mistakes include ignoring revision, avoiding mock tests, and poor time management. These can affect performance significantly. A balanced approach helps avoid these issues and improves results. Identify your mistakes today and correct them to strengthen your CUET preparation.",
      },
      {
        id: 26,
        question: "How can students improve speed and accuracy for CUET?",
        answer:
          "Speed and accuracy improve through regular timed practice and consistent mock testing. Solving questions under exam conditions trains the mind to respond quickly and correctly. This builds confidence and reduces errors. Practice timed questions today and sharpen your CUET performance skills.",
      },
    ],
  },
  {
    title: "IPMAT Preparation",
    items: [
      {
        id: 27,
        question: "What is the IPMAT exam?",
        answer:
          "IPMAT is an entrance exam for integrated management programs at prestigious institutes like IIM Indore and IIM Rohtak. It tests aptitude, reasoning, and verbal skills. Early preparation gives students an advantage. Understand the IPMAT exam today and take your first step towards a career in management.",
      },
      {
        id: 28,
        question: "Which institutes conduct the IPMAT exam?",
        answer:
          "The IPMAT exam is conducted by IIM Indore and IIM Rohtak, each with its own pattern and selection process. Understanding these differences helps students prepare effectively. This clarity builds confidence and direction. Explore IPMAT patterns today and align your preparation with your target institute.",
      },
      {
        id: 29,
        question: "Who is eligible for the IPMAT exam?",
        answer:
          "Students who have completed or are appearing for Class 12 can apply, provided they meet age and academic criteria. Checking eligibility early removes uncertainty and helps in better planning. Confirm your eligibility today and start your IPMAT preparation journey with confidence.",
      },
      {
        id: 30,
        question: "What subjects are included in the IPMAT exam?",
        answer:
          "The IPMAT exam includes Quantitative Ability, Verbal Ability, and Logical Reasoning. These sections test problem-solving, language, and analytical skills. Balanced preparation is essential. Start covering all sections today and build a strong foundation for IPMAT success.",
      },
      {
        id: 31,
        question: "How should students prepare for IPMAT effectively?",
        answer:
          "Students should focus on concept clarity, regular practice, and consistent testing. A disciplined routine ensures steady improvement. When students see progress, their confidence grows naturally. Create your IPMAT study plan today and stay consistent in your preparation.",
      },
      {
        id: 32,
        question: "Are mock tests important for IPMAT preparation?",
        answer:
          "Yes, mock tests are crucial as they help students understand the exam pattern, improve speed, and develop effective strategies. Regular testing also builds confidence and reduces exam anxiety, ensuring better performance on the actual exam day.",
      },
      {
        id: 33,
        question: "How can students improve aptitude for IPMAT?",
        answer:
          "Improving aptitude requires solving a variety of questions and strengthening fundamentals. Regular practice enhances analytical thinking and problem-solving ability. Work on your aptitude skills today and build confidence for IPMAT success.",
      },
      {
        id: 34,
        question: "What are the most challenging sections in IPMAT?",
        answer:
          "Quantitative Ability is often considered challenging due to its complexity and time pressure. However, consistent practice makes it manageable. Confidence comes with preparation. Start practicing Quantitative Ability today and turn your fear into strength.",
      },
      {
        id: 35,
        question: "How can students manage time during the IPMAT exam?",
        answer:
          "Time management improves through practice and smart question selection. Students should learn to prioritize easier questions and maintain a steady pace. Practice timed tests today and improve your time management skills for IPMAT.",
      },
      {
        id: 36,
        question: "What is the best strategy to crack the IPMAT exam?",
        answer:
          "The best strategy includes strong fundamentals, regular testing, and performance analysis. Students should focus on improving weak areas while maintaining strengths. Follow a balanced strategy today and move closer to cracking IPMAT confidently.",
      },
    ],
  },
  {
    title: "NDA Preparation",
    items: [
      {
        id: 37,
        question: "What is the NDA exam?",
        answer:
          "The NDA exam is a national-level test for entry into the Indian Armed Forces. It requires discipline, dedication, and strong fundamentals. This career path demands commitment and passion. Begin your NDA preparation today and take your first step towards serving the nation.",
      },
      {
        id: 38,
        question: "Who conducts the NDA exam?",
        answer:
          "The NDA exam is conducted by the Union Public Service Commission (UPSC) twice a year. It ensures a fair and transparent selection process. Knowing this helps students stay informed and focused. Stay updated today and prepare confidently for the NDA exam.",
      },
      {
        id: 39,
        question: "What is the eligibility criteria for the NDA exam?",
        answer:
          "Candidates must meet age, education, and physical fitness requirements to apply. Understanding eligibility early helps avoid confusion and ensures better preparation planning. Check your NDA eligibility today and start preparing with clarity.",
      },
      {
        id: 40,
        question: "What subjects are included in the NDA exam?",
        answer:
          "The NDA exam includes Mathematics and the General Ability Test, covering English, science, and current affairs. Balanced preparation is essential for success. Start covering both sections today and build a strong NDA preparation base.",
      },
      {
        id: 41,
        question: "How should students prepare for NDA effectively?",
        answer:
          "Preparation requires discipline, consistency, and concept clarity. Regular practice and testing help improve performance. A focused mindset is key to success. Build your NDA routine today and stay consistent in your preparation.",
      },
      {
        id: 42,
        question: "Are mock tests useful for NDA preparation?",
        answer:
          "Yes, mock tests improve speed, accuracy, and confidence. They simulate real exam conditions and help refine strategies. Attempt an NDA mock test today and evaluate your readiness.",
      },
      {
        id: 43,
        question: "How can students improve their problem-solving speed for NDA?",
        answer:
          "Regular timed practice helps improve speed and efficiency. Solving diverse questions enhances familiarity and confidence. Practice speed-based questions today and boost your problem-solving ability.",
      },
      {
        id: 44,
        question: "What are the common mistakes students make while preparing for NDA?",
        answer:
          "Ignoring revision, avoiding practice, and poor time management are common mistakes. Avoiding these ensures better preparation and results. Identify and correct your mistakes today to strengthen your NDA preparation.",
      },
      {
        id: 45,
        question: "How can students manage time during the NDA exam?",
        answer:
          "Time management improves through consistent practice and smart strategies. Prioritizing questions helps maintain pace. Practice time management today and perform efficiently in the NDA exam.",
      },
      {
        id: 46,
        question: "What is the best strategy to clear the NDA written exam?",
        answer:
          "Strong basics, regular practice, and detailed analysis are key to success. A disciplined approach ensures steady improvement. Follow a focused strategy today and move closer to clearing NDA.",
      },
    ],
  },
  {
    title: "For Parents",
    items: [
      {
        id: 47,
        question: "How can parents support their child's preparation?",
        answer:
          "Parents can support their child by creating a positive environment, encouraging consistency, and reducing pressure. Emotional support plays a crucial role in building confidence. When students feel supported, they perform better. Encourage your child today and be a strong pillar in their success journey.",
      },
      {
        id: 48,
        question: "How can parents track their child's progress?",
        answer:
          "Parents can track progress through performance reports, accuracy scores, and analytics. This helps them understand strengths and weaknesses. Active involvement builds trust and motivation. Stay involved today and monitor your child's preparation effectively.",
      },
    ],
  },
  {
    title: "Differentiation & Outcome Focus",
    items: [
      {
        id: 49,
        question: "What makes this platform different?",
        answer:
          "The platform focuses on structured learning, performance tracking, and real outcomes. Students not only study but also improve continuously. This result-oriented approach builds confidence and clarity. Experience a better way of preparation today and see real progress in your performance.",
      },
      {
        id: 50,
        question: "What is the best way to achieve high scores?",
        answer:
          "Consistency, smart practice, and regular analysis are the keys to high scores. Students who follow a structured approach and learn from mistakes perform better. Commit to your preparation today and aim for the top score you deserve.",
      },
    ],
  },
  {
    title: "Associate Partner FAQs",
    items: [
      {
        id: 51,
        question: "How can institutes partner with Merit Launchers?",
        answer:
          "Institutes can partner by integrating structured mock tests and performance analytics into their existing teaching system. This allows them to provide students with a complete preparation journey - from learning concepts to testing and improving performance. Such partnerships help institutes enhance their results, build credibility, and offer measurable outcomes to students. When institutes combine teaching with data-driven practice, student success becomes more consistent and visible.",
      },
      {
        id: 52,
        question: "Can coaching institutes use these mock tests?",
        answer:
          "Yes, coaching institutes can use these mock tests to strengthen their students' preparation and track performance more effectively. Mock tests help bridge the gap between teaching and actual exam performance by providing real exam simulation and detailed analysis. This ensures that students not only learn concepts but also know how to apply them under pressure. Institutes that include structured testing often see improved results and higher student confidence.",
      },
      {
        id: 53,
        question: "How can associates earn through the platform?",
        answer:
          "Associates can earn by connecting students or institutes to a structured preparation system that delivers real value. As students achieve better results and improved confidence, it naturally builds trust and long-term engagement. This creates a sustainable earning opportunity based on performance-driven outcomes rather than one-time efforts. For individuals looking to grow in the education space, this can become a meaningful and rewarding journey.",
      },
    ],
  },
] as const;

const faqs = faqSections.flatMap((section) => section.items);

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export default function FAQ() {
  const appLink = "https://www.meritlaunchers.com/portal/";

  return (
    <div className="min-h-screen flex flex-col bg-[linear-gradient(180deg,#f7fbff_0%,#eef6ff_45%,#ffffff_100%)]">
      <SEO {...pageSeo.faq} jsonLd={faqJsonLd} pageEvent={{ name: "faq_page_view" }} />
      <Navbar />

      <main className="flex-grow">
        <section className="border-b border-sky-100 bg-[radial-gradient(circle_at_top_left,_rgba(45,187,233,0.14),transparent_38%),linear-gradient(180deg,#ffffff_0%,#f3f8ff_100%)] py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl">
              <div className="inline-flex rounded-full border border-sky-200 bg-white/90 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-sky-600 shadow-sm">
                FAQs
              </div>
              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
                {pageSeo.faq.h1}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
                Find clear answers about mock tests, exam preparation, course access, app usage, and partner support across Merit Launchers.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {faqSections.map((section) => (
                  <a
                    key={section.title}
                    href={`#${slugify(section.title)}`}
                    className="rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
                  >
                    {section.title}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-10 md:py-14">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl space-y-6">
              {faqSections.map((section) => (
                <section
                  key={section.title}
                  id={slugify(section.title)}
                  className="overflow-hidden rounded-[28px] border border-sky-100 bg-white shadow-[0_20px_60px_rgba(15,44,84,0.08)]"
                >
                  <div className="border-b border-sky-100 bg-[linear-gradient(135deg,#eff8ff_0%,#f9fcff_65%,#ffffff_100%)] px-5 py-5 md:px-8">
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">
                          FAQ Section
                        </p>
                        <h2 className="mt-2 text-2xl font-black text-slate-900 md:text-3xl">
                          {section.title}
                        </h2>
                      </div>
                      <div className="inline-flex w-fit rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-slate-700">
                        {section.items.length} questions
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-4 md:px-6 md:py-6">
                    <Accordion type="single" collapsible className="space-y-3">
                      {section.items.map((faq) => (
                        <AccordionItem
                          key={faq.id}
                          value={`item-${faq.id}`}
                          className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 shadow-sm md:px-6"
                        >
                          <AccordionTrigger className="gap-4 py-5 text-left text-base font-semibold leading-6 text-slate-900 hover:text-sky-700">
                            <span className="flex items-start gap-3">
                              <span className="mt-0.5 inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-sky-100 px-2 text-xs font-bold text-sky-700">
                                {faq.id}
                              </span>
                              <span>{faq.question}</span>
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="pb-5 pl-10 pr-1 text-sm leading-7 text-slate-600 md:text-[15px]">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </section>
              ))}
            </div>
          </div>
        </section>

        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl rounded-[28px] border border-slate-200 bg-white px-6 py-10 text-center shadow-[0_20px_50px_rgba(15,44,84,0.07)]">
              <h2 className="text-3xl font-black text-slate-900">Still have questions?</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Email us at{" "}
                <a href="mailto:info@meritlaunchers.com" className="font-semibold text-sky-700 hover:underline">
                  info@meritlaunchers.com
                </a>{" "}
                and our team will help you out.
              </p>
              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button size="default" asChild>
                  <Link to="/contact">Contact Us</Link>
                </Button>
                <Button size="default" variant="outline" asChild>
                  <Link to="/fee-structure">View Fees</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gradient-primary py-10 text-white">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-black">Start with a free mock test</h2>
              <p className="mt-4 text-lg text-white/90">
                Download the Merit Launchers app and begin your preparation with a guided test experience.
              </p>
              <Button size="lg" variant="secondary" asChild className="mt-6">
                <a
                  href={appLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent("play_store_click", { source: "faq_cta" })}
                >
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
