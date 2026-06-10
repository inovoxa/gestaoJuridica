import Link from "next/link";
import { Scale } from "lucide-react";

export function SiteNavbar({ firmName }: { firmName: string }) {
  const links = [
    { href: "#areas", label: "Áreas de atuação" },
    { href: "#sobre", label: "Sobre" },
    { href: "#equipe", label: "Equipe" },
    { href: "#contato", label: "Contato" },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Scale className="h-6 w-6 text-gold" strokeWidth={1.5} />
          <span className="font-serif text-lg font-semibold">{firmName}</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-muted transition-colors hover:text-foreground">
              {l.label}
            </a>
          ))}
        </nav>
        <a
          href="#contato"
          className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold transition-transform hover:brightness-110 active:scale-[0.99]"
          style={{ color: "rgb(var(--bg))" }}
        >
          Fale conosco
        </a>
      </div>
    </header>
  );
}
