import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePartnerAuth } from "@/hooks/usePartnerAuth";
import { partnerApi } from "@/lib/partnerApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Loader2, ArrowLeft, Users, TrendingUp, Wallet } from "lucide-react";

function fmt(n: number) {
  return `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function PartnerSubDetail() {
  const { token } = usePartnerAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !id) return;
    partnerApi.subPartnerDetail(token, id).then((d) => { setData(d); setLoading(false); }).catch(() => navigate("/partner/network"));
  }, [token, id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const {
    partner,
    students = [],
    payouts = [],
    clicks = [],
    totalClicks = 0,
    monthly = [],
    totalStudents = 0,
    totalRevenue = 0,
    currentSlab = 0,
  } = data || {};
  const totalCommission = (totalRevenue || 0) * ((currentSlab || 0) / 100);
  const paidCommission = payouts.filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + parseFloat(p.paid_amount || "0"), 0);
  const paidStudents = students.filter((s: any) => parseInt(s.purchase_count || "0") > 0).length;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/partner/network")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{partner.name}</h1>
            <Badge variant={partner.status === "active" ? "default" : "secondary"}>{partner.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {partner.partner_type} · Code: <code className="text-primary">{partner.code}</code>
            {partner.associate_id && ` · ${partner.associate_id}`}
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Students", value: totalStudents.toString(), sub: `${paidStudents} paid`, icon: Users, color: "text-primary", bg: "bg-primary/10" },
          { label: "Revenue", value: fmt(totalRevenue), sub: `${currentSlab}% slab`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-100" },
          { label: "Commission", value: fmt(totalCommission), sub: `${fmt(paidCommission)} paid`, icon: Wallet, color: "text-blue-600", bg: "bg-blue-100" },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <Card key={label} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
              <div className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
              <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly revenue */}
        <Card className="shadow-sm">
          <CardHeader><CardTitle>Monthly Revenue</CardTitle></CardHeader>
          <CardContent>
            {monthly.length === 0 ? (
              <div className="text-center h-32 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthly} margin={{ bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month_label" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => fmt(parseFloat(v))} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Payout history */}
        <Card className="shadow-sm">
          <CardHeader><CardTitle>Payout History</CardTitle></CardHeader>
          <CardContent>
            {payouts.length === 0 ? (
              <div className="text-center h-32 flex items-center justify-center text-muted-foreground text-sm">No payouts yet</div>
            ) : (
              <div className="divide-y divide-border">
                {payouts.map((p: any) => (
                  <div key={p.month} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{p.month}</p>
                      <p className="text-xs text-muted-foreground">{fmt(parseFloat(p.commission_amount))} earned</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={p.status === "paid" ? "default" : "secondary"}>{p.status}</Badge>
                      {p.paid_amount && <p className="text-xs text-muted-foreground mt-1">{fmt(parseFloat(p.paid_amount))} paid</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Channel Click Breakdown */}
      {clicks?.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader><CardTitle>Channel Clicks <span className="text-muted-foreground font-normal text-sm">({totalClicks} total)</span></CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3 pt-1">
              {clicks.map((c: any) => (
                <div key={c.channel} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-sm font-medium capitalize">{c.channel}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-28 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min(totalClicks > 0 ? (parseInt(c.clicks || "0") / totalClicks) * 100 : 0, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-8 text-right">{c.clicks}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent students */}
      <Card className="shadow-sm">
        <CardHeader><CardTitle>Recent Students <span className="text-muted-foreground font-normal text-sm">({totalStudents} total)</span></CardTitle></CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">No students yet</div>
          ) : (
            <div className="divide-y divide-border">
              {students.map((s: any) => (
                <div key={s.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{s.name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{s.city || "—"} · {s.joined_at ? new Date(s.joined_at).toLocaleDateString() : "—"}</p>
                  </div>
                  <div className="text-right">
                    {parseInt(s.purchase_count || "0") > 0 ? (
                      <Badge variant="default" className="text-xs">{fmt(parseFloat(s.total_spent))}</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Free</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
