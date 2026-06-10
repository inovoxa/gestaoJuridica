import { Sidebar } from "@/components/sidebar";
import { requireSession } from "@/lib/tenant";
import { signOut } from "@/lib/auth";

const ROLE_LABEL: Record<string, string> = {
  ADMIN_ESCRITORIO: "Administrador",
  ADVOGADO: "Advogado",
  SECRETARIA: "Secretaria",
  CLIENTE_PORTAL: "Cliente",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireSession();

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-white px-6 py-3">
          <div className="text-sm text-gray-500">
            <span className="font-semibold text-brand">{ctx.accountName}</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600">
              {ctx.name} · {ROLE_LABEL[ctx.role] ?? ctx.role}
            </span>
            <form action={logout}>
              <button className="rounded-md border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50">Sair</button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
