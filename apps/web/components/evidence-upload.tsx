"use client";

import { useRef, useState } from "react";
import { uploadEvidence } from "@/app/portal/actions";
import { Upload } from "lucide-react";

const inputCls =
  "w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-gold/60 focus:ring-2 focus:ring-gold/20";

export function EvidenceUpload({ caseId }: { caseId: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      ref={ref}
      action={async (fd) => {
        setPending(true);
        try {
          await uploadEvidence(caseId, fd);
          ref.current?.reset();
        } finally {
          setPending(false);
        }
      }}
      className="card space-y-4 p-5"
    >
      <h2 className="font-serif text-base font-semibold text-foreground">Enviar documento/prova</h2>
      <input name="name" placeholder="Nome (opcional)" className={inputCls} />
      <textarea name="description" rows={2} placeholder="Descrição (opcional)" className={inputCls} />
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
    </form>
  );
}
