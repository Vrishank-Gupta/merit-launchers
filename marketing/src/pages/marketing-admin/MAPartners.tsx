import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMAAuth } from "@/hooks/useMarketingAdminAuth";
import { marketingAdminApi } from "@/lib/partnerApi";
import { PARTNER_PROFESSIONS, PARTNER_TYPES } from "@/lib/partnerMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Search, Eye, Pencil, ShieldAlert } from "lucide-react";

const typeColors: Record<string, string> = {
  "Campus Ambassador": "bg-blue-100 text-blue-800",
  "Education Associate": "bg-teal-100 text-teal-800",
  "Institutional Partner": "bg-violet-100 text-violet-800",
};

const lifecycleColors: Record<string, string> = {
  New: "bg-sky-100 text-sky-800",
  Active: "bg-emerald-100 text-emerald-800",
  "High Performer": "bg-violet-100 text-violet-800",
  "At Risk": "bg-rose-100 text-rose-800",
};

export default function MAPartners() {
  const { token } = useMAAuth();
  const navigate = useNavigate();
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [lifecycle, setLifecycle] = useState("all");
  const [partnerType, setPartnerType] = useState("all");
  const [profession, setProfession] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);

  const load = () => {
    if (!token) return;
    marketingAdminApi.getPartners(token).then((data) => {
      setPartners(data.partners || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [token]);

  const filtered = useMemo(() => partners.filter((partner) => {
    const lower = search.toLowerCase();
    const matchesQuery =
      !lower ||
      partner.name?.toLowerCase().includes(lower) ||
      partner.code?.toLowerCase().includes(lower) ||
      partner.associate_id?.toLowerCase().includes(lower) ||
      partner.partner_type?.toLowerCase().includes(lower) ||
      partner.profession?.toLowerCase().includes(lower) ||
      partner.pincode?.toLowerCase().includes(lower) ||
      partner.login_email?.toLowerCase().includes(lower) ||
      partner.phone?.toLowerCase().includes(lower);
    const matchesLifecycle = lifecycle === "all" || partner.lifecycle === lifecycle;
    const matchesType = partnerType === "all" || partner.partner_type === partnerType;
    const matchesProfession = profession === "all" || partner.profession === profession;
    return matchesQuery && matchesLifecycle && matchesType && matchesProfession;
  }), [partners, search, lifecycle, partnerType, profession]);

  const toggleSelection = (partnerId: string) => {
    setSelected((current) => current.includes(partnerId) ? current.filter((id) => id !== partnerId) : [...current, partnerId]);
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
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Partners</h1>
          <p className="text-muted-foreground mt-1">{partners.length} partners in the operating system</p>
        </div>
        <Button onClick={() => navigate("/marketing-admin/partners/new")}>
          <Plus className="w-4 h-4 mr-2" />
          Add partner
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {["New", "Active", "High Performer", "At Risk"].map((bucket) => {
          const count = partners.filter((partner) => partner.lifecycle === bucket).length;
          return (
            <Card key={bucket} className="border-border/70 shadow-sm">
              <CardContent className="p-5">
                <Badge className={lifecycleColors[bucket]}>{bucket}</Badge>
                <p className="mt-4 text-3xl font-semibold text-foreground">{count}</p>
                <p className="mt-1 text-sm text-muted-foreground">Partners in this stage</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <CardTitle>Partner operating table</CardTitle>
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by name, code, ID, profession, pincode..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={lifecycle} onValueChange={setLifecycle}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Lifecycle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All lifecycles</SelectItem>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="High Performer">High Performer</SelectItem>
                  <SelectItem value="At Risk">At Risk</SelectItem>
                </SelectContent>
              </Select>
              <Select value={partnerType} onValueChange={setPartnerType}>
                <SelectTrigger className="w-full md:w-52">
                  <SelectValue placeholder="Partner type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All partner types</SelectItem>
                  {PARTNER_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={profession} onValueChange={setProfession}>
                <SelectTrigger className="w-full md:w-56">
                  <SelectValue placeholder="Profession" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All professions</SelectItem>
                  {PARTNER_PROFESSIONS.map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {selected.length > 0 ? (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {selected.length} partner{selected.length === 1 ? "" : "s"} selected. Use this selection to review records in detail or manage them in focused batches.
            </div>
          ) : null}
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12" />
                <TableHead>Partner</TableHead>
                <TableHead>Type</TableHead>
              <TableHead>Lifecycle</TableHead>
              <TableHead>Access</TableHead>
              <TableHead className="text-right">Health</TableHead>
                <TableHead className="text-right">Students</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Open leads</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="py-12 text-center text-muted-foreground">
                    No partners match this view.
                  </TableCell>
                </TableRow>
              ) : filtered.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell>
                    <Checkbox checked={selected.includes(partner.id)} onCheckedChange={() => toggleSelection(partner.id)} />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{partner.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[partner.associate_id || partner.code, partner.profession, partner.pincode].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColors[partner.partner_type] || "bg-muted text-foreground"}`}>
                      {partner.partner_type || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={lifecycleColors[partner.lifecycle] || "bg-muted text-foreground"}>{partner.lifecycle}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={partner.invitation_status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>
                      {partner.invitation_status === "active" ? "Active" : "Invitation sent"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                      {partner.health_score}
                      {partner.health_band === "critical" ? <ShieldAlert className="h-3.5 w-3.5 text-rose-600" /> : null}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{partner.total_referred || 0}</TableCell>
                  <TableCell className="text-right">{partner.total_clicks || 0}</TableCell>
                  <TableCell className="text-right">Rs {Number(partner.total_revenue || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</TableCell>
                  <TableCell className="text-right">{partner.open_leads || 0}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/marketing-admin/partners/${partner.id}`)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/marketing-admin/partners/${partner.id}/edit`)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

