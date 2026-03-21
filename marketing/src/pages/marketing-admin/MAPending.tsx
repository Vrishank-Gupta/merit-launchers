import { useEffect, useState } from "react";
import { useMAAuth } from "@/hooks/useMarketingAdminAuth";
import { marketingAdminApi } from "@/lib/partnerApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, CheckCircle, Clock, Info } from "lucide-react";

export default function MAPending() {
  const { token } = useMAAuth();
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    marketingAdminApi.getPending(token).then((d) => {
      setPending(d.pending || []);
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

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Pending Applications</h1>
        <p className="text-muted-foreground mt-1">Overview of all self-registered applications across the network.</p>
      </div>

      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Approvals are handled by the referring partner</p>
          <p>Each pending applicant is reviewed and approved by the partner who shared their onboarding link. The applicant set their own password when they applied — the referring partner just clicks Approve to activate the account. You can monitor the queue here.</p>
        </div>
      </div>

      {pending.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="pt-12 pb-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No pending applications</h2>
            <p className="text-muted-foreground">All applications have been reviewed.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pending.map((p) => (
            <Card key={p.id} className="shadow-sm">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-foreground">{p.name}</p>
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        pending
                      </Badge>
                      <Badge variant="outline" className="text-xs">{p.partner_type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Code: <code className="text-primary">{p.code}</code>
                      {p.referred_by_name && (
                        <> · Referred by: <span className="font-medium">{p.referred_by_name}</span> (<code>{p.referred_by_code}</code>)</>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Applied: {new Date(p.created_at).toLocaleDateString("en-IN")}
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
