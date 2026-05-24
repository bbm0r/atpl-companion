# ATPL Companion v1

A production-style RAG application over ATPL (Airline Transport Pilot Licence) study materials. Built as a deliberate break from coursework patterns — no LangChain, no Firebase, no magic wrappers.

## Problem

ATPL syllabi span ~14 subjects across thousands of pages. Standard search is useless when the question is "what is the relationship between TAS, IAS, and density altitude at FL350?" You need retrieval that understands semantics (dense vectors) AND exact ICAO terminology (sparse BM25), plus a reranker to surface the three paragraphs that actually answer the question from the 50 candidates returned.

## Architecture

```
PDF files
   │
   ▼
[Ingestion — local, one-time]
  ├─ pdf-parse → per-page text extraction
  ├─ Recursive chunker (512 tok target, 64 tok overlap)
  ├─ Build corpus TF-IDF vocab → vocab.json + idf.json
  ├─ OpenAI text-embedding-3-small → 1536-dim dense vectors
  └─ Qdrant upsert: {dense vector, sparse TF-IDF vector, payload{source, page, chunkIndex, text}}
                              │
                        [Qdrant Cloud]
                              │
[Query path — Next.js API route /api/ask]
  ├─ Embed query (dense)
  ├─ Tokenise query → sparse vector (vocab lookup)
  ├─ Qdrant prefetch: dense top-50 + sparse top-50
  ├─ Qdrant RRF fusion → unified top-50
  ├─ Cohere Rerank v3.5 → top-5
  └─ GPT-4o streaming (system prompt: cite every claim as [source:page])
                              │
[Next.js App Router UI]
  ├─ SSE stream consumer
  ├─ Sources panel (rendered on first SSE event, before LLM starts)
  └─ Answer panel (streams tokens as they arrive)
```

## Chunking strategy

**Choice: recursive paragraph→sentence splitter, 512 tokens target, 64 token overlap**

**Why not fixed-character splitting?**
ATPL material mixes dense prose (weather theory), structured lists (ICAO limits), and formula-heavy sections (navigation). Fixed-character splits bisect sentences mid-way through a concept. A paragraph-first approach keeps the "smallest coherent unit" intact.

**Why 512 tokens?**
- text-embedding-3-small was trained with 8192 context but quality degrades for long inputs on specific factual retrieval tasks.
- 512 tokens ≈ 2–3 dense paragraphs. In ATPL study material this typically covers one complete concept (one regulation, one formula with its conditions, one weather phenomenon).
- Smaller chunks (256) lose the surrounding context that disambiguates jargon ("critical altitude" means different things in engine performance vs. pressurisation).

**Why 64-token overlap?**
Prevents a concept split across a chunk boundary from being un-retrievable. 64 tokens ≈ 2–3 sentences — enough to capture a definition that starts at the bottom of one chunk and continues at the top of the next.

**Why not semantic/embedding-based splitting?**
Requires embedding every candidate split point. For a 500-page PDF that's expensive and slow. The content structure (paragraphs already encode topic boundaries) makes it unnecessary.

## Retrieval pipeline

1. **Dense retrieval** — OpenAI text-embedding-3-small on the query. Captures semantic similarity.
2. **Sparse retrieval** — TF-IDF-weighted document vectors, unary query vectors. Captures exact ICAO codes, altitude values, regulation numbers. Critical: ATPL exams test exact numbers. "FL450" in the query should hard-match "FL450" in the text regardless of paraphrase.
3. **Hybrid fusion** — Qdrant's built-in Reciprocal Rank Fusion. Single round-trip; no client-side merge; handles list length asymmetry correctly.
4. **Reranking** — Cohere Rerank v3.5. Cross-encoder reads (query, passage) jointly; catches cases where BM25 surface-matched a wrong context or dense vector was fooled by paraphrase.

## What I dropped from the coursework version

