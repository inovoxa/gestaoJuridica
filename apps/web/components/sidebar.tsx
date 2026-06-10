"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Scale,
  Landmark,
  CalendarDays,
  Clock,
  FileText,
  Globe,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/processos", label: "Processos", icon: Scale },
  { href: "/audiencias", label: "Audiências", icon: Landmark },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/prazos", label: "Prazos", icon: Clock },
  { href: "/documentos", label: "Documentos", icon: FileText },
];

export function Sidebar({ firmName }: { firmName: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 px-6 py-5">
        <Scale className="h-6 w-6 text-gold" strokeWidth={1.75} />
        <span className="font-serif text-lg font-semibold leading-tight text-foreground">{firmName}</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-200 ${
                active
                  ? "bg-gold/10 text-gold ring-1 ring-inset ring-gold/25"
                  : "text-muted hover:bg-surface-2 hover:text-foreground"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/"
        target="_blank"
        className="m-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted hover:bg-surface-2 hover:text-foreground"
      >
        <Globe className="h-4 w-4" strokeWidth={1.75} />
        Ver website público
      </Link>
    </aside>
  );
}
