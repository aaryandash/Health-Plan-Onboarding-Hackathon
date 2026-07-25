import type { ExtractResult, PlanIntake } from "@/lib/types";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

const FIELD_LIST: (keyof PlanIntake)[] = [
  "carrier",
  "planName",
  "metalTier",
  "planType",
  "deductibleIndividual",
  "deductibleFamily",
  "deductibleMetYTD",
  "oopMax",
  "oopMetYTD",
  "coinsurance",
  "copayPrimaryCare",
  "copaySpecialist",
  "copayEmergency",
  "copayUrgentCare",
  "monthlyPremium",
];

const PROMPT = `You are extracting health plan details from an uploaded document (a Summary of Benefits and Coverage or an Explanation of Benefits).

Return ONLY a JSON object, no prose, no markdown fences, matching exactly this shape:
{"fields": {"<field>": <value>, ...}, "confidence": {"<field>": <0..1>, ...}}

Only these field names are valid: ${FIELD_LIST.join(", ")}.

Rules:
- Only include a field if you actually see its value in the document. Never guess or estimate.
- Dollar-amount fields are plain numbers, no "$" and no commas (e.g. 2500, not "$2,500.00").
- "coinsurance" is a fraction from 0 to 1 (20% becomes 0.2).
- "carrier", "planName", "metalTier", "planType" are plain strings.
- confidence is your honest 0..1 estimate of how certain you are, per field you included.
- If you cannot find anything, return {"fields": {}, "confidence": {}}.`;

export async function extractWithLLM(buffer: Buffer, mimeType: string): Promise<ExtractResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  const isPdf = mimeType === "application/pdf";
  const contentBlock = isPdf
    ? {
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: buffer.toString("base64") },
      }
    : {
        type: "image",
        source: { type: "base64", media_type: mimeType, data: buffer.toString("base64") },
      };

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [contentBlock, { type: "text", text: PROMPT }],
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Anthropic API error ${response.status}: ${body}`);
  }

  const data = (await response.json()) as { content?: Array<{ type: string; text?: string }> };
  const textBlock = data.content?.find((block) => block.type === "text")?.text ?? "";
  const jsonMatch = textBlock.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("LLM response did not contain a JSON object");
  }

  const parsed = JSON.parse(jsonMatch[0]) as Partial<ExtractResult>;

  return {
    fields: parsed.fields ?? {},
    confidence: parsed.confidence ?? {},
    source: "llm",
  };
}
