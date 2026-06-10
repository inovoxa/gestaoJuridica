"use client";

import { useState, useTransition } from "react";
import { explainMovement } from "@/app/(app)/processos/actions";
import { Sparkles } from "lucide-react";

export function MovementExplain({ caseId, movementId }: { caseId: string; movementId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="shrink-0">
      <button
        type="button"
        disabled={pending}
        title="Explicar com IA"
        onClick={() =>
          start(async () => {
            setError(null);
            const r = await explainMovement(caseId, movementId);
            if (!r.ok) setError(r.message);
          })
        }
        className="rounded-md border border-border p-1 text-muted transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-50"
      >
        <Sparkles className={`h-3.5 w-3.5 ${pending ? "animate-pulse" : ""}`} strokeWidth={1.75} />
      </button>
      {error && <span className="ml-1 text-xs text-danger">{error}</span>}
    </span>
  );
}
