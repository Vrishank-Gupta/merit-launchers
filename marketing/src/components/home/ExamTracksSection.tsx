import { GraduationCap, Scale, ShieldCheck, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

const tracks = [
  {
    icon: GraduationCap,
    eyebrow: "CUET",
    title: "Smart Preparation With Online Mock Tests",
    description:
      "At Merit Launchers, we provide a highly effective online CUET mock test platform that helps students prepare with precision. Our CUET online test series is designed by experts to match the latest exam pattern, helping students manage time efficiently, reduce exam stress, and improve weak areas with regular practice.",
  },
  {
    icon: Scale,
    eyebrow: "CLAT",
    title: "Comprehensive CLAT Mock Test Series",
    description:
      "For law aspirants, our online CLAT mock test series strengthens logical reasoning, legal aptitude, and reading comprehension through high-quality questions that reflect the actual exam format. Detailed explanations and performance analysis help students learn from mistakes and improve continuously.",
  },
  {
    icon: ShieldCheck,
    eyebrow: "NDA",
    title: "NDA Mock Tests For Defence Aspirants",
    description:
      "Our online NDA mock test series covers mathematics and general ability sections with timed tests and real exam simulation. Students improve speed, accuracy, and exam strategy while building the confidence needed to face the NDA exam seriously.",
  },
  {
    icon: TrendingUp,
    eyebrow: "IPMAT",
    title: "IPMAT Online Test Series For Management Aspirants",
    description:
      "For students targeting top management institutes, our IPMAT online mock test series supports quantitative aptitude, verbal ability, and logical reasoning preparation. Regular practice improves question recognition, problem-solving technique, and overall result quality.",
  },
];

export default function ExamTracksSection() {
  return (
    <section className="bg-background py-3 md:py-4">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            Best Online Mock Test Series for CUET, CLAT, NDA & IPMAT
          </p>
          <h2 className="mt-2 text-2xl font-bold md:text-3xl">
            Practice With The Right Strategy, Consistency, And Exam-Level Feedback
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
            Preparing for competitive exams like CUET, CLAT, NDA, and IPMAT requires
            the right strategy, consistent practice, and accurate performance tracking.
            Merit Launchers brings you a comprehensive and result-driven platform
            designed to simulate real exam conditions, improve speed, enhance
            accuracy, and keep students one step ahead.
          </p>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {tracks.map((track) => (
            <Card
              key={track.eyebrow}
              className="rounded-3xl border border-primary/15 bg-gradient-to-br from-background via-background to-primary/5 p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-premium"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <track.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                    {track.eyebrow}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold">{track.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {track.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
