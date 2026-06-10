/**
 * Cálculo de prazos processuais (CPC art. 219 — contagem em dias úteis;
 * art. 224 — exclui o dia do começo, inclui o do vencimento).
 */
import { feriadosNacionais } from "./feriados.js";

/** Normaliza para meia-noite UTC (ignora hora). */
function atMidnightUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDaysUTC(date: Date, days: number): Date {
  const d = atMidnightUTC(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function ymd(date: Date): string {
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${date.getUTCFullYear()}-${m}-${d}`;
}

export interface PrazoOptions {
  /** Contar apenas dias úteis (padrão true — CPC). Se false, dias corridos. */
  businessDays?: boolean;
  /** Considerar feriados nacionais (padrão true). */
  nationalHolidays?: boolean;
  /** Feriados adicionais (estaduais/municipais), em Date. */
  extraHolidays?: Date[];
}

/** Cache de feriados por ano + extras como Set de 'YYYY-MM-DD'. */
function buildHolidaySet(year: number, opts: PrazoOptions): Set<string> {
  const set = new Set<string>();
  if (opts.nationalHolidays !== false) {
    for (const d of feriadosNacionais(year)) set.add(d);
    // anos vizinhos cobrem prazos que cruzam a virada
    for (const d of feriadosNacionais(year + 1)) set.add(d);
  }
  for (const h of opts.extraHolidays ?? []) set.add(ymd(atMidnightUTC(h)));
  return set;
}

/** É dia útil? (não é sábado/domingo nem feriado) */
export function isBusinessDay(date: Date, holidays: Set<string>): boolean {
  const dow = date.getUTCDay(); // 0=domingo, 6=sábado
  if (dow === 0 || dow === 6) return false;
  return !holidays.has(ymd(date));
}

/** Próximo dia útil (inclui o próprio se já for útil). */
export function nextBusinessDay(date: Date, holidays: Set<string>): Date {
  let d = atMidnightUTC(date);
  while (!isBusinessDay(d, holidays)) d = addDaysUTC(d, 1);
  return d;
}

/**
 * Calcula a data de vencimento de um prazo.
 *
 * Regra (CPC): a contagem inicia no primeiro dia útil seguinte ao evento
 * (intimação/publicação) e exclui o dia do começo. Conta-se `days` dias úteis;
 * o vencimento, se cair em dia não útil, é prorrogado para o próximo dia útil.
 *
 * @param origin data do evento que originou o prazo (intimação/publicação)
 * @param days   quantidade de dias (úteis por padrão)
 */
export function computeDeadline(origin: Date, days: number, options: PrazoOptions = {}): Date {
  const businessDays = options.businessDays !== false;
  const holidays = businessDays
    ? buildHolidaySet(origin.getUTCFullYear(), options)
    : new Set<string>();

  if (!businessDays) {
    // dias corridos; ainda assim prorroga vencimento em fim de semana/feriado
    let due = addDaysUTC(origin, days);
    if (options.nationalHolidays !== false || (options.extraHolidays?.length ?? 0) > 0) {
      const hs = buildHolidaySet(due.getUTCFullYear(), options);
      due = nextBusinessDay(due, hs);
    }
    return due;
  }

  // dies a quo: primeiro dia útil após o evento
  let cursor = nextBusinessDay(addDaysUTC(origin, 1), holidays);
  // o primeiro dia útil já conta como dia 1
  let counted = 1;
  while (counted < days) {
    cursor = addDaysUTC(cursor, 1);
    if (isBusinessDay(cursor, holidays)) counted++;
  }
  return cursor;
}

/**
 * Dias úteis restantes entre hoje e uma data limite (negativo se vencido).
 */
export function businessDaysRemaining(deadlineDate: Date, from: Date = new Date(), options: PrazoOptions = {}): number {
  const holidays = buildHolidaySet(from.getUTCFullYear(), options);
  let start = atMidnightUTC(from);
  const end = atMidnightUTC(deadlineDate);
  if (end.getTime() === start.getTime()) return 0;

  const sign = end > start ? 1 : -1;
  let count = 0;
  let cursor = start;
  while (cursor.getTime() !== end.getTime()) {
    cursor = addDaysUTC(cursor, sign);
    if (isBusinessDay(cursor, holidays)) count += sign;
  }
  return count;
}

/** Nível de risco do prazo a partir dos dias restantes (corridos). */
export function riskLevel(deadlineDate: Date, from: Date = new Date()): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  const days = Math.floor((atMidnightUTC(deadlineDate).getTime() - atMidnightUTC(from).getTime()) / 86400000);
  if (days < 0) return "CRITICAL";
  if (days <= 1) return "HIGH";
  if (days <= 3) return "MEDIUM";
  return "LOW";
}
