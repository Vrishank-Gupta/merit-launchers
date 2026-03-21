import { useEffect, useRef, useState } from "react";
import { useMAAuth } from "@/hooks/useMarketingAdminAuth";
import { marketingAdminApi } from "@/lib/partnerApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, Trash2, Download, FileText } from "lucide-react";

const CATEGORIES = ["Poster", "Template", "WhatsApp", "Webinar", "Other"];

const categoryColors: Record<string, string> = {
  Poster: "bg-pink-100 text-pink-800",
  Template: "bg-blue-100 text-blue-800",
  WhatsApp: "bg-green-100 text-green-800",
  Webinar: "bg-purple-100 text-purple-800",
  Other: "bg-gray-100 text-gray-800",
};

export default function MAToolkit() {
  const { token } = useMAAuth();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: "", category: "Other" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    if (!token) return;
    marketingAdminApi.getToolkit(token).then((d) => {
      setFiles(d.files || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [token]);

  const handleUpload = async () => {
    if (!selectedFile || !uploadForm.title) {
      setError("Title and file are required.");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const ext = selectedFile.name.split(".").pop() || "bin";
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (!result || !result.includes(",")) { reject(new Error("Could not read file")); return; }
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });
      await marketingAdminApi.uploadToolkit(token!, {
        title: uploadForm.title,
        category: uploadForm.category,
        data,
        ext,
        file_name: selectedFile.name,
      });
      setUploadForm({ title: "", category: "Other" });
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (id: string) => {
    if (!confirm("Delete this file?")) return;
    try {
      await marketingAdminApi.deleteToolkit(token!, id);
      load();
    } catch (e: any) {
      setError(e.message || "Failed to delete file");
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
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Partner Toolkit</h1>
        <p className="text-muted-foreground mt-1">Manage marketing materials for partners</p>
      </div>

      {/* Upload Section */}
      <Card className="mb-6 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Upload New File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={uploadForm.title}
                onChange={(e) => setUploadForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. WhatsApp Banner March 2026"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={uploadForm.category}
                onValueChange={(v) => setUploadForm((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>File *</Label>
            <Input
              ref={fileRef}
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
            {selectedFile && (
              <p className="text-xs text-muted-foreground">
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>
          )}
          <Button onClick={handleUpload} disabled={uploading}>
            {uploading ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Uploading...</>
            ) : (
              <><Upload className="w-4 h-4 mr-2" />Upload File</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Files Grid */}
      {files.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FileText className="w-12 h-12 mb-3 opacity-40" />
            <p>No files uploaded yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((f) => (
            <Card key={f.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{f.title}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{f.file_name}</p>
                  </div>
                  <span
                    className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      categoryColors[f.category] || categoryColors.Other
                    }`}
                  >
                    {f.category}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  {new Date(f.created_at).toLocaleDateString("en-IN")}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" asChild>
                    <a href={f.file_url} target="_blank" rel="noopener noreferrer" download>
                      <Download className="w-3.5 h-3.5 mr-1" />
                      Download
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteFile(f.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
