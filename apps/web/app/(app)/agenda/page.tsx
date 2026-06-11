import { prisma } from "@legaltech/db";
import { requireSession, getFirm } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/format";
import { Landmark, Clock, Users, CalendarDays, Link2, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

const TYPE_META: Record<string, { label: string; icon: typeof Landmark; cls: string }> = {
  AUDIENCIA: { label: "Audiência", icon: Landmark, cls: "text-danger bg-danger/10" },
  PRAZO: { label: "Prazo", icon: Clock, cls: "text-warning bg-warning/10" },
  CONSULTA: { label: "Consulta", icon: Users, cls: "text-info bg-info/10" },
  OUTRO: { label: "Evento", icon: CalendarDays, cls: "text-muted bg-muted/10" },
};

function groupByDay<T extends { start: Date }>(events: T[]) {
  const map = new Map<string, T[]>();
  for (const e of events) {
    const key = e.start.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return map;
}

export default async function AgendaPage() {
  await requireSession();
  const firm = await getFirm();

  const events = await prisma.calendarEvent.findMany({
    where: { start: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    orderBy: { start: "asc" },
    take: 100,
    include: { case: true },
  });

  // Status da integração Google Calendar (singleton).
  const google = await prisma.googleIntegration.findUnique({ where: { id: "google" } }).catch(() => null);
  const grouped = groupByDay(events);

  return (
    <div>
      <PageHeader title="Agenda" subtitle="Audiências, prazos e compromissos" />

      {/* Faixa de integração Google Calendar */}
      <div className="card mb-6 flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gold/10 p-2 text-gold">
            <CalendarDays className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">Google Calendar</div>
            <div className="text-xs text-muted">
              {google?.syncEnabled ? "Sincronização bidirecional ativa" : "Sincronize sua agenda com o Google Calendar"}
            </div>
          </div>
        </div>
        {google?.syncEnabled ? (
          <span className="badge badge-success">
            <CheckCircle2 className="h-3.5 w-3.5" /> Conectado
          </span>
        ) : (
          <a
            href="/api/google/oauth/start"
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-gold/40 hover:text-foreground"
          >
            <Link2 className="h-3.5 w-3.5" />
            Conectar
          </a>
        )}
      </div>

      {events.length === 0 ? (
        <EmptyState message="Nenhum compromisso futuro na agenda." />
      ) : (
        <div className="space-y-6">
          {[...grouped.entries()].map(([day, items]) => (
            <div key={day}>
              <h2 className="mb-2 font-serif text-sm font-semibold capitalize text-gold">{day}</h2>
              <div className="card divide-y divide-border/60">
                {items.map((e) => {
                  const meta = TYPE_META[e.type] ?? TYPE_META.OUTRO!;
                  const Icon = meta.icon;
                  return (
                    <div key={e.id} className="flex items-center gap-4 p-4">
                      <div className={`rounded-lg p-2 ${meta.cls}`}>
                        <Icon className="h-4 w-4" strokeWidth={1.75} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">{e.title}</div>
                        <div className="text-xs text-muted">
                          {meta.label}
                          {e.case ? ` · ${e.case.caseNumber}` : ""}
                        </div>
                      </div>
                      <div className="text-right text-xs tabular-nums text-muted">{formatDateTime(e.start)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {firm?.name && <p className="mt-8 text-center text-xs text-muted">{firm.name}</p>}
    </div>
  );
}
