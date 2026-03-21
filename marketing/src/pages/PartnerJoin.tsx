import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { partnerApi } from "@/lib/partnerApi";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle, Rocket, Eye, EyeOff } from "lucide-react";

const PARTNER_TYPES = ["Campus Ambassador", "Education Associate", "Institutional Partner"];

export default function PartnerJoin() {
  const { code } = useParams<{ code: string }>();
  const [form, setForm] = useState({ name: "", phone: "", email: "", city: "", partner_type: "Education Associate", password: "", confirm_password: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

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
    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.trim().length < 6) {
      setError("Password must be at least 6 non-space characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await partnerApi.joinRequest(code, form);
      setDone(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-muted/30 py-12 px-4">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
              <Rocket className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Join as a Partner</h1>
            <p className="text-muted-foreground mt-2">
              Referred by code <span className="font-semibold text-primary">{code?.toUpperCase()}</span>
            </p>
          </div>

          {done ? (
            <Card className="shadow-sm">
              <CardContent className="pt-8 pb-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-foreground mb-2">Application Submitted!</h2>
                <p className="text-muted-foreground mb-2">
                  Your application is with the person who referred you. Once they approve it, you can log in at:
                </p>
                <p className="font-medium text-primary mb-6">{window.location.origin}/partner/login</p>
                <p className="text-sm text-muted-foreground mb-6">Use the email and password you just set.</p>
                <Link to="/">
                  <Button variant="outline">Back to Home</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Partner Registration</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="Manish Sharma" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone *</Label>
                      <Input id="phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} required placeholder="9876543210" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@email.com" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Delhi" />
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
                  <div className="border-t pt-4 space-y-3">
                    <p className="text-sm font-medium text-foreground">Set your login password</p>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={form.password}
                          onChange={(e) => set("password", e.target.value)}
                          required
                          placeholder="Min. 6 characters"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          onClick={() => setShowPassword((v) => !v)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm_password">Confirm Password *</Label>
                      <Input
                        id="confirm_password"
                        type="password"
                        value={form.confirm_password}
                        onChange={(e) => set("confirm_password", e.target.value)}
                        required
                        placeholder="Re-enter password"
                      />
                    </div>
                  </div>
                  {error && (
                    <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>
                  )}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Submit Application
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
