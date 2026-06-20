import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Wrench } from "lucide-react";
import { DemoBadge } from "@/components/DemoBadge";
import { ReactNode } from "react";

export function ComingSoonPage({ title, description, icon: Icon, children }: { title: string; description: string; icon: any; children?: ReactNode }) {
  return (
    <AppShell>
      <DemoBadge />
      <div className="p-6 lg:p-8 max-w-5xl">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl gradient-warm flex items-center justify-center shadow-warm">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-serif text-3xl">{title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        </div>

        {children ?? (
          <Card className="p-8 text-center border-dashed">
            <div className="inline-flex items-center gap-2 mb-3">
              <Badge variant="secondary"><Wrench className="w-3 h-3 mr-1" /> Phase 2</Badge>
              <Badge variant="outline"><Sparkles className="w-3 h-3 mr-1" /> Coming next</Badge>
            </div>
            <div className="font-serif text-2xl mb-2">Wired & ready</div>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              The data model and navigation for this page are already in place. The full UI ships in the next build phase.
              The core demo flow (Customer → POS → Kitchen → Payment → Receipt) is fully functional.
            </p>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
