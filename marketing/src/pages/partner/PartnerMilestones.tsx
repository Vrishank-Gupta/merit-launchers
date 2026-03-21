import { useEffect, useState } from "react";
import { usePartnerAuth } from "@/hooks/usePartnerAuth";
import { partnerApi } from "@/lib/partnerApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Trophy, Award, Gift, Star } from "lucide-react";

const milestoneIcons = [Award, Gift, Trophy, Star];

export default function PartnerMilestones() {
  const { token } = usePartnerAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    partnerApi.milestones(token).then((d) => {
      setData(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const { totalStudents = 0, milestones = [] } = data || {};

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Milestones</h1>
        <p className="text-muted-foreground mt-1">Track your progress towards rewards</p>
      </div>

      {/* Total Students Hero */}
      <Card className="shadow-sm bg-gradient-to-br from-primary/10 to-secondary/5">
        <CardContent className="pt-8 pb-8 text-center">
          <p className="text-muted-foreground text-sm uppercase tracking-wide font-medium mb-2">
            Total Students Referred
          </p>
          <p className="text-6xl font-black text-primary">{totalStudents}</p>
          <p className="text-muted-foreground text-sm mt-2">Keep growing your network!</p>
        </CardContent>
      </Card>

      {/* Milestone Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {milestones.map((m: any, i: number) => {
          const Icon = milestoneIcons[i % milestoneIcons.length];
          return (
            <Card
              key={m.target}
              className={`shadow-sm transition-all ${
                m.achieved ? "border-green-300 bg-green-50/50" : ""
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        m.achieved ? "bg-green-100" : "bg-muted"
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${m.achieved ? "text-green-600" : "text-muted-foreground"}`}
                      />
                    </div>
                    <div>
                      <p className="font-bold text-lg">{m.label}</p>
                      <p className="text-sm text-muted-foreground">Reward: {m.reward}</p>
                    </div>
                  </div>
                  {m.achieved ? (
                    <Badge className="bg-green-100 text-green-800 border-0">Achieved!</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      {m.target - totalStudents} to go
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {Math.min(totalStudents, m.target)} / {m.target} students
                    </span>
                    <span className="font-semibold">{m.progress.toFixed(0)}%</span>
                  </div>
                  <Progress
                    value={m.progress}
                    className={`h-3 ${m.achieved ? "[&>div]:bg-green-500" : ""}`}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
