import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, Sparkles, BookOpen, ShieldCheck } from "lucide-react";

export default function Referral() {
  const { code, channel } = useParams<{ code: string; channel?: string }>();
  const [context, setContext] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!code) return;
    fetch(`/v1/referral/${encodeURIComponent(code.toUpperCase())}/context`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        setContext(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [code]);

  const continueToApp = () => {
    setRedirecting(true);
    const resolvedChannel = channel || "direct";
    const destination = code ? `/v1/referral/${encodeURIComponent(code.toUpperCase())}/${resolvedChannel}` : "/";
    window.location.replace(destination);
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] px-4 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="overflow-hidden rounded-[36px] bg-slate-950 text-slate-50 shadow-[0_30px_80px_rgba(15,23,42,0.2)]">
          <div className="px-8 py-8">
            <Badge className="border-0 bg-white/10 text-white">Referred student journey</Badge>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">Merit Launchers student access starts here.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              {context?.affiliate?.name
                ? `${context.affiliate.name} shared this Merit Launchers access point with you. Review the course direction, then continue to the app to study, attempt previews, and purchase when ready.`
                : "You were referred to Merit Launchers. Review the course direction, then continue to the app to study, attempt previews, and purchase when ready."}
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                { title: "Focused course pages", text: "Reach the right exam prep path instead of browsing randomly.", icon: BookOpen },
                { title: "Attribution stays intact", text: "Your partner referral context is preserved when you continue.", icon: ShieldCheck },
                { title: "Preview before buying", text: "Use free papers and product pages to judge fit before payment.", icon: Sparkles },
              ].map(({ title, text, icon: Icon }) => (
                <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="mt-4 font-medium text-white">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div className="rounded-[32px] border border-border/70 bg-background p-8 shadow-xl">
            {loading ? (
              <div className="flex min-h-[280px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Partner referral</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{context?.affiliate?.name || "Merit Launchers partner"}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {(context?.affiliate?.partner_type || "Partner")}{context?.affiliate?.city ? ` · ${context.affiliate.city}` : ""}
                  </p>
                </div>
                <div className="rounded-3xl border border-border/70 bg-muted/30 p-5">
                  <p className="text-sm font-medium text-foreground">Recommended next move</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Continue to the app so you can review the right course pages, try free previews, and keep your referral context attached.
                  </p>
                </div>
                {context?.topCourses?.length ? (
                  <div>
                    <p className="text-sm font-medium text-foreground">Popular starting points</p>
                    <div className="mt-3 space-y-3">
                      {context.topCourses.map((course: any) => (
                        <div key={course.id} className="rounded-3xl border border-border/70 px-4 py-3">
                          <p className="font-medium text-foreground">{course.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">Starts from Rs {Number(course.price || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                <Button className="w-full rounded-full" onClick={continueToApp} disabled={redirecting || !code}>
                  {redirecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Continue to app
                  {!redirecting ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
