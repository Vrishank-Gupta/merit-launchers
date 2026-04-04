import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  GraduationCap,
  Code,
  HeadphonesIcon,
  Mail,
  CheckCircle2,
  Target,
  Lightbulb,
  Heart,
  Quote,
  BookOpen,
  Users,
  Building2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { pageSeo } from "@/lib/seo";
import diwakerPhoto from "@/assets/team-diwaker.png";
import arvindPhoto from "@/assets/team-arvind.jpg";

// ─── Arvind Kumar – Key Attributes ──────────────────────────────────────────
const arvindAttributes = [
  {
    title: "Strategic Education Leader",
    body: "with 36+ years of progressive experience across teaching, leadership, and policy implementation",
  },
  {
    title: "Two-Time UPSC Qualifier",
    body: "reflecting exceptional academic rigor and competitive excellence",
  },
  {
    title: "Expert in Educational Governance",
    body: "including Delhi School Education Act, RTE Act, CCS/CCA Rules, and service regulations",
  },
  {
    title: "Proven Administrative Head",
    body: "having led multiple districts and large-scale education systems effectively",
  },
  {
    title: "Specialist in Vigilance & Disciplinary Proceedings",
    body: "handling complex inquiries, complaints, and legal cases with high success rates",
  },
  {
    title: "Strong Legal & Compliance Acumen",
    body: "with extensive experience in court matters, tribunals, and regulatory frameworks",
  },
  {
    title: "Curriculum & Academic Excellence Champion",
    body: "contributing to improved CBSE results and institutional performance",
  },
  {
    title: "Global Exposure",
    body: "with leadership training at the University of Cambridge and accreditation expertise via Quality Council of India",
  },
  {
    title: "Versatile Educator & Mentor",
    body: "with experience across Kendriya Vidyalaya Sangathan and reputed residential schools",
  },
  {
    title: "Trusted Advisor Post-Retirement",
    body: "supporting recruitment, policy guidance, and institutional decision-making",
  },
];

// ─── Arvind Kumar – Mission Bullets ─────────────────────────────────────────
const arvindMission = [
  <>To bridge the gap between <strong>talent and opportunity</strong></>,
  <>To make <strong>high-quality preparation accessible and affordable</strong></>,
  <>To empower students with the <strong>right practice, assessment, and improvement tools</strong></>,
  <>To ensure that <strong>no dream is denied due to financial limitations</strong></>,
];

// ─── Diwaker – Key Attributes ────────────────────────────────────────────────
const diwakerAttributes = [
  {
    title: "Transformational L&D Leader",
    body: "Over 30+ years of experience in designing and delivering high-impact learning interventions focused on capability building and productivity enhancement",
  },
  {
    title: "Architect of End-to-End Learning Ecosystems",
    body: "Expertise in Training Needs Assessment, content design, group coaching, and execution—creating holistic and outcome-driven learning journeys",
  },
  {
    title: "Creator of 150+ Signature Programs",
    body: "Conceptualized and delivered programs on Leadership Development, Customer Centricity, Train the Trainer, and Positive Relationship frameworks across industries",
  },
  {
    title: "Coach to 2700+ Professionals",
    body: "Empowered over 1800 trainers and 900 business leaders in the last five years, driving measurable transformation in skills, mindset, and performance",
  },
  {
    title: "Visionary Community Builder & Strategist",
    body: "Founder of Deal Training Solutions and Digital Gurukul, and a key force behind The Trainers Camp—a thriving learning community impacting over 13,000 professionals nationwide",
  },
];

// ─── MERIT Exam Compass ──────────────────────────────────────────────────────
const meritCompassBenefits = ["Improves accuracy", "Enhances confidence", "Sharpens strategy"];
const meritThreePillars = [
  { title: "Cognitive Mastery", sub: "Knowledge & Concepts" },
  { title: "Behavioral Discipline", sub: "Habits & Consistency" },
  { title: "Emotional Resilience", sub: "Mindset & Pressure Handling" },
];

