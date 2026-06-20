import { ReactNode } from "react";

export function PageHeader({ icon: Icon, title, description, actions }: { icon: any; title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl gradient-warm flex items-center justify-center shadow-warm shrink-0">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-serif text-3xl leading-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
