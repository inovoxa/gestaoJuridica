import { requireClient, getFirm } from "@/lib/session";
import { signOut } from "@/lib/auth";
import Link from "next/link";
import { Scale, LogOut } from "lucide-react";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const [{ client }, firm] = await Promise.all([requireClient(), getFirm()]);

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/portal" className="flex items-center gap-2">
            <Scale className="h-6 w-6 text-gold" strokeWidth={1.5} />
            <span className="font-serif text-lg font-semibold">{firm?.name ?? "Advocacia"}</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted">{client.name}</span>
            <form action={logout}>
              <button className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-gold/40 hover:text-foreground">
                <LogOut className="h-3.5 w-3.5" />
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 p-6">{children}</main>
      <footer className="border-t border-border py-4 text-center text-xs text-muted">
        Portal do cliente · {firm?.name}
      </footer>
    </div>
  );
}
