import { CohereClient } from "cohere-ai";
import type { RetrievedChunk } from "@/types";

let _cohere: CohereClient | null = null;
function getCohere(): CohereClient {
  if (!_cohere) _cohere = new CohereClient({ token: process.env.COHERE_API_KEY });
  return _cohere;
}

// Returns top-k re-ranked chunks. Falls back to original order if Cohere
// key is missing or ENABLE_RERANK is explicitly false.
export async function rerank(
  query: string,
  chunks: RetrievedChunk[],
  topK = 5
): Promise<RetrievedChunk[]> {
  const enabled = process.env.ENABLE_RERANK !== "false" && process.env.COHERE_API_KEY;

  if (!enabled || chunks.length === 0) {
    return chunks.slice(0, topK);
  }

  const response = await getCohere().rerank({
    model: "rerank-v3.5",
    query,
    documents: chunks.map((c) => c.payload.text),
    topN: topK,
    returnDocuments: false,
  });

  return response.results.map((r) => chunks[r.index]);
}
