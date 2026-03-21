import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMAAuth } from "@/hooks/useMarketingAdminAuth";
import { marketingAdminApi } from "@/lib/partnerApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Loader2, ArrowLeft, Pencil,
} from "lucide-react";

function fmt(n: number) {
  return `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function MAPartnerDetail() {
  const { token } = useMAAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !id) return;
    marketingAdminApi.getPartner(token, id).then((d) => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [token, id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Partner not found. <button className="ml-2 underline" onClick={() => navigate(-1)}>Go back</button>
      </div>
    );
  }

  const { partner, students = [], payouts = [], clicks = [], totalClicks = 0 } = data;

  return (
    <div className="p-8 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{partner.name}</h1>
            <p className="text-muted-foreground">
              {partner.associate_id || partner.code} · {partner.partner_type}
            </p>
          </div>
        </div>
        <Button onClick={() => navigate(`/marketing-admin/partners/${id}/edit`)}>
          <Pencil className="w-4 h-4 mr-2" />
          Edit
        </Button>
      </div>

      {/* Profile + Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Referral Code", value: <code className="bg-muted px-2 py-1 rounded text-sm">{partner.code}</code> },
          { label: "Login Email", value: partner.login_email || "—" },
          { label: "Total Clicks", value: (totalClicks ?? 0).toString() },
          { label: "Commission Rate", value: partner.commission_rate != null ? `${partner.commission_rate}%` : "—" },
        ].map(({ label, value }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className="font-semibold text-sm">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>


      {/* Channel Click Breakdown */}
      {clicks?.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader><CardTitle>Channel Click Breakdown</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Channel</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clicks.map((c: any) => (
                  <TableRow key={c.channel}>
                    <TableCell className="capitalize">{c.channel}</TableCell>
                    <TableCell className="text-right font-semibold">{c.clicks}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Students Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Referred Students ({students?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Attempts</TableHead>
                <TableHead className="text-right">Spent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No students yet</TableCell>
                </TableRow>
              ) : students?.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name || "—"}</TableCell>
                  <TableCell>{s.city || "—"}</TableCell>
                  <TableCell>
                    {parseInt(s.purchase_count || "0") > 0 ? (
                      <Badge className="bg-green-100 text-green-800 border-0">Paid</Badge>
                    ) : (
                      <Badge variant="outline">Free</Badge>
                    )}
                  </TableCell>
                  <TableCell>{s.joined_at ? new Date(s.joined_at).toLocaleDateString("en-IN") : "—"}</TableCell>
                  <TableCell className="text-right">{s.attempt_count}</TableCell>
                  <TableCell className="text-right">{fmt(parseFloat(s.total_spent || 0))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payouts */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No payouts yet</TableCell>
                </TableRow>
              ) : payouts?.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>{p.month}</TableCell>
                  <TableCell className="text-right">{fmt(p.gross_revenue)}</TableCell>
                  <TableCell className="text-right">{p.weighted_commission_rate}%</TableCell>
                  <TableCell className="text-right font-semibold">{fmt(p.commission_amount)}</TableCell>
                  <TableCell>
                    {p.status === "paid" ? (
                      <Badge className="bg-green-100 text-green-800 border-0">Paid</Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800 border-0">Pending</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
