import { NextResponse } from "next/server";
import { extract } from "@/lib/extract";
import type { ExtractResult } from "@/lib/types";

/**
 * POST /api/extract — multipart/form-data with a "file" field.
 *
 * Always responds 200 with an ExtractResult. Extraction failing is a normal
 * path, not an error: the member falls through to manual entry and loses
 * nothing (the Core Flow Rule). A 500 here would strand them, so nothing
 * throws out of this handler.
 */

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ["application/pdf", "image/"];

function empty(notice: string, source: ExtractResult["source"] = "stub"): ExtractResult {
  return { fields: {}, confidence: {}, source, notice };
}

export async function POST(req: Request): Promise<NextResponse<ExtractResult>> {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        empty("We didn't receive a file. You can type your details in instead."),
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        empty(
          "That file is larger than 10MB. Try a smaller one, or just type the details in — it only takes a couple of minutes.",
        ),
      );
    }

    if (!ACCEPTED.some((t) => file.type.startsWith(t))) {
      return NextResponse.json(
        empty(
          "We can read PDFs and photos. That one's a different format — you can type the details in instead.",
        ),
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await extract(buffer, file.type);

    const found = Object.keys(result.fields).length;
    return NextResponse.json({
      ...result,
      notice:
        result.notice ??
        (found > 0
          ? `We found ${found} ${found === 1 ? "answer" : "answers"} in that document. Each one is marked so you can check our work.`
          : "We couldn't pull anything usable out of that one. No problem — you can type the details in instead."),
    });
  } catch {
    // Malformed multipart, aborted upload, anything else. The member should
    // never see a stack trace or a dead end.
    return NextResponse.json(
      empty(
        "Something went wrong reading that file. You can try another one, or type the details in instead.",
      ),
    );
  }
}
