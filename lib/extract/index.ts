import type { ExtractResult } from "@/lib/types";
import { extractHeuristic } from "./heuristic";
import { extractWithLLM } from "./llm";

export interface ExtractInput {
  buffer: Buffer;
  mimeType: string;
}

/**
 * Single entry point for document extraction. LLM path runs when
 * ANTHROPIC_API_KEY is set; otherwise (or if the LLM call fails) falls back
 * to the heuristic PDF-only path. Never throws — always returns a valid
 * ExtractResult so the caller can fall through to manual entry.
 */
export async function extract({ buffer, mimeType }: ExtractInput): Promise<ExtractResult> {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await extractWithLLM(buffer, mimeType);
    } catch {
      // fall through to heuristic / manual-entry notice below
    }
  }

  if (mimeType === "application/pdf") {
    return extractHeuristic(buffer);
  }

  return {
    fields: {},
    confidence: {},
    source: "heuristic",
    notice: "We can only automatically read PDF documents right now. You can still fill in your plan details manually below.",
  };
}
