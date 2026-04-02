import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePartnerAuth } from "@/hooks/usePartnerAuth";
import { partnerApi } from "@/lib/partnerApi";
import { formatPartnerAddress } from "@/lib/partnerMeta";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Users, ChevronRight, User, Copy, CheckCircle, Clock } from "lucide-react";

function fmt(n: number) {
  return `Rs ${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function Avatar({ partner, size = "h-12 w-12" }: { partner: any; size?: string }) {
  if (partner?.profile_image_url) {
    return <img src={partner.profile_image_url} alt={partner.name || "Partner"} className={`${size} rounded-2xl object-cover border border-border/70`} />;
  }
  return (
    <div className={`${size} rounded-2xl bg-muted border border-border/70 flex items-center justify-center`}>
      <User className="w-5 h-5 text-muted-foreground" />
    </div>
  );
}

export default function PartnerNetwork() {
  const { token, affiliate } = usePartnerAuth();
  const [data, setData] = useState<any>(null);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState("");
  const [approveError, setApproveError] = useState("");
  const navigate = useNavigate();

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
      toast({
        title: `${type === "student" ? "Student" : "Partner"} referral link copied`,
        description: "The link is now on your clipboard and ready to paste.",
      });
      setTimeout(() => setCopied(""), 2000);
    }).catch(() => {
      toast({
        title: "Could not copy link",
        description: "Please copy the link manually from the field shown above.",
        variant: "destructive",
      });
    });
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
                <p className="text-xs text-muted-foreground mb-3">
                  Share this to refer students. They will be redirected to the student entry point.
                </p>
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
                <p className="text-xs text-muted-foreground mb-3">
                  Share this to onboard a new partner. After you approve them, they receive an email invitation to set their password.
                </p>
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
              These people used your onboarding link. Review and approve them.
            </p>
            <div className="divide-y divide-border">
              {pending.map((p: any) => (
                <div key={p.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar partner={p} size="h-10 w-10" />
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

      {data?.upline && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-4 h-4" /> Who Onboarded You
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar partner={data.upline} />
              <div>
                <p className="font-semibold text-foreground">{data.upline.name}</p>
                <p className="text-sm text-muted-foreground">
                  {data.upline.partner_type} · Code: <code className="text-primary">{data.upline.code}</code>
                </p>
                <p className="text-sm text-muted-foreground">
                  {data.upline.login_email || "No email available"}
                  {data.upline.phone ? ` · ${data.upline.phone}` : ""}
                </p>
                {data.upline.profession ? (
                  <p className="text-xs text-muted-foreground">{data.upline.profession}</p>
                ) : null}
                {formatPartnerAddress(data.upline) ? (
                  <p className="text-xs text-muted-foreground">{formatPartnerAddress(data.upline)}</p>
                ) : null}
                {data.upline.associate_id && <p className="text-xs text-muted-foreground">ID: {data.upline.associate_id}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Partners I&apos;ve Onboarded
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
                    <Avatar partner={p} />
                    <div>
                      <p className="font-semibold text-sm text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.partner_type} · <code className="text-primary">{p.code}</code>
                        {p.current_slab != null ? ` · ${p.current_slab}% commission` : ""}
                      </p>
                      <div className="mt-1">
                        <Badge className={p.invitation_status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>
                          {p.invitation_status === "active" ? "Active" : "Invitation sent"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {p.login_email || "No email available"}
                        {p.phone ? ` · ${p.phone}` : ""}
                      </p>
                      {p.profession || p.pincode ? (
                        <p className="text-xs text-muted-foreground">
                          {[p.profession, p.pincode].filter(Boolean).join(" · ")}
                        </p>
                      ) : null}
                      {formatPartnerAddress(p) ? (
                        <p className="text-xs text-muted-foreground">{formatPartnerAddress(p)}</p>
                      ) : null}
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

      <Dialog open={!!approveTarget} onOpenChange={(open) => { if (!open && !approving) { setApproveTarget(null); setApproved(null); setApproveError(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approved ? "Approved" : `Approve ${approveTarget?.name}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {approved ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                <p className="font-medium text-green-900">{approved.name} is now active.</p>
                <p className="mt-2 text-sm text-green-800">
                  Login email: <strong>{approved.email || "Already on file"}</strong>
                </p>
                <p className="mt-1 text-xs text-green-700">
                  An invitation email has been sent. They can now set their password and activate the partner portal.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  You are approving <strong>{approveTarget?.name}</strong> as a partner in your network.
                </p>
                <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-1">
                  <p><strong>Email:</strong> {approveTarget?.login_email || "—"}</p>
                  <p><strong>Phone:</strong> {approveTarget?.phone || "—"}</p>
                  <p><strong>Type:</strong> {approveTarget?.partner_type || "—"}</p>
                </div>
                {approveError ? (
                  <div className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{approveError}</div>
                ) : null}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setApproveTarget(null)} disabled={approving}>
                    Cancel
                  </Button>
                  <Button onClick={handleApprove} disabled={approving}>
                    {approving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Approve
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

