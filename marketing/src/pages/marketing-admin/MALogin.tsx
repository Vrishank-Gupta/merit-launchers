import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMAAuth } from "@/hooks/useMarketingAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { marketingAdminApi } from "@/lib/partnerApi";

export default function MALogin() {
  const { signIn } = useMAAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    const result = await signIn(email, password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      navigate("/marketing-admin");
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Enter your email first so we know where to send the reset link.");
      setNotice("");
      return;
    }
    setLoading(true);
    setError("");
    setNotice("");
    try {
      await marketingAdminApi.forgotPassword(email.trim());
      setNotice("If this account exists, a reset email has been sent.");
    } catch (e: any) {
      setError(e.message || "Unable to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/10 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Merit Launchers</h1>
          <p className="text-muted-foreground mt-1">Marketing Admin Portal</p>
        </div>

        <Card className="shadow-lg border-border/50">
          <CardHeader>
            <CardTitle className="text-xl text-center">Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="marketing@meritlaunchers.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button type="button" variant="ghost" size="sm" className="px-0" onClick={() => setShowPassword((value) => !value)}>
                  {showPassword ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                  {showPassword ? "Hide password" : "Show password"}
                </Button>
              </div>
              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}
              {notice && (
                <div className="p-3 rounded-md bg-emerald-50 text-emerald-700 text-sm border border-emerald-200">
                  {notice}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
              <Button type="button" variant="ghost" className="w-full" disabled={loading} onClick={handleForgotPassword}>
                Forgot password?
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
