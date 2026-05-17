import { useEffect, useState, type ChangeEvent } from "react";
import { usePartnerAuth } from "@/hooks/usePartnerAuth";
import { partnerApi } from "@/lib/partnerApi";
import { PARTNER_PROFESSIONS } from "@/lib/partnerMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle, Eye, EyeOff, Save } from "lucide-react";

export default function PartnerAccount() {
  const { token, affiliate, updateAffiliate } = usePartnerAuth();

  // ── Profile section ──────────────────────────────────────────────────────
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileDone, setProfileDone] = useState(false);

  const emptyProfile = {
    name: "",
    phone: "",
    profession: "",
    address_line_1: "",
    address_line_2: "",
    locality: "",
    district: "",
    state: "",
    pincode: "",
    bank_account_holder_name: "",
    bank_ifsc_code: "",
    bank_account_number: "",
    aadhaar_number: "",
    pan_number: "",
    work_experience_years: "",
    profile_image_url: "",
  };

  const [profile, setProfile] = useState(emptyProfile);

  useEffect(() => {
    if (!token) return;
    let active = true;
    partnerApi.me(token)
      .then((d) => {
        if (!active) return;
        const p = d;
        setProfile({
          name: p.name ?? "",
          phone: p.phone ?? "",
          profession: p.profession ?? "",
          address_line_1: p.address_line_1 ?? "",
          address_line_2: p.address_line_2 ?? "",
          locality: p.locality ?? "",
          district: p.district ?? "",
          state: p.state ?? "",
          pincode: p.pincode ?? "",
          bank_account_holder_name: p.bank_account_holder_name ?? "",
          bank_ifsc_code: p.bank_ifsc_code ?? "",
          bank_account_number: p.bank_account_number ?? "",
          aadhaar_number: p.aadhaar_number ?? "",
          pan_number: p.pan_number ?? "",
          work_experience_years: p.work_experience_years != null ? String(p.work_experience_years) : "",
          profile_image_url: p.profile_image_url ?? "",
        });
      })
      .catch(() => {
        if (!active) return;
        const p = affiliate ?? {};
        setProfile({
          name: p.name ?? "",
          phone: p.phone ?? "",
          profession: p.profession ?? "",
          address_line_1: p.address_line_1 ?? "",
          address_line_2: p.address_line_2 ?? "",
          locality: p.locality ?? "",
          district: p.district ?? "",
          state: p.state ?? "",
          pincode: p.pincode ?? "",
          bank_account_holder_name: p.bank_account_holder_name ?? "",
          bank_ifsc_code: p.bank_ifsc_code ?? "",
          bank_account_number: p.bank_account_number ?? "",
          aadhaar_number: p.aadhaar_number ?? "",
          pan_number: p.pan_number ?? "",
          work_experience_years: p.work_experience_years != null ? String(p.work_experience_years) : "",
          profile_image_url: p.profile_image_url ?? "",
        });
      })
      .finally(() => { if (active) setProfileLoading(false); });
    return () => { active = false; };
  }, [token]);

  const setP = (k: string, v: string) => {
    setProfile((f) => ({ ...f, [k]: v }));
    setProfileError("");
    setProfileDone(false);
  };

  const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    setProfileError("");
    try {
      const uploaded = await partnerApi.uploadProfilePhoto(file);
      setP("profile_image_url", uploaded.url ?? "");
    } catch (err: any) {
      setProfileError(err.message ?? "Unable to upload profile photo.");
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError("");
    try {
      const v = (s: string) => s.trim() || undefined;
      const payload = {
        name: v(profile.name),
        phone: v(profile.phone),
        profession: v(profile.profession),
        address_line_1: v(profile.address_line_1),
        address_line_2: v(profile.address_line_2),
        locality: v(profile.locality),
        district: v(profile.district),
        state: v(profile.state),
        pincode: v(profile.pincode),
        bank_account_holder_name: v(profile.bank_account_holder_name),
        bank_ifsc_code: v(profile.bank_ifsc_code),
        bank_account_number: v(profile.bank_account_number),
        aadhaar_number: v(profile.aadhaar_number) ?? null,
        pan_number: v(profile.pan_number) ?? null,
        work_experience_years: profile.work_experience_years ? Number(profile.work_experience_years) : undefined,
        profile_image_url: v(profile.profile_image_url) ?? null,
      };
      const res = await partnerApi.updateMe(token!, payload);
      updateAffiliate(res.partner ?? payload);
      setProfileDone(true);
    } catch (err: any) {
      setProfileError(err.message ?? "Could not save profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Password section ──────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwDone, setPwDone] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const setPw = (k: string, v: string) => { setPwForm((f) => ({ ...f, [k]: v })); setPwError(""); setPwDone(false); };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwForm.current_password.trim()) { setPwError("Current password is required."); return; }
    if (pwForm.new_password !== pwForm.confirm_password) { setPwError("New passwords do not match."); return; }
    if (pwForm.new_password.trim().length < 6) { setPwError("New password must be at least 6 non-space characters."); return; }
    setPwSaving(true);
    setPwError("");
    try {
      await partnerApi.changePassword(token!, {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      setPwDone(true);
      setPwForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err: any) {
      setPwError(err.message);
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Account</h1>
        <p className="text-muted-foreground mt-1">{affiliate?.name} · {affiliate?.login_email}</p>
      </div>

      {/* ── Edit Profile ─────────────────────────────────────────────────── */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {profileLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading profile…
            </div>
          ) : (
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              {profileDone && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <p className="text-sm text-green-800 font-medium">Profile updated successfully.</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="p_name">Name *</Label>
                  <Input
                    id="p_name"
                    value={profile.name}
                    onChange={(e) => setP("name", e.target.value)}
                    required
                    placeholder="Full Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p_phone">Phone *</Label>
                  <Input
                    id="p_phone"
                    value={profile.phone}
                    onChange={(e) => setP("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    required
                    placeholder="9876543210"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="p_profession">Profession *</Label>
                  <Select value={profile.profession || undefined} onValueChange={(v) => setP("profession", v)}>
                    <SelectTrigger id="p_profession">
                      <SelectValue placeholder="Choose profession" />
                    </SelectTrigger>
                    <SelectContent>
                      {PARTNER_PROFESSIONS.map((pr) => (
                        <SelectItem key={pr} value={pr}>{pr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p_exp">Work experience (years)</Label>
                  <Input
                    id="p_exp"
                    type="number"
                    min="0"
                    max="60"
                    value={profile.work_experience_years}
                    onChange={(e) => setP("work_experience_years", e.target.value)}
                    placeholder="5"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="p_addr1">Address line 1 *</Label>
                <Input
                  id="p_addr1"
                  value={profile.address_line_1}
                  onChange={(e) => setP("address_line_1", e.target.value)}
                  required
                  placeholder="House / building / street"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p_addr2">Address line 2</Label>
                <Input
                  id="p_addr2"
                  value={profile.address_line_2}
                  onChange={(e) => setP("address_line_2", e.target.value)}
                  placeholder="Apartment, suite, floor, landmark"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="p_locality">Area / Locality *</Label>
                  <Input
                    id="p_locality"
                    value={profile.locality}
                    onChange={(e) => setP("locality", e.target.value)}
                    required
                    placeholder="Rohini Sector 9"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p_district">District / City *</Label>
                  <Input
                    id="p_district"
                    value={profile.district}
                    onChange={(e) => setP("district", e.target.value)}
                    required
                    placeholder="New Delhi"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p_state">State *</Label>
                  <Input
                    id="p_state"
                    value={profile.state}
                    onChange={(e) => setP("state", e.target.value)}
                    required
                    placeholder="Delhi"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p_pincode">Pincode *</Label>
                  <Input
                    id="p_pincode"
                    value={profile.pincode}
                    onChange={(e) => setP("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    placeholder="110085"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="p_bank_holder">Account holder name *</Label>
                <Input
                  id="p_bank_holder"
                  value={profile.bank_account_holder_name}
                  onChange={(e) => setP("bank_account_holder_name", e.target.value)}
                  required
                  placeholder="As printed on cheque"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="p_ifsc">IFSC code *</Label>
                  <Input
                    id="p_ifsc"
                    value={profile.bank_ifsc_code}
                    onChange={(e) => setP("bank_ifsc_code", e.target.value.toUpperCase().slice(0, 11))}
                    required
                    placeholder="SBIN0001234"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p_bank_acc">Bank account number *</Label>
                  <Input
                    id="p_bank_acc"
                    value={profile.bank_account_number}
                    onChange={(e) => setP("bank_account_number", e.target.value)}
                    required
                    placeholder="123456789012"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="p_aadhaar">Aadhaar</Label>
                  <Input
                    id="p_aadhaar"
                    value={profile.aadhaar_number}
                    onChange={(e) => setP("aadhaar_number", e.target.value.replace(/\D/g, "").slice(0, 12))}
                    placeholder="123412341234"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p_pan">PAN</Label>
                  <Input
                    id="p_pan"
                    value={profile.pan_number}
                    onChange={(e) => setP("pan_number", e.target.value.toUpperCase().slice(0, 10))}
                    placeholder="ABCDE1234F"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="p_photo">Profile photo</Label>
                <Input
                  id="p_photo"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handlePhotoChange}
                  disabled={uploadingPhoto}
                />
              </div>
              {uploadingPhoto && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Uploading photo…
                </div>
              )}
              {profile.profile_image_url && (
                <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/20 p-3">
                  <img src={profile.profile_image_url} alt="Profile preview" className="h-14 w-14 rounded-xl object-cover" />
                  <p className="text-sm text-muted-foreground">Profile photo ready. Choose another file to replace it.</p>
                </div>
              )}

              {profileError && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{profileError}</div>
              )}

              <Button type="submit" disabled={profileSaving || uploadingPhoto}>
                {profileSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Profile
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* ── Change Password ───────────────────────────────────────────────── */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          {pwDone && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-800 font-medium">Password updated successfully.</p>
            </div>
          )}
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current_password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current_password"
                  type={showCurrent ? "text" : "password"}
                  value={pwForm.current_password}
                  onChange={(e) => setPw("current_password", e.target.value)}
                  required
                  placeholder="Your current password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowCurrent((v) => !v)}
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_password">New Password</Label>
              <div className="relative">
                <Input
                  id="new_password"
                  type={showNew ? "text" : "password"}
                  value={pwForm.new_password}
                  onChange={(e) => setPw("new_password", e.target.value)}
                  required
                  placeholder="Min. 6 characters"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowNew((v) => !v)}
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm New Password</Label>
              <Input
                id="confirm_password"
                type="password"
                value={pwForm.confirm_password}
                onChange={(e) => setPw("confirm_password", e.target.value)}
                required
                placeholder="Re-enter new password"
              />
            </div>
            {pwError && <p className="text-sm text-destructive">{pwError}</p>}
            <Button type="submit" disabled={pwSaving}>
              {pwSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
