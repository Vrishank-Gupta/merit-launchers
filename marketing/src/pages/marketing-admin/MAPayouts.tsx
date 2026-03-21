import { useEffect, useState } from "react";
import { useMAAuth } from "@/hooks/useMarketingAdminAuth";
import { marketingAdminApi } from "@/lib/partnerApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Zap, CheckCircle } from "lucide-react";

function fmt(n: number) {
  return `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function MAPayouts() {
  const { token } = useMAAuth();
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateMonth, setGenerateMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [generateResult, setGenerateResult] = useState<any>(null);

  const [payDialog, setPayDialog] = useState<any>(null);
  const [payForm, setPayForm] = useState({ paid_amount: "", notes: "" });
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    if (!token) return;
    marketingAdminApi.getPayouts(token).then((d) => {
      setPayouts(d.payouts || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [token]);

  const generate = async () => {
    if (!generateMonth) return;
    setGenerating(true);
    setError("");
    try {
      const result = await marketingAdminApi.generatePayouts(token!, generateMonth);
      setGenerateResult(result);
      load();
    } catch (e: any) {
      setError(e.message || "Failed to generate payouts");
    } finally {
      setGenerating(false);
    }
  };

  const markPaid = async () => {
    if (!payDialog) return;
    setPaying(true);
    try {
      await marketingAdminApi.markPaid(token!, payDialog.id, {
        paid_amount: parseFloat(payForm.paid_amount) || payDialog.commission_amount,
        notes: payForm.notes,
      });
      setPayDialog(null);
      setPayForm({ paid_amount: "", notes: "" });
      load();
    } catch (e: any) {
      setError(e.message || "Failed to mark as paid");
    } finally {
      setPaying(false);
    }
  };

  const pending = payouts.filter((p) => p.status === "pending");
  const all = payouts;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const PayoutTable = ({ rows }: { rows: any[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Partner</TableHead>
          <TableHead>Month</TableHead>
          <TableHead className="text-right">Revenue</TableHead>
          <TableHead className="text-right">Rate</TableHead>
          <TableHead className="text-right">Commission</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No payouts found</TableCell>
          </TableRow>
        ) : rows.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="font-medium">{p.affiliate_name}</TableCell>
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
            <TableCell>
              {p.status === "pending" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setPayDialog(p);
                    setPayForm({ paid_amount: String(p.commission_amount), notes: "" });
                  }}
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  Mark Paid
                </Button>
              )}
              {p.status === "paid" && p.paid_at && (
                <span className="text-xs text-muted-foreground">
                  {p.paid_at ? new Date(p.paid_at).toLocaleDateString("en-IN") : "—"}
                </span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Payouts</h1>
        <p className="text-muted-foreground mt-1">Commission payout management</p>
      </div>

      {/* Generate section */}
      <Card className="mb-6 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Generate Monthly Payouts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>Month</Label>
              <Input
                type="month"
                value={generateMonth}
                onChange={(e) => setGenerateMonth(e.target.value)}
                className="w-full sm:w-48"
              />
            </div>
            <Button onClick={generate} disabled={generating}>
              {generating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
              ) : (
                <><Zap className="w-4 h-4 mr-2" />Generate Payouts</>
              )}
            </Button>
          </div>
          {generateResult && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm text-green-800">
              Generated {generateResult.generated?.length || 0} payout(s).{" "}
              {generateResult.generated?.map((g: any) => `${g.affiliate}: ${fmt(g.amount)}`).join(", ")}
            </div>
          )}
          {error && (
            <div className="mt-4 p-3 bg-destructive/10 rounded-lg text-sm text-destructive">{error}</div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="pending">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">
            Pending ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="all">All ({all.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <Card className="shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
              <PayoutTable rows={pending} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="all">
          <Card className="shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
              <PayoutTable rows={all} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Mark Paid Dialog */}
      <Dialog open={!!payDialog} onOpenChange={(o) => !o && setPayDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Paid — {payDialog?.affiliate_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p>Month: <strong>{payDialog?.month}</strong></p>
              <p>Commission: <strong>{fmt(payDialog?.commission_amount || 0)}</strong></p>
            </div>
            <div className="space-y-2">
              <Label>Paid Amount (₹)</Label>
              <Input
                type="number"
                value={payForm.paid_amount}
                onChange={(e) => setPayForm((f) => ({ ...f, paid_amount: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input
                value={payForm.notes}
                onChange={(e) => setPayForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Transfer ID, remarks..."
              />
            </div>
            <Button onClick={markPaid} disabled={paying} className="w-full">
              {paying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Confirm Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
