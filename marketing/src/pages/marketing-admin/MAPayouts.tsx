import { useEffect, useMemo, useState } from "react";
import { useMAAuth } from "@/hooks/useMarketingAdminAuth";
import { marketingAdminApi } from "@/lib/partnerApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Zap, CheckCircle, Wallet } from "lucide-react";

function fmtCurrency(value: number) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function MAPayouts() {
  const { token } = useMAAuth();
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [bulkPaying, setBulkPaying] = useState(false);
  const [generateMonth, setGenerateMonth] = useState(() => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");

  const load = () => {
    if (!token) return;
    marketingAdminApi.getPayouts(token).then((data) => {
      setPayouts(data.payouts || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [token]);

  const pending = useMemo(() => payouts.filter((payout) => payout.status === "pending"), [payouts]);

  const generate = async () => {
    if (!generateMonth || !token) return;
    setGenerating(true);
    setError("");
    try {
      await marketingAdminApi.generatePayouts(token, generateMonth);
      load();
    } catch (err: any) {
      setError(err.message || "Failed to generate payouts");
    } finally {
      setGenerating(false);
    }
  };

  const toggleRow = (payoutId: string) => {
    setSelected((current) => current.includes(payoutId) ? current.filter((id) => id !== payoutId) : [...current, payoutId]);
  };

  const bulkMarkPaid = async () => {
    if (!token || selected.length === 0) return;
    setBulkPaying(true);
    setError("");
    try {
      const rows = pending
        .filter((payout) => selected.includes(payout.id))
        .map((payout) => ({
          id: payout.id,
          paid_amount: Number(payout.commission_amount),
          notes: "Bulk marked paid from admin payouts workspace",
        }));
      await marketingAdminApi.bulkMarkPaid(token, rows);
      setSelected([]);
      load();
    } catch (err: any) {
      setError(err.message || "Failed to bulk mark paid");
    } finally {
      setBulkPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalPendingAmount = pending.reduce((sum, payout) => sum + Number(payout.commission_amount || 0), 0);

  const payoutTable = (rows: any[], allowSelect: boolean) => (
    <Table>
      <TableHeader>
        <TableRow>
          {allowSelect ? <TableHead className="w-12" /> : null}
          <TableHead>Partner</TableHead>
          <TableHead>Month</TableHead>
          <TableHead className="text-right">Revenue</TableHead>
          <TableHead className="text-right">Rate</TableHead>
          <TableHead className="text-right">Commission</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={allowSelect ? 7 : 6} className="py-12 text-center text-muted-foreground">
              No payouts found
            </TableCell>
          </TableRow>
        ) : rows.map((payout) => (
          <TableRow key={payout.id}>
            {allowSelect ? (
              <TableCell>
                <Checkbox checked={selected.includes(payout.id)} onCheckedChange={() => toggleRow(payout.id)} />
              </TableCell>
            ) : null}
            <TableCell className="font-medium">{payout.affiliate_name}</TableCell>
            <TableCell>{payout.month}</TableCell>
            <TableCell className="text-right">{fmtCurrency(payout.gross_revenue)}</TableCell>
            <TableCell className="text-right">{payout.weighted_commission_rate}%</TableCell>
            <TableCell className="text-right font-semibold">{fmtCurrency(payout.commission_amount)}</TableCell>
            <TableCell>
              {payout.status === "paid" ? (
                <Badge className="bg-emerald-100 text-emerald-800 border-0">Paid</Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-800 border-0">Pending</Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Payouts</h1>
        <p className="text-muted-foreground mt-1">Generate monthly payouts and clear the queue in batches.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Generate monthly payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <Label>Month</Label>
                <Input type="month" value={generateMonth} onChange={(e) => setGenerateMonth(e.target.value)} className="w-full sm:w-56" />
              </div>
              <Button onClick={generate} disabled={generating}>
                {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                Generate payouts
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Pending queue</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-3xl border border-border/70 px-4 py-3">
              <p className="text-sm text-muted-foreground">Pending payouts</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{pending.length}</p>
            </div>
            <div className="rounded-3xl border border-border/70 px-4 py-3">
              <p className="text-sm text-muted-foreground">Pending amount</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{fmtCurrency(totalPendingAmount)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {error ? (
        <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      ) : null}

      <Tabs defaultValue="pending">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="all">All ({payouts.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">Pending payout queue</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Select multiple rows to clear routine payouts quickly.</p>
              </div>
              <Button onClick={bulkMarkPaid} disabled={selected.length === 0 || bulkPaying}>
                {bulkPaying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                Mark selected paid
              </Button>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {payoutTable(pending, true)}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="all">
          <Card className="border-border/70 shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
              {payoutTable(payouts, false)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
