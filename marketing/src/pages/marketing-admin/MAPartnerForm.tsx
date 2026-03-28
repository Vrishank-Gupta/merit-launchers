import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMAAuth } from "@/hooks/useMarketingAdminAuth";
import { marketingAdminApi } from "@/lib/partnerApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, ArrowLeft, Save, CheckCircle, Copy } from "lucide-react";

const PARTNER_TYPES = ["Campus Ambassador", "Education Associate", "Institutional Partner"];

export default function MAPartnerForm() {
  const { token } = useMAAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id && id !== "new";

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState<{ name: string; code: string; loginEmail: string; tempPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    name: "",
    associate_id: "",
    partner_type: "Education Associate",
    login_email: "",
    phone: "",
    city: "",
    aadhaar_number: "",
    pan_number: "",
    password: "",
    bank_details: "",
  });

  useEffect(() => {
    if (!isEdit || !token) return;
    marketingAdminApi.getPartner(token, id!).then((d) => {
      const p = d.partner;
      setForm({
        name: p.name || "",
        associate_id: p.associate_id || "",
        partner_type: p.partner_type || "Education Associate",
        login_email: p.login_email || "",
        phone: p.phone || "",
        city: p.city || "",
        aadhaar_number: p.aadhaar_number || "",
        pan_number: p.pan_number || "",
        password: "",
        bank_details: typeof p.bank_details === "object" ? JSON.stringify(p.bank_details, null, 2) : (p.bank_details || ""),
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [isEdit, id, token]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      let bankDetails: any = {};
      if (form.bank_details.trim()) {
        try { bankDetails = JSON.parse(form.bank_details); }
        catch { bankDetails = { info: form.bank_details }; }
      }

      if (isEdit) {
        const payload: any = {
          name: form.name,
          associate_id: form.associate_id || null,
          partner_type: form.partner_type,
          login_email: form.login_email || null,
          phone: form.phone || null,
          city: form.city || null,
          aadhaar_number: form.aadhaar_number || null,
          pan_number: form.pan_number || null,
          bank_details: bankDetails,
        };
        if (form.password) payload.password = form.password;
        await marketingAdminApi.updatePartner(token!, id!, payload);
        navigate(`/marketing-admin/partners/${id}`);
      } else {
        const result = await marketingAdminApi.createPartner(token!, {
          name: form.name,
          associate_id: form.associate_id || null,
          partner_type: form.partner_type,
          login_email: form.login_email,
          phone: form.phone || null,
          city: form.city || null,
          aadhaar_number: form.aadhaar_number || null,
          pan_number: form.pan_number || null,
          bank_details: bankDetails,
        });
        setCredentials({
          name: result.name,
          code: result.code,
          loginEmail: result.loginEmail,
          tempPassword: result.tempPassword,
        });
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const credText = credentials
    ? `Login: ${window.location.origin}/partner/login\nEmail: ${credentials.loginEmail}\nPassword: ${credentials.tempPassword}\nReferral Code: ${credentials.code}`
    : "";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isEdit ? "Edit Partner" : "Add Partner"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEdit ? "Update partner details" : "Register a new partner — referral code is auto-generated"}
          </p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Partner Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  required
                  placeholder="Full Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="associate_id">Associate ID</Label>
                <Input
                  id="associate_id"
                  value={form.associate_id}
                  onChange={(e) => set("associate_id", e.target.value)}
                  placeholder="ML-A102"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="partner_type">Partner Type</Label>
              <Select value={form.partner_type} onValueChange={(v) => set("partner_type", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PARTNER_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="login_email">Login Email *</Label>
              <Input
                id="login_email"
                type="email"
                value={form.login_email}
                onChange={(e) => set("login_email", e.target.value)}
                required
                placeholder="partner@example.com"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="9876543210"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="Delhi"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aadhaar_number">Aadhaar *</Label>
                <Input
                  id="aadhaar_number"
                  value={form.aadhaar_number}
                  onChange={(e) => set("aadhaar_number", e.target.value.replace(/\D/g, "").slice(0, 12))}
                  required
                  placeholder="123412341234"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pan_number">PAN *</Label>
                <Input
                  id="pan_number"
                  value={form.pan_number}
                  onChange={(e) => set("pan_number", e.target.value.toUpperCase().slice(0, 10))}
                  required
                  placeholder="ABCDE1234F"
                />
              </div>
            </div>

            {isEdit && (
              <div className="space-y-2">
                <Label htmlFor="password">New Password <span className="text-muted-foreground font-normal">(leave blank to keep current)</span></Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="bank_details">Bank / UPI Details <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea
                id="bank_details"
                value={form.bank_details}
                onChange={(e) => set("bank_details", e.target.value)}
                placeholder='{"upi": "partner@upi", "bank": "HDFC", "account": "123456789"}'
                rows={3}
              />
              <p className="text-xs text-muted-foreground">JSON or plain text</p>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isEdit ? "Update Partner" : "Create Partner"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Credentials dialog shown once after creation */}
      <Dialog open={!!credentials} onOpenChange={() => {}}>
        <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Partner Created — Share Credentials
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              A temporary password has been generated. Share the details below with <strong>{credentials?.name}</strong>. They can change their password after logging in.
            </p>
            <div className="bg-muted rounded-lg p-4 space-y-2 font-mono text-sm">
              <p><span className="text-muted-foreground">Referral Code:</span> <strong className="text-primary">{credentials?.code}</strong></p>
              <p><span className="text-muted-foreground">Login Email:</span> {credentials?.loginEmail}</p>
              <p><span className="text-muted-foreground">Temp Password:</span> <strong>{credentials?.tempPassword}</strong></p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  navigator.clipboard.writeText(credText).catch(() => {});
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? <CheckCircle className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? "Copied!" : "Copy All"}
              </Button>
              <Button className="flex-1" onClick={() => navigate("/marketing-admin/partners")}>
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
