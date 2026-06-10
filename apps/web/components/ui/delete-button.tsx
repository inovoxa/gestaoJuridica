"use client";

import { Trash2 } from "lucide-react";

/**
 * Botão de exclusão com confirmação. Recebe um server action já vinculado ao id.
 */
export function DeleteButton({
  action,
  label = "Excluir",
  confirmText = "Tem certeza que deseja excluir? Esta ação não pode ser desfeita.",
  iconOnly = false,
}: {
  action: () => Promise<void>;
  label?: string;
  confirmText?: string;
  iconOnly?: boolean;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
    >
      <button
        type="submit"
        aria-label={label}
        className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-danger/40 hover:text-danger"
      >
        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
        {!iconOnly && label}
      </button>
    </form>
  );
}
