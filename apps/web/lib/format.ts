/** Helpers de formatação pt-BR. */

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("pt-BR");
}

export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

/** Para inputs type="date" (YYYY-MM-DD). */
export function toDateInput(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

/** Para inputs type="datetime-local". */
export function toDateTimeInput(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  const off = date.getTimezoneOffset();
  return new Date(date.getTime() - off * 60000).toISOString().slice(0, 16);
}

export function formatCpfCnpj(v: string | null | undefined): string {
  if (!v) return "—";
  const d = v.replace(/\D/g, "");
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return v;
}

export function formatPhone(v: string | null | undefined): string {
  if (!v) return "—";
  const d = v.replace(/\D/g, "").replace(/^55/, "");
  if (d.length === 11) return d.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (d.length === 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return v;
}

export function formatMoney(v: number | string): string {
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// --- Rótulos e badges de domínio ---

export const STAGE_LABEL: Record<string, string> = {
  DRAFT: "Rascunho",
  IN_PROGRESS: "Em andamento",
  WON: "Ganho",
  LOST: "Perdido",
  SETTLED: "Acordo",
  CANCELLED: "Cancelado",
};

export const STAGE_BADGE: Record<string, string> = {
  DRAFT: "badge-muted",
  IN_PROGRESS: "badge-info",
  WON: "badge-success",
  LOST: "badge-danger",
  SETTLED: "badge-warning",
  CANCELLED: "badge-muted",
};

export const HEARING_LABEL: Record<string, string> = {
  SCHEDULED: "Agendada",
  COMPLETED: "Realizada",
  ADJOURNED: "Adiada",
};
export const HEARING_BADGE: Record<string, string> = {
  SCHEDULED: "badge-info",
  COMPLETED: "badge-success",
  ADJOURNED: "badge-warning",
};

export const DEADLINE_LABEL: Record<string, string> = {
  INTIMACAO: "Intimação",
  CITACAO: "Citação",
  SENTENCA: "Sentença",
  DESPACHO: "Despacho",
  PUBLICACAO: "Publicação",
  OUTRO: "Outro",
};

export const DEADLINE_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente",
  ALERTED: "Alertado",
  COMPLETED: "Cumprido",
  OVERDUE: "Vencido",
};
export const DEADLINE_STATUS_BADGE: Record<string, string> = {
  PENDING: "badge-info",
  ALERTED: "badge-warning",
  COMPLETED: "badge-success",
  OVERDUE: "badge-danger",
};
