import { Scale, MapPin, Phone, Mail } from "lucide-react";
import type { Firm } from "@legaltech/db";

export function SiteFooter({ firm }: { firm: Firm | null }) {
  const address = [
    [firm?.street, firm?.number].filter(Boolean).join(", "),
    firm?.complement,
    firm?.district,
    [firm?.city, firm?.state].filter(Boolean).join(" - "),
    firm?.zip ? `CEP ${firm.zip}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <footer id="contato" className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="h-6 w-6 text-gold" strokeWidth={1.5} />
            <span className="font-serif text-lg font-semibold">{firm?.name ?? "Advocacia"}</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted">{firm?.tagline}</p>
          {firm?.oab && <p className="mt-3 text-xs text-muted">{firm.oab}</p>}
        </div>

        <div className="space-y-3 text-sm">
          <h3 className="font-serif text-base font-semibold text-foreground">Contato</h3>
          {address && (
            <p className="flex items-start gap-2 text-muted">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.75} />
              <span>{address}</span>
            </p>
          )}
          {firm?.phone && (
            <p className="flex items-center gap-2 text-muted">
              <Phone className="h-4 w-4 text-gold" strokeWidth={1.75} />
              {firm.phone}
            </p>
          )}
          {firm?.email && (
            <p className="flex items-center gap-2 text-muted">
              <Mail className="h-4 w-4 text-gold" strokeWidth={1.75} />
              {firm.email}
            </p>
          )}
        </div>

        <div className="text-sm">
          <h3 className="font-serif text-base font-semibold text-foreground">Atendimento</h3>
          <p className="mt-3 text-muted">Segunda a sexta, das 9h às 18h.</p>
          {firm?.mapsUrl && (
            <a
              href={firm.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-gold hover:underline"
            >
              Ver no mapa →
            </a>
          )}
        </div>
      </div>
      <div className="border-t border-border/60 py-5 text-center text-xs text-muted">
        © {new Date().getFullYear()} {firm?.legalName ?? firm?.name}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
