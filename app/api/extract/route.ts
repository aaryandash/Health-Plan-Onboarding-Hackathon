// Must come before anything that reaches pdfjs-dist. See the file for why.
import "@/lib/extract/polyfill";
import type { ExtractResult } from "@/lib/types";

// pdf-parse / pdfjs-dist need Node APIs, not the edge runtime.
export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

const ACCEPTED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function fallback(notice: string): ExtractResult {
  return { fields: {}, confidence: {}, source: "heuristic", notice };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json(fallback("We didn't receive a file. You can fill in your plan details manually below."));
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return Response.json(
        fallback("That file is larger than 10MB, so we couldn't read it automatically. You can fill in your plan details manually below.")
      );
    }

    if (!ACCEPTED_MIME_TYPES.has(file.type)) {
      return Response.json(
        fallback("We can only read PDF or image files right now. You can fill in your plan details manually below.")
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // Imported here, not at the top: if the pdfjs module graph fails to load
    // for any reason, that failure lands in this try block instead of killing
    // the whole route at module evaluation (which is what returned 500s
    // before). The member falls through to manual entry either way.
    const { extract } = await import("@/lib/extract");
    const result = await extract({ buffer, mimeType: file.type });
    return Response.json(result);
  } catch {
    // Partial/failed extraction is expected behavior, not an error — the
    // form always falls through to manual entry. Never surface a 500 here.
    return Response.json(
      fallback("Something went wrong reading that document. You can fill in your plan details manually below.")
    );
  }
}
