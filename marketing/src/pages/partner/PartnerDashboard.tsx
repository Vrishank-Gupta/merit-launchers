import { useEffect, useState } from "react";
import { usePartnerAuth } from "@/hooks/usePartnerAuth";
import { partnerApi } from "@/lib/partnerApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from "recharts";
import { Loader2, Users, TrendingUp, Wallet, Clock, Percent, AlertCircle, CheckCircle, Info, Smartphone, Globe } from "lucide-react";

function fmt(n: number) {
  return `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function SmartAlerts({ stats }: { stats: any }) {
  const alerts: { icon: any; color: string; msg: string }[] = [];

  if (stats.pendingCommission > 0) {
    alerts.push({
      icon: Clock,
      color: "text-yellow-600",
      msg: `You have ${fmt(stats.pendingCommission)} in pending commission.`,
    });
  }

  const convRate = stats.totalStudents > 0 ? (stats.paidStudents / stats.totalStudents) * 100 : 0;
  if (convRate < 20 && stats.totalStudents > 5) {
    alerts.push({
      icon: AlertCircle,
      color: "text-orange-600",
      msg: `Your conversion rate is ${convRate.toFixed(1)}%. Share course value to improve.`,
    });
  }

  if (stats.totalStudents >= 50) {
    alerts.push({
      icon: CheckCircle,
      color: "text-green-600",
      msg: "You've crossed 50 students — eligible for the Certificate milestone!",
    });
  }

  if (stats.totalClicks === 0) {
    alerts.push({
      icon: Info,
      color: "text-primary",
      msg: "No referral clicks tracked yet. Share your referral link to get started.",
    });
  }

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map(({ icon: Icon, color, msg }) => (
        <div key={msg} className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border/50 shadow-sm">
          <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${color}`} />
          <p className="text-sm text-foreground">{msg}</p>
        </div>
      ))}
    </div>
  );
}

export default function PartnerDashboard() {
  const { token } = usePartnerAuth();
  const [stats, setStats] = useState<any>(null);
  const [platform, setPlatform] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([partnerApi.stats(token), partnerApi.platformStats(token)]).then(([s, p]) => {
      setStats(s);
      setPlatform(p);
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

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Failed to load dashboard data. Please refresh.
      </div>
    );
  }

  const convRate = stats.totalStudents > 0
    ? (stats.paidStudents / stats.totalStudents) * 100
    : 0;

  const statCards = [
    {
      label: "Students Referred",
      value: stats.totalStudents,
      sub: `${stats.paidStudents} paid · ${stats.freeStudents} free`,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
      format: (v: number) => v.toString(),
    },
    {
      label: "Revenue Generated",
      value: stats.totalRevenue,
      sub: `${stats.totalStudents} students`,
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-100",
      format: fmt,
    },
    {
      label: "Commission Earned",
      value: stats.paidCommission,
      sub: `${stats.currentSlabRate}% current rate`,
      icon: Wallet,
      color: "text-blue-600",
      bg: "bg-blue-100",
      format: fmt,
    },
    {
      label: "Pending Commission",
      value: stats.pendingCommission,
      sub: "Awaiting payout",
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-100",
      format: fmt,
    },
    {
      label: "Conversion Rate",
      value: convRate,
      sub: `${stats.paidStudents} of ${stats.totalStudents} paid`,
      icon: Percent,
      color: "text-purple-600",
      bg: "bg-purple-100",
      format: (v: number) => `${v.toFixed(1)}%`,
    },
  ];

  const funnelData = [
    { name: "Clicks", value: stats.totalClicks, fill: "hsl(190 85% 50%)" },
    { name: "Free Signups", value: stats.totalStudents, fill: "hsl(210 80% 55%)" },
    { name: "Paid Students", value: stats.paidStudents, fill: "hsl(150 60% 50%)" },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Your partner performance overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map(({ label, value, sub, icon: Icon, color, bg, format }) => (
          <Card key={label} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">{label}</CardTitle>
              <div className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{format(value)}</div>
              <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* App vs Web signups */}
      {(stats.mobileSignups > 0 || stats.webSignups > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="shadow-sm border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Android App Signups</CardTitle>
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-4 h-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.mobileSignups}</div>
              <p className="text-xs text-muted-foreground mt-1">Students who installed the app via your code</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Web Signups</CardTitle>
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Globe className="w-4 h-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.webSignups}</div>
              <p className="text-xs text-muted-foreground mt-1">Students who signed up via web browser</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Smart Alerts */}
      <SmartAlerts stats={stats} />

      {/* Conversion Funnel + Channel Clicks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={funnelData} layout="vertical" margin={{ left: 20, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={90} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {funnelData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle>Channel Clicks</CardTitle></CardHeader>
          <CardContent>
            {!stats.channelBreakdown?.length ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No click data yet</div>
            ) : (
              <div className="space-y-3 pt-2">
                {stats.channelBreakdown.map((c: any) => (
                  <div key={c.channel} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-sm font-medium capitalize">{c.channel}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.min(stats.totalClicks > 0 ? (parseInt(c.count || "0") / stats.totalClicks) * 100 : 0, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-8 text-right">{c.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Platform Breakdown */}
      {platform && (platform.loginsByPlatform?.length > 0 || platform.loginTrend?.length > 0) && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Platform Activity</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Login counts by platform */}
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-sm">Logins by Platform</CardTitle></CardHeader>
              <CardContent className="space-y-3 pt-1">
                {platform.loginsByPlatform?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No login data yet</p>
                ) : platform.loginsByPlatform.map((r: any) => (
                  <div key={r.platform} className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium capitalize">
                      {(r.platform === "android" || r.platform === "ios") ? (
                        <Smartphone className="w-4 h-4 text-green-600" />
                      ) : (
                        <Globe className="w-4 h-4 text-blue-600" />
                      )}
                      {r.platform === "android" ? "Android App" : r.platform === "ios" ? "iOS App" : "Web"}
                    </span>
                    <span className="font-bold text-foreground">{r.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Purchase source */}
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-sm">Sales by Platform</CardTitle></CardHeader>
              <CardContent className="space-y-3 pt-1">
                {platform.purchasesByPlatform?.filter((r: any) => r.platform !== "unknown").length === 0 ? (
                  <p className="text-sm text-muted-foreground">No purchase source data yet</p>
                ) : platform.purchasesByPlatform?.map((r: any) => (
                  <div key={r.platform} className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                      {(r.platform === "android" || r.platform === "ios") ? (
                        <Smartphone className="w-4 h-4 text-green-600" />
                      ) : r.platform === "web" ? (
                        <Globe className="w-4 h-4 text-blue-600" />
                      ) : null}
                      {r.platform === "android" ? "Android App" : r.platform === "ios" ? "iOS App" : r.platform === "web" ? "Web" : "Unknown"}
                    </span>
                    <div className="text-right">
                      <div className="font-bold text-foreground">{r.count} sales</div>
                      <div className="text-xs text-muted-foreground">₹{Number(r.revenue).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 30-day login trend */}
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-sm">Daily Logins (30d)</CardTitle></CardHeader>
              <CardContent>
                {platform.loginTrend?.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={140}>
                    <LineChart data={platform.loginTrend} margin={{ left: -20, right: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" tick={false} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip labelFormatter={(l) => l} />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="android" stroke="hsl(150 60% 45%)" dot={false} name="Android" strokeWidth={2} />
                      <Line type="monotone" dataKey="web" stroke="hsl(210 80% 55%)" dot={false} name="Web" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
