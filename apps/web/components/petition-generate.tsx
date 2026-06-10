"use client";

import { useState, useTransition } from "react";
import { generatePetition } from "@/app/(app)/processos/[id]/peticoes/actions";
import { Sparkles, XCircle } from "lucide-react";

export function PetitionGenerate({ petitionId, label }: { petitionId: string; label: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const r = await generatePetition(petitionId);
            if (!r.ok) setError(r.message);
          })
        }
        className="flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-semibold transition-transform hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
        style={{ color: "rgb(var(--bg))" }}
      >
        <Sparkles className={`h-4 w-4 ${pending ? "animate-pulse" : ""}`} strokeWidth={2} />
        {pending ? "Gerando…" : label}
      </button>
      {error && (
        <span className="flex items-center gap-1 text-xs text-danger">
          <XCircle className="h-3.5 w-3.5" /> {error}
        </span>
      )}
    </div>
  );
}
