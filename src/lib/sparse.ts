// Lightweight BM25-style sparse vector builder for query-time use.
// At ingest time we compute TF-IDF; at query time we tokenize and look up IDF weights.
// For simplicity we use a shared token→index vocabulary stored as a JSON file
// generated during ingestion. At query time we only need term presence (BM25 query vector).

export interface SparseVector {
  indices: number[];
  values: number[];
}

// Tokenise: lowercase, strip punctuation, split on whitespace.
// ATPL text is mostly English with ICAO codes — simple tokenisation is fine.
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

// Build a query sparse vector from a precomputed vocab map (token → index).
// Values are set to 1.0 for present terms (adequate for query-side BM25 scoring).
export function buildQuerySparse(
  text: string,
  vocab: Record<string, number>
): SparseVector {
  const tokens = Array.from(new Set(tokenize(text)));
  const indices: number[] = [];
  const values: number[] = [];

  for (const token of tokens) {
    if (vocab[token] !== undefined) {
      indices.push(vocab[token]);
      values.push(1.0);
    }
  }

  return { indices, values };
}

// Build a document sparse vector with TF-IDF-like weighting.
// idf: precomputed per-term IDF scores from the corpus.
export function buildDocSparse(
  text: string,
  vocab: Record<string, number>,
  idf: Record<string, number>
): SparseVector {
  const tokens = tokenize(text);
  const tf: Record<string, number> = {};
  for (const t of tokens) tf[t] = (tf[t] ?? 0) + 1;

  const indices: number[] = [];
  const values: number[] = [];

  for (const [token, count] of Object.entries(tf)) {
    if (vocab[token] === undefined) continue;
    const tfNorm = count / tokens.length;
    const weight = tfNorm * (idf[token] ?? 1.0);
    indices.push(vocab[token]);
    values.push(weight);
  }

  return { indices, values };
}
