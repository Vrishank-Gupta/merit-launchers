import { useEffect, useMemo, useState } from "react";
import { usePartnerAuth } from "@/hooks/usePartnerAuth";
import { partnerApi } from "@/lib/partnerApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Trophy, Award, Gift, Star, ArrowRight } from "lucide-react";

const milestoneIcons = [Award, Gift, Trophy, Star];

export default function PartnerMilestones() {
  const { token } = usePartnerAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    partnerApi.milestones(token).then((payload) => {
      setData(payload);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [token]);

  const nextMilestone = useMemo(() => (data?.milestones || []).find((milestone: any) => !milestone.achieved), [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const { totalStudents = 0, milestones = [] } = data || {};

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Milestones</h1>
        <p className="text-muted-foreground mt-1">Use milestones as pacing tools, not vanity trophies.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-0 bg-slate-950 text-slate-50 shadow-[0_30px_80px_rgba(15,23,42,0.2)]">
          <CardContent className="p-8">
            <Badge className="border-0 bg-white/10 text-white">Momentum tracker</Badge>
            <p className="mt-4 text-sm uppercase tracking-[0.18em] text-slate-400">Total students referred</p>
            <p className="mt-3 text-6xl font-semibold">{totalStudents}</p>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
              Keep your weekly outreach and follow-up predictable. Milestones are easier to hit when your system is steady.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Next target</CardTitle>
          </CardHeader>
          <CardContent>
            {nextMilestone ? (
              <div className="rounded-3xl border border-border/70 p-5">
                <p className="text-sm text-muted-foreground">{nextMilestone.label}</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">{nextMilestone.target - totalStudents}</p>
                <p className="mt-1 text-sm text-muted-foreground">more students to unlock {nextMilestone.reward}</p>
                <Progress value={nextMilestone.progress} className="mt-4 h-2" />
                <div className="mt-4 flex items-center gap-2 text-sm text-primary">
                  <ArrowRight className="h-4 w-4" />
                  Stay focused on lead follow-up and one high-intent channel.
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
                All current milestones are achieved. This is the right moment to scale your operating rhythm and network depth.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {milestones.map((milestone: any, index: number) => {
          const Icon = milestoneIcons[index % milestoneIcons.length];
          return (
            <Card key={milestone.target} className={`border-border/70 shadow-sm ${milestone.achieved ? "border-emerald-200 bg-emerald-50/60" : ""}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${milestone.achieved ? "bg-emerald-100" : "bg-muted"}`}>
                      <Icon className={`h-6 w-6 ${milestone.achieved ? "text-emerald-700" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">{milestone.label}</p>
                      <p className="text-sm text-muted-foreground">Reward: {milestone.reward}</p>
                    </div>
                  </div>
                  {milestone.achieved ? (
                    <Badge className="bg-emerald-100 text-emerald-800 border-0">Achieved</Badge>
                  ) : (
                    <Badge variant="outline">{milestone.target - totalStudents} to go</Badge>
                  )}
                </div>
                <div className="mt-5 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{Math.min(totalStudents, milestone.target)} / {milestone.target} students</span>
                    <span className="font-semibold text-foreground">{milestone.progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={milestone.progress} className={`h-3 ${milestone.achieved ? "[&>div]:bg-emerald-500" : ""}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
