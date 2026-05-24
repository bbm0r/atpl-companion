import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { embedQuery } from "@/lib/embed";
import { hybridSearch } from "@/lib/qdrant";
import { rerank } from "@/lib/rerank";
import { buildQuerySparse } from "@/lib/sparse";
import type { AskRequest, Source } from "@/types";

export const runtime = "nodejs";

// Lazy-init clients so build-time module evaluation doesn't require env vars.
let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

// Vocab loaded from disk once per cold start (written by `npm run ingest`).
let _vocab: Record<string, number> | null = null;
function getVocab(): Record<string, number> {
  if (!_vocab) {
    try {
      const vocabPath = path.join(process.cwd(), "docs", "vocab.json");
      _vocab = JSON.parse(fs.readFileSync(vocabPath, "utf-8"));
    } catch {
      _vocab = {};
    }
  }
  return _vocab!;
}

const SYSTEM_PROMPT = `You are an expert ATPL (Airline Transport Pilot Licence) study assistant.
Answer questions using ONLY the provided context passages. Be precise — ATPL exams test exact values.

Rules:
- Cite every factual claim with [source:page] inline. Example: "The maximum altitude is FL450 [B-ATPL-AGK:142]."
- If a question cannot be answered from the context, say "I cannot find this in the provided materials."
- You MAY perform arithmetic or unit conversions derived directly from values stated in the context (e.g. applying a lapse rate to compute a temperature at a given flight level). Cite the source of the input values.
- Never guess or hallucinate numbers, altitudes, speeds, or regulations not derivable from the context.
- Format numerical answers clearly. Use the same units as the source material.`;

function buildUserPrompt(question: string, chunks: { payload: { source: string; page: number; text: string } }[]): string {
  const context = chunks
    .map((c, i) => `[${i + 1}] [${c.payload.source}:${c.payload.page}]\n${c.payload.text}`)
    .join("\n\n");

  return `Context:\n${context}\n\nQuestion: ${question}`;
}

export async function POST(req: NextRequest) {
  let body: AskRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const { question } = body;
  if (!question?.trim()) {
    return new Response(JSON.stringify({ error: "question is required" }), { status: 400 });
  }

  // 1. Embed query (dense)
  const denseVector = await embedQuery(question);

  // 2. Build sparse query vector
  const sparseVector = buildQuerySparse(question, getVocab());

  // 3. Hybrid retrieval from Qdrant (RRF fusion, top-50)
  const candidates = await hybridSearch(denseVector, sparseVector, 50);

  // 4. Rerank to top-5
  const topChunks = await rerank(question, candidates, 5);

  // 5. Deduplicate sources for the sources panel
  const seen = new Set<string>();
  const sources: Source[] = [];
  for (const c of topChunks) {
    const key = `${c.payload.source}:${c.payload.page}`;
    if (!seen.has(key)) {
      seen.add(key);
      sources.push({ source: c.payload.source, page: c.payload.page, text: c.payload.text });
    }
  }

  // 6. Stream from OpenAI GPT-4o
  const userPrompt = buildUserPrompt(question, topChunks);

  const stream = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    stream: true,
    temperature: 0.1, // low temp: ATPL answers should be factual and deterministic
    max_tokens: 1024,
  });

  // 7. Build a ReadableStream that emits SSE-style JSON lines
  const readable = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();

      // First event: sources (so UI can render the panel immediately)
      controller.enqueue(
        enc.encode(`data: ${JSON.stringify({ type: "sources", sources })}\n\n`)
      );

      // Stream LLM chunks
      for await (const part of stream) {
        const delta = part.choices[0]?.delta?.content ?? "";
        if (delta) {
          controller.enqueue(
            enc.encode(`data: ${JSON.stringify({ type: "chunk", content: delta })}\n\n`)
          );
        }
      }

      controller.enqueue(enc.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
