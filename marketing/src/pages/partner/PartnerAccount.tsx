import { useEffect, useState, type ChangeEvent } from "react";
import { usePartnerAuth } from "@/hooks/usePartnerAuth";
import { partnerApi } from "@/lib/partnerApi";
import { PARTNER_PROFESSIONS } from "@/lib/partnerMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";

function isValidPan(value: string) {
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value.trim().toUpperCase());
}

function isValidAadhaar(value: string) {
  return /^\d{12}$/.test(value.replace(/\s+/g, ""));
}

function isValidIfsc(value: string) {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(value.trim().toUpperCase());
}

const emptyProfile = {
  name: "",
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
  bank_account_holder_name: "",
  bank_ifsc_code: "",
  bank_account_number: "",
  aadhaar_number: "",
  pan_number: "",
  profile_image_url: "",
};

export default function PartnerAccount() {
  const { token, affiliate } = usePartnerAuth();
  const [profile, setProfile] = useState(emptyProfile);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileDone, setProfileDone] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordDone, setPasswordDone] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    if (!token) return;
    setProfileLoading(true);
    partnerApi.me(token)
      .then((data) => {
        setProfile({
          name: data.name || "",
          login_email: data.login_email || "",
          phone: data.phone || "",
          address_line_1: data.address_line_1 || "",
          address_line_2: data.address_line_2 || "",
          locality: data.locality || "",
          district: data.district || "",
          state: data.state || "",
          pincode: data.pincode || "",
          profession: data.profession || "",
          work_experience_years: data.work_experience_years != null ? String(data.work_experience_years) : "",
          bank_account_holder_name: data.bank_account_holder_name || "",
          bank_ifsc_code: data.bank_ifsc_code || "",
          bank_account_number: data.bank_account_number || "",
          aadhaar_number: data.aadhaar_number || "",
          pan_number: data.pan_number || "",
          profile_image_url: data.profile_image_url || "",
        });
      })
      .catch((e: any) => setProfileError(e.message || "Unable to load your profile."))
      .finally(() => setProfileLoading(false));
  }, [token]);

  const setProfileField = (key: string, value: string) => {
    setProfile((current) => ({ ...current, [key]: value }));
    setProfileError("");
    setProfileDone(false);
  };

  const setPasswordField = (key: string, value: string) => {
    setPasswordForm((current) => ({ ...current, [key]: value }));
    setPasswordError("");
    setPasswordDone(false);
  };

  const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    setProfileError("");
    try {
      const uploaded = await partnerApi.uploadProfilePhoto(file);
      setProfileField("profile_image_url", uploaded.url || "");
    } catch (err: any) {
      setProfileError(err.message || "Unable to upload profile photo.");
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.name.trim()) {
      setProfileError("Full name is required.");
      return;
    }
    if (!profile.login_email.trim()) {
      setProfileError("Login email is required.");
      return;
    }
    if (!/^\d{10}$/.test(profile.phone.trim())) {
      setProfileError("Phone must be exactly 10 digits.");
      return;
    }
    if (!profile.address_line_1.trim() || !profile.locality.trim() || !profile.district.trim() || !profile.state.trim()) {
      setProfileError("Complete address is required.");
      return;
    }
    if (!/^\d{6}$/.test(profile.pincode.trim())) {
      setProfileError("Pincode must be exactly 6 digits.");
      return;
    }
    if (!profile.profession) {
      setProfileError("Profession is required.");
      return;
    }
    if (!profile.bank_account_holder_name.trim()) {
      setProfileError("Account holder name is required.");
      return;
    }
    if (!isValidIfsc(profile.bank_ifsc_code)) {
      setProfileError("IFSC code must be valid.");
      return;
    }
    if (!profile.bank_account_number.trim()) {
      setProfileError("Bank account number is required.");
      return;
    }
    if (!isValidAadhaar(profile.aadhaar_number)) {
      setProfileError("Aadhaar must be exactly 12 digits.");
      return;
    }
    if (!isValidPan(profile.pan_number)) {
      setProfileError("PAN must follow the standard 10-character format.");
      return;
    }
    setProfileSaving(true);
    setProfileError("");
    try {
      const response = await partnerApi.updateProfile(token!, {
        ...profile,
        work_experience_years: profile.work_experience_years ? Number(profile.work_experience_years) : null,
      });
      const updated = response.partner || {};
      setProfile({
        name: updated.name || profile.name,
        login_email: updated.login_email || profile.login_email,
        phone: updated.phone || "",
        address_line_1: updated.address_line_1 || "",
        address_line_2: updated.address_line_2 || "",
        locality: updated.locality || "",
        district: updated.district || "",
        state: updated.state || "",
        pincode: updated.pincode || "",
        profession: updated.profession || "",
        work_experience_years: updated.work_experience_years != null ? String(updated.work_experience_years) : "",
        bank_account_holder_name: updated.bank_account_holder_name || "",
        bank_ifsc_code: updated.bank_ifsc_code || "",
        bank_account_number: updated.bank_account_number || "",
        aadhaar_number: updated.aadhaar_number || "",
        pan_number: updated.pan_number || "",
        profile_image_url: updated.profile_image_url || "",
      });
      localStorage.setItem("partner_info", JSON.stringify({
        id: updated.id || affiliate?.id,
        name: updated.name || affiliate?.name,
        code: updated.code || affiliate?.code,
        login_email: updated.login_email || profile.login_email,
      }));
      setProfileDone(true);
    } catch (e: any) {
      setProfileError(e.message);
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.current_password.trim()) { setPasswordError("Current password is required."); return; }
    if (passwordForm.new_password !== passwordForm.confirm_password) { setPasswordError("New passwords do not match."); return; }
    if (passwordForm.new_password.trim().length < 6) { setPasswordError("New password must be at least 6 non-space characters."); return; }
    setSavingPassword(true);
    setPasswordError("");
    try {
      await partnerApi.changePassword(token!, {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordDone(true);
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (e: any) {
      setPasswordError(e.message);
    } finally {
      setSavingPassword(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Account</h1>
        <p className="text-muted-foreground mt-1">{profile.name || affiliate?.name} · {profile.login_email || affiliate?.login_email}</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {profileDone ? (
            <div className="flex items-center gap-2 p-3 mb-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-800 font-medium">Profile updated successfully.</p>
            </div>
          ) : null}
          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name *</Label>
                <Input id="name" value={profile.name} onChange={(e) => setProfileField("name", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login_email">Login email *</Label>
                <Input id="login_email" type="email" value={profile.login_email} onChange={(e) => setProfileField("login_email", e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" value={profile.phone} onChange={(e) => setProfileField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profession">Profession *</Label>
                <Select value={profile.profession} onValueChange={(value) => setProfileField("profession", value)}>
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
                <Input id="address_line_1" value={profile.address_line_1} onChange={(e) => setProfileField("address_line_1", e.target.value)} required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address_line_2">Address line 2</Label>
                <Input id="address_line_2" value={profile.address_line_2} onChange={(e) => setProfileField("address_line_2", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="locality">Area / Locality *</Label>
                <Input id="locality" value={profile.locality} onChange={(e) => setProfileField("locality", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">District / City *</Label>
                <Input id="district" value={profile.district} onChange={(e) => setProfileField("district", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input id="state" value={profile.state} onChange={(e) => setProfileField("state", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode *</Label>
                <Input id="pincode" value={profile.pincode} onChange={(e) => setProfileField("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))} required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="work_experience_years">Work experience (years)</Label>
                <Input id="work_experience_years" type="number" min="0" max="60" value={profile.work_experience_years} onChange={(e) => setProfileField("work_experience_years", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile_photo">Profile photo</Label>
                <Input id="profile_photo" type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePhotoChange} disabled={uploadingPhoto} />
              </div>
            </div>

            {uploadingPhoto ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading profile photo...
              </div>
            ) : null}
            {profile.profile_image_url ? (
              <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/20 p-3">
                <img src={profile.profile_image_url} alt="Profile preview" className="h-14 w-14 rounded-xl object-cover" />
                <div className="text-sm text-muted-foreground">Profile photo uploaded. You can choose another file to replace it.</div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aadhaar_number">Aadhaar number *</Label>
                <Input id="aadhaar_number" value={profile.aadhaar_number} onChange={(e) => setProfileField("aadhaar_number", e.target.value.replace(/\D/g, "").slice(0, 12))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pan_number">PAN number *</Label>
                <Input id="pan_number" value={profile.pan_number} onChange={(e) => setProfileField("pan_number", e.target.value.toUpperCase().slice(0, 10))} required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_account_holder_name">Account holder name *</Label>
                <Input id="bank_account_holder_name" value={profile.bank_account_holder_name} onChange={(e) => setProfileField("bank_account_holder_name", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_ifsc_code">IFSC code *</Label>
                <Input id="bank_ifsc_code" value={profile.bank_ifsc_code} onChange={(e) => setProfileField("bank_ifsc_code", e.target.value.toUpperCase().replace(/\s+/g, "").slice(0, 11))} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank_account_number">Bank account number *</Label>
              <Input id="bank_account_number" value={profile.bank_account_number} onChange={(e) => setProfileField("bank_account_number", e.target.value)} required />
            </div>

            {profileError ? <p className="text-sm text-destructive">{profileError}</p> : null}
            <Button type="submit" disabled={profileSaving || uploadingPhoto}>
              {profileSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Profile
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          {passwordDone ? (
            <div className="flex items-center gap-2 p-3 mb-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-800 font-medium">Password updated successfully.</p>
            </div>
          ) : null}
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current_password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current_password"
                  type={showCurrent ? "text" : "password"}
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordField("current_password", e.target.value)}
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
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordField("new_password", e.target.value)}
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
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordField("confirm_password", e.target.value)}
                required
                placeholder="Re-enter new password"
              />
            </div>
            {passwordError ? <p className="text-sm text-destructive">{passwordError}</p> : null}
            <Button type="submit" disabled={savingPassword}>
              {savingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
