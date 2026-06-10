"use client";

import { useRef, useState } from "react";
import { uploadDocument } from "@/app/(app)/documentos/actions";
import { Upload } from "lucide-react";

const DOC_TYPES = [
  "01 - Inicial",
  "02 - Procuração / Contrato",
  "03 - Documentos do Cliente",
  "04 - Documentos da Parte Contrária",
  "05 - Decisões",
  "06 - Recursos",
  "07 - Audiências",
  "08 - Cálculos",
  "09 - Sentença",
  "10 - Cumprimento de Sentença",
];

const inputCls =
  "w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-gold/60 focus:ring-2 focus:ring-gold/20";

export function DocumentUpload({
  cases,
  clients,
}: {
  cases: { id: string; label: string }[];
  clients: { id: string; label: string }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        setPending(true);
        try {
          await uploadDocument(fd);
          formRef.current?.reset();
        } finally {
          setPending(false);
        }
      }}
      className="card space-y-4 p-5"
    >
      <h2 className="font-serif text-base font-semibold text-foreground">Enviar documento</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <input name="name" placeholder="Nome do documento (opcional)" className={inputCls} />
        <select name="documentType" defaultValue="" className={inputCls}>
          <option value="">Categoria…</option>
          {DOC_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select name="caseId" defaultValue="" className={inputCls}>
          <option value="">Vincular a processo…</option>
          {cases.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <select name="clientId" defaultValue="" className={inputCls}>
          <option value="">Ou a cliente…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <input
        name="file"
        type="file"
        required
        className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface-2 file:px-4 file:py-2 file:text-sm file:text-foreground hover:file:bg-surface-2/70"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 rounded-lg bg-gold px-5 py-2 text-sm font-semibold transition-transform hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
          style={{ color: "rgb(var(--bg))" }}
        >
          <Upload className="h-4 w-4" strokeWidth={2} />
          {pending ? "Enviando…" : "Enviar"}
        </button>
      </div>
      <p className="text-xs text-muted">Máx. 25 MB. Os arquivos ficam no storage do escritório (LGPD).</p>
    </form>
  );
}
