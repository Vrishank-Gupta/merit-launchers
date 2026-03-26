import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePartnerAuth } from "@/hooks/usePartnerAuth";
import { partnerApi } from "@/lib/partnerApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Cell,
} from "recharts";
import {
  Loader2,
  Users,
  TrendingUp,
  Wallet,
  Clock,
  Percent,
  CheckCircle2,
  ArrowRight,
  ClipboardList,
  Target,
  Rocket,
  Sparkles,
  PhoneCall,
  Globe,
  Smartphone,
} from "lucide-react";

function fmtCurrency(value: number) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function toneClasses(tone: string) {
  if (tone === "success") return "border-emerald-200 bg-emerald-50";
  if (tone === "warning") return "border-amber-200 bg-amber-50";
  return "border-sky-200 bg-sky-50";
}

export default function PartnerDashboard() {
  const { token, affiliate } = usePartnerAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [platform, setPlatform] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completingStep, setCompletingStep] = useState("");

  const load = () => {
    if (!token) return;
    Promise.all([partnerApi.stats(token), partnerApi.platformStats(token)]).then(([dashboard, platformData]) => {
      setStats(dashboard);
      setPlatform(platformData);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [token]);

  const completeStep = async (stepKey: string) => {
    if (!token) return;
    setCompletingStep(stepKey);
    try {
      await partnerApi.completeChecklistStep(token, stepKey);
      load();
    } finally {
      setCompletingStep("");
    }
  };

  const conversionRate = useMemo(() => {
    if (!stats?.totalStudents) return 0;
    return (stats.paidStudents / stats.totalStudents) * 100;
  }, [stats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Failed to load dashboard data. Please refresh.
      </div>
    );
  }

  const topMetrics = [
    {
      label: "Students referred",
      value: stats.totalStudents,
      helper: `${stats.paidStudents} paid · ${stats.freeStudents} free`,
      icon: Users,
    },
    {
      label: "Revenue influenced",
      value: fmtCurrency(stats.totalRevenue),
      helper: `${stats.totalClicks} referral clicks`,
      icon: TrendingUp,
    },
    {
      label: "Pending commission",
      value: fmtCurrency(stats.pendingCommission),
      helper: `${stats.currentSlabRate}% current rate`,
      icon: Wallet,
    },
    {
      label: "Conversion rate",
      value: `${conversionRate.toFixed(1)}%`,
      helper: `${stats.totalAttempts} students attempted tests`,
      icon: Percent,
    },
  ];

  const funnelData = [
    { name: "Clicks", value: stats.totalClicks, fill: "#0f766e" },
    { name: "Signups", value: stats.totalStudents, fill: "#155e75" },
    { name: "Paid", value: stats.paidStudents, fill: "#1d4ed8" },
  ];

  return (
    <div className="p-4 sm:p-8 space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <Card className="overflow-hidden border-0 bg-slate-950 text-slate-50 shadow-[0_30px_80px_rgba(15,23,42,0.25)]">
          <CardContent className="p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl space-y-5">
                <Badge className="w-fit border-0 bg-white/10 text-slate-100">Partner workspace</Badge>
                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Build momentum, not random activity.</h1>
                  <p className="max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                    See what deserves attention today, convert warm leads faster, and run your partner work like a disciplined growth engine.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary" className="rounded-full bg-white text-slate-900 hover:bg-white/90" onClick={() => navigate("/partner/leads")}>
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Open lead board
                  </Button>
                  <Button variant="outline" className="rounded-full border-white/20 bg-transparent text-slate-100 hover:bg-white/10" onClick={() => navigate("/partner/toolkit")}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Use scripts
                  </Button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px]">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Health</p>
                  <p className="mt-3 text-4xl font-semibold">{stats.partnerHealth?.score ?? 0}</p>
                  <p className="mt-2 text-sm text-slate-300 capitalize">{stats.partnerHealth?.band} momentum</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Lifecycle</p>
                  <p className="mt-3 text-2xl font-semibold">{stats.partnerHealth?.lifecycle || "Active"}</p>
                  <p className="mt-2 text-sm text-slate-300">{stats.pendingPartnerApplications} partner approvals waiting</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Leads open</p>
                  <p className="mt-3 text-4xl font-semibold">{stats.leadSummary?.open ?? 0}</p>
                  <p className="mt-2 text-sm text-slate-300">{stats.leadSummary?.dueToday ?? 0} follow-ups due today</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Commission earned</p>
                  <p className="mt-3 text-3xl font-semibold">{fmtCurrency(stats.paidCommission)}</p>
                  <p className="mt-2 text-sm text-slate-300">Pending {fmtCurrency(stats.pendingCommission)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">First 7 days plan</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stats.checklistProgress?.completed || 0} of {stats.checklistProgress?.total || 0} setup actions complete
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                <Rocket className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={((stats.checklistProgress?.completed || 0) / Math.max(stats.checklistProgress?.total || 1, 1)) * 100} className="h-2" />
            <div className="space-y-3">
              {(stats.firstWeekPlan || []).map((step: any) => (
                <div key={step.key} className="rounded-3xl border border-border/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{step.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                    </div>
                    {step.completed ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-0">Done</Badge>
                    ) : (
                      <Button size="sm" variant="outline" disabled={completingStep === step.key} onClick={() => completeStep(step.key)}>
                        {completingStep === step.key ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-2 h-3.5 w-3.5" />}
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {topMetrics.map(({ label, value, helper, icon: Icon }) => (
          <Card key={label} className="border-border/70 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-3 text-3xl font-semibold text-foreground">{value}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Action queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(stats.actionAlerts || []).map((alert: any) => (
              <div key={alert.title} className={`rounded-3xl border p-5 ${toneClasses(alert.tone)}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-base font-semibold text-foreground">{alert.title}</p>
                    <p className="text-sm text-foreground/90">{alert.action}</p>
                    <p className="text-xs text-muted-foreground">{alert.rationale}</p>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 text-foreground/70" />
                </div>
              </div>
            ))}
            {stats.quickActions?.length ? (
              <div className="rounded-3xl border border-border/70 bg-muted/30 p-5">
                <p className="text-sm font-semibold text-foreground">Quick setup fixes</p>
                <div className="mt-3 space-y-2">
                  {stats.quickActions.map((item: string) => (
                    <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Operating rhythm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(stats.weeklyRhythm || []).map((item: any) => (
              <div key={item.label} className="rounded-3xl border border-border/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-sm font-medium text-foreground">{item.task}</p>
              </div>
            ))}
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="outline" className="justify-start rounded-2xl" onClick={() => navigate("/partner/leads")}>
                <PhoneCall className="mr-2 h-4 w-4" />
                Update leads
              </Button>
              <Button variant="outline" className="justify-start rounded-2xl" onClick={() => navigate("/partner/network")}>
                <Users className="mr-2 h-4 w-4" />
                Review network
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Growth funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={funnelData} layout="vertical" margin={{ left: 8, right: 18 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={64} />
                <Tooltip formatter={(value: number) => [value, "Count"]} />
                <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                  {funnelData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Platform mix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl border border-border/70 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100">
                    <Smartphone className="h-4 w-4 text-emerald-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Android app signups</p>
                    <p className="text-xs text-muted-foreground">Students who installed or signed up via app</p>
                  </div>
                </div>
                <p className="text-2xl font-semibold text-foreground">{stats.mobileSignups || 0}</p>
              </div>
            </div>
            <div className="rounded-3xl border border-border/70 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100">
                    <Globe className="h-4 w-4 text-sky-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Web signups</p>
                    <p className="text-xs text-muted-foreground">Students who came through the website</p>
                  </div>
                </div>
                <p className="text-2xl font-semibold text-foreground">{stats.webSignups || 0}</p>
              </div>
            </div>
            <div className="rounded-3xl border border-border/70 bg-muted/30 p-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Next milestone</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {stats.totalStudents >= 50
                  ? "You have crossed the first milestone. Push for consistent conversions now."
                  : `${Math.max(50 - stats.totalStudents, 0)} more student signups unlock the first milestone.`}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
