import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pageSeo } from "@/lib/seo";
import { Award, Calculator, Download, ExternalLink, Shield, Target, Timer, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

const appLink = "https://play.google.com/store/apps/details?id=co.robin.qibrw";

export default function NDA() {
  const packages = [
    {
      title: "NDA GAT",
      price: "Rs 491*",
      description: "2.5 hours, 150 questions, all subjects, 600 marks, and -1.33 negative marking.",
      icon: Shield,
    },
    {
      title: "NDA Maths",
      price: "Rs 491*",
      description: "2.5 hours, 120 questions, 300 marks, and -0.83 negative marking.",
      icon: Calculator,
    },
  ];

  const gatBreakdown = [
    "English: 50 questions",
    "Physics: 20 to 25 questions",
    "Chemistry: 15 questions",
    "General Science: 10 questions",
    "History: 20 questions",
    "Geography: 20 questions",
    "Current Events: 10 questions",
  ];

  const highlights = [
    { label: "Conducting Body", value: "Union Public Service Commission (UPSC)" },
    { label: "Exam Level", value: "National defence entrance exam" },
    { label: "Mock Test Sets", value: "2 sets of question papers with one demo paper excluded from the paid count" },
    { label: "Paid Papers", value: "10 papers total, excluding one demo paper" },
    { label: "Written Papers", value: "NDA GAT and NDA Maths available separately" },
    { label: "Interview Marks", value: "900 marks" },
  ];

  const features = [
    { title: "Timed Practice", text: "Build pace for the real NDA written exam." },
    { title: "Section Focus", text: "Choose GAT or Maths based on the exact area you need." },
    { title: "Instant Analysis", text: "Review scores and accuracy immediately after each attempt." },
    { title: "Free Preview", text: "Try a free mock before purchasing the full test series." },
  ];

  return (
    <div className="min-h-screen">
      <SEO {...pageSeo.nda} pageEvent={{ name: "course_page_view", params: { exam: "NDA" } }} />
      <Navbar />

      <main>
        <section className="relative overflow-hidden bg-gradient-hero py-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_45%,rgba(6,182,212,0.14),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_50%,rgba(34,197,94,0.14),transparent_50%)]" />
          <div className="container relative mx-auto px-4">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-background px-5 py-2 shadow-card">
                <Trophy className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold text-primary">National Defence Academy</span>
              </div>
              <h1 className="mb-6 text-4xl font-bold md:text-6xl">{pageSeo.nda.h1}</h1>
              <p className="mx-auto mb-8 max-w-3xl text-lg text-muted-foreground md:text-xl">
                Prepare separately for NDA GAT and NDA Maths with exam-style mock tests, instant scores, and affordable access.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Button size="lg" className="shadow-glow" asChild>
                  <a href={appLink} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-5 w-5" />
                    Download App
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/fee-structure">View Pricing</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-background py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-6xl">
              <div className="mb-10 text-center">
                <h2 className="mb-3 text-3xl font-bold md:text-4xl">Choose Your NDA Test Series</h2>
                <p className="text-muted-foreground">Both packages are priced at Rs 491 + GST.</p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {packages.map((item) => (
                  <Card key={item.title} className="border-primary/20 shadow-card">
                    <CardHeader>
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <item.icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="flex items-center justify-between gap-4">
                        <span>{item.title}</span>
                        <span className="text-primary">{item.price}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 text-muted-foreground">{item.description}</p>
                      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">*GST extra</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <p className="mt-5 text-center text-sm text-muted-foreground">
                Price of mock test: Rs 491 + GST for each paper.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-muted/30 py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-6xl">
              <h2 className="mb-8 text-center text-3xl font-bold md:text-4xl">NDA Test Details</h2>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>NDA GAT Paper</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      The GAT mock test runs for 2.5 hours with 150 questions across all subjects. The total test is 600 marks with negative marking of -1.33 for wrong answers.
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {gatBreakdown.map((item) => (
                        <div key={item} className="rounded-lg bg-background px-4 py-3 text-sm font-medium">
                          {item}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>NDA Maths Paper</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      The Maths mock test runs for 2.5 hours with 120 questions. The paper carries 300 marks with negative marking of -0.83 for wrong answers.
                    </p>
                    <div className="rounded-lg bg-background px-4 py-3 text-sm font-medium">
                      Interview stage: 900 marks
                    </div>
                    <div className="rounded-lg bg-background px-4 py-3 text-sm font-medium">
                      Paid access includes 10 papers, excluding one demo paper.
                    </div>
                    <div className="rounded-lg bg-background px-4 py-3 text-sm font-medium">
                      Each mock paper is priced at Rs 491 + GST.
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-background py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl">
              <h2 className="mb-8 text-center text-3xl font-bold md:text-4xl">NDA Exam Highlights</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {highlights.map((item) => (
                  <div key={item.label} className="rounded-lg bg-card p-5 shadow-card">
                    <p className="mb-1 text-sm font-semibold text-primary">{item.label}</p>
                    <p className="text-muted-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-muted/30 py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-6xl">
              <h2 className="mb-8 text-center text-3xl font-bold md:text-4xl">Why Practice NDA With Merit Launchers</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {features.map((feature, index) => {
                  const icons = [Timer, Target, Award, Download];
                  const Icon = icons[index];
                  return (
                    <Card key={feature.title} className="shadow-card">
                      <CardContent className="p-6">
                        <Icon className="mb-4 h-8 w-8 text-primary" />
                        <h3 className="mb-2 font-semibold">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.text}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gradient-primary py-16 text-white">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">Start NDA Practice Today</h2>
              <p className="mb-8 text-lg text-white/90">
                Download the app, attempt your free mock, and unlock NDA GAT or NDA Maths when you are ready.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Button size="lg" variant="secondary" asChild>
                  <a href={appLink} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-5 w-5" />
                    Download App
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="border-white/60 bg-transparent text-white hover:bg-white/10" asChild>
                  <a href="https://upsc.gov.in" target="_blank" rel="noopener noreferrer">
                    UPSC Website
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
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
