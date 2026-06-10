"use client";

import { useState, useTransition } from "react";
import { syncDatajud } from "@/app/(app)/processos/actions";
import { RefreshCw, CheckCircle2, XCircle } from "lucide-react";

export function DatajudSync({ caseId }: { caseId: string }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => setResult(await syncDatajud(caseId)))}
        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-gold/40 hover:text-foreground disabled:opacity-50"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${pending ? "animate-spin" : ""}`} strokeWidth={1.75} />
        {pending ? "Sincronizando…" : "Sincronizar DataJud"}
      </button>
      {result && (
        <span className={`flex items-center gap-1 text-xs ${result.ok ? "text-success" : "text-danger"}`}>
          {result.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
          {result.message}
        </span>
      )}
    </div>
  );
}
