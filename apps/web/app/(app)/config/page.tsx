import { prisma } from "@legaltech/db";
import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { Field, FormActions } from "@/components/ui/form";
import { ChatwootTest } from "@/components/chatwoot-test";
import { Select } from "@/components/ui/form";
import { saveChatwootConfig, saveDatajudConfig, saveAiConfig } from "./actions";
import { MessagesSquare, CalendarDays, Scale, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ConfigPage() {
  await requireRole("ADMIN_ESCRITORIO");
  const [chatwoot, google, datajud, ai] = await Promise.all([
    prisma.chatwootIntegration.findUnique({ where: { id: "chatwoot" } }),
    prisma.googleIntegration.findUnique({ where: { id: "google" } }).catch(() => null),
    prisma.datajudConfig.findUnique({ where: { id: "datajud" } }).catch(() => null),
    prisma.aiConfig.findFirst({ orderBy: { priority: "asc" } }).catch(() => null),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Configurações" subtitle="Integrações do escritório" />

      {/* Chatwoot */}
      <div className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <MessagesSquare className="h-5 w-5 text-gold" strokeWidth={1.75} />
          <h2 className="font-serif text-base font-semibold text-foreground">CRM Chatwoot</h2>
        </div>
        <form action={saveChatwootConfig} className="space-y-4">
          <Field label="Base URL" name="baseUrl" defaultValue={chatwoot?.baseUrl ?? ""} placeholder="https://crm.seudominio.com.br" />
          <Field
            label="API Token"
            name="token"
            type="password"
            placeholder={chatwoot?.apiTokenEncrypted ? "•••••• (mantém o atual se vazio)" : "Cole o API Token"}
            helper="Armazenado criptografado (AES-256-GCM)."
          />
          <Field label="ID do funil padrão (processos)" name="defaultFunnelId" defaultValue={chatwoot?.defaultFunnelId ?? ""} />
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" name="active" defaultChecked={chatwoot?.active ?? true} className="h-4 w-4 rounded border-border bg-bg accent-gold" />
            Integração ativa
          </label>
          <div className="flex items-center justify-between">
            <ChatwootTest />
            <FormActions cancelHref="/dashboard" submitLabel="Salvar" />
          </div>
        </form>
      </div>

      {/* DataJud */}
      <div className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Scale className="h-5 w-5 text-gold" strokeWidth={1.75} />
          <h2 className="font-serif text-base font-semibold text-foreground">DataJud (CNJ)</h2>
        </div>
        <form action={saveDatajudConfig} className="space-y-4">
          <Field
            label="Chave da API DataJud"
            name="apiKey"
            type="password"
            placeholder={datajud?.apiKeyEncrypted ? "•••••• (mantém a atual se vazio)" : "Chave pública DPJ/CNJ"}
            helper="Chave pública do DataJud (datajud-wiki.cnj.jus.br). Armazenada criptografada."
          />
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" name="autoSync" defaultChecked={datajud?.autoSync ?? true} className="h-4 w-4 rounded border-border bg-bg accent-gold" />
            Sincronização automática diária
          </label>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" name="autoExtractDeadlines" defaultChecked={datajud?.autoExtractDeadlines ?? true} className="h-4 w-4 rounded border-border bg-bg accent-gold" />
            Extrair prazos automaticamente das movimentações
          </label>
          <div className="flex justify-end">
            <FormActions cancelHref="/dashboard" submitLabel="Salvar" />
          </div>
        </form>
        {datajud?.lastSync && (
          <p className="mt-3 text-xs text-muted">
            Última sincronização: {datajud.lastSync.toLocaleString("pt-BR")} · {datajud.requestsThisMonth} requisição(ões) no mês
          </p>
        )}
      </div>

      {/* IA */}
      <div className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-gold" strokeWidth={1.75} />
          <h2 className="font-serif text-base font-semibold text-foreground">Inteligência Artificial</h2>
        </div>
        <form action={saveAiConfig} className="space-y-4">
          <Select
            label="Provedor"
            name="provider"
            required
            defaultValue={ai?.provider ?? ""}
            options={[
              { value: "OPENAI", label: "OpenAI (GPT)" },
              { value: "ANTHROPIC", label: "Anthropic (Claude)" },
              { value: "GEMINI", label: "Google (Gemini)" },
              { value: "GROK", label: "xAI (Grok)" },
            ]}
          />
          <Field
            label="Chave da API"
            name="apiKey"
            type="password"
            placeholder={ai?.apiKeyEnc ? "•••••• (mantém a atual se vazio)" : "Cole a chave da API"}
            helper="Armazenada criptografada. Usada para petições, explicações e análises."
          />
          <Field label="Modelo (opcional)" name="model" defaultValue={ai?.model ?? ""} helper="Vazio = modelo padrão do provedor." />
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" name="active" defaultChecked={ai?.active ?? true} className="h-4 w-4 rounded border-border bg-bg accent-gold" />
            Ativo
          </label>
          <div className="flex justify-end">
            <FormActions cancelHref="/dashboard" submitLabel="Salvar" />
          </div>
        </form>
        {ai?.lastUsed && (
          <p className="mt-3 text-xs text-muted">
            {ai.totalRequests} requisição(ões) · {ai.totalTokens} tokens · último uso {ai.lastUsed.toLocaleDateString("pt-BR")}
          </p>
        )}
      </div>

      {/* Google Calendar */}
      <div className="card p-6">
        <div className="mb-2 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-gold" strokeWidth={1.75} />
          <h2 className="font-serif text-base font-semibold text-foreground">Google Calendar</h2>
        </div>
        <p className="text-sm text-muted">
          {google?.syncEnabled
            ? "Sincronização bidirecional ativa."
            : "Conecte sua conta Google na página de Agenda para sincronizar a agenda."}
        </p>
        <a
          href={google?.syncEnabled ? "/agenda" : "/api/google/oauth/start"}
          className="mt-3 inline-block text-sm text-gold hover:underline"
        >
          {google?.syncEnabled ? "Ir para a Agenda →" : "Conectar Google Calendar →"}
        </a>
      </div>
    </div>
  );
}
