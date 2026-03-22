import { useEffect, useState } from "react";
import { usePartnerAuth } from "@/hooks/usePartnerAuth";
import { partnerApi } from "@/lib/partnerApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Loader2, Search, Smartphone, Globe, HelpCircle } from "lucide-react";

function fmt(n: number) {
  return `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

const COLORS = [
  "hsl(190 85% 50%)",
  "hsl(210 80% 55%)",
  "hsl(150 60% 50%)",
  "hsl(35 100% 55%)",
  "hsl(270 60% 55%)",
];

export default function PartnerStudents() {
  const { token } = usePartnerAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!token) return;
    partnerApi.students(token).then((d) => {
      setData(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const students = data?.students || [];
  const cityBreakdown = data?.cityBreakdown || [];
  const examInterest = data?.examInterest || [];

  const filtered = students.filter(
    (s: any) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.city?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()),
  );

  const cityChartData = cityBreakdown.slice(0, 8).map((c: any, i: number) => ({
    name: c.city || "Unknown",
    count: parseInt(c.count || "0"),
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Students</h1>
        <p className="text-muted-foreground mt-1">{students.length} students referred</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* City Breakdown */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>City Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {cityChartData.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                No city data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={cityChartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {cityChartData.map((entry: any) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Exam Interest */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Exam Interest</CardTitle>
          </CardHeader>
          <CardContent>
            {examInterest.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                No purchase data yet
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {examInterest.map((e: any) => {
                  const max = parseInt(examInterest[0]?.count || "1");
                  return (
                    <div key={e.title} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{e.title}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${max > 0 ? (parseInt(e.count || "0") / max) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold w-6 text-right">{e.count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Students Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Attempts</TableHead>
                <TableHead className="text-right">Spent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    {search ? "No results found" : "No students yet"}
                  </TableCell>
                </TableRow>
              ) : filtered.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name || "—"}</TableCell>
                  <TableCell>{s.city || "—"}</TableCell>
                  <TableCell>
                    {s.signup_source === "android" || s.signup_source === "ios" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium">
                        <Smartphone className="w-3 h-3" /> App
                      </span>
                    ) : s.signup_source === "web" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-blue-700 font-medium">
                        <Globe className="w-3 h-3" /> Web
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <HelpCircle className="w-3 h-3" /> —
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {parseInt(s.purchase_count || "0") > 0 ? (
                      <Badge className="bg-green-100 text-green-800 border-0">Paid</Badge>
                    ) : (
                      <Badge variant="outline">Free</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {s.joined_at ? new Date(s.joined_at).toLocaleDateString("en-IN") : "—"}
                  </TableCell>
                  <TableCell className="text-right">{s.attempt_count}</TableCell>
                  <TableCell className="text-right">{fmt(parseFloat(s.total_spent || 0))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
