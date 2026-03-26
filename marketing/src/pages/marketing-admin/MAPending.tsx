import { useEffect, useState } from "react";
import { useMAAuth } from "@/hooks/useMarketingAdminAuth";
import { marketingAdminApi } from "@/lib/partnerApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, User, CheckCircle, Clock, Info } from "lucide-react";

export default function MAPending() {
  const { token } = useMAAuth();
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [approving, setApproving] = useState(false);

  const load = () => {
    if (!token) return;
    marketingAdminApi.getPending(token).then((data) => {
      setPending(data.pending || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [token]);

  const toggle = (id: string) => {
    setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  };

  const bulkApprove = async () => {
    if (!token || selected.length === 0) return;
    setApproving(true);
    try {
      await marketingAdminApi.bulkApprovePending(token, selected);
      setSelected([]);
      load();
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pending applications</h1>
          <p className="text-muted-foreground mt-1">Monitor the queue and activate strong applicants in batches when needed.</p>
        </div>
        <Button onClick={bulkApprove} disabled={selected.length === 0 || approving}>
          {approving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
          Approve selected
        </Button>
      </div>

      <div className="flex items-start gap-3 rounded-3xl border border-blue-200 bg-blue-50 p-4">
        <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Default flow still favors partner ownership</p>
          <p>Approvals can still be handled by the referring partner. This admin queue exists so operations do not stall when a referrer goes silent.</p>
        </div>
      </div>

      {pending.length === 0 ? (
        <Card className="border-border/70 shadow-sm">
          <CardContent className="py-14 text-center">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No pending applications</h2>
            <p className="text-muted-foreground">The approval queue is clear.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pending.map((partner) => (
            <Card key={partner.id} className="border-border/70 shadow-sm">
              <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <Checkbox checked={selected.includes(partner.id)} onCheckedChange={() => toggle(partner.id)} />
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">{partner.name}</p>
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="mr-1 h-3 w-3" />
                        Pending
                      </Badge>
                      <Badge variant="outline" className="text-xs">{partner.partner_type}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Code: <code className="text-primary">{partner.code}</code>
                      {partner.referred_by_name ? <> · Referred by <span className="font-medium">{partner.referred_by_name}</span> (<code>{partner.referred_by_code}</code>)</> : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Applied {new Date(partner.created_at).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
