import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePartnerAuth } from "@/hooks/usePartnerAuth";
import { partnerApi } from "@/lib/partnerApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Users, ChevronRight, User, Copy, CheckCircle, Clock, AlertCircle } from "lucide-react";

function fmt(n: number) {
  return `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function PartnerNetwork() {
  const { token, affiliate } = usePartnerAuth();
  const [data, setData] = useState<any>(null);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState("");
  const [approveError, setApproveError] = useState("");
  const navigate = useNavigate();

  // Approve dialog state
  const [approveTarget, setApproveTarget] = useState<any>(null);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState<{ name: string; email: string } | null>(null);

  const load = () => {
    if (!token) return;
    Promise.all([
      partnerApi.network(token),
      partnerApi.pendingApplications(token),
    ]).then(([net, pend]) => {
      setData(net);
      setPending(pend.pending || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [token]);

  const copyLink = (type: "student" | "partner") => {
    if (!affiliate?.code) return;
    const url = type === "student"
      ? `${window.location.origin}/ref/${affiliate.code}`
      : `${window.location.origin}/join/${affiliate.code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(type);
      setTimeout(() => setCopied(""), 2000);
    }).catch(() => alert("Could not copy — please copy the link manually."));
  };

  const openApprove = (applicant: any) => {
    setApproveTarget(applicant);
    setApproved(null);
    setApproveError("");
  };

  const handleApprove = async () => {
    if (!approveTarget) return;
    setApproving(true);
    setApproveError("");
    try {
      const result = await partnerApi.approvePendingApplication(token!, approveTarget.id, {});
      setApproved({
        name: result.name || approveTarget.name,
        email: result.loginEmail || approveTarget.login_email,
      });
      load();
    } catch (e: any) {
      setApproveError(e.message || "Failed to approve. Please try again.");
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

  const subPartners = data?.subPartners || [];

  return (
    <div className="p-4 sm:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Network</h1>
        <p className="text-muted-foreground mt-1">Partners you've onboarded and your upline</p>
      </div>

      {/* Referral Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-sm border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Student Referral Link</CardTitle>
          </CardHeader>
          <CardContent>
            {affiliate?.code ? (
              <>
                <code className="text-xs text-muted-foreground block mb-3 bg-muted rounded p-2 break-all">
                  {window.location.origin}/ref/{affiliate.code}
                </code>
                <p className="text-xs text-muted-foreground mb-3">Share this to refer students. They'll be redirected to download the app.</p>
                <Button size="sm" variant="outline" onClick={() => copyLink("student")}>
                  {copied === "student" ? <CheckCircle className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied === "student" ? "Copied!" : "Copy Link"}
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Referral code not available.</p>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-sm border-muted">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Partner Onboarding Link</CardTitle>
          </CardHeader>
          <CardContent>
            {affiliate?.code ? (
              <>
                <code className="text-xs text-muted-foreground block mb-3 bg-muted rounded p-2 break-all">
                  {window.location.origin}/join/{affiliate.code}
                </code>
                <p className="text-xs text-muted-foreground mb-3">Share this to onboard a new partner. You approve them and share login credentials.</p>
                <Button size="sm" variant="outline" onClick={() => copyLink("partner")}>
                  {copied === "partner" ? <CheckCircle className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied === "partner" ? "Copied!" : "Copy Link"}
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Referral code not available.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Applications */}
      {pending.length > 0 && (
        <Card className="shadow-sm border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <Clock className="w-4 h-4" />
              Pending Applications
              <Badge className="bg-yellow-100 text-yellow-800 border-0">{pending.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              These people used your onboarding link. Review and approve them — they set their own password when applying.
            </p>
            <div className="divide-y divide-border">
              {pending.map((p: any) => (
                <div key={p.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-yellow-50 border border-yellow-200 flex items-center justify-center">
                      <User className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.partner_type}
                        {p.login_email && ` · ${p.login_email}`}
                        {p.phone && ` · ${p.phone}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Applied {p.created_at ? new Date(p.created_at).toLocaleDateString("en-IN") : "—"}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => openApprove(p)}>
                    Review & Approve
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upline */}
      {data?.upline && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-4 h-4" /> Who Onboarded You
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{data.upline.name}</p>
                <p className="text-sm text-muted-foreground">{data.upline.partner_type} · Code: <code className="text-primary">{data.upline.code}</code></p>
                {data.upline.associate_id && <p className="text-xs text-muted-foreground">ID: {data.upline.associate_id}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sub-partners */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Partners I've Onboarded
            <Badge variant="secondary">{subPartners.filter((p: any) => p.status === "active").length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subPartners.filter((p: any) => p.status === "active").length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No active partners yet. Share your partner link to onboard associates.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {subPartners.filter((p: any) => p.status === "active").map((p: any) => (
                <div key={p.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.partner_type} · <code className="text-primary">{p.code}</code>
                        {p.current_slab != null ? ` · ${p.current_slab}% commission` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.total_students} students · {fmt(parseFloat(p.total_revenue || "0"))} revenue
                        {parseInt(p.sub_partner_count || "0") > 0 && ` · ${p.sub_partner_count} sub-partners`}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/partner/network/${p.id}`)}>
                    View <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={!!approveTarget} onOpenChange={(open) => { if (!open && !approving) { setApproveTarget(null); setApproved(null); setApproveError(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approved ? "Approved — Share Credentials" : `Approve ${approveTarget?.name}`}
            </DialogTitle>
          </DialogHeader>

          {approved ? (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-800 font-medium">{approved.name} is now active!</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Let them know they can now log in at <span className="font-medium text-foreground">{window.location.origin}/partner/login</span> with the email and password they set when they applied.
              </p>
              <Button className="w-full" onClick={() => { setApproveTarget(null); setApproved(null); }}>
                Done
              </Button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
                <p><span className="text-muted-foreground">Name:</span> <span className="font-medium">{approveTarget?.name}</span></p>
                <p><span className="text-muted-foreground">Type:</span> {approveTarget?.partner_type}</p>
                {approveTarget?.login_email && <p><span className="text-muted-foreground">Email:</span> {approveTarget?.login_email}</p>}
                {approveTarget?.phone && <p><span className="text-muted-foreground">Phone:</span> {approveTarget?.phone}</p>}
              </div>
              <p className="text-sm text-muted-foreground">
                They set their own password when applying. Approving will activate their account immediately.
              </p>
              <p className="text-xs text-muted-foreground">Commission rate is set by partner type — managed by the admin.</p>
              {approveError && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                  <p className="text-sm text-destructive">{approveError}</p>
                </div>
              )}
              <Button className="w-full" onClick={handleApprove} disabled={approving}>
                {approving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Approve & Activate
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
