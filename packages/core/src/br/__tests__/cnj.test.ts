import { describe, it, expect } from "vitest";
import { parseCnj, isValidCnj, formatCnj, calcCnjDigito, detectTribunal } from "../cnj.js";

describe("CNJ", () => {
  const valido = "0018063-19.2013.8.26.0002";

  it("parseia número com máscara", () => {
    const p = parseCnj(valido);
    expect(p).not.toBeNull();
    expect(p!.sequencial).toBe("0018063");
    expect(p!.ano).toBe("2013");
    expect(p!.segmento).toBe("8");
    expect(p!.tribunal).toBe("26");
    expect(p!.origem).toBe("0002");
  });

  it("parseia número sem máscara (20 dígitos)", () => {
    const p = parseCnj("00180631920138260002");
    expect(p?.digito).toBe("19");
  });

  it("calcula o dígito verificador (ISO 7064 MOD 97-10)", () => {
    const p = parseCnj(valido)!;
    expect(calcCnjDigito(p)).toBe("19");
  });

  it("valida número correto e rejeita dígito errado", () => {
    expect(isValidCnj(valido)).toBe(true);
    expect(isValidCnj("0018063-20.2013.8.26.0002")).toBe(false);
    expect(isValidCnj("abc")).toBe(false);
  });

  it("formata com máscara padrão", () => {
    expect(formatCnj("00180631920138260002")).toBe(valido);
  });

  it("detecta tribunal a partir do segmento/TR", () => {
    expect(detectTribunal(valido)).toEqual({ segmento: "Justiça Estadual", sigla: "TJSP" });
    expect(detectTribunal("0000001-02.2020.5.02.0001")?.sigla).toBe("TRT2");
    expect(detectTribunal("0000001-02.2020.4.03.0001")?.sigla).toBe("TRF3");
  });
});
