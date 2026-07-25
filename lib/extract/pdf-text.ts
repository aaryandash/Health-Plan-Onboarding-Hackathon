import { inflateSync, unzipSync } from "node:zlib";

// Pulls the text layer out of a PDF using only node:zlib.
//
// Page content lives in `stream ... endstream` blocks, usually Flate-compressed.
// Text is drawn by `(literal) Tj` and `[(kerned) -120 (runs)] TJ` operators, so
// we inflate each stream and pull the string literals back out.
//
// Text-layer PDFs only. A scan has no text layer and yields nothing, which the
// caller handles by falling through to manual entry.
//
// (pdf-parse would do this, but its pdfjs dependency needs DOM globals that
// don't exist in a serverless function.)

/** Decode a PDF string literal, resolving escapes and octal codes. */
function decodeLiteral(raw: string): string {
  let out = "";
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch !== "\\") {
      out += ch;
      continue;
    }
    const next = raw[++i];
    if (next === undefined) break;
    switch (next) {
      case "n": out += "\n"; break;
      case "r": out += "\r"; break;
      case "t": out += "\t"; break;
      case "b": out += "\b"; break;
      case "f": out += "\f"; break;
      case "(": out += "("; break;
      case ")": out += ")"; break;
      case "\\": out += "\\"; break;
      case "\n": break; // line continuation
      default:
        if (next >= "0" && next <= "7") {
          let oct = next;
          while (oct.length < 3 && raw[i + 1] >= "0" && raw[i + 1] <= "7") {
            oct += raw[++i];
          }
          out += String.fromCharCode(parseInt(oct, 8));
        } else {
          out += next;
        }
    }
  }
  return out;
}

/**
 * Read string literals from a content stream, in order, inserting breaks where
 * the PDF moves the text cursor — otherwise every line runs together and the
 * label/value proximity the field parser relies on is destroyed.
 */
function textFromContentStream(content: string): string {
  let out = "";
  let i = 0;

  while (i < content.length) {
    const ch = content[i];

    if (ch === "(") {
      // Scan to the matching close paren, honouring escapes and nesting.
      let depth = 1;
      let j = i + 1;
      let raw = "";
      while (j < content.length && depth > 0) {
        const c = content[j];
        if (c === "\\") {
          raw += c + (content[j + 1] ?? "");
          j += 2;
          continue;
        }
        if (c === "(") depth++;
        else if (c === ")") {
          depth--;
          if (depth === 0) break;
        }
        raw += c;
        j++;
      }
      out += decodeLiteral(raw);
      i = j + 1;
      continue;
    }

    // Operators that move to a new line: Td, TD, T*, and the ' and " show-text
    // forms. Treat each as a line break.
    if (ch === "T" && (content[i + 1] === "d" || content[i + 1] === "D" || content[i + 1] === "*")) {
      out += "\n";
      i += 2;
      continue;
    }
    if ((ch === "'" || ch === '"') && out.length > 0) {
      out += "\n";
      i++;
      continue;
    }

    i++;
  }

  return out;
}

function inflateMaybe(bytes: Buffer): Buffer | null {
  try {
    return inflateSync(bytes);
  } catch {
    try {
      return unzipSync(bytes);
    } catch {
      return null;
    }
  }
}

export function pdfToText(buffer: Buffer): string {
  const latin = buffer.toString("latin1");
  const chunks: string[] = [];

  const STREAM = "stream";
  const ENDSTREAM = "endstream";
  let cursor = 0;

  while (cursor < latin.length) {
    const start = latin.indexOf(STREAM, cursor);
    if (start === -1) break;
    const end = latin.indexOf(ENDSTREAM, start);
    if (end === -1) break;

    // Skip the EOL that follows the `stream` keyword.
    let dataStart = start + STREAM.length;
    if (latin[dataStart] === "\r") dataStart++;
    if (latin[dataStart] === "\n") dataStart++;

    const raw = buffer.subarray(dataStart, end);
    const inflated = inflateMaybe(raw);
    const content = inflated
      ? inflated.toString("latin1")
      : raw.toString("latin1");

    // Only bother with streams that actually draw text.
    if (content.includes("Tj") || content.includes("TJ") || content.includes("BT")) {
      chunks.push(textFromContentStream(content));
    }

    cursor = end + ENDSTREAM.length;
  }

  return chunks
    .join("\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
