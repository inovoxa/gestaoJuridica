/**
 * Adapter unificado de IA (OpenAI, Anthropic, Gemini, Grok) via fetch.
 * Recebe a config (provider + apiKey + model) e retorna texto + tokens usados.
 */

export type AiProviderName = "OPENAI" | "ANTHROPIC" | "GEMINI" | "GROK";

export interface AiRequest {
  provider: AiProviderName;
  apiKey: string;
  model?: string;
  system: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AiResponse {
  content: string;
  tokens: number;
  model: string;
}

export function defaultModel(provider: AiProviderName): string {
  switch (provider) {
    case "OPENAI":
      return "gpt-4o";
    case "ANTHROPIC":
      return "claude-sonnet-4-6";
    case "GEMINI":
      return "gemini-2.5-flash";
    case "GROK":
      return "grok-4";
  }
}

export async function complete(req: AiRequest): Promise<AiResponse> {
  const model = req.model || defaultModel(req.provider);
  const maxTokens = req.maxTokens ?? 4000;
  const temperature = req.temperature ?? 0.3;

  if (req.provider === "ANTHROPIC") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": req.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        system: req.system,
        messages: [{ role: "user", content: req.prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { content: { text: string }[]; usage?: { input_tokens: number; output_tokens: number } };
    return {
      content: data.content.map((c) => c.text).join("\n"),
      tokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
      model,
    };
  }

  if (req.provider === "GEMINI") {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${req.apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: req.system }] },
        contents: [{ role: "user", parts: [{ text: req.prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature },
      }),
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      usageMetadata?: { totalTokenCount?: number };
    };
    const content = (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
    return { content, tokens: data.usageMetadata?.totalTokenCount ?? 0, model };
  }

  // OpenAI e Grok usam o mesmo formato (Chat Completions).
  const endpoint =
    req.provider === "GROK" ? "https://api.x.ai/v1/chat/completions" : "https://api.openai.com/v1/chat/completions";
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${req.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      messages: [
        { role: "system", content: req.system },
        { role: "user", content: req.prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`${req.provider} ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
    usage?: { total_tokens: number };
  };
  return { content: data.choices[0]?.message?.content ?? "", tokens: data.usage?.total_tokens ?? 0, model };
}
