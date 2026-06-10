/**
 * Adapter da API Pública do DataJud (CNJ).
 * Consulta a capa e as movimentações de um processo pelo número CNJ.
 *
 * Endpoint: https://api-publica.datajud.cnj.jus.br/{alias}/_search  (ElasticSearch)
 * Auth: header `Authorization: APIKey <chave pública DPJ/CNJ>`
 * Doc: https://datajud-wiki.cnj.jus.br/api-publica/
 */
import { detectTribunal, parseCnj } from "../br/cnj.js";

const BASE = "https://api-publica.datajud.cnj.jus.br";

export interface DatajudMovementDTO {
  codigo?: number;
  descricao: string;
  data?: Date | null;
}

export interface DatajudProcessDTO {
  numeroProcesso: string;
  tribunalSigla: string | null;
  classe?: string;
  assunto?: string;
  orgaoJulgador?: string;
  grau?: string;
  dataAjuizamento?: Date | null;
  dataUltimaMov?: Date | null;
  movements: DatajudMovementDTO[];
  raw: unknown;
}

/** Deriva o alias do tribunal (ex.: api_publica_tjsp) a partir do número CNJ. */
export function tribunalAlias(cnj: string): string | null {
  const t = detectTribunal(cnj);
  if (!t?.sigla) return null;
  return `api_publica_${t.sigla.toLowerCase()}`;
}

function parseDate(v?: string): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

/** Busca um processo no DataJud pelo número CNJ. Retorna null se não encontrado. */
export async function fetchProcess(apiKey: string, cnj: string): Promise<DatajudProcessDTO | null> {
  const alias = tribunalAlias(cnj);
  if (!alias) throw new Error("Não foi possível identificar o tribunal a partir do número CNJ");
  const digits = parseCnj(cnj);
  if (!digits) throw new Error("Número CNJ inválido");
  const numero = `${digits.sequencial}${digits.digito}${digits.ano}${digits.segmento}${digits.tribunal}${digits.origem}`;

  const res = await fetch(`${BASE}/${alias}/_search`, {
    method: "POST",
    headers: { Authorization: `APIKey ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: { match: { numeroProcesso: numero } }, size: 1 }),
  });
  if (!res.ok) throw new Error(`DataJud ${res.status}: ${await res.text()}`);

  const data = (await res.json()) as {
    hits?: { hits?: Array<{ _source: Record<string, any> }> };
  };
  const src = data.hits?.hits?.[0]?._source;
  if (!src) return null;

  const movimentos: DatajudMovementDTO[] = Array.isArray(src.movimentos)
    ? src.movimentos.map((m: any) => ({
        codigo: m.codigo,
        descricao: m.nome ?? m.descricao ?? "(sem descrição)",
        data: parseDate(m.dataHora),
      }))
    : [];

  const assuntos = Array.isArray(src.assuntos)
    ? src.assuntos.map((a: any) => a.nome).filter(Boolean).join(", ")
    : undefined;

  return {
    numeroProcesso: cnj,
    tribunalSigla: detectTribunal(cnj)?.sigla ?? null,
    classe: src.classe?.nome,
    assunto: assuntos,
    orgaoJulgador: src.orgaoJulgador?.nome,
    grau: src.grau,
    dataAjuizamento: parseDate(src.dataAjuizamento),
    dataUltimaMov: parseDate(src.dataHoraUltimaAtualizacao),
    movements: movimentos,
    raw: src,
  };
}
