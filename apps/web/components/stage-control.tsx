"use client";

import { useTransition } from "react";
import type { CaseStage } from "@legaltech/db";
import { STAGE_LABEL, STAGE_BADGE } from "@/lib/format";

const FLOW: { stage: CaseStage; label: string }[] = [
  { stage: "DRAFT", label: "Rascunho" },
  { stage: "IN_PROGRESS", label: "Em andamento" },
  { stage: "WON", label: "Ganho" },
  { stage: "LOST", label: "Perdido" },
  { stage: "SETTLED", label: "Acordo" },
  { stage: "CANCELLED", label: "Cancelado" },
];

export function StageControl({
  current,
  onChange,
}: {
  current: CaseStage;
  onChange: (stage: CaseStage) => Promise<void>;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`badge ${STAGE_BADGE[current]}`}>{STAGE_LABEL[current]}</span>
      <span className="text-xs text-muted">alterar para:</span>
      {FLOW.filter((f) => f.stage !== current).map((f) => (
        <button
          key={f.stage}
          disabled={pending}
          onClick={() => start(() => onChange(f.stage))}
          className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted transition-colors hover:border-gold/40 hover:text-foreground disabled:opacity-50"
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
