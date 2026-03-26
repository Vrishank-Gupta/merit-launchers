import { useEffect, useMemo, useState } from "react";
import { usePartnerAuth } from "@/hooks/usePartnerAuth";
import { partnerApi } from "@/lib/partnerApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Plus, PhoneCall, CalendarClock, CheckCircle2, Flame, Search } from "lucide-react";

const statusOptions = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "interested", label: "Interested" },
  { value: "follow_up_due", label: "Follow-up due" },
  { value: "converted", label: "Converted" },
  { value: "dropped", label: "Dropped" },
];

const priorityOptions = [
  { value: "high", label: "High" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
];

const statusTone: Record<string, string> = {
  new: "bg-sky-100 text-sky-800",
  contacted: "bg-indigo-100 text-indigo-800",
  interested: "bg-amber-100 text-amber-800",
  follow_up_due: "bg-rose-100 text-rose-800",
  converted: "bg-emerald-100 text-emerald-800",
  dropped: "bg-slate-200 text-slate-700",
};

function toLocalInputValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default function PartnerLeads() {
  const { token } = usePartnerAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    city: "",
    exam_interest: "",
    source: "manual",
    status: "new",
    priority: "normal",
    notes: "",
    next_follow_up_at: "",
  });

  const load = () => {
    if (!token) return;
    partnerApi.leads(token).then((data) => {
      setLeads(data.leads || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [token]);

  const resetForm = () => {
    setForm({
      name: "",
      phone: "",
      city: "",
      exam_interest: "",
      source: "manual",
      status: "new",
      priority: "normal",
      notes: "",
      next_follow_up_at: "",
    });
    setEditingLead(null);
  };

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const lower = query.toLowerCase();
      const matchesQuery =
        !lower ||
        lead.name?.toLowerCase().includes(lower) ||
        lead.exam_interest?.toLowerCase().includes(lower) ||
        lead.city?.toLowerCase().includes(lower) ||
        lead.phone?.toLowerCase().includes(lower);
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || lead.priority === priorityFilter;
      return matchesQuery && matchesStatus && matchesPriority;
    });
  }, [leads, query, statusFilter, priorityFilter]);

  const summary = useMemo(() => ({
    dueToday: leads.filter((lead) => lead.next_follow_up_at && new Date(lead.next_follow_up_at) <= new Date() && !["converted", "dropped"].includes(lead.status)).length,
    open: leads.filter((lead) => !["converted", "dropped"].includes(lead.status)).length,
    converted: leads.filter((lead) => lead.status === "converted").length,
    highPriority: leads.filter((lead) => lead.priority === "high" && !["converted", "dropped"].includes(lead.status)).length,
  }), [leads]);

  const startCreate = () => {
    resetForm();
    setOpen(true);
  };

  const startEdit = (lead: any) => {
    setEditingLead(lead);
    setForm({
      name: lead.name || "",
      phone: lead.phone || "",
      city: lead.city || "",
      exam_interest: lead.exam_interest || "",
      source: lead.source || "manual",
      status: lead.status || "new",
      priority: lead.priority || "normal",
      notes: lead.notes || "",
      next_follow_up_at: toLocalInputValue(lead.next_follow_up_at),
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!token || !form.name.trim()) return;
    setSaving(true);
    const payload = {
      ...form,
      next_follow_up_at: form.next_follow_up_at ? new Date(form.next_follow_up_at).toISOString() : null,
    };
    try {
      if (editingLead) {
        await partnerApi.updateLead(token, editingLead.id, payload);
      } else {
        await partnerApi.createLead(token, payload);
      }
      setOpen(false);
      resetForm();
      load();
    } finally {
      setSaving(false);
    }
  };

  const updateLeadStatus = async (lead: any, status: string) => {
    if (!token) return;
    await partnerApi.updateLead(token, lead.id, { status });
    load();
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leads & follow-up</h1>
          <p className="text-muted-foreground mt-1">Track every prospect so your follow-up stays systematic.</p>
        </div>
        <Button onClick={startCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add lead
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Open leads", value: summary.open, icon: PhoneCall },
          { label: "Follow-up due", value: summary.dueToday, icon: CalendarClock },
          { label: "Converted", value: summary.converted, icon: CheckCircle2 },
          { label: "High priority", value: summary.highPriority, icon: Flame },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="border-border/70 shadow-sm">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-3xl font-semibold text-foreground mt-2">{value}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle>Lead board</CardTitle>
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search lead, exam, city..." className="pl-9" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {statusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  {priorityOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredLeads.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-muted/40 px-6 py-14 text-center">
              <p className="text-lg font-semibold text-foreground">No leads in this view</p>
              <p className="mt-2 text-sm text-muted-foreground">Add prospects here and use follow-up dates to keep your pipeline moving.</p>
            </div>
          ) : (
            filteredLeads.map((lead) => (
              <div key={lead.id} className="rounded-3xl border border-border/70 bg-background p-5 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-foreground">{lead.name}</h3>
                      <Badge className={statusTone[lead.status] || "bg-muted text-foreground"}>{statusOptions.find((option) => option.value === lead.status)?.label || lead.status}</Badge>
                      <Badge variant="outline" className="capitalize">{lead.priority} priority</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {[lead.exam_interest, lead.city, lead.phone].filter(Boolean).join(" · ") || "No extra lead details yet"}
                    </p>
                    {lead.notes ? <p className="text-sm text-foreground/85">{lead.notes}</p> : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={lead.status} onValueChange={(value) => updateLeadStatus(lead, value)}>
                      <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => startEdit(lead)}>Edit</Button>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>Source: {lead.source || "manual"}</span>
                  <span>Created: {lead.created_at ? new Date(lead.created_at).toLocaleDateString("en-IN") : "—"}</span>
                  <span>Next follow-up: {lead.next_follow_up_at ? new Date(lead.next_follow_up_at).toLocaleString("en-IN") : "Not set"}</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) resetForm(); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingLead ? "Update lead" : "Add a new lead"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Lead name</Label>
              <Input value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} placeholder="Aarav Sharma" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))} placeholder="9876543210" />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={form.city} onChange={(e) => setForm((current) => ({ ...current, city: e.target.value }))} placeholder="Delhi" />
            </div>
            <div className="space-y-2">
              <Label>Exam interest</Label>
              <Input value={form.exam_interest} onChange={(e) => setForm((current) => ({ ...current, exam_interest: e.target.value }))} placeholder="CTET, CUET, CLAT..." />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(value) => setForm((current) => ({ ...current, priority: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <Input value={form.source} onChange={(e) => setForm((current) => ({ ...current, source: e.target.value }))} placeholder="manual, whatsapp, campus..." />
            </div>
            <div className="space-y-2">
              <Label>Next follow-up</Label>
              <Input type="datetime-local" value={form.next_follow_up_at} onChange={(e) => setForm((current) => ({ ...current, next_follow_up_at: e.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} placeholder="Context, objections, next ask, parent concern..." rows={5} />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingLead ? "Save changes" : "Add lead"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
