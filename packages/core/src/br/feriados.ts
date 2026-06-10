/**
 * Feriados nacionais brasileiros (fixos + móveis).
 * Móveis derivam da Páscoa (algoritmo de Gauss/Computus).
 * Datas em UTC para evitar deslocamento de fuso.
 */

function ymd(year: number, month1: number, day: number): string {
  const m = String(month1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

/** Domingo de Páscoa (algoritmo de Computus / Meeus-Jones-Butcher). */
export function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=março, 4=abril
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function addDaysUTC(date: Date, days: number): Date {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function toYmd(date: Date): string {
  return ymd(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

/**
 * Conjunto de feriados nacionais (datas 'YYYY-MM-DD') para um ano.
 * Inclui 20/11 (Consciência Negra, feriado nacional desde a Lei 14.759/2023) para anos >= 2024.
 */
export function feriadosNacionais(year: number): Set<string> {
  const fixos = [
    ymd(year, 1, 1), // Confraternização Universal
    ymd(year, 4, 21), // Tiradentes
    ymd(year, 5, 1), // Dia do Trabalho
    ymd(year, 9, 7), // Independência
    ymd(year, 10, 12), // Nossa Senhora Aparecida
    ymd(year, 11, 2), // Finados
    ymd(year, 11, 15), // Proclamação da República
    ymd(year, 12, 25), // Natal
  ];
  if (year >= 2024) {
    fixos.push(ymd(year, 11, 20)); // Consciência Negra
  }

  const pascoa = easterSunday(year);
  const moveis = [
    toYmd(addDaysUTC(pascoa, -48)), // Segunda de Carnaval
    toYmd(addDaysUTC(pascoa, -47)), // Terça de Carnaval
    toYmd(addDaysUTC(pascoa, -2)), // Sexta-feira Santa
    toYmd(addDaysUTC(pascoa, 60)), // Corpus Christi
  ];

  return new Set([...fixos, ...moveis]);
}

/** Verifica se uma data é feriado nacional. */
export function isFeriadoNacional(date: Date): boolean {
  return feriadosNacionais(date.getUTCFullYear()).has(toYmd(date));
}
