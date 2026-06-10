"use client";

import { useActionState } from "react";
import { submitContact, type ContactFormState } from "@/app/(site)/actions";
import { CheckCircle2, Send } from "lucide-react";

const initial: ContactFormState = { ok: false };

const inputCls =
  "w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-gold/60 focus:ring-2 focus:ring-gold/20";

export function ContactForm({ areas }: { areas: { slug: string; name: string }[] }) {
  const [state, action, pending] = useActionState(submitContact, initial);

  if (state.ok) {
    return (
      <div className="card flex flex-col items-center gap-3 p-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-success" strokeWidth={1.5} />
        <h3 className="font-serif text-lg font-semibold text-foreground">Mensagem enviada!</h3>
        <p className="text-sm text-muted">Recebemos seu contato e retornaremos em breve.</p>
      </div>
    );
  }

  return (
    <form action={action} className="card space-y-4 p-6">
      {state.error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger ring-1 ring-inset ring-danger/30">
          {state.error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-muted">
            Nome <span className="text-danger">*</span>
          </label>
          <input id="name" name="name" required className={inputCls} />
        </div>
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-muted">
            Telefone / WhatsApp
          </label>
          <input id="phone" name="phone" type="tel" inputMode="tel" className={inputCls} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-muted">
            E-mail
          </label>
          <input id="email" name="email" type="email" className={inputCls} />
        </div>
        <div>
          <label htmlFor="practiceArea" className="mb-1.5 block text-sm font-medium text-muted">
            Área de interesse
          </label>
          <select id="practiceArea" name="practiceArea" className={inputCls} defaultValue="">
            <option value="">Selecione…</option>
            {areas.map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-muted">
          Mensagem <span className="text-danger">*</span>
        </label>
        <textarea id="message" name="message" required rows={4} className={inputCls} />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold py-2.5 text-sm font-semibold transition-transform hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
        style={{ color: "rgb(var(--bg))" }}
      >
        <Send className="h-4 w-4" strokeWidth={2} />
        {pending ? "Enviando…" : "Enviar mensagem"}
      </button>
      <p className="text-center text-xs text-muted">
        Ao enviar, você concorda com o tratamento dos seus dados conforme a LGPD.
      </p>
    </form>
  );
}
