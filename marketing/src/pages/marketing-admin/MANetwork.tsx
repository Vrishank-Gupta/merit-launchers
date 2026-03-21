import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMAAuth } from "@/hooks/useMarketingAdminAuth";
import { marketingAdminApi } from "@/lib/partnerApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2, ChevronRight, ChevronDown, Users, Search, ExternalLink,
} from "lucide-react";

function fmt(n: number) {
  return `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

const TYPE_COLORS: Record<string, string> = {
  "Campus Ambassador":    "bg-blue-100 text-blue-700 border-blue-200",
  "Education Associate":  "bg-purple-100 text-purple-700 border-purple-200",
  "Institutional Partner":"bg-orange-100 text-orange-700 border-orange-200",
};

// Count all descendants recursively
function countDescendants(node: any): number {
  return node.children.reduce(
    (sum: number, child: any) => sum + 1 + countDescendants(child),
    0,
  );
}

// Check if node or any descendant matches search
function nodeMatches(node: any, q: string): boolean {
  if (!q) return true;
  const lower = q.toLowerCase();
  if (
    node.name?.toLowerCase().includes(lower) ||
    node.code?.toLowerCase().includes(lower) ||
    node.partner_type?.toLowerCase().includes(lower)
  ) return true;
  return node.children.some((c: any) => nodeMatches(c, q));
}

function TreeNode({
  node,
  depth,
  search,
}: {
  node: any;
  depth: number;
  search: string;
}) {
  const navigate = useNavigate();
  const hasChildren = node.children.length > 0;
  const totalDescendants = countDescendants(node);
  // Auto-expand top 2 levels, or if search is active
  const [expanded, setExpanded] = useState(depth < 2 || !!search);

  useEffect(() => {
    if (search) setExpanded(true);
  }, [search]);

  // Filter children by search
  const visibleChildren = search
    ? node.children.filter((c: any) => nodeMatches(c, search))
    : node.children;

  return (
    <div>
      {/* Node row */}
      <div
        className="flex items-center gap-2 py-2 pr-2 rounded-lg hover:bg-muted/60 transition-colors group"
        style={{ paddingLeft: `${depth * 24 + 8}px` }}
      >
        {/* Expand toggle */}
        <button
          className="w-5 h-5 flex-shrink-0 flex items-center justify-center text-muted-foreground hover:text-foreground"
          onClick={() => hasChildren && setExpanded((v) => !v)}
          style={{ visibility: hasChildren ? "visible" : "hidden" }}
        >
          {expanded
            ? <ChevronDown className="w-4 h-4" />
            : <ChevronRight className="w-4 h-4" />}
        </button>

        {/* Status dot */}
        <div
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            node.status === "active" ? "bg-green-500" : "bg-yellow-400"
          }`}
        />

        {/* Name + code */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="font-medium text-sm text-foreground truncate">{node.name}</span>
          <code className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded flex-shrink-0">
            {node.code}
          </code>
          <Badge
            variant="outline"
            className={`text-xs flex-shrink-0 hidden sm:inline-flex ${TYPE_COLORS[node.partner_type] || ""}`}
          >
            {node.partner_type}
          </Badge>
        </div>

        {/* Stats */}
        <div className="hidden md:flex items-center gap-5 text-xs text-muted-foreground flex-shrink-0">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {node.total_students} students
          </span>
          <span>{fmt(parseFloat(node.total_revenue || "0"))}</span>
          <span>{node.total_clicks} clicks</span>
          {totalDescendants > 0 && (
            <span className="text-primary font-medium">{totalDescendants} total sub-partners</span>
          )}
        </div>

        {/* View button */}
        <Button
          size="sm"
          variant="ghost"
          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 h-7 px-2"
          onClick={() => navigate(`/marketing-admin/partners/${node.id}`)}
        >
          <ExternalLink className="w-3 h-3" />
        </Button>
      </div>

      {/* Connecting line + children */}
      {expanded && visibleChildren.length > 0 && (
        <div
          className="border-l border-border ml-6"
          style={{ marginLeft: `${depth * 24 + 20}px` }}
        >
          {visibleChildren.map((child: any) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} search={search} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MANetwork() {
  const { token } = useMAAuth();
  const [tree, setTree] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!token) return;
    marketingAdminApi.getNetwork(token)
      .then((d) => { setTree(d.tree || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const totalPartners = (function count(nodes: any[]): number {
    return nodes.reduce((s, n) => s + 1 + count(n.children), 0);
  })(tree);

  const filteredTree = search
    ? tree.filter((n) => nodeMatches(n, search))
    : tree;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Partner Network</h1>
          <p className="text-muted-foreground mt-1">
            Full hierarchy — {totalPartners} partners total
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search name, code, type…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500" /> Active
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-yellow-400" /> Pending
        </div>
        <div className="flex items-center gap-2 ml-2">
          <Badge variant="outline" className={`text-xs ${TYPE_COLORS["Campus Ambassador"]}`}>Campus Ambassador</Badge>
          <Badge variant="outline" className={`text-xs ${TYPE_COLORS["Education Associate"]}`}>Education Associate</Badge>
          <Badge variant="outline" className={`text-xs ${TYPE_COLORS["Institutional Partner"]}`}>Institutional Partner</Badge>
        </div>
      </div>

      {/* Tree */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {filteredTree.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {search ? "No partners match your search." : "No partners yet."}
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-0.5">
            {filteredTree.map((node) => (
              <TreeNode key={node.id} node={node} depth={0} search={search} />
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Hover a partner to reveal the View button. Click the arrow to expand/collapse.
      </p>
    </div>
  );
}
