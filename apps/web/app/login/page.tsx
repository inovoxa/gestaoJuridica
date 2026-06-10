import { signIn } from "@/lib/auth";
import { getFirm } from "@/lib/session";
import { redirect } from "next/navigation";
import { Scale } from "lucide-react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const firm = await getFirm();

  async function authenticate(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const callbackUrl = String(formData.get("callbackUrl") ?? "/dashboard");
    try {
      await signIn("credentials", { email, password, redirectTo: callbackUrl });
    } catch (err) {
      if ((err as Error)?.message === "NEXT_REDIRECT") throw err;
      redirect("/login?error=1");
    }
  }

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      {/* Lado institucional */}
      <div className="relative hidden flex-col justify-between bg-surface p-12 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle at 30% 20%, rgb(var(--gold)) 0, transparent 45%)" }}
        />
        <div className="relative flex items-center gap-2">
          <Scale className="h-7 w-7 text-gold" strokeWidth={1.5} />
          <span className="font-serif text-xl font-semibold">{firm?.name ?? "Advocacia"}</span>
        </div>
        <div className="relative">
          <h1 className="font-serif text-4xl font-semibold leading-tight text-foreground">
            {firm?.tagline ?? "Advocacia com tradição, técnica e resultado."}
          </h1>
          <p className="mt-4 max-w-md text-muted">
            Plataforma de gestão jurídica — processos, prazos, audiências e documentos em um só lugar.
          </p>
        </div>
        <div className="relative text-xs text-muted">
          {firm?.city && firm?.state ? `${firm.city} · ${firm.state}` : null}
        </div>
      </div>

      {/* Formulário */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:hidden">
            <Scale className="mx-auto h-8 w-8 text-gold" strokeWidth={1.5} />
            <h2 className="mt-2 font-serif text-xl font-semibold">{firm?.name ?? "Advocacia"}</h2>
          </div>

          <h2 className="font-serif text-2xl font-semibold text-foreground">Acesso ao painel</h2>
          <p className="mt-1 text-sm text-muted">Entre com suas credenciais</p>

          {params.error && (
            <p className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger ring-1 ring-inset ring-danger/30">
              E-mail ou senha inválidos.
            </p>
          )}

          <form action={authenticate} className="mt-6 space-y-4">
            <input type="hidden" name="callbackUrl" value={params.callbackUrl ?? "/dashboard"} />
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-muted">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="mt-1.5 w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-muted">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="mt-1.5 w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-gold py-2.5 text-sm font-semibold transition-transform hover:brightness-110 active:scale-[0.99]"
              style={{ color: "rgb(var(--bg))" }}
            >
              Entrar
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-muted">
            Demonstração: admin@silva.adv.br · admin123
          </p>
        </div>
      </div>
    </main>
  );
}
