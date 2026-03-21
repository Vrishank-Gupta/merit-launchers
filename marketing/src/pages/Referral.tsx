import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function Referral() {
  const { code, channel } = useParams<{ code: string; channel?: string }>();

  useEffect(() => {
    const ch = channel || "direct";
    const dest = code
      ? `/v1/referral/${encodeURIComponent(code.toUpperCase())}/${ch}`
      : "/";
    // Navigate to the API endpoint — it tracks the click and redirects to Play Store
    window.location.replace(dest);
  }, [code, channel]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/10">
      <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
      <p className="text-lg font-semibold text-foreground">Redirecting…</p>
      <p className="text-sm text-muted-foreground mt-1">Taking you to the app</p>
    </div>
  );
}
