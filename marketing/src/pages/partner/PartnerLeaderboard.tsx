import { useEffect, useState } from "react";
import { usePartnerAuth } from "@/hooks/usePartnerAuth";
import { partnerApi } from "@/lib/partnerApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Trophy } from "lucide-react";

function fmt(n: number) {
  return `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

const RANK_BADGES: Record<number, { label: string; class: string }> = {
  1: { label: "Gold", class: "bg-yellow-400 text-yellow-900" },
  2: { label: "Silver", class: "bg-gray-300 text-gray-800" },
  3: { label: "Bronze", class: "bg-amber-600 text-amber-50" },
};

export default function PartnerLeaderboard() {
  const { token } = usePartnerAuth();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    partnerApi.leaderboard(token).then((d) => {
      setLeaderboard(d.leaderboard || []);
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

  const myRow = leaderboard.find((r) => r.isMe);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground mt-1">This month's top partners by revenue</p>
      </div>

      {myRow && (
        <Card className="shadow-sm bg-primary/5 border-primary/30">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Your Ranking</p>
                  <p className="text-sm text-muted-foreground">{myRow.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">#{myRow.rank}</p>
                <p className="text-sm text-muted-foreground">{fmt(myRow.revenueThisMonth)} this month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top 3 */}
      {leaderboard.slice(0, 3).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {leaderboard.slice(0, 3).map((r) => {
            const badge = RANK_BADGES[r.rank];
            return (
              <Card key={r.name || r.rank} className={`shadow-sm text-center ${r.isMe ? "ring-2 ring-primary" : ""}`}>
                <CardContent className="pt-6 pb-4">
                  <div
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-lg font-bold mb-3 ${badge.class}`}
                  >
                    {r.rank}
                  </div>
                  <p className="font-semibold text-sm truncate">{r.name}{r.isMe && " (You)"}</p>
                  <p className="text-xl font-bold text-foreground mt-2">{fmt(r.revenueThisMonth)}</p>
                  <p className="text-xs text-muted-foreground">{r.studentsThisMonth} students</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Full Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Full Rankings</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Partner</TableHead>
                <TableHead className="text-right">Students</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                    No data this month
                  </TableCell>
                </TableRow>
              ) : leaderboard.map((r) => {
                const badge = RANK_BADGES[r.rank];
                return (
                  <TableRow
                    key={r.name || r.rank}
                    className={r.isMe ? "bg-primary/5 font-semibold" : ""}
                  >
                    <TableCell>
                      {badge ? (
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${badge.class}`}>
                          {r.rank}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">{r.rank}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {r.name}
                      {r.isMe && <Badge className="ml-2 bg-primary/10 text-primary border-0 text-xs">You</Badge>}
                    </TableCell>
                    <TableCell className="text-right">{r.studentsThisMonth}</TableCell>
                    <TableCell className="text-right font-semibold">{fmt(r.revenueThisMonth)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