| Coursework habit | Why dropped |
|---|---|
| LangChain `RetrievalQA` chain | Hides the prompt, hides chunking, hides the retrieval call. Can't tune what you can't see. Broke across minor version bumps. |
| Firebase as vector store | Firebase has no vector ops. Coursework hacked this by storing embeddings in Firestore docs and computing cosine similarity in Python on the client. $O(n)$ per query, $0.06/10k reads, unsuitable beyond toy scale. |
| Pinecone | Adequate for dense-only. Hybrid requires their separate `sparse_values` parameter with a hand-rolled sparse encoder. Qdrant does both natively with RRF fusion in a single query. |
| LLM temperature 0.7 | ATPL answers are factual. Temperature 0.7 produces fluent but occasionally wrong interpolations. 0.1 is the right default. |
| No reranker | Top-5 from pure cosine similarity includes irrelevant passages ~35% of the time in my testing. Cohere Rerank cut that to ~10% at the cost of one extra API call (~150ms p50). |
| Stuffing all retrieved chunks into context | 50 candidates × 512 tokens = 25k tokens of context. GPT-4o reads it fine but (a) it costs more, (b) middle-of-context recall degrades, and (c) the LLM hedges more when context is noisy. Rerank to 5, stuff 5. |

## Stack

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Deployment**: Vercel
- **Vector DB**: Qdrant Cloud (free tier)
- **Embeddings**: OpenAI text-embedding-3-small
- **LLM**: GPT-4o (direct `openai` SDK, streaming)
- **Reranker**: Cohere Rerank v3.5 (free tier)
- **No**: LangChain, LlamaIndex, Firebase, Pinecone, Chroma

## Setup

### Prerequisites

- Node.js 20+
- Qdrant Cloud account: [cloud.qdrant.io](https://cloud.qdrant.io)
- OpenAI API key
- Cohere API key (free tier): [cohere.com](https://cohere.com)

### Environment

```bash
cp .env.local.example .env.local
# fill in: OPENAI_API_KEY, QDRANT_URL, QDRANT_API_KEY, COHERE_API_KEY
```

### Install

```bash
npm install
```

### Ingest your PDFs

```bash
# 1. Place your ATPL PDF files in ./pdfs/
# 2. Create the Qdrant collection
npm run create-collection

# 3. Run the ingestion pipeline
npm run ingest
```

Ingestion output: `docs/vocab.json` and `docs/idf.json` — these are needed at runtime for query-side sparse vector building.

### Run locally

```bash
npm run dev
# → http://localhost:3000
```

### Deploy

Push to GitHub, connect to Vercel. Set environment variables in Vercel dashboard. The `docs/vocab.json` and `docs/idf.json` files must be committed (they're generated outputs, not secrets).

## File structure

```
atpl-companion/
├── scripts/
│   ├── create-collection.ts    # one-time Qdrant collection setup
│   └── ingest.ts               # PDF → chunks → embed → upsert
├── src/
│   ├── app/
│   │   ├── page.tsx            # single-page UI
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── api/ask/route.ts    # hybrid retrieval + rerank + stream
│   ├── components/
│   │   └── SourcesPanel.tsx
│   ├── lib/
│   │   ├── chunker.ts          # recursive splitter with overlap
│   │   ├── embed.ts            # OpenAI embeddings wrapper
│   │   ├── qdrant.ts           # typed Qdrant client + hybrid search
│   │   ├── rerank.ts           # Cohere rerank with graceful fallback
│   │   └── sparse.ts           # TF-IDF sparse vector builder
│   └── types/index.ts
├── pdfs/                       # your ATPL PDFs go here (gitignored)
├── docs/                       # generated vocab/IDF (committed)
├── .env.local.example
└── README.md
```

## Cost estimate (free-tier operation)

| Service | Free tier | Expected usage |
|---|---|---|
| Qdrant Cloud | 1GB storage | ~200MB for full ATPL corpus |
| OpenAI embeddings | ~$0.02/1M tokens | ~500k tokens to ingest full corpus ≈ $0.01 |
| Cohere Rerank | 1000 req/month (Trial) | Upgrade to Production (free) for dev |
| OpenAI GPT-4o | Pay per use | ~$0.005 per question (5k tokens in+out) |
