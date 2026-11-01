export const DEFAULT_MODEL = "gpt-4o-mini";
export const DEFAULT_BASE_URL = "https://api.openai.com/v1";

export type LlmConfig = {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
};

export type ResolvedLlm = {
  apiKey: string;
  model: string;
  baseUrl: string;
  fetchImpl: typeof fetch;
};

export function resolveLlmConfig(options: LlmConfig = {}): ResolvedLlm {
  const hasKeyOverride = Object.prototype.hasOwnProperty.call(options, "apiKey");
  const apiKey = (hasKeyOverride ? options.apiKey : process.env.OPENAI_API_KEY)?.trim() || "";
  const model = (options.model ?? process.env.OPENAI_MODEL)?.trim() || DEFAULT_MODEL;
  const baseUrl = ((options.baseUrl ?? process.env.OPENAI_BASE_URL)?.trim() || DEFAULT_BASE_URL).replace(/\/$/, "");
  return {
    apiKey,
    model,
    baseUrl,
    fetchImpl: options.fetchImpl ?? fetch,
  };
}

export function llmStatus(): { enabled: boolean; model: string } {
  const { apiKey, model } = resolveLlmConfig();
  return { enabled: Boolean(apiKey), model };
}

type TokenField = "max_completion_tokens" | "max_tokens";

async function postChat(config: ResolvedLlm, system: string, user: string, tokenField: TokenField, maxTokens: number) {
  return config.fetchImpl(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.2,
      [tokenField]: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
}

export async function completeChat(
  system: string,
  user: string,
  options: LlmConfig = {},
  maxTokens = 700,
): Promise<{ text: string; model: string } | null> {
  const config = resolveLlmConfig(options);
  if (!config.apiKey) return null;

  let response = await postChat(config, system, user, "max_completion_tokens", maxTokens);
  if (response.status === 400) {
    response = await postChat(config, system, user, "max_tokens", maxTokens);
  }
  if (!response.ok) throw new Error(`Model request failed (${response.status}).`);

  const data = (await response.json()) as {
    choices?: { message?: { content?: string | null } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Model returned an empty response.");
  return { text, model: config.model };
}
