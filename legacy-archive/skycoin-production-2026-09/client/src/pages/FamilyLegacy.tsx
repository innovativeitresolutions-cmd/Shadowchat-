import { useState } from "react";
import { Check, Copy, Heart, Printer, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FAMILY_LEGACY, getFamilyLegacyText } from "@/data/familyLegacy";

export default function FamilyLegacy() {
  const [copied, setCopied] = useState(false);

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(getFamilyLegacyText());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-4xl">
        <section className="mb-8 text-center" aria-labelledby="family-legacy-title">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-500/15 ring-1 ring-pink-300/30">
            <Heart className="h-8 w-8 fill-pink-400 text-pink-300" aria-hidden="true" />
          </div>
          <Badge className="mb-4 border border-purple-300/20 bg-purple-400/10 text-purple-100">
            SKYCOIN4444 FAMILY LEGACY
          </Badge>
          <h1 id="family-legacy-title" className="text-3xl font-black tracking-tight sm:text-5xl">
            {FAMILY_LEGACY.title}
          </h1>
          <p className="mt-3 text-sm text-purple-100/70 sm:text-base">
            {FAMILY_LEGACY.subtitle}
          </p>
        </section>

        <Card className="overflow-hidden border-purple-300/20 bg-black/35 text-white shadow-2xl shadow-purple-950/40 backdrop-blur">
          <div className="h-1 bg-gradient-to-r from-pink-400 via-purple-400 to-sky-400" />
          <CardContent className="p-6 sm:p-10">
            <div className="mb-8 grid gap-3 sm:grid-cols-3" aria-label="Skyler's daughters">
              {FAMILY_LEGACY.children.map((child) => (
                <div key={child} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                  <Sparkles className="mx-auto mb-2 h-4 w-4 text-yellow-300" aria-hidden="true" />
                  <span className="text-sm font-semibold text-white/90">{child}</span>
                </div>
              ))}
            </div>

            <blockquote className="space-y-6 text-base leading-8 text-white/85 sm:text-lg">
              {FAMILY_LEGACY.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </blockquote>

            <p className="mt-8 border-t border-white/10 pt-6 text-xl font-bold text-pink-200">
              {FAMILY_LEGACY.signoff}
            </p>

            <div className="mt-8 flex flex-wrap gap-3 print:hidden">
              <Button type="button" onClick={copyMessage} className="bg-purple-600 hover:bg-purple-500">
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? "Copied" : "Copy letter"}
              </Button>
              <Button type="button" variant="outline" onClick={() => window.print()} className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                <Printer className="mr-2 h-4 w-4" />
                Print or save
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-white/45">
          This is a living family message. It honors love and memories now and can grow with new ones.
        </p>
      </div>
    </main>
  );
}
