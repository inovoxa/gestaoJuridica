import { Sidebar } from "@/components/sidebar";
import { requireSession, getFirm } from "@/lib/session";
import { signOut } from "@/lib/auth";
import { LogOut } from "lucide-react";

const ROLE_LABEL: Record<string, string> = {
  ADMIN_ESCRITORIO: "Administrador",
  ADVOGADO: "Advogado",
  SECRETARIA: "Secretaria",
  CLIENTE_PORTAL: "Cliente",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [ctx, firm] = await Promise.all([requireSession(), getFirm()]);

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="flex min-h-dvh">
      <Sidebar firmName={firm?.name ?? "Escritório"} />
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-surface/60 px-6 py-3 backdrop-blur">
          <div className="text-sm text-muted">
            Painel de gestão jurídica
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-right leading-tight">
              <div className="font-medium text-foreground">{ctx.name}</div>
              <div className="text-xs text-muted">{ROLE_LABEL[ctx.role] ?? ctx.role}</div>
            </div>
            <form action={logout}>
              <button
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-gold/40 hover:text-foreground"
                aria-label="Sair do sistema"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sair
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
