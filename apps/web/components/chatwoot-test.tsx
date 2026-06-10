"use client";

import { useState, useTransition } from "react";
import { testChatwoot } from "@/app/(app)/config/actions";
import { CheckCircle2, XCircle, Plug } from "lucide-react";

export function ChatwootTest() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => start(async () => setResult(await testChatwoot()))}
        disabled={pending}
        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-gold/40 hover:text-foreground disabled:opacity-50"
      >
        <Plug className="h-3.5 w-3.5" />
        {pending ? "Testando…" : "Testar conexão"}
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