// ─── Message audiences ───────────────────────────────────────────────────────
const studentPoints = [
  "Measure where you stand with honesty and clarity",
  "Explore the smartest strategies tailored to your strengths",
  "Rework your mistakes into powerful learning opportunities",
  "Implement with discipline, consistency, and focus",
  "Transform into a confident, exam-ready performer",
];
const parentPoints = [
  "Encourage effort over pressure",
  "Support disciplined routines",
  "Trust the process rather than chasing shortcuts",
];
const institutionPoints = [
  "Improved student outcomes and success ratios",
  "Stronger institutional credibility and brand trust",
  "A differentiated positioning as a results-driven learning partner",
];
const institutionEmbed = [
  "Cognitive Mastery (conceptual clarity)",
  "Behavioral Discipline (consistent habits)",
  "Emotional Resilience (exam temperament)",
];
const khassItems = [
  { letter: "K", word: "Knowledge" },
  { letter: "H", word: "Habit" },
  { letter: "A", word: "Attitude" },
  { letter: "S", word: "Skill" },
  { letter: "S", word: "Strategy" },
];
const khassStrategyPoints = [
  <>Decide <strong>what to study, what to skip, and when to revise</strong></>,
  <>Focus on <strong>high-impact areas instead of scattered efforts</strong></>,
  <>Convert mistakes into <strong>learning and improvement cycles</strong></>,
  "Manage time, pressure, and performance during exams",
];

