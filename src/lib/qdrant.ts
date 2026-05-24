import { QdrantClient } from "@qdrant/js-client-rest";
import type { ChunkPayload, RetrievedChunk } from "@/types";

export const COLLECTION = process.env.QDRANT_COLLECTION ?? "atpl_chunks";
const DENSE_DIM = 1536; // text-embedding-3-small

let _qdrant: QdrantClient | null = null;
export function getQdrant(): QdrantClient {
  if (!_qdrant) {
    _qdrant = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
    });
  }
  return _qdrant;
}

export async function createCollection(): Promise<void> {
  const client = getQdrant();
  const exists = await client
    .getCollection(COLLECTION)
    .then(() => true)
    .catch(() => false);

  if (exists) {
    console.log(`Collection "${COLLECTION}" already exists.`);
    return;
  }

  await client.createCollection(COLLECTION, {
    vectors: {
      dense: { size: DENSE_DIM, distance: "Cosine" },
    },
    sparse_vectors: {
      sparse: { index: { on_disk: false } },
    },
  });

  await client.createPayloadIndex(COLLECTION, {
    field_name: "source",
    field_schema: "keyword",
  });

  console.log(`Collection "${COLLECTION}" created.`);
}

export async function upsertChunks(
  points: Array<{
    id: string;
    dense: number[];
    sparse: { indices: number[]; values: number[] };
    payload: ChunkPayload;
  }>
): Promise<void> {
  await getQdrant().upsert(COLLECTION, {
    wait: true,
    points: points.map((p) => ({
      id: p.id,
      vector: { dense: p.dense, sparse: p.sparse },
      payload: p.payload,
    })),
  });
}

// Hybrid search: dense cosine + BM25 sparse, fused with RRF inside Qdrant.
export async function hybridSearch(
  denseVector: number[],
  sparseVector: { indices: number[]; values: number[] },
  limit = 50
): Promise<RetrievedChunk[]> {
  const response = await getQdrant().query(COLLECTION, {
    prefetch: [
      { query: denseVector, using: "dense", limit },
      { query: { indices: sparseVector.indices, values: sparseVector.values }, using: "sparse", limit },
    ],
    query: { fusion: "rrf" },
    limit,
    with_payload: true,
  });

  return response.points.map((p) => ({
    id: String(p.id),
    score: p.score,
    payload: p.payload as unknown as ChunkPayload,
  }));
}
