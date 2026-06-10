"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white print:hidden"
      style={{ backgroundColor: "#0B3C5D" }}
    >
      <Printer className="h-4 w-4" /> Imprimir / Salvar PDF
    </button>
  );
}
