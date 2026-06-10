import { describe, it, expect } from "vitest";
import { computeDeadline, isBusinessDay, nextBusinessDay } from "../prazos.js";
import { feriadosNacionais, easterSunday } from "../feriados.js";

const d = (s: string) => new Date(s + "T00:00:00.000Z");
const ymd = (date: Date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;

describe("Feriados", () => {
  it("calcula a Páscoa corretamente", () => {
    expect(ymd(easterSunday(2026))).toBe("2026-04-05");
    expect(ymd(easterSunday(2024))).toBe("2024-03-31");
  });

  it("inclui feriados fixos e móveis", () => {
    const f = feriadosNacionais(2026);
    expect(f.has("2026-01-01")).toBe(true); // Confraternização
    expect(f.has("2026-12-25")).toBe(true); // Natal
    expect(f.has("2026-02-17")).toBe(true); // Terça de Carnaval (Páscoa 05/04 - 47)
    expect(f.has("2026-04-03")).toBe(true); // Sexta Santa (Páscoa - 2)
    expect(f.has("2026-11-20")).toBe(true); // Consciência Negra (>= 2024)
  });
});

describe("Prazos (dias úteis)", () => {
  it("identifica fim de semana como não útil", () => {
    const holidays = feriadosNacionais(2026);
    expect(isBusinessDay(d("2026-06-13"), holidays)).toBe(false); // sábado
    expect(isBusinessDay(d("2026-06-15"), holidays)).toBe(true); // segunda
  });

  it("pula feriado ao buscar próximo dia útil", () => {
    const holidays = feriadosNacionais(2026);
    // 25/12/2026 é sexta (Natal); próximo útil é 28/12 (segunda)
    expect(ymd(nextBusinessDay(d("2026-12-25"), holidays))).toBe("2026-12-28");
  });

  it("conta prazo de 15 dias úteis excluindo o dia do evento", () => {
    // Intimação numa quarta (2026-06-10). Início conta no dia útil seguinte (11/06).
    const due = computeDeadline(d("2026-06-10"), 15);
    // 15 dias úteis a partir de 11/06 (sem feriados no intervalo) → 2026-07-01
    expect(ymd(due)).toBe("2026-07-01");
  });

  it("respeita feriado dentro do intervalo do prazo", () => {
    // Evento próximo ao Carnaval 2026 (16-17/02). Prazo de 5 dias úteis a partir de 13/02 (sexta).
    // dies a quo = 18/02 (quarta-feira de cinzas é dia útil); 5 d.u.: 18,19,20,23,24 → 24/02
    const due = computeDeadline(d("2026-02-13"), 5);
    expect(ymd(due)).toBe("2026-02-24");
  });

  it("calcula prazo em dias corridos quando configurado", () => {
    const due = computeDeadline(d("2026-06-10"), 10, { businessDays: false, nationalHolidays: false });
    expect(ymd(due)).toBe("2026-06-20");
  });
});
