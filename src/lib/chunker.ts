import { get_encoding } from "tiktoken";

const enc = get_encoding("cl100k_base");

const TARGET_TOKENS = 512;
const OVERLAP_TOKENS = 64;

// Paragraph-first recursive splitter.
// Strategy: split on double newline → single newline → sentence boundary.
// This preserves ATPL concept integrity better than pure character splitting.
function splitByParagraph(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function splitBySentence(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function tokenCount(text: string): number {
  return enc.encode(text).length;
}

function mergeWithOverlap(segments: string[]): string[] {
  const chunks: string[] = [];
  let buffer: string[] = [];
  let bufferTokens = 0;

  for (const seg of segments) {
    const segTokens = tokenCount(seg);

    if (bufferTokens + segTokens > TARGET_TOKENS && buffer.length > 0) {
      chunks.push(buffer.join(" "));

      // Keep overlap: roll back segments until we have ~OVERLAP_TOKENS
      let overlapTokens = 0;
      const overlapBuffer: string[] = [];
      for (let i = buffer.length - 1; i >= 0; i--) {
        const t = tokenCount(buffer[i]);
        if (overlapTokens + t > OVERLAP_TOKENS) break;
        overlapTokens += t;
        overlapBuffer.unshift(buffer[i]);
      }
      buffer = overlapBuffer;
      bufferTokens = overlapTokens;
    }

    buffer.push(seg);
    bufferTokens += segTokens;
  }

  if (buffer.length > 0) chunks.push(buffer.join(" "));
  return chunks;
}

export function chunkText(text: string): string[] {
  const paragraphs = splitByParagraph(text);
  const sentences: string[] = [];

  for (const para of paragraphs) {
    if (tokenCount(para) <= TARGET_TOKENS) {
      sentences.push(para);
    } else {
      sentences.push(...splitBySentence(para));
    }
  }

  return mergeWithOverlap(sentences).filter(
    (c) => c.trim().length > 30 // drop stub chunks
  );
}
