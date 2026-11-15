import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Ruler, Sparkles, ArrowLeft } from "lucide-react";

export default function MeasurementsPlaceholderPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link
            href="/app"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="border-border/80 bg-card/40 flex flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center">
        <div className="bg-primary/10 text-primary mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
          <Ruler className="h-7 w-7" />
        </div>
        <div className="bg-gold/15 text-gold-700 dark:text-gold-400 mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
          <Sparkles className="h-3 w-3" />
          Coming soon
        </div>
        <h2 className="text-foreground font-serif text-2xl font-medium tracking-tight">
          Digital Measurement Passport
        </h2>
        <p className="text-muted-foreground mt-2 max-w-md text-sm leading-relaxed">
          Store precision tailored measurements for Shalwar Kameez, Kurtas, Waistcoats, and
          Sherwanis. Save once and carry them with your secure QR passport to any tailor.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/app">Return to Overview</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
