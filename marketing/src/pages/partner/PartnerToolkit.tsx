import { useEffect, useMemo, useState } from "react";
import { usePartnerAuth } from "@/hooks/usePartnerAuth";
import { partnerApi } from "@/lib/partnerApi";
import { playbookSections, outreachChannels } from "@/lib/partnerPlaybook";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Download, Copy, Check, FileText, Link as LinkIcon, Sparkles, MessagesSquare } from "lucide-react";

const categoryColors: Record<string, string> = {
  Poster: "bg-pink-100 text-pink-800",
  Template: "bg-blue-100 text-blue-800",
  WhatsApp: "bg-green-100 text-green-800",
  Webinar: "bg-purple-100 text-purple-800",
  Other: "bg-gray-100 text-gray-800",
};

const CHANNELS = ["direct", "whatsapp", "instagram", "youtube", "telegram", "college"];

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <Button variant="outline" size="sm" onClick={copy} className="rounded-full">
      {copied ? <Check className="mr-2 h-3.5 w-3.5 text-emerald-600" /> : <Copy className="mr-2 h-3.5 w-3.5" />}
      {copied ? "Copied" : label}
    </Button>
  );
}

export default function PartnerToolkit() {
  const { token, affiliate } = usePartnerAuth();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    partnerApi.toolkit(token).then((data) => {
      setFiles(data.files || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [token]);

  const code = affiliate?.code;
  const baseUrl = window.location.origin;
  const grouped = useMemo(() => files.reduce((acc: Record<string, any[]>, file) => {
    if (!acc[file.category]) acc[file.category] = [];
    acc[file.category].push(file);
    return acc;
  }, {}), [files]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="max-w-3xl space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Toolkit & scripts</h1>
        <p className="text-muted-foreground">
          Use one place for referral links, outreach copy, and reusable assets so you are not improvising every conversation.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-primary" />
              <CardTitle>Your referral links</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {!code ? (
              <p className="text-sm text-muted-foreground">Referral code not available.</p>
            ) : CHANNELS.map((channel) => {
              const url = `${baseUrl}/ref/${code}/${channel}`;
              return (
                <div key={channel} className="flex flex-col gap-2 rounded-3xl border border-border/70 p-4 lg:flex-row lg:items-center">
                  <div className="w-28 flex-shrink-0">
                    <p className="text-sm font-medium capitalize text-foreground">{channel}</p>
                    <p className="text-xs text-muted-foreground">Tracked separately</p>
                  </div>
                  <div className="flex-1 rounded-2xl bg-muted/40 px-3 py-2">
                    <code className="block truncate text-xs text-foreground">{url}</code>
                  </div>
                  <CopyButton text={url} />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle>How to use this toolkit</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {outreachChannels.map((item) => (
              <div key={item.title} className="rounded-3xl border border-border/70 p-4">
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="scripts" className="space-y-5">
        <TabsList className="flex h-auto flex-wrap gap-2 rounded-full bg-transparent p-0">
          <TabsTrigger value="scripts" className="rounded-full border border-border bg-background px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Scripts & playbook
          </TabsTrigger>
          <TabsTrigger value="assets" className="rounded-full border border-border bg-background px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Downloadable assets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scripts" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            {playbookSections.map((section) => (
              <Card key={section.id} className="border-border/70 shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MessagesSquare className="h-4 w-4 text-primary" />
                    <CardTitle className="text-lg">{section.label}</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {section.entries.map((entry) => (
                    <div key={entry.title} className="rounded-3xl border border-border/70 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-foreground">{entry.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{entry.when}</p>
                        </div>
                        <CopyButton text={entry.script} label="Copy script" />
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground/90">{entry.script}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          {Object.keys(grouped).length === 0 ? (
            <Card className="border-border/70 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <FileText className="mb-3 h-12 w-12 opacity-40" />
                <p>No toolkit files available yet</p>
                <p className="mt-1 text-xs">Your team will upload posters, templates, and media packs here.</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(grouped).map(([category, categoryFiles]) => (
              <Card key={category} className="border-border/70 shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColors[category] || categoryColors.Other}`}>
                      {category}
                    </span>
                    <CardTitle className="text-base">{category} assets</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {categoryFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between rounded-3xl border border-border/70 p-4">
                        <div className="min-w-0 pr-3">
                          <p className="truncate text-sm font-medium text-foreground">{file.title}</p>
                          <p className="truncate text-xs text-muted-foreground">{file.file_name}</p>
                        </div>
                        <Button size="sm" variant="outline" className="rounded-full" asChild>
                          <a href={file.file_url} target="_blank" rel="noopener noreferrer" download>
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
