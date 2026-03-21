import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download, Globe, BookOpen } from "lucide-react";

export default function ExternalLinksPage() {
  const appLink = "https://play.google.com/store/apps/details?id=co.robin.qibrw&hl=en";

  const examLinks = [
    {
      title: "CUET (Common University Entrance Test)",
      url: "https://cuet.nta.nic.in",
      conductor: "National Testing Agency (NTA)",
      purpose: "Admission to undergraduate courses across Central, State & Private Universities.",
      tip: "Check regularly for exam dates, city slips, and answer keys.",
    },
    {
      title: "CLAT (Common Law Admission Test)",
      url: "https://consortiumofnlus.ac.in",
      conductor: "Consortium of National Law Universities (CNLU)",
      purpose: "Admission to 5-year Integrated LL.B. and LL.M. courses at NLUs.",
      tip: "Follow the site for application forms, syllabus, and counselling rounds.",
    },
    {
      title: "CTET (Central Teacher Eligibility Test)",
      url: "https://ctet.nic.in",
      conductor: "Central Board of Secondary Education (CBSE)",
      purpose: "Eligibility for teaching in primary (I–V) and upper primary (VI–VIII) classes.",
      details: [
        "Mode of Exam: Computer-Based Test (CBT)",
        "Frequency: Twice a year – January and July",
        "Validity of Certificate: Lifetime",
      ],
      tip: "Use Merit Launchers Mock Tests to simulate the real exam with instant analysis.",
    },
    {
      title: "JEE (Joint Entrance Examination)",
      url: "https://jeemain.nta.ac.in",
      conductor: "National Testing Agency (NTA)",
      purpose: "Admission to IITs, NITs, IIITs & other top engineering institutes.",
      tip: "Follow NTA portal for session-wise schedules and city intimation slips.",
    },
    {
      title: "IPMAT (Integrated Program in Management Aptitude Test)",
      url: "https://www.iimidr.ac.in/academics/ipm/",
      url2: "https://www.iimrohtak.ac.in/",
      conductor: "IIM Indore & IIM Rohtak",
      purpose: "Admission to the 5-year Integrated BBA + MBA Program.",
      tip: "Review eligibility, exam structure & sample papers on IIM portals.",
    },
    {
      title: "NEET (National Eligibility cum Entrance Test)",
      url: "https://neet.nta.nic.in",
      conductor: "National Testing Agency (NTA)",
      purpose: "Admission to MBBS, BDS & other medical courses.",
      tip: "Track registration deadlines & admit card releases on the official site.",
    },
    {
      title: "SSC (Staff Selection Commission)",
      url: "https://ssc.gov.in",
      conductor: "Staff Selection Commission (SSC)",
      purpose: "Recruitment for Group B & C posts in central ministries and departments.",
      tip: "Visit for exam calendars, vacancy notices & results.",
    },
    {
      title: "DSSSB (Delhi Subordinate Services Selection Board)",
      url: "https://dsssb.delhi.gov.in",
      conductor: "Govt of NCT of Delhi",
      purpose: "Recruitment for teaching and non-teaching posts in Delhi government schools and departments.",
      tip: "Check for post codes, syllabus PDFs, and admit card updates.",
    },
  ];

  const otherLinks = [
    { name: "National Testing Agency (NTA)", url: "https://nta.ac.in" },
    { name: "University Grants Commission (UGC)", url: "https://ugc.ac.in" },
    { name: "AICTE", url: "https://aicte-india.org" },
    { name: "CBSE", url: "https://cbse.gov.in" },
    { name: "Directorate of Education GNCT of Delhi", url: "https://edudel.nic.in" },
    { name: "NCERT", url: "https://ncert.nic.in" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="External Links - Merit Launchers | Official Exam Resources & Links"
        description="Access official links for CUET, CLAT, CTET, JEE, NEET, IPMAT, SSC, DSSSB exams. Find NTA, CBSE, IIM, and other authoritative exam resources in one place."
        keywords="NTA link, CUET official website, CLAT link, JEE main link, NEET official site, SSC website, DSSSB portal, exam official links"
      />
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-primary text-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mb-6">
                <Globe className="h-10 w-10" />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in-up">
                🌐 External Links
              </h1>
              <p className="text-xl md:text-2xl mb-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                Your One-Stop Hub for Official Exam Resources
              </p>
              <p className="text-lg text-white/90 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                At Merit Launchers, we believe in transparent and well-informed preparation. To help students stay connected with authentic and verified sources, we've compiled a list of official links for all major exams supported by Merit Launchers App.
              </p>
            </div>
          </div>
        </section>

        {/* Introduction */}
        <section className="py-12 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-lg text-muted-foreground">
                For mock tests, instant analytics, and free practice, use our <span className="font-semibold text-foreground">Merit Launchers App</span>. For notifications, admit cards, and results, visit the official websites listed below.
              </p>
            </div>
          </div>
        </section>

        {/* Exam Links */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto space-y-8">
              {examLinks.map((exam, index) => (
                <div key={index} className="bg-card border border-border rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-2 text-foreground">{index + 1}. {exam.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        <span className="font-semibold">Conducted by:</span> {exam.conductor}
                      </p>
                    </div>
                    <Button variant="default" size="sm" asChild>
                      <a href={exam.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        Visit Website
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start space-x-2">
                      <span className="text-primary font-semibold min-w-[80px]">Official URL:</span>
                      <a href={exam.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                        {exam.url}
                      </a>
                    </div>
                    
                    {exam.url2 && (
                      <div className="flex items-start space-x-2">
                        <span className="text-primary font-semibold min-w-[80px]">Also visit:</span>
                        <a href={exam.url2} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                          {exam.url2}
                        </a>
                      </div>
                    )}
                    
                    <div className="flex items-start space-x-2">
                      <span className="font-semibold min-w-[80px]">Purpose:</span>
                      <span className="text-muted-foreground">{exam.purpose}</span>
                    </div>
                    
                    {exam.details && (
                      <div className="bg-secondary/30 p-4 rounded-md space-y-1">
                        {exam.details.map((detail, i) => (
                          <p key={i} className="text-sm text-muted-foreground">• {detail}</p>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-start space-x-2 bg-primary/5 p-3 rounded-md">
                      <span className="font-semibold text-primary min-w-[80px]">💡 Tip:</span>
                      <span className="text-muted-foreground text-sm">{exam.tip}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Other Useful Links */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-center mb-8">
                <BookOpen className="h-8 w-8 text-primary mr-3" />
                <h2 className="text-3xl md:text-4xl font-bold">Other Useful Educational Links</h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all hover:border-primary group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium group-hover:text-primary transition-colors">{link.name}</span>
                      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 break-all">{link.url}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Stay Updated Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">🏆 Stay Updated, Stay Ahead</h2>
              <p className="text-lg text-muted-foreground mb-4">
                Bookmark this page and visit often — all major exam links are verified and updated here for your convenience.
              </p>
              <p className="text-xl font-semibold text-foreground mb-2">But remember:</p>
              <p className="text-lg text-muted-foreground italic">
                Information helps you prepare. <span className="text-primary font-semibold">Practice helps you win.</span>
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-primary text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Begin Your Journey</h2>
              <p className="text-lg md:text-xl mb-10 text-white/90">
                Experience smart preparation with Merit Launchers
              </p>
              <Button size="lg" variant="secondary" className="shadow-premium text-lg px-8 py-6" asChild>
                <a href={appLink} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-5 w-5" />
                  Download the Merit Launchers App
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

