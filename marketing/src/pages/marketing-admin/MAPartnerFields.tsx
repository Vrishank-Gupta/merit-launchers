import { useEffect, useState } from "react";
import { useMAAuth } from "@/hooks/useMarketingAdminAuth";
import { marketingAdminApi } from "@/lib/partnerApi";
import { normalizePartnerFields } from "@/lib/partnerMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, MoveDown, MoveUp, Plus, Save, Settings2 } from "lucide-react";

export default function MAPartnerFields() {
  const { token } = useMAAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [fields, setFields] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;
    marketingAdminApi.getPartnerProfileFields(token)
      .then((response) => setFields(normalizePartnerFields(response)))
      .catch((e: any) => setError(e.message || "Unable to load partner field settings."))
      .finally(() => setLoading(false));
  }, [token]);

  const updateField = (fieldKey: string, patch: Record<string, any>) => {
    setFields((current) => current.map((field) => field.field_key === fieldKey ? {...field, ...patch} : field));
  };

  const updateOption = (fieldKey: string, optionId: string, patch: Record<string, any>) => {
    setFields((current) => current.map((field) => field.field_key !== fieldKey ? field : {
      ...field,
      options: field.options.map((option: any) => option.id === optionId ? {...option, ...patch} : option),
    }));
  };

  const addOption = (fieldKey: string) => {
    setFields((current) => current.map((field) => field.field_key !== fieldKey ? field : {
      ...field,
      options: [
        ...field.options,
        {
          id: `local_${fieldKey}_${Date.now()}_${field.options.length + 1}`,
          field_key: fieldKey,
          value: "",
          label: "",
          enabled: true,
          sort_order: (field.options.length + 1) * 10,
        },
      ],
    }));
  };

  const resequence = (items: any[]) => items.map((item, index) => ({ ...item, sort_order: (index + 1) * 10 }));

  const moveField = (fieldKey: string, direction: "up" | "down") => {
    setFields((current) => {
      const index = current.findIndex((field) => field.field_key === fieldKey);
      if (index < 0) return current;
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return resequence(next);
    });
  };

  const moveOption = (fieldKey: string, optionId: string, direction: "up" | "down") => {
    setFields((current) => current.map((field) => {
      if (field.field_key !== fieldKey) return field;
      const index = field.options.findIndex((option: any) => option.id === optionId);
      if (index < 0) return field;
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= field.options.length) return field;
      const nextOptions = [...field.options];
      [nextOptions[index], nextOptions[targetIndex]] = [nextOptions[targetIndex], nextOptions[index]];
      return { ...field, options: resequence(nextOptions) };
    }));
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const payload = fields.map((field) => ({
        ...field,
        options: Array.isArray(field.options)
          ? field.options.map((option: any, index: number) => ({
              ...option,
              value: String(option.value || option.label || "").trim(),
              label: String(option.label || option.value || "").trim(),
              sort_order: Number(option.sort_order || (index + 1) * 10),
            })).filter((option: any) => option.value)
          : [],
      }));
      const response = await marketingAdminApi.updatePartnerProfileFields(token!, payload);
      setFields(normalizePartnerFields(response));
      setNotice("Partner onboarding fields updated successfully.");
    } catch (e: any) {
      setError(e.message || "Unable to save partner field settings.");
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
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Partner Onboarding Form</h1>
          <p className="text-muted-foreground mt-1">
            Control what future partners see in the onboarding form, which details are compulsory, and which dropdown choices are available.
          </p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save field settings
        </Button>
      </div>

      {error ? <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}
      {notice ? <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div> : null}

      <div className="grid gap-5">
        {fields.map((field) => (
          <Card key={field.field_key} className="border-border/70 shadow-sm">
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings2 className="w-4 h-4 text-primary" />
                    {field.label}
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {field.field_type === "dropdown"
                      ? "Partners will choose one option from this list during onboarding."
                      : "This field appears in the onboarding form exactly as named below."}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => moveField(field.field_key, "up")}
                    aria-label={`Move ${field.label} up`}
                  >
                    <MoveUp className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => moveField(field.field_key, "down")}
                    aria-label={`Move ${field.label} down`}
                  >
                    <MoveDown className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2 md:col-span-2">
                  <Label>Field name shown to partners</Label>
                  <Input value={field.label} onChange={(e) => updateField(field.field_key, {label: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Field style</Label>
                  <Input value={field.field_type} disabled />
                </div>
              </div>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-3 text-sm text-foreground">
                  <Switch checked={field.enabled !== false} onCheckedChange={(checked) => updateField(field.field_key, {enabled: checked})} />
                  Show this field in onboarding
                </label>
                <label className="flex items-center gap-3 text-sm text-foreground">
                  <Switch checked={field.required === true} onCheckedChange={(checked) => updateField(field.field_key, {required: checked})} />
                  Make this compulsory
                </label>
              </div>
              {field.field_type === "dropdown" ? (
                <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">Choices shown in the dropdown</h3>
                      <p className="text-sm text-muted-foreground">Turn a choice off to hide it from future onboarding while keeping older partner records intact.</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => addOption(field.field_key)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add choice
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {field.options.map((option: any, index: number) => (
                      <div key={option.id} className="grid gap-3 rounded-xl border border-border/70 bg-background p-3 md:grid-cols-[1.8fr_150px_120px]">
                        <div className="space-y-1">
                          <Label>Choice shown to partners</Label>
                          <Input
                            value={option.label}
                            onChange={(e) => updateOption(field.field_key, option.id, {
                              label: e.target.value,
                              value: option.value ? option.value : e.target.value,
                            })}
                          />
                        </div>
                        <div className="flex items-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => moveOption(field.field_key, option.id, "up")}
                            disabled={index === 0}
                            aria-label={`Move ${option.label || "choice"} up`}
                          >
                            <MoveUp className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => moveOption(field.field_key, option.id, "down")}
                            disabled={index === field.options.length - 1}
                            aria-label={`Move ${option.label || "choice"} down`}
                          >
                            <MoveDown className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex items-end gap-3">
                          <label className="flex items-center gap-2 text-sm">
                            <Switch checked={option.enabled !== false} onCheckedChange={(checked) => updateOption(field.field_key, option.id, {enabled: checked})} />
                            Show
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
