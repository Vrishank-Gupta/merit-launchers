import { useState, type ChangeEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { partnerApi } from "@/lib/partnerApi";
import { PARTNER_PROFESSIONS, PARTNER_TYPES } from "@/lib/partnerMeta";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, Rocket, ArrowRight, Sparkles, BriefcaseBusiness, Users, Clock3 } from "lucide-react";

const reasons = [
  {
    title: "Earn from serious referrals",
    text: "Share the right course links, build trust, and convert educational referrals into a recurring revenue stream.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Use a structured growth system",
    text: "The portal gives you referral links, scripts, milestone tracking, and lead follow-up support.",
    icon: Sparkles,
  },
  {
    title: "Grow individually or as a network",
    text: "Refer students directly and also onboard additional partners through your own link.",
    icon: Users,
  },
];

const proofPoints = [
  "Clear partner login and tracking",
  "Referral-based student attribution",
  "Commission visibility without manual spreadsheets",
  "Partner network onboarding built in",
];

function isValidPan(value: string) {
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value.trim().toUpperCase());
}

function isValidAadhaar(value: string) {
  return /^\d{12}$/.test(value.replace(/\s+/g, ""));
}

export default function PartnerJoin() {
  const { code } = useParams<{ code: string }>();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    partner_type: "Education Associate",
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
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

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
    if (!code) {
      setError("Invalid referral link. Please ask your referrer to share the link again.");
      return;
    }
    if (!form.name.trim()) {
      setError("Full name is required.");
      return;
    }
    if (!/^\d{10}$/.test(form.phone.trim())) {
      setError("Phone must be exactly 10 digits.");
      return;
    }
    if (!form.address_line_1.trim() || !form.locality.trim() || !form.district.trim() || !form.state.trim()) {
      setError("Complete address is required.");
      return;
    }
    if (!/^\d{6}$/.test(form.pincode.trim())) {
      setError("Pincode must be exactly 6 digits.");
      return;
    }
    if (!form.profession) {
      setError("Profession is required.");
      return;
    }
    if (!form.bank_account_number.trim()) {
      setError("Bank account number is required.");
      return;
    }
    if (!isValidAadhaar(form.aadhaar_number)) {
      setError("Aadhaar must be exactly 12 digits.");
      return;
    }
    if (!isValidPan(form.pan_number)) {
      setError("PAN must follow the standard 10-character format.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await partnerApi.joinRequest(code, form);
      setDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f8fb]">
      <Navbar />
      <main className="flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="overflow-hidden rounded-[36px] bg-slate-950 text-slate-50 shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
            <div className="border-b border-white/10 px-8 py-8">
              <Badge className="border-0 bg-white/10 text-slate-100">Partner opportunity</Badge>
              <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
                Build a credible education referral business, not random side income.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                You were invited through partner code <span className="font-semibold text-white">{code?.toUpperCase()}</span>. Join the Merit Launchers partner network to refer students, track outcomes, and grow a reliable outreach system.
              </p>
            </div>
            <div className="grid gap-4 px-8 py-8 md:grid-cols-3">
              {reasons.map(({ title, text, icon: Icon }) => (
                <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="mt-4 text-lg font-medium text-white">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-4 border-t border-white/10 px-8 py-8 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Why partners stick</p>
                <div className="mt-4 space-y-3">
                  {proofPoints.map((point) => (
                    <div key={point} className="flex items-start gap-3 text-sm text-slate-200">
                      <CheckCircle className="mt-0.5 h-4 w-4 text-emerald-400" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">What happens next</p>
                <div className="mt-4 space-y-4 text-sm text-slate-200">
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">1</div>
                    <p>Submit your details so your referrer or admin can review your application.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">2</div>
                    <p>Your referrer or admin reviews and activates your account.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">3</div>
                    <p>You receive an email invitation, set your password, and start using the partner portal.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            {done ? (
              <Card className="rounded-[32px] border-border/70 shadow-xl">
                <CardContent className="space-y-6 px-8 py-10 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle className="h-8 w-8 text-emerald-600" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold text-foreground">Application submitted</h2>
                    <p className="text-muted-foreground">
                      Your profile is now in the approval queue. Once approved, we&apos;ll email you an invitation link to set your password and activate your partner access.
                    </p>
                  </div>
                  <div className="rounded-3xl border border-border/70 bg-muted/30 p-5 text-left">
                    <div className="flex items-start gap-3">
                      <Clock3 className="mt-0.5 h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">What to do while you wait</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Keep your login email handy, note the portal URL below, and watch for the invitation email after approval.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-3xl bg-primary/5 px-5 py-4 text-sm font-medium text-primary">
                    {window.location.origin}/partner/login
                  </div>
                  <div className="flex justify-center">
                    <Link to="/">
                      <Button variant="outline" className="rounded-full">Back to Home</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-[32px] border-border/70 shadow-xl">
                <CardHeader className="px-8 pt-8">
                  <CardTitle className="text-2xl">Create your partner profile</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    This takes 2 minutes. After approval, we&apos;ll email you a secure invitation to set your partner password.
                  </p>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full name *</Label>
                      <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="Manish Sharma" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone *</Label>
                        <Input id="phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} required placeholder="9876543210" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required placeholder="you@email.com" />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="partner_type">Partner type</Label>
                        <Select value={form.partner_type} onValueChange={(value) => set("partner_type", value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PARTNER_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="profession">Profession *</Label>
                        <Select value={form.profession} onValueChange={(value) => set("profession", value)}>
                          <SelectTrigger id="profession">
                            <SelectValue placeholder="Choose your profession" />
                          </SelectTrigger>
                          <SelectContent>
                            {PARTNER_PROFESSIONS.map((profession) => (
                              <SelectItem key={profession} value={profession}>{profession}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
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

                    <div className="grid gap-4 sm:grid-cols-2">
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
                        <Label htmlFor="bank_account_number">Bank account number *</Label>
                        <Input
                          id="bank_account_number"
                          value={form.bank_account_number}
                          onChange={(e) => set("bank_account_number", e.target.value)}
                          required
                          placeholder="123456789012"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="profile_photo">Profile photo <span className="text-muted-foreground font-normal">(optional)</span></Label>
                      <Input
                        id="profile_photo"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handlePhotoChange}
                        disabled={uploadingPhoto}
                      />
                      <p className="text-xs text-muted-foreground">
                        Add a clear profile picture so your upline and team recognize you in the partner network.
                      </p>
                      {uploadingPhoto ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading photo...
                        </div>
                      ) : null}
                      {form.profile_image_url ? (
                        <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/20 p-3">
                          <img
                            src={form.profile_image_url}
                            alt="Profile preview"
                            className="h-16 w-16 rounded-2xl object-cover"
                          />
                          <div className="text-sm text-muted-foreground">
                            Profile photo uploaded. You can choose another file to replace it.
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="aadhaar_number">Aadhaar number *</Label>
                        <Input
                          id="aadhaar_number"
                          value={form.aadhaar_number}
                          onChange={(e) => set("aadhaar_number", e.target.value.replace(/\D/g, "").slice(0, 12))}
                          required
                          placeholder="123412341234"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pan_number">PAN number *</Label>
                        <Input
                          id="pan_number"
                          value={form.pan_number}
                          onChange={(e) => set("pan_number", e.target.value.toUpperCase().slice(0, 10))}
                          required
                          placeholder="ABCDE1234F"
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      Aadhaar and PAN are mandatory for partner onboarding. Our team verifies these details before activation.
                    </div>

                    <div className="rounded-3xl border border-border/70 bg-muted/30 p-5 text-sm text-muted-foreground">
                      After approval, we&apos;ll send a secure email invitation so you can set your partner password yourself.
                    </div>

                    {error ? (
                      <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
                    ) : null}

                    <Button type="submit" className="w-full rounded-full" disabled={loading}>
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
                      Submit application
                      {!loading ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
