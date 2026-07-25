import type { ExtractResult } from "@/lib/types";
import { stubExtract } from "./stub";

/**
 * Extraction entry point. One function, one contract — everything upstream
 * (the API route, the upload step, the store) talks only to this.
 *
 * P2: to land the real parser, implement `parse(buffer, mimeType)` in
 * ./heuristic.ts returning an ExtractResult, then swap the call below. That is
 * the only line that needs to change; the route, the store, and the UI all
 * stay as they are.
 */
export async function extract(
  buffer: Buffer,
  mimeType: string,
): Promise<ExtractResult> {
  void buffer;
  void mimeType;

  // TODO(P2): replace with `return parse(buffer, mimeType)` from ./heuristic.
  // An LLM path goes here too, gated on process.env.ANTHROPIC_API_KEY.
  return stubExtract();
}
