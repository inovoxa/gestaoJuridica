import Link from "next/link";
import { Plus } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="flex items-center gap-1.5 rounded-lg bg-gold px-4 py-2 text-sm font-semibold transition-transform hover:brightness-110 active:scale-[0.99]"
          style={{ color: "rgb(var(--bg))" }}
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          {action.label}
        </Link>
      )}
    </div>
  );
}
