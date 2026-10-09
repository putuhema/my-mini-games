// Z.ai GLM-5 in JSON mode, shared by the AI judges. Without ZAI_API_KEY every call returns null
// and the caller falls back to its built-in rules.

import { z } from "zod";

const ENDPOINT = "https://api.z.ai/api/paas/v4/chat/completions";
const MODEL = "glm-5";

const JSON_INSTRUCTION =
  "Balas HANYA dengan satu objek JSON yang sesuai JSON Schema berikut, tanpa teks lain:";

export async function glm<T extends z.ZodType>(
  schema: T,
  system: string,
  user: string,
  opts: {
    maxTokens: number;
    temperature: number;
    thinking: boolean;
    jsonInstruction?: string;
  },
): Promise<z.infer<T> | null> {
  const apiKey = process.env.ZAI_API_KEY;
  if (!apiKey) return null;
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            `${system}\n\n${opts.jsonInstruction ?? JSON_INSTRUCTION}\n` +
            JSON.stringify(z.toJSONSchema(schema)),
        },
        { role: "user", content: user },
      ],
      thinking: { type: opts.thinking ? "enabled" : "disabled" },
      response_format: { type: "json_object" },
      max_tokens: opts.maxTokens,
      temperature: opts.temperature,
    }),
  });
  if (!res.ok)
    throw new Error(`GLM-5 ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("GLM-5 returned no content");
  const json = content.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  const parsed = schema.safeParse(JSON.parse(json));
  if (!parsed.success)
    throw new Error(
      `GLM-5 output did not match: ${parsed.error.message.slice(0, 300)}`,
    );
  return parsed.data;
}
