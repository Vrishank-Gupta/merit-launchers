import { useEffect, useState } from "react";
import { usePartnerAuth } from "@/hooks/usePartnerAuth";
import { partnerApi } from "@/lib/partnerApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";

function fmt(n: number) {
  return `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

const PIE_COLORS = [
  "hsl(190 85% 50%)",
  "hsl(210 80% 55%)",
  "hsl(150 60% 50%)",
  "hsl(35 100% 55%)",
  "hsl(270 60% 55%)",
  "hsl(0 70% 60%)",
];

export default function PartnerSales() {
  const { token } = usePartnerAuth();
  const [monthly, setMonthly] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([partnerApi.monthly(token), partnerApi.courses(token)]).then(([m, c]) => {
      setMonthly(m.monthly || []);
      setCourses(c.courses || []);
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

  const chartData = monthly.map((m) => ({
    month: m.month_label,
    revenue: parseFloat(m.revenue || "0"),
    students: parseInt(m.students || "0"),
    growth: m.growth ? parseFloat(m.growth) : null,
  }));

  const pieData = courses.slice(0, 6).map((c: any) => ({
    name: c.title,
    value: parseFloat(c.revenue || "0"),
  }));

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sales & Revenue</h1>
        <p className="text-muted-foreground mt-1">Monthly performance and course breakdown</p>
      </div>

      {/* Monthly Trend Chart */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Monthly Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              No sales data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: any, name: string) => [
                    name === "revenue" ? fmt(value) : value,
                    name === "revenue" ? "Revenue" : "Students",
                  ]}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="hsl(190 85% 50%)" radius={[4, 4, 0, 0]} opacity={0.85} />
                <Line yAxisId="right" type="monotone" dataKey="students" name="Students" stroke="hsl(35 100% 55%)" strokeWidth={2} dot={{ fill: "hsl(35 100% 55%)" }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Monthly Table */}
      {monthly.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Monthly Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Students</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Growth</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthly.map((m) => {
                  const growth = m.growth ? parseFloat(m.growth) : null;
                  return (
                    <TableRow key={m.month}>
                      <TableCell className="font-medium">{m.month_label}</TableCell>
                      <TableCell className="text-right">{m.students}</TableCell>
                      <TableCell className="text-right font-semibold">{fmt(parseFloat(m.revenue))}</TableCell>
                      <TableCell className="text-right">
                        {growth === null ? (
                          <span className="text-muted-foreground">—</span>
                        ) : growth > 0 ? (
                          <span className="text-green-600 flex items-center justify-end gap-1 text-sm">
                            <TrendingUp className="w-3.5 h-3.5" />+{growth}%
                          </span>
                        ) : growth < 0 ? (
                          <span className="text-red-600 flex items-center justify-end gap-1 text-sm">
                            <TrendingDown className="w-3.5 h-3.5" />{growth}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground flex items-center justify-end gap-1 text-sm">
                            <Minus className="w-3.5 h-3.5" />0%
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Table */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Course Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead className="text-right">Students</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No purchases yet</TableCell>
                  </TableRow>
                ) : courses.map((c: any) => (
                  <TableRow key={c.title}>
                    <TableCell className="font-medium text-sm">{c.title}</TableCell>
                    <TableCell className="text-right">{c.students}</TableCell>
                    <TableCell className="text-right font-semibold">{fmt(parseFloat(c.revenue))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Revenue by Course</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                No data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) => `${name.slice(0, 12)} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
