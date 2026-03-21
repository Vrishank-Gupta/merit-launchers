import { useEffect, useState } from "react";
import { usePartnerAuth } from "@/hooks/usePartnerAuth";
import { partnerApi } from "@/lib/partnerApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Copy, Check, FileText, Link } from "lucide-react";

const categoryColors: Record<string, string> = {
  Poster: "bg-pink-100 text-pink-800",
  Template: "bg-blue-100 text-blue-800",
  WhatsApp: "bg-green-100 text-green-800",
  Webinar: "bg-purple-100 text-purple-800",
  Other: "bg-gray-100 text-gray-800",
};

const CHANNELS = ["direct", "whatsapp", "instagram", "youtube", "telegram", "college"];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <Button variant="ghost" size="sm" onClick={copy} className="h-8 px-2">
      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
    </Button>
  );
}

export default function PartnerToolkit() {
  const { token, affiliate } = usePartnerAuth();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    partnerApi.toolkit(token).then((d) => {
      setFiles(d.files || []);
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

  const code = affiliate?.code;
  const baseUrl = window.location.origin;

  // Group files by category
  const grouped = files.reduce((acc: Record<string, any[]>, f) => {
    if (!acc[f.category]) acc[f.category] = [];
    acc[f.category].push(f);
    return acc;
  }, {});

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Toolkit</h1>
        <p className="text-muted-foreground mt-1">Marketing materials and your referral links</p>
      </div>

      {/* Referral Links */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Link className="w-4 h-4 text-primary" />
            <CardTitle>Your Referral Links</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!code ? (
            <p className="text-sm text-muted-foreground">Referral code not available.</p>
          ) : CHANNELS.map((channel) => {
            const url = `${baseUrl}/ref/${code}/${channel}`;
            return (
              <div key={channel} className="flex items-center gap-2">
                <span className="w-24 text-sm font-medium capitalize text-muted-foreground flex-shrink-0">
                  {channel}
                </span>
                <div className="flex-1 flex items-center bg-muted rounded-lg px-3 py-2 gap-2 min-w-0">
                  <code className="text-xs text-foreground flex-1 truncate">{url}</code>
                  <CopyButton text={url} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Files by Category */}
      {Object.keys(grouped).length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FileText className="w-12 h-12 mb-3 opacity-40" />
            <p>No toolkit files available yet</p>
            <p className="text-xs mt-1">Your team will upload materials here</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([category, categoryFiles]) => (
          <Card key={category} className="shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    categoryColors[category] || categoryColors.Other
                  }`}
                >
                  {category}
                </span>
                <CardTitle className="text-base">{category} Files</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {categoryFiles.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{f.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{f.file_name}</p>
                    </div>
                    <Button size="sm" variant="outline" className="ml-2 flex-shrink-0" asChild>
                      <a href={f.file_url} target="_blank" rel="noopener noreferrer" download>
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