// ─── Team sections (bottom of page) ─────────────────────────────────────────
const teamSections = [
  {
    icon: GraduationCap,
    title: "Academic Team",
    description:
      "Our academic experts and paper-setters are highly qualified professionals — including IIT, IIM, NLU, and DU alumni — who specialize in creating accurate, syllabus-aligned, and up-to-date mock tests.",
    quote: "We don't just test knowledge — we build exam temperament.",
    features: [
      "Every mock test matches the latest official pattern",
      "Question difficulty and weightage are balanced to reflect real exam conditions",
      "Solutions are clear, conceptual, and easy to understand",
      "Regular updates are made based on NTA, CBSE, SSC, and DSSSB notifications",
    ],
  },
  {
    icon: Code,
    title: "Technical & Design Team",
    description:
      "Our tech innovators work tirelessly to ensure that the Merit Launchers App runs smoothly, securely, and efficiently. They constantly enhance features such as instant scoring, analytics dashboards, ranking systems, and result reports — giving students a seamless digital experience.",
    quote: "Technology is our tool, but student success is our goal.",
    features: [],
  },
  {
    icon: HeadphonesIcon,
    title: "Student Support Team",
    description:
      "Our friendly support team ensures every student gets the help they need — whether it's about payment, login, test access, or results. We respond quickly, because we know how important every practice test is in your preparation journey.",
    quote: "",
    features: [],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function SectionDivider() {
  return <div className="my-10 h-px w-full bg-border" />;
}

function AttributeList({ items }: { items: { title: string; body: string }[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-muted-foreground leading-relaxed">
            <strong className="text-foreground">{item.title}</strong>
            {item.body ? ` ${item.body}` : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}

function BulletList({ items }: { items: (React.ReactNode)[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <ChevronRight className="h-4 w-4 text-primary flex-shrink-0 mt-1" />
          <p className="text-muted-foreground leading-relaxed">{item}</p>
        </li>
      ))}
    </ul>
  );
}

function BlockQuote({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-primary/5 border-l-4 border-primary rounded-r-xl p-5 my-4">
      <p className="text-base italic text-foreground font-medium leading-relaxed">{children}</p>
    </div>
  );
}

function SignatureBlock({
  name,
  role,
  sub,
}: {
  name: string;
  role: string;
  sub?: string;
}) {
  return (
    <div className="mt-6 pt-6 border-t border-border">
      <p className="font-bold text-foreground text-lg">— {name}</p>
      <p className="text-muted-foreground text-sm">{role}</p>
      {sub && <p className="text-muted-foreground text-sm">{sub}</p>}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function OurTeam() {
  return (
    <div className="min-h-screen">
      <SEO {...pageSeo.ourTeam} />
      <Navbar />

      <main>
        {/* ── Hero ── */}
        <section className="relative bg-gradient-hero py-14 overflow-hidden">
          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="secondary" className="mb-4">Leadership</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{pageSeo.ourTeam.h1}</h1>
              <p className="text-lg text-muted-foreground">
                Meet the minds and mission behind Merit Launchers
              </p>
            </div>
          </div>
        </section>

        {/* ── Quick intro cards ── */}
        <section className="py-10 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-6">
              {/* Arvind */}
              <Card className="shadow-card hover:shadow-premium transition-all duration-300 border-primary/15">
                <CardContent className="p-7">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-muted shrink-0">
                      <img
                        src={arvindPhoto}
                        alt="Mr. Arvind Kumar"
                        className="w-full h-full object-cover object-top"
                        loading="lazy"
                      />
                    </div>
                    <div>
                      <p className="text-lg font-semibold">Mr. Arvind Kumar</p>
                      <p className="text-sm text-muted-foreground">Founder, Merit Launchers</p>
                    </div>
                  </div>
                  <blockquote className="mt-4 text-muted-foreground leading-relaxed text-sm border-l-2 border-primary/40 pl-3 italic">
                    "Talent is everywhere, but opportunity is not."
                  </blockquote>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    Former Regional Director of Education (GNCT of Delhi) · 36+ years in education · Two-time UPSC qualifier
                  </p>
                  <div className="mt-5 flex justify-end">
                    <Button asChild variant="outline" size="sm">
                      <a href="#arvind-profile">Read full profile</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Diwaker */}
              <Card className="shadow-card hover:shadow-premium transition-all duration-300 border-primary/15">
                <CardContent className="p-7">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-muted shrink-0">
                      <img
                        src={diwakerPhoto}
                        alt="Mr. Diwaker Saraswati Chandra"
                        className="w-full h-full object-cover object-top"
                        loading="lazy"
                      />
                    </div>
                    <div>
                      <p className="text-lg font-semibold">Mr. Diwaker Saraswati Chandra</p>
                      <p className="text-sm text-muted-foreground">Director – Capability Development & Marketing Strategy</p>
                    </div>
                  </div>
                  <blockquote className="mt-4 text-muted-foreground leading-relaxed text-sm border-l-2 border-primary/40 pl-3 italic">
                    "KASH builds your foundation, but KHASS builds your success."
                  </blockquote>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    30+ years in L&D · Author of Amazon bestseller <em>The Trainer's Blueprint</em> · Coach to 2700+ professionals
                  </p>
                  <div className="mt-5 flex justify-end">
                    <Button asChild size="sm">
                      <a href="#diwaker-profile">Read full profile</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            MR. ARVIND KUMAR – FULL PROFILE
        ════════════════════════════════════════════════════════════════════ */}
        <section id="arvind-profile" className="py-12 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">

              {/* Profile header */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold">Mr. Arvind Kumar</h2>
                  <p className="text-primary font-semibold">Founder, Merit Launchers</p>
                </div>
              </div>

              <Card className="shadow-card border-primary/15">
                <CardContent className="p-8 space-y-5">

                  <p className="text-muted-foreground leading-relaxed">
                    Mr. Arvind Kumar is a distinguished education leader and former Regional Director of Education with the
                    Directorate of Education, GNCT of Delhi, bringing over 36 years of extensive experience across teaching,
                    school leadership, and educational governance. Renowned for his administrative acumen, policy expertise,
                    and commitment to excellence, he has consistently contributed to strengthening institutional frameworks,
                    improving academic outcomes, and ensuring regulatory compliance across multiple districts in Delhi.
                  </p>

                  <p className="text-muted-foreground leading-relaxed">
                    A consistent first-division achiever and a rare two-time UPSC qualifier (for the roles of Principal and
                    Deputy Director of Education), Mr. Kumar has demonstrated exceptional perseverance and competence
                    throughout his career. From shaping young minds as a Physics educator to leading large administrative
                    units as Regional Director, his journey reflects a seamless blend of academic depth and strategic
                    leadership.
                  </p>

                  <p className="text-muted-foreground leading-relaxed">
                    His core strengths lie in navigating complex educational systems, handling sensitive administrative and
                    legal matters, and driving performance through structured governance. Even post-retirement, he continues
                    to actively contribute as an advisor, inquiry officer, and expert in educational administration.
                  </p>

                  <SectionDivider />

                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Key Attributes & Strengths</h3>
                    <AttributeList items={arvindAttributes} />
                  </div>

                  <SectionDivider />

                  <p className="text-muted-foreground leading-relaxed">
                    With a rare combination of administrative depth, academic excellence, and ethical leadership, Mr. Arvind
                    Kumar continues to be a valuable force in shaping and guiding the education ecosystem.
                  </p>

                  <div className="flex justify-center mt-2">
                    <div className="w-52 rounded-2xl overflow-hidden shadow-md">
                      <img
                        src={arvindPhoto}
                        alt="Mr. Arvind Kumar"
                        className="w-full h-full object-cover object-top"
                        loading="lazy"
                      />
                    </div>
                  </div>

                </CardContent>
              </Card>

              {/* ── Founder's Message ── */}
              <div className="mt-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <Quote className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Message from the Desk</p>
                    <h3 className="text-xl font-bold">Mr. Arvind Kumar · Founder, Merit Launchers</h3>
                  </div>
                </div>

                <Card className="shadow-card border-amber-200/60">
                  <CardContent className="p-8 space-y-5">

                    <div>
                      <h4 className="text-xl md:text-2xl font-bold text-foreground mb-5">
                        Founder's Story – From a Remote Village to a Mission for Millions
                      </h4>

                      <p className="text-muted-foreground leading-relaxed">I was not born into privilege.</p>
                      <p className="text-muted-foreground leading-relaxed mt-3">
                        I come from a small, remote village in Saharanpur, Uttar Pradesh—a place where, during my childhood,
                        there were no proper roads, no access to quality schools, no coaching institutes, and no exposure to
                        competitive opportunities. Education was not a clear pathway; it was a daily struggle.
                      </p>
                      <p className="text-muted-foreground leading-relaxed mt-3">But what I witnessed growing up shaped my life forever.</p>
                    </div>

                    <BlockQuote>
                      It was not a lack of talent.<br />
                      It was a lack of opportunity.
                    </BlockQuote>

                    <p className="text-muted-foreground leading-relaxed">
                      I saw bright, hardworking children—full of dreams and potential—forced to give up on their aspirations.
                      Many who could have become doctors, engineers, or civil servants are today pulling rickshaws, working as
                      daily wage earners, or still confined to the same circumstances they were born into.
                    </p>

                    <p className="text-muted-foreground leading-relaxed">
                      Not because they lacked ability…<br />
                      But because they never got a fair chance.
                    </p>

                    <p className="text-muted-foreground leading-relaxed">That reality stayed with me.</p>

                    <p className="text-muted-foreground leading-relaxed">
                      With determination, discipline, and the right guidance at crucial moments, I carved my own path in
                      education. Over the next 36 years, I served in the education system, qualified UPSC twice, and eventually
                      retired as Regional Director of Education, Government of NCT of Delhi.
                    </p>

                    <p className="text-muted-foreground leading-relaxed">
                      Yet, even after reaching a position of influence, one question never left my mind:
                    </p>

                    <BlockQuote>"What about the millions of students who are still where I once was?"</BlockQuote>

                    <p className="text-muted-foreground leading-relaxed">
                      The truth is harsh but real—quality coaching and competitive exam preparation in India has become
                      expensive and inaccessible for a large section of society. Countless talented students are left
                      behind—not because they are less capable, but because they lack the right guidance, exposure, and
                      consistent practice.
                    </p>

                    <p className="text-muted-foreground leading-relaxed font-medium">That is why I founded Merit Launchers.</p>

                    <p className="text-muted-foreground leading-relaxed">
                      Merit Launchers is not just a platform—it is a purpose-driven mission.
                    </p>

                    <BulletList items={arvindMission} />

                    <p className="text-muted-foreground leading-relaxed mt-2">
                      Whether a student is preparing for CUET, CLAT, SSC, CTET, or other competitive exams, our focus is
                      simple—build confidence through consistent practice and help them compete with the best.
                    </p>

                    <p className="text-muted-foreground leading-relaxed">I firmly believe:</p>

                    <BlockQuote>"Talent is everywhere, but opportunity is not."</BlockQuote>

                    <p className="text-muted-foreground leading-relaxed">
                      Through Merit Launchers, I am committed to changing this reality.
                    </p>

                    <p className="text-muted-foreground leading-relaxed">
                      Because if even one student from a small village, just like mine, can rise, compete, and succeed—
                      then this journey will truly be meaningful.
                    </p>

                    <SignatureBlock
                      name="Arvind Kumar"
                      role="Founder, Merit Launchers"
                      sub="Former Regional Director of Education (GNCT of Delhi)"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            MR. DIWAKER SARASWATI CHANDRA – FULL PROFILE
        ════════════════════════════════════════════════════════════════════ */}
        <section id="diwaker-profile" className="py-12 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">

              {/* Profile header */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold">Mr. Diwaker Saraswati Chandra</h2>
                  <p className="text-primary font-semibold">Director – Capability Development & Marketing Strategy</p>
                </div>
              </div>

              <Card className="shadow-card border-primary/15">
                <CardContent className="p-8">

                  {/* Photo + bio side-by-side on large screens */}
                  <div className="flex flex-col md:flex-row gap-7 mb-6">
                    <div className="w-full md:w-48 shrink-0">
                      <div className="w-full aspect-square md:aspect-auto md:h-56 rounded-2xl overflow-hidden bg-muted shadow-md">
                        <img
                          src={diwakerPhoto}
                          alt="Mr. Diwaker Saraswati Chandra"
                          className="w-full h-full object-cover object-top"
                          loading="lazy"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <p className="text-muted-foreground leading-relaxed">
                        Mr. Diwaker Saraswati Chandra is a seasoned Transformational Capability Development Coach and
                        strategic leader with over three decades of rich experience in Learning & Development (L&D). As the
                        Director – Capability Development & Marketing Strategy at Merit Launchers, he brings a unique blend
                        of behavioural science, strategic thinking, and market insight to design impactful learning
                        ecosystems that empower students, educators, and institutions alike.
                      </p>
                      <p className="text-muted-foreground leading-relaxed">
                        With a deep-rooted belief that{" "}
                        <em>"Knowing is nothing until the ability of doing it is within,"</em> Mr. Chandra has consistently
                        focused on bridging the gap between knowledge and execution. His approach goes beyond traditional
                        training—he emphasizes real transformation by enabling individuals to build practical skills,
                        confidence, and performance-oriented mindsets.
                      </p>
                    </div>
                  </div>

                  <p className="text-muted-foreground leading-relaxed">
                    Over the years, he has played a pivotal role in designing and delivering high-impact capability-building
                    initiatives that have enhanced productivity and driven behavioural transformation across trainers,
                    business leaders, and learning communities. His expertise lies in creating end-to-end learning
                    journeys—from Training Needs Assessment to execution, reinforcement, and measurable outcomes—ensuring
                    that learning is not just delivered but truly absorbed and applied.
                  </p>

                  <p className="text-muted-foreground leading-relaxed mt-4">
                    An accomplished author of the Amazon bestselling book <em>The Trainer's Blueprint</em>, Mr. Chandra is
                    widely recognized for his ability to simplify complex concepts into actionable frameworks. His learning
                    philosophy—<em>SARAL (Simple), SPASHT (Clear), and SATIK (Precise)</em>—has made his programs highly
                    relatable, practical, and impactful across diverse audiences.
                  </p>

                  <p className="text-muted-foreground leading-relaxed mt-4">
                    At Merit Launchers, he is instrumental in shaping capability development strategies and aligning them
                    with market needs, ensuring that students preparing for competitive exams receive not just content, but
                    the right direction, discipline, and practice framework to succeed.
                  </p>

                  <SectionDivider />

                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Key Attributes & Achievements</h3>
                    <AttributeList items={diwakerAttributes} />
                  </div>

                  <SectionDivider />

                  <p className="text-muted-foreground leading-relaxed">
                    A multilingual facilitator with a natural and engaging delivery style, Mr. Chandra connects effortlessly
                    with diverse audiences, making learning both meaningful and actionable. His ability to blend strategy with
                    human connection makes him a driving force behind Merit Launchers' mission—to democratize quality
                    learning and unlock the true potential of every learner.
                  </p>

                </CardContent>
              </Card>

              {/* ── Diwaker's Messages ── */}
              <div className="mt-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                    <Quote className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Message from the Desk</p>
                    <h3 className="text-xl font-bold">Mr. Diwaker Saraswati Chandra</h3>
                  </div>
                </div>

                {/* Opening message */}
                <Card className="shadow-card border-blue-200/60 mb-6">
                  <CardContent className="p-8 space-y-4">
                    <p className="text-muted-foreground leading-relaxed">
                      At Merit Launchers, we believe that success in competitive exams is not a matter of chance—it is a
                      result of clarity, strategy, discipline, and transformation.
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      Through years of working with learners, educators, and institutions, one truth has become evident
                      within me:
                    </p>
                    <BlockQuote>
                      Hard work alone is not enough. What truly matters is structured, intelligent, and consistent effort.
                    </BlockQuote>
                    <p className="text-muted-foreground leading-relaxed">
                      This belief led me to create the{" "}
                      <strong className="text-foreground">MERIT Exam Compass</strong>—a 5-frame strategic model designed to
                      guide every aspirant from preparation to transformation through a cyclical journey of{" "}
                      <strong>M</strong>easure, <strong>E</strong>xplore, <strong>R</strong>ework,{" "}
                      <strong>I</strong>mplement, and <strong>T</strong>ransform.
                    </p>

                    <div>
                      <p className="text-sm font-semibold text-foreground mb-3">Each cycle of MERIT Exam Compass has been instrumental in:</p>
                      <ul className="space-y-2">
                        {meritCompassBenefits.map((b, i) => (
                          <li key={i} className="flex items-center gap-3">
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                            <span className="text-muted-foreground">{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <p className="text-muted-foreground leading-relaxed">
                      This is not just a framework—it is a mindset, a system, and a commitment to excellence.
                    </p>

                    <div className="bg-primary/5 rounded-xl p-5">
                      <p className="text-sm font-bold text-foreground mb-3">The 3 Pillars Embedded in MERIT Exam Compass:</p>
                      <div className="grid sm:grid-cols-3 gap-3">
                        {meritThreePillars.map((p, i) => (
                          <div key={i} className="bg-background rounded-lg p-3 border border-primary/10 text-center">
                            <p className="font-semibold text-foreground text-sm">{p.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{p.sub}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Message for Students */}
                <Card className="shadow-card mb-6">
                  <CardContent className="p-8 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                        <GraduationCap className="h-5 w-5 text-green-600" />
                      </div>
                      <h4 className="text-lg font-bold text-foreground">Message for Students – Your Journey from Aspirant to Achiever</h4>
                    </div>

                    <p className="text-muted-foreground leading-relaxed">Dear Students,</p>
                    <p className="text-muted-foreground leading-relaxed">
                      Your dreams are valid, and your potential is limitless—but success demands more than just studying
                      harder. It demands studying smarter and evolving continuously.
                    </p>
                    <p className="text-sm font-semibold text-foreground">The MERIT Compass empowers you to:</p>
                    <BulletList items={studentPoints} />

                    <div className="grid sm:grid-cols-2 gap-4 mt-2">
                      <div className="bg-muted/40 rounded-xl p-4">
                        <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-1">Your Responsibility</p>
                        <p className="text-sm text-muted-foreground">Take ownership of your preparation, stay consistent, and trust the process.</p>
                      </div>
                      <div className="bg-muted/40 rounded-xl p-4">
                        <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-1">Your Gain (WIFM)</p>
                        <p className="text-sm text-muted-foreground">Clarity in direction, improved accuracy, stronger confidence, and a real competitive edge.</p>
                      </div>
                    </div>

                    <BlockQuote>
                      Remember: <em>You don't just clear exams—you become capable of winning in life.</em>
                    </BlockQuote>
                  </CardContent>
                </Card>

                {/* Message for Parents */}
                <Card className="shadow-card mb-6">
                  <CardContent className="p-8 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                        <Heart className="h-5 w-5 text-orange-600" />
                      </div>
                      <h4 className="text-lg font-bold text-foreground">Message for Parents – Your Role as Enablers of Potential</h4>
                    </div>

                    <p className="text-muted-foreground leading-relaxed">Dear Parents,</p>
                    <p className="text-muted-foreground leading-relaxed">
                      Behind every successful student stands a pillar of support, belief, and emotional strength. Your role
                      is not just to guide—but to create an environment where your child can thrive without fear.
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      The MERIT Compass helps your child move from confusion to confidence through a structured approach.
                      But your encouragement is what fuels their consistency.
                    </p>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="bg-muted/40 rounded-xl p-4">
                        <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-2">Your Responsibility</p>
                        <BulletList items={parentPoints} />
                      </div>
                      <div className="bg-muted/40 rounded-xl p-4">
                        <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-1">Your Gain (WIFM)</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          A confident, self-driven child who develops not just academic success, but lifelong discipline,
                          resilience, and clarity.
                        </p>
                      </div>
                    </div>

                    <p className="text-muted-foreground leading-relaxed italic">
                      Your belief can turn their preparation into transformation.
                    </p>
                  </CardContent>
                </Card>

                {/* Message for Institutional Partners */}
                <Card className="shadow-card mb-6">
                  <CardContent className="p-8 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                        <Building2 className="h-5 w-5 text-purple-600" />
                      </div>
                      <h4 className="text-lg font-bold text-foreground">Message for Institutional Partners – Building a Culture of Performance Excellence</h4>
                    </div>

                    <p className="text-muted-foreground leading-relaxed">Dear Institutional Partners,</p>
                    <p className="text-muted-foreground leading-relaxed">
                      In today's competitive landscape, institutions are not just centres of learning—they are ecosystems of
                      performance and transformation.
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      The MERIT Exam Compass offers a structured, scalable, and outcome-driven model to enhance student
                      success by embedding:
                    </p>
                    <BulletList items={institutionEmbed} />

                    <div className="grid sm:grid-cols-2 gap-4 mt-2">
                      <div className="bg-muted/40 rounded-xl p-4">
                        <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-1">Your Responsibility</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Integrate structured preparation systems, enable data-driven tracking, and foster a culture of
                          continuous improvement.
                        </p>
                      </div>
                      <div className="bg-muted/40 rounded-xl p-4">
                        <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-2">Your Gain (WIFM)</p>
                        <BulletList items={institutionPoints} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Final Thoughts – KASH to KHASS */}
                <Card className="shadow-card border-primary/20 mb-6">
                  <CardContent className="p-8 space-y-5">
                    <h4 className="text-xl font-bold text-foreground">Final Thoughts</h4>

                    <div>
                      <h5 className="text-lg font-semibold text-foreground mb-3">From KASH to KHASS – The Missing Link to Success</h5>
                      <p className="text-muted-foreground leading-relaxed">
                        In the journey of success, we often focus on building{" "}
                        <strong className="text-foreground">KASH—Knowledge, Attitude, Skills, and Habits.</strong>
                      </p>
                      <div className="grid sm:grid-cols-2 gap-3 mt-4">
                        {[
                          { k: "Knowledge", v: "gives you understanding" },
                          { k: "Attitude", v: "shapes your mindset" },
                          { k: "Skills", v: "enable execution" },
                          { k: "Habits", v: "build consistency" },
                        ].map((row, i) => (
                          <div key={i} className="flex items-center gap-2 bg-muted/40 rounded-lg p-3">
                            <span className="font-bold text-primary w-20 shrink-0">{row.k}</span>
                            <span className="text-sm text-muted-foreground">{row.v}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-muted-foreground leading-relaxed mt-4">
                        Together, KASH builds confidence.<br />
                        But here's the truth most students overlook:
                      </p>
                      <BlockQuote>Confidence alone does not guarantee success.</BlockQuote>
                      <p className="text-muted-foreground leading-relaxed">
                        Many students have knowledge. Many have the right attitude. Many work hard and build good habits.
                        Yet, they fall short when it matters the most.
                      </p>
                      <p className="text-muted-foreground leading-relaxed mt-2">
                        <strong>Why?</strong><br />
                        Because something critical is missing— <strong className="text-foreground">STRATEGY.</strong>
                      </p>
                    </div>

                    <div>
                      <h5 className="text-lg font-semibold text-foreground mb-3">Introducing KHASS – The Complete Success Formula</h5>
                      <p className="text-muted-foreground leading-relaxed mb-4">
                        When you add <strong>Strategy</strong> to KASH, it becomes <strong>KHASS</strong>:
                      </p>
                      <div className="flex flex-wrap gap-3 mb-4">
                        {khassItems.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 bg-primary/10 rounded-xl px-4 py-3 min-w-[100px]">
                            <span className="text-2xl font-black text-primary">{item.letter}</span>
                            <span className="text-sm font-semibold text-foreground">{item.word}</span>
                          </div>
                        ))}
                      </div>
                      <BlockQuote>Strategy is what transforms effort into results.</BlockQuote>
                      <p className="text-muted-foreground leading-relaxed mb-1">It is the difference between:</p>
                      <div className="grid sm:grid-cols-3 gap-3 mt-3">
                        {[
                          ["Studying hard", "studying smart"],
                          ["Being busy", "being productive"],
                          ["Attempting exams", "cracking exams"],
                        ].map(([from, to], i) => (
                          <div key={i} className="bg-muted/40 rounded-lg p-3 text-center text-sm">
                            <p className="text-muted-foreground">{from}</p>
                            <p className="text-xs text-muted-foreground my-1">vs.</p>
                            <p className="font-semibold text-foreground">{to}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="text-base font-semibold text-foreground mb-3">Why Strategy Makes You "KHASS" (Special)</h5>
                      <p className="text-muted-foreground leading-relaxed mb-3">Strategy helps you:</p>
                      <BulletList items={khassStrategyPoints} />
                      <p className="text-muted-foreground leading-relaxed mt-3">
                        Without strategy, effort gets diluted.<br />
                        With strategy, effort gets multiplied.
                      </p>
                    </div>

                    <div>
                      <h5 className="text-base font-semibold text-foreground mb-2">The Reality Check</h5>
                      <p className="text-muted-foreground leading-relaxed">
                        Two students may study for the same number of hours… But the one with the right strategy will always
                        move ahead.
                      </p>
                      <p className="text-muted-foreground leading-relaxed mt-2">
                        Because success is not about doing more—{" "}
                        <strong className="text-foreground">It's about doing what matters most, in the right way, at the right time.</strong>
                      </p>
                    </div>

                    <div className="bg-gradient-hero rounded-2xl p-6 text-center">
                      <p className="text-lg font-bold text-foreground mb-1">
                        "KASH builds your foundation, but KHASS builds your success."
                      </p>
                      <p className="text-muted-foreground mt-3">
                        So don't just prepare harder—<br />
                        <strong>Prepare smarter, with the strategy of Merit Launchers at the core.</strong>
                      </p>
                      <p className="text-muted-foreground mt-3">
                        Because the future belongs not just to those who work hard…<br />
                        But to those who think, plan, and execute with precision.
                      </p>
                      <p className="text-muted-foreground mt-3">
                        At Merit Launchers, our mission is simple yet powerful—<br />
                        To ensure that every learner, regardless of background, gets a fair opportunity to succeed.
                      </p>
                      <p className="text-muted-foreground mt-3 italic">
                        Let us not just prepare for exams—<br />
                        Let us prepare for excellence.
                      </p>
                      <p className="text-muted-foreground mt-2 italic">Wish your success with strategy</p>
                    </div>

                    <SignatureBlock
                      name="Diwaker Saraswati Chandra"
                      role="Director – Capability Development & Marketing Strategy"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* ── Team Sections ── */}
        <section className="py-12 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-10">
                <Badge variant="secondary" className="mb-3">Our People</Badge>
                <h2 className="text-3xl font-bold">The Team Behind the Platform</h2>
                <p className="text-muted-foreground mt-2">
                  Our founders and academic leaders come with years of experience in competitive exam preparation.
                </p>
              </div>

              <div className="space-y-6">
                {teamSections.map((section, index) => (
                  <Card key={index} className="shadow-card hover:shadow-premium transition-all duration-300">
                    <CardContent className="p-8">
                      <div className="flex items-start gap-5">
                        <div className="w-14 h-14 bg-gradient-primary rounded-xl flex items-center justify-center shrink-0 shadow-glow">
                          <section.icon className="h-7 w-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold mb-3">{section.title}</h3>
                          <p className="text-muted-foreground leading-relaxed mb-4">{section.description}</p>
                          {section.features.length > 0 && (
                            <div className="space-y-2 mb-4">
                              <p className="font-semibold text-foreground text-sm mb-2">They ensure that:</p>
                              {section.features.map((f, i) => (
                                <div key={i} className="flex items-start gap-3">
                                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                  <p className="text-muted-foreground text-sm">{f}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          {section.quote && (
                            <div className="bg-primary/5 border-l-4 border-primary rounded-r-lg px-5 py-4">
                              <p className="italic text-foreground font-medium">"{section.quote}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Join Our Mission ── */}
        <section className="py-16 bg-gradient-hero relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.1),transparent_70%)]" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-6 animate-float shadow-premium">
                <Lightbulb className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-4xl font-bold mb-4">
                Join Our <span className="bg-gradient-primary bg-clip-text text-transparent">Mission</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                We're expanding our team! If you're an educator, content creator, or subject expert passionate about
                mentoring students, we'd love to collaborate.
              </p>
              <Button size="lg" className="shadow-glow hover:shadow-premium transition-all duration-300" asChild>
                <a href="mailto:info@meritlaunchers.com" className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Write to us at info@meritlaunchers.com
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* ── Our Values ── */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">
                  Our <span className="bg-gradient-primary bg-clip-text text-transparent">Values</span>
                </h2>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { icon: GraduationCap, title: "Excellence", desc: "Delivering high-quality content that matches real exam standards" },
                  { icon: Heart, title: "Dedication", desc: "Committed to every student's success journey" },
                  { icon: Lightbulb, title: "Innovation", desc: "Constantly improving through technology and feedback" },
                ].map((v, i) => (
                  <Card key={i} className="shadow-card hover:shadow-premium transition-all duration-300 group">
                    <CardContent className="p-8 text-center">
                      <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-primary rounded-full mb-4 shadow-glow group-hover:scale-110 transition-transform">
                        <v.icon className="h-7 w-7 text-white" />
                      </div>
                      <h3 className="text-xl font-bold mb-3">{v.title}</h3>
                      <p className="text-muted-foreground">{v.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-6">
                Ready to Start Your{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">Success Journey?</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join thousands of students who trust our team to guide their preparation
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="shadow-glow hover:shadow-premium transition-all duration-300" asChild>
                  <a href="https://play.google.com/store/apps/details?id=co.robin.qibrw&hl=en" target="_blank" rel="noopener noreferrer">
                    Download App
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="/contact">Contact Us</a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
