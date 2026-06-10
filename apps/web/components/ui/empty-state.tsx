import Link from "next/link";
import { Inbox, Plus } from "lucide-react";

export function EmptyState({
  message,
  action,
}: {
  message: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="card flex flex-col items-center gap-3 p-12 text-center">
      <Inbox className="h-10 w-10 text-muted/60" strokeWidth={1.5} />
      <p className="text-sm text-muted">{message}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-1 flex items-center gap-1.5 rounded-lg bg-gold px-4 py-2 text-sm font-semibold transition-transform hover:brightness-110"
          style={{ color: "rgb(var(--bg))" }}
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          {action.label}
        </Link>
      )}
    </div>
  );
}
