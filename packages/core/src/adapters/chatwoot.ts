/**
 * Adapter do CRM Chatwoot (API personalizada do usuário).
 * Endpoints usados: Atendimentos, Kanban (cards), Funis. Auth via API Token (Bearer)
 * — também envia o header api_access_token para compatibilidade.
 *
 * Todas as funções são best-effort no chamador (try/catch); aqui apenas lançam em erro HTTP.
 */

export interface ChatwootConfig {
  baseUrl: string;
  token: string;
}

function headers(token: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    api_access_token: token,
  };
}

async function call<T>(cfg: ChatwootConfig, method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${cfg.baseUrl.replace(/\/$/, "")}${path}`, {
    method,
    headers: headers(cfg.token),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Chatwoot ${method} ${path}: ${res.status} ${await res.text()}`);
  return (res.status === 204 ? (undefined as T) : ((await res.json()) as T));
}

/** Testa a conexão listando os funis. */
export async function testConnection(cfg: ChatwootConfig): Promise<boolean> {
  await call(cfg, "GET", "/api/v1/kanban/boards");
  return true;
}

// ---------- Atendimentos (conversas / leads) ----------

export interface CreateConversationInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  message?: string;
  extra?: Record<string, unknown>;
}

/** Cria um atendimento (conversa) — usado para registrar um lead do site. */
export async function createConversation(cfg: ChatwootConfig, input: CreateConversationInput): Promise<{ id?: number }> {
  return call(cfg, "POST", "/api/atendimentos", {
    name: input.name,
    email: input.email ?? undefined,
    phone: input.phone ?? undefined,
    message: input.message ?? undefined,
    ...input.extra,
  });
}

// ---------- Funis e Kanban ----------

export interface CreateFunnelInput {
  name: string;
  stages?: { name: string; key?: string }[];
}

export async function createFunnel(cfg: ChatwootConfig, input: CreateFunnelInput): Promise<{ id?: string }> {
  return call(cfg, "POST", "/api/v1/funnels", input);
}

export interface CreateCardInput {
  boardId?: string;
  funnelId?: string;
  stageId?: string;
  title: string;
  conversationId?: string | number;
  contact?: { name: string; email?: string | null; phone?: string | null };
  value?: number;
  meta?: Record<string, unknown>;
}

/** Cria um card no Kanban (espelha um processo, por exemplo). */
export async function createCard(cfg: ChatwootConfig, input: CreateCardInput): Promise<{ id?: string; conversationId?: string }> {
  return call(cfg, "POST", "/api/v1/kanban/cards", input);
}

/** Move um card para outro stage do funil. */
export async function moveCard(cfg: ChatwootConfig, conversationId: string | number, stageId: string): Promise<void> {
  await call(cfg, "PUT", `/api/v1/kanban/cards/${conversationId}/move`, { stageId });
}
