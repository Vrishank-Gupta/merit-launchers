import { useEffect, useState } from "react";
import { useMAAuth } from "@/hooks/useMarketingAdminAuth";
import { marketingAdminApi } from "@/lib/partnerApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Save, CheckCircle, Percent } from "lucide-react";

const PARTNER_TYPES = ["Campus Ambassador", "Education Associate", "Institutional Partner"];

export default function MACommissionRates() {
  const { token } = useMAAuth();
  const [rates, setRates] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!token) return;
    marketingAdminApi.getCommissionRates(token).then((d) => {
      const map: Record<string, string> = {};
      for (const r of d.rates) map[r.partner_type] = String(r.rate);
      // ensure all 3 types present
      for (const t of PARTNER_TYPES) if (!map[t]) map[t] = "0";
      setRates(map);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [token]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setSaveError("");
    try {
      await marketingAdminApi.updateCommissionRates(
        token!,
        PARTNER_TYPES.map((t) => ({ partner_type: t, rate: parseFloat(rates[t] || "0") })),
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setSaveError(e.message || "Failed to save rates");
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
    <div className="p-8 max-w-lg space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Commission Rates</h1>
        <p className="text-muted-foreground mt-1">
          Set a fixed commission rate for each partner type. All partners of that type earn this rate.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Rates by Partner Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {PARTNER_TYPES.map((type) => (
            <div key={type} className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[160px]">
                <p className="text-sm font-medium text-foreground">{type}</p>
              </div>
              <div className="flex items-center gap-2 w-36">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={rates[type] ?? "0"}
                  onChange={(e) => setRates((r) => ({ ...r, [type]: e.target.value }))}
                  className="text-right"
                />
                <Percent className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </div>
            </div>
          ))}

          <div className="pt-2 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Rates
              </Button>
              {saved && (
                <div className="flex items-center gap-1.5 text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Saved
                </div>
              )}
            </div>
            {saveError && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{saveError}</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm bg-muted/50">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">How it works:</strong> When monthly payouts are generated,
            each partner's commission is calculated using the rate for their partner type at that time.
            Changing a rate takes effect on the next payout generation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
