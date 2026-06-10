/**
 * Extração de designação de audiência a partir do texto de uma movimentação.
 * Detecta termos de audiência + data (e hora, quando houver).
 */

export interface ExtractedHearing {
  date: Date;
  type: string; // ex.: "Audiência de Instrução", "Audiência de Conciliação"
}

const HEARING_RE = /audi[êe]ncia/i;
const TYPE_RE = /audi[êe]ncia\s+(de\s+[\wçãéíúâ\s]+?)(?:\s+(?:designada|marcada|para|em|no dia|às)|[.,;]|$)/i;
// data DD/MM/AAAA e hora opcional HH:MM ou HHhMM / HHh
const DATE_RE = /(\d{2})\/(\d{2})\/(\d{4})(?:[^\d]{0,12}?(\d{1,2})[:h](\d{2})?)?/;

/** Retorna a audiência designada (data/hora) se a movimentação indicar uma; senão null. */
export function extractHearing(text: string): ExtractedHearing | null {
  if (!text || !HEARING_RE.test(text)) return null;
  const dm = text.match(DATE_RE);
  if (!dm) return null;

  const [, dd, mm, yyyy, hh, min] = dm;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const hour = hh ? Number(hh) : 9; // padrão 9h se hora ausente
  const minute = min ? Number(min) : 0;

  // Constrói no horário local (sem deslocar para UTC).
  const date = new Date(year, month - 1, day, hour, minute, 0);
  if (isNaN(date.getTime())) return null;

  const typeMatch = text.match(TYPE_RE);
  const type = typeMatch ? `Audiência ${typeMatch[1].trim()}`.replace(/\s+/g, " ") : "Audiência designada";

  return { date, type };
}
