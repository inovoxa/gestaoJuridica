import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

export default function LoginPage({ searchParams }: { searchParams: { error?: string; callbackUrl?: string } }) {
  async function authenticate(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const callbackUrl = String(formData.get("callbackUrl") ?? "/dashboard");
    try {
      await signIn("credentials", { email, password, redirectTo: callbackUrl });
    } catch (err) {
      // next-auth lança um redirect interno em caso de sucesso; repassa.
      if ((err as Error)?.message === "NEXT_REDIRECT") throw err;
      redirect("/login?error=1");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-brand-dark px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-brand">LegalTech BR</h1>
          <p className="text-sm text-gray-500">Gestão jurídica do escritório</p>
        </div>
        {searchParams.error && (
          <p className="mb-4 rounded bg-red-50 p-2 text-sm text-red-700">E-mail ou senha inválidos.</p>
        )}
        <form action={authenticate} className="space-y-4">
          <input type="hidden" name="callbackUrl" value={searchParams.callbackUrl ?? "/dashboard"} />
          <div>
            <label className="block text-sm font-medium text-gray-700">E-mail</label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Senha</label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Entrar
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-gray-400">
          Demo: admin@silva.adv.br / admin123
        </p>
      </div>
    </main>
  );
}
