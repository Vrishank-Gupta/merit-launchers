import { useEffect, useState } from "react";
import { marketingAdminApi } from "@/lib/partnerApi";
import { useMAAuth } from "@/hooks/useMarketingAdminAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, ShieldCheck, UserCog, UserX } from "lucide-react";

export default function MAAccess() {
  const { token } = useMAAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const roleType = "marketing_admin";

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await marketingAdminApi.getAdminUsers(token);
      setAccounts(response.accounts || []);
    } catch (e: any) {
      setError(e.message || "Unable to load access accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("Enter a full name and email address.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await marketingAdminApi.inviteAdminUser(token!, {
        name: name.trim(),
        email: email.trim(),
        roleType,
      });
      setName("");
      setEmail("");
      setNotice("Invitation email sent successfully.");
      await load();
    } catch (e: any) {
      setError(e.message || "Unable to send invitation.");
    } finally {
      setSaving(false);
    }
  };

  const disableAccount = async (id: string) => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await marketingAdminApi.disableAdminUser(token!, id);
      setNotice("Portal access has been disabled.");
      await load();
    } catch (e: any) {
      setError(e.message || "Unable to disable this account.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Portal Access</h1>
        <p className="text-muted-foreground mt-1">
          Invite marketing admin users with a secure email link instead of sharing passwords.
        </p>
      </div>

      <Card className="shadow-sm border-border/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Invite a portal user
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={invite} className="space-y-4 max-w-2xl">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="invite-name">Full name</Label>
                <Input id="invite-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Riya Sharma" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="riya@meritlaunchers.com" />
              </div>
            </div>
            <div className="rounded-md border border-primary/15 bg-primary/5 p-3 text-sm text-primary max-w-xl">
              Marketing admin portal invites from this workspace always create <strong>marketing admin</strong> access. CMS admin access is managed only from the CMS admin portal.
            </div>
            {error && <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
            {notice && <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div>}
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              Send invitation
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Existing portal users
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invited portal users yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {accounts.map((account) => (
                <div key={account.id} className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{account.name}</p>
                    <p className="text-sm text-muted-foreground">{account.email}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-primary">
                        <UserCog className="h-3 w-3" />
                        {account.role_type === "marketing_admin" ? "Marketing admin" : "Admin"}
                      </span>
                      <span className={`inline-flex rounded-full px-2.5 py-1 ${account.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                        {account.is_active ? "Active" : "Disabled"}
                      </span>
                      <span className={`inline-flex rounded-full px-2.5 py-1 ${
                        account.invitation_status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}>
                        {account.invitation_status === "active" ? "Password set" : "Invitation sent"}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" disabled={saving || !account.is_active} onClick={() => disableAccount(account.id)}>
                    <UserX className="mr-2 h-4 w-4" />
                    Disable access
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
