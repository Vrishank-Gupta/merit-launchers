import { useEffect, useState } from "react";
import { useMAAuth } from "@/hooks/useMarketingAdminAuth";
import { marketingAdminApi } from "@/lib/partnerApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Wallet, TrendingUp, Clock } from "lucide-react";
import { Link } from "react-router-dom";

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function MAOverview() {
  const { token } = useMAAuth();
  const [data, setData] = useState<any>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      marketingAdminApi.overview(token),
      marketingAdminApi.getPending(token),
    ]).then(([overview, pending]) => {
      setData(overview);
      setPendingCount(pending.pending?.length ?? 0);
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

  const stats = [
    {
      label: "Total Partners",
      value: data?.totalPartners ?? 0,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
      format: (v: number) => v.toString(),
    },
    {
      label: "Pending Payouts",
      value: data?.pendingPayouts ?? 0,
      icon: Wallet,
      color: "text-orange-600",
      bg: "bg-orange-100",
      format: fmt,
    },
    {
      label: "Total Revenue",
      value: data?.totalRevenue ?? 0,
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-100",
      format: fmt,
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Overview</h1>
        <p className="text-muted-foreground mt-1">Partner program summary</p>
      </div>

      {pendingCount > 0 && (
        <div className="mb-6 flex items-center gap-4 p-4 rounded-lg bg-amber-50 border border-amber-200">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-amber-800">
              {pendingCount} partner application{pendingCount !== 1 ? "s" : ""} awaiting approval
            </p>
            <p className="text-sm text-amber-700">Review and approve pending partner registrations.</p>
          </div>
          <Link to="/marketing-admin/pending">
            <Button size="sm" variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100">
              Review
            </Button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map(({ label, value, icon: Icon, color, bg, format }) => (
          <Card key={label} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{format(value)}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
