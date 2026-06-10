import Link from "next/link";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/clientes", label: "Clientes", icon: "👤" },
  { href: "/processos", label: "Processos", icon: "⚖️" },
  { href: "/audiencias", label: "Audiências", icon: "🏛️" },
  { href: "/agenda", label: "Agenda", icon: "📅" },
  { href: "/prazos", label: "Prazos", icon: "⏰" },
  { href: "/documentos", label: "Documentos", icon: "📄" },
];

export function Sidebar() {
  return (
    <aside className="flex w-60 flex-col bg-brand-dark text-white">
      <div className="px-5 py-5 text-lg font-bold">
        LegalTech <span className="text-brand-gold">BR</span>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-200 hover:bg-white/10"
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="px-5 py-4 text-xs text-gray-400">Fase 0 — Fundação</div>
    </aside>
  );
}
