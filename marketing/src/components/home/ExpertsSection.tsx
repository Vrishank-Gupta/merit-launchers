import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import diwakerPhoto from "@/assets/team-diwaker.png";
import arvindPhoto from "@/assets/team-arvind.jpg";

const arvindHighlights = [
  "36+ years in education & governance",
  "Two-time UPSC qualifier",
  "Former Regional Director of Education, GNCT of Delhi",
  "Leadership training at University of Cambridge",
];

const diwakerHighlights = [
  "30+ years in Learning & Development",
  "Coach to 2700+ professionals",
  "Creator of 150+ signature programs",
  "Author — Amazon bestseller The Trainer's Blueprint",
];

export default function ExpertsSection() {
  return (
    <section className="py-12 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <Badge className="mb-3" variant="secondary">
            Leadership
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Meet the Experts Behind{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">Merit Launchers</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            A mission-led team focused on making exam preparation accessible, structured, and performance-driven.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">

          {/* ── Mr. Arvind Kumar ── */}
          <Card className="shadow-card hover:shadow-premium transition-all duration-300 border-primary/15">
            <CardContent className="p-7 flex flex-col h-full">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-muted shrink-0">
                  <img
                    src={arvindPhoto}
                    alt="Mr. Arvind Kumar"
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                  />
                </div>
                <div>
                  <p className="text-lg font-semibold leading-snug">Mr. Arvind Kumar</p>
                  <p className="text-sm text-muted-foreground">Founder, Merit Launchers</p>
                </div>
              </div>

              <blockquote className="text-sm italic text-muted-foreground border-l-2 border-primary/40 pl-3 mb-4 leading-relaxed">
                "I come from a remote village where opportunity was scarce. Merit Launchers is built to bridge the gap
                between talent and access, so no dream is denied due to financial limitations."
              </blockquote>

              <ul className="space-y-2 mb-5 flex-1">
                {arvindHighlights.map((h, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm text-muted-foreground">{h}</span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-end mt-auto">
                <Button asChild variant="outline" className="gap-2" size="sm">
                  <a href="/our-team#arvind-profile">
                    Read the full message <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ── Mr. Diwaker Saraswati Chandra ── */}
          <Card className="shadow-card hover:shadow-premium transition-all duration-300 border-primary/15">
            <CardContent className="p-7 flex flex-col h-full">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-muted shrink-0">
                  <img
                    src={diwakerPhoto}
                    alt="Mr. Diwaker Saraswati Chandra"
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                  />
                </div>
                <div>
                  <p className="text-lg font-semibold leading-snug">Mr. Diwaker Saraswati Chandra</p>
                  <p className="text-sm text-muted-foreground">
                    Director – Capability Development & Marketing Strategy
                  </p>
                </div>
              </div>

              <blockquote className="text-sm italic text-muted-foreground border-l-2 border-primary/40 pl-3 mb-4 leading-relaxed">
                "KASH builds your foundation, but KHASS builds your success. Strategy is what transforms effort into results."
              </blockquote>

              <ul className="space-y-2 mb-5 flex-1">
                {diwakerHighlights.map((h, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm text-muted-foreground">{h}</span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-end mt-auto">
                <Button asChild className="gap-2" size="sm">
                  <a href="/our-team#diwaker-profile">
                    Read full profile & messages <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </section>
  );
}
