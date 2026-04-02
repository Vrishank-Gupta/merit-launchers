import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMAAuth } from "@/hooks/useMarketingAdminAuth";
import { marketingAdminApi } from "@/lib/partnerApi";
import { partnerApi } from "@/lib/partnerApi";
import { PARTNER_PROFESSIONS, PARTNER_TYPES } from "@/lib/partnerMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, ArrowLeft, Save, CheckCircle } from "lucide-react";

export default function MAPartnerForm() {
  const { token } = useMAAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id && id !== "new";

  const [loading, setLoading] = useState(isEdit);
  const [partnerOptionsLoading, setPartnerOptionsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState("");
  const [createdPartner, setCreatedPartner] = useState<{ name: string; code: string; loginEmail: string } | null>(null);
  const [partnerOptions, setPartnerOptions] = useState<Array<{ id: string; name: string; code: string; status?: string }>>([]);

  const [form, setForm] = useState({
    name: "",
    associate_id: "",
    partner_type: "Education Associate",
    referred_by_affiliate_id: "",
    login_email: "",
    phone: "",
    address_line_1: "",
    address_line_2: "",
    locality: "",
    district: "",
    state: "",
    pincode: "",
    profession: "",
    work_experience_years: "",
    bank_account_number: "",
    aadhaar_number: "",
    pan_number: "",
    profile_image_url: "",
  });

  useEffect(() => {
    if (!token) return;
    let active = true;
    setPartnerOptionsLoading(true);
    marketingAdminApi.getPartners(token)
      .then((d) => {
        if (!active) return;
        const partners = Array.isArray(d.partners) ? d.partners : [];
        setPartnerOptions(
          partners
            .filter((p: any) => p.status !== "pending")
            .map((p: any) => ({id: p.id, name: p.name, code: p.code, status: p.status}))
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
      })
      .catch(() => {
        if (active) setPartnerOptions([]);
      })
      .finally(() => {
        if (active) setPartnerOptionsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (!isEdit || !token) return;
    marketingAdminApi.getPartner(token, id!).then((d) => {
      const p = d.partner;
      setForm({
        name: p.name || "",
        associate_id: p.associate_id || "",
        partner_type: p.partner_type || "Education Associate",
        referred_by_affiliate_id: p.referred_by_affiliate_id || "",
        login_email: p.login_email || "",
        phone: p.phone || "",
        address_line_1: p.address_line_1 || "",
        address_line_2: p.address_line_2 || "",
        locality: p.locality || "",
        district: p.district || "",
        state: p.state || "",
        pincode: p.pincode || "",
        profession: p.profession || "",
        work_experience_years: p.work_experience_years != null ? String(p.work_experience_years) : "",
        bank_account_number: p.bank_account_number || "",
        aadhaar_number: p.aadhaar_number || "",
        pan_number: p.pan_number || "",
        profile_image_url: p.profile_image_url || "",
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [isEdit, id, token]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    setError("");
    try {
      const uploaded = await partnerApi.uploadProfilePhoto(file);
      set("profile_image_url", uploaded.url || "");
    } catch (err: any) {
      setError(err.message || "Unable to upload profile photo.");
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (isEdit) {
        const payload: any = {
          name: form.name,
          associate_id: form.associate_id || null,
          partner_type: form.partner_type,
          referred_by_affiliate_id: form.referred_by_affiliate_id || null,
          login_email: form.login_email || null,
          phone: form.phone || null,
          address_line_1: form.address_line_1 || null,
          address_line_2: form.address_line_2 || null,
          locality: form.locality || null,
          district: form.district || null,
          state: form.state || null,
          pincode: form.pincode || null,
          profession: form.profession || null,
          work_experience_years: form.work_experience_years ? Number(form.work_experience_years) : null,
          bank_account_number: form.bank_account_number || null,
          profile_image_url: form.profile_image_url || null,
          aadhaar_number: form.aadhaar_number || null,
          pan_number: form.pan_number || null,
        };
        await marketingAdminApi.updatePartner(token!, id!, payload);
        navigate(`/marketing-admin/partners/${id}`);
      } else {
        const result = await marketingAdminApi.createPartner(token!, {
          name: form.name,
          associate_id: form.associate_id || null,
          partner_type: form.partner_type,
          referred_by_affiliate_id: form.referred_by_affiliate_id || null,
          login_email: form.login_email,
          phone: form.phone || null,
          address_line_1: form.address_line_1 || null,
          address_line_2: form.address_line_2 || null,
          locality: form.locality || null,
          district: form.district || null,
          state: form.state || null,
          pincode: form.pincode || null,
          profession: form.profession || null,
          work_experience_years: form.work_experience_years ? Number(form.work_experience_years) : null,
          bank_account_number: form.bank_account_number || null,
          profile_image_url: form.profile_image_url || null,
          aadhaar_number: form.aadhaar_number || null,
          pan_number: form.pan_number || null,
        });
        setCreatedPartner({
          name: result.name,
          code: result.code,
          loginEmail: result.loginEmail,
        });
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
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
            {isEdit ? "Update partner details" : "Register a new partner and email a secure invitation automatically"}
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
              <Label htmlFor="referred_by_affiliate_id">Place under existing partner</Label>
              <Select
                value={form.referred_by_affiliate_id || "__none__"}
                onValueChange={(v) => set("referred_by_affiliate_id", v === "__none__" ? "" : v)}
                disabled={partnerOptionsLoading}
              >
                <SelectTrigger id="referred_by_affiliate_id">
                  <SelectValue placeholder={partnerOptionsLoading ? "Loading partner network..." : "Choose a parent partner"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No parent partner (top-level admin-managed)</SelectItem>
                  {partnerOptions
                    .filter((partner) => !isEdit || partner.id !== id)
                    .map((partner) => (
                      <SelectItem key={partner.id} value={partner.id}>
                        {partner.name} ({partner.code})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The invited partner will receive the email from admin, but their hierarchy will follow the selected parent partner.
              </p>
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
                  required
                  placeholder="9876543210"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profession">Profession *</Label>
                <Select value={form.profession} onValueChange={(v) => set("profession", v)}>
                  <SelectTrigger id="profession">
                    <SelectValue placeholder="Choose profession" />
                  </SelectTrigger>
                  <SelectContent>
                    {PARTNER_PROFESSIONS.map((profession) => (
                      <SelectItem key={profession} value={profession}>{profession}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address_line_1">Address line 1 *</Label>
                <Input
                  id="address_line_1"
                  value={form.address_line_1}
                  onChange={(e) => set("address_line_1", e.target.value)}
                  required
                  placeholder="House / building / street"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address_line_2">Address line 2</Label>
                <Input
                  id="address_line_2"
                  value={form.address_line_2}
                  onChange={(e) => set("address_line_2", e.target.value)}
                  placeholder="Apartment, suite, floor, landmark"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="locality">Area / Locality *</Label>
                <Input
                  id="locality"
                  value={form.locality}
                  onChange={(e) => set("locality", e.target.value)}
                  required
                  placeholder="Rohini Sector 9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">District / City *</Label>
                <Input
                  id="district"
                  value={form.district}
                  onChange={(e) => set("district", e.target.value)}
                  required
                  placeholder="New Delhi"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={form.state}
                  onChange={(e) => set("state", e.target.value)}
                  required
                  placeholder="Delhi"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  value={form.pincode}
                  onChange={(e) => set("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  placeholder="110085"
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

            <div className="space-y-2">
              <Label htmlFor="bank_account_number">Bank account number *</Label>
              <Input
                id="bank_account_number"
                value={form.bank_account_number}
                onChange={(e) => set("bank_account_number", e.target.value)}
                required
                placeholder="123456789012"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="work_experience_years">Work experience (years)</Label>
                <Input
                  id="work_experience_years"
                  type="number"
                  min="0"
                  max="60"
                  value={form.work_experience_years}
                  onChange={(e) => set("work_experience_years", e.target.value)}
                  placeholder="5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile_photo">Profile photo</Label>
                <Input
                  id="profile_photo"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handlePhotoChange}
                  disabled={uploadingPhoto}
                />
              </div>
            </div>

            {uploadingPhoto ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading profile photo...
              </div>
            ) : null}
            {form.profile_image_url ? (
              <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/20 p-3">
                <img src={form.profile_image_url} alt="Profile preview" className="h-14 w-14 rounded-xl object-cover" />
                <div className="text-sm text-muted-foreground">
                  Profile photo uploaded. You can choose another file to replace it.
                </div>
              </div>
            ) : null}

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

      <Dialog open={!!createdPartner} onOpenChange={() => {}}>
        <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Partner Created
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              A password-setup invitation has been emailed to <strong>{createdPartner?.name}</strong>.
            </p>
            <div className="bg-muted rounded-lg p-4 space-y-2 font-mono text-sm">
              <p><span className="text-muted-foreground">Referral Code:</span> <strong className="text-primary">{createdPartner?.code}</strong></p>
              <p><span className="text-muted-foreground">Login Email:</span> {createdPartner?.loginEmail}</p>
              <p><span className="text-muted-foreground">Portal:</span> {window.location.origin}/partner/login</p>
            </div>
            <Button className="w-full" onClick={() => navigate("/marketing-admin/partners")}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
