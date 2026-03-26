import { useEffect, useState } from "react";
import { useMAAuth } from "@/hooks/useMarketingAdminAuth";
import { marketingAdminApi } from "@/lib/partnerApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Wallet, TrendingUp, Clock, ArrowRight, AlertTriangle, Activity, BriefcaseBusiness } from "lucide-react";
import { Link } from "react-router-dom";

function fmtCurrency(value: number) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

const lifecycleTone: Record<string, string> = {
  New: "bg-sky-100 text-sky-800",
  Active: "bg-emerald-100 text-emerald-800",
  "High Performer": "bg-violet-100 text-violet-800",
  "At Risk": "bg-rose-100 text-rose-800",
};

export default function MAOverview() {
  const { token } = useMAAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    marketingAdminApi.overview(token).then((overview) => {
      setData(overview);
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

  const statCards = [
    { label: "Total partners", value: data?.totalPartners ?? 0, helper: "Accounts with partner login", icon: Users },
    { label: "Pending payouts", value: fmtCurrency(data?.pendingPayouts ?? 0), helper: "Commission awaiting settlement", icon: Wallet },
    { label: "Revenue influenced", value: fmtCurrency(data?.totalRevenue ?? 0), helper: "Attributed purchases across all partners", icon: TrendingUp },
    { label: "Pending applications", value: data?.pendingApplications ?? 0, helper: "Waiting for approval", icon: Clock },
  ];

  return (
    <div className="p-4 sm:p-8 space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card className="border-0 bg-slate-950 text-slate-50 shadow-[0_30px_80px_rgba(15,23,42,0.22)]">
          <CardContent className="p-8">
            <Badge className="border-0 bg-white/10 text-white">Admin intelligence</Badge>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Run the partner system by signals, not spreadsheets.</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              See where approvals are stuck, which partners are carrying momentum, and who is likely to stall before revenue does.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/marketing-admin/pending">
                <Button variant="secondary" className="rounded-full bg-white text-slate-900 hover:bg-white/90">
                  Review approvals
                </Button>
              </Link>
              <Link to="/marketing-admin/payouts">
                <Button variant="outline" className="rounded-full border-white/20 bg-transparent text-white hover:bg-white/10">
                  Open payouts
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Action queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Pending applications", value: data?.actionQueue?.pendingApplications ?? 0 },
              { label: "Need fresh traffic", value: data?.actionQueue?.partnersNeedingTraffic ?? 0 },
              { label: "Need conversion help", value: data?.actionQueue?.partnersNeedingConversionHelp ?? 0 },
              { label: "Open lead pipelines", value: data?.actionQueue?.partnersWithOpenLeads ?? 0 },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-3xl border border-border/70 px-4 py-3">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-lg font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, helper, icon: Icon }) => (
          <Card key={label} className="border-border/70 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
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

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr_1fr]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Lifecycle view</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(data?.lifecycleBuckets || {}).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-3xl border border-border/70 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Badge className={lifecycleTone[label] || "bg-muted text-foreground"}>{label}</Badge>
                </div>
                <span className="text-lg font-semibold text-foreground">{String(value)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Top performers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data?.topPerformers || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No partner performance data yet.</p>
            ) : (data.topPerformers || []).map((partner: any, index: number) => (
              <div key={partner.id} className="rounded-3xl border border-border/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">#{index + 1}</span>
                      <p className="font-medium text-foreground">{partner.name}</p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{partner.partnerType} · {partner.code}</p>
                  </div>
                  <Badge className={lifecycleTone[partner.lifecycle] || "bg-muted text-foreground"}>{partner.lifecycle}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Revenue</p>
                    <p className="mt-1 font-semibold text-foreground">{fmtCurrency(partner.totalRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Students</p>
                    <p className="mt-1 font-semibold text-foreground">{partner.totalStudents}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Health</p>
                    <p className="mt-1 font-semibold text-foreground">{partner.healthScore}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">At-risk partners</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data?.atRiskPartners || []).length === 0 ? (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                No critical partner drop-off detected right now.
              </div>
            ) : (data.atRiskPartners || []).map((partner: any) => (
              <div key={partner.id} className="rounded-3xl border border-rose-200 bg-rose-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{partner.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{partner.partnerType} · {partner.code}</p>
                  </div>
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Health</p>
                    <p className="mt-1 font-semibold text-foreground">{partner.healthScore}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Open leads</p>
                    <p className="mt-1 font-semibold text-foreground">{partner.leadsOpen}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {[
          {
            title: "Approvals",
            text: "Self-registered partners are waiting for activation. Clearing this queue quickly protects conversion momentum.",
            icon: Clock,
            to: "/marketing-admin/pending",
          },
          {
            title: "Partner operations",
            text: "Use partner records to spot lifecycle stage, health risk, and where manual support is still being overused.",
            icon: Activity,
            to: "/marketing-admin/partners",
          },
          {
            title: "Network quality",
            text: "See how referral trees are growing and where high-leverage partners are actually building second-order distribution.",
            icon: BriefcaseBusiness,
            to: "/marketing-admin/network",
          },
        ].map(({ title, text, icon: Icon, to }) => (
          <Card key={title} className="border-border/70 shadow-sm">
            <CardContent className="p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
              <Link to={to} className="mt-5 inline-flex items-center text-sm font-medium text-primary">
                Open view
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
