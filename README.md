# ATPL Companion v1

> A production-style RAG application over ATPL (Airline Transport Pilot Licence) study materials — built to break coursework habits and learn what production retrieval actually looks like.

![Next.js](https://img.shields.io/badge/Next.js_14-black?style=flat-square&logo=next.js)
![Qdrant](https://img.shields.io/badge/Qdrant-Cloud-crimson?style=flat-square)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-green?style=flat-square)
![Cohere](https://img.shields.io/badge/Cohere-Rerank_v3.5-coral?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?style=flat-square)

---

## The Problem

ATPL syllabi span 14 subjects across thousands of pages of dense technical material — aerodynamics, meteorology, air law, navigation, human performance. Exam questions test exact values: altitudes to the foot, temperatures to the degree, regulation numbers.

Standard search fails here. A question like *"what is the relationship between TAS, IAS, and density altitude at FL350?"* needs retrieval that understands semantics (dense vectors) **and** exact ICAO terminology (sparse BM25). And after retrieval, you need a reranker to surface the three right paragraphs from fifty candidates — not hallucinate an answer.

I'm studying for my ATPL. So I built the tool I actually needed, and used it as a forcing function to replace every coursework shortcut with a production pattern.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    INGESTION PIPELINE                        │
│                    (local, one-time)                         │
│                                                              │
│  PDF files                                                   │
│     │                                                        │
│     ▼                                                        │
│  pdf-parse ──► per-page text extraction                      │
│     │                                                        │
│     ▼                                                        │
│  Recursive chunker                                           │
│  (512 tok target · 64 tok overlap)                           │
│     │                                                        │
│     ├──► Build corpus TF-IDF vocab ──► vocab.json + idf.json │
│     │                                                        │
│     ▼                                                        │
│  OpenAI text-embedding-3-small                               │
│  (1536-dim dense vectors)                                    │
│     │                                                        │
│     ▼                                                        │
│  Qdrant Cloud upsert                                         │
│  {dense vector, sparse TF-IDF vector,                        │
│   payload: {source, page, chunkIndex, text}}                 │
└─────────────────────────┬───────────────────────────────────┘
                          │
                    [Qdrant Cloud]
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    QUERY PIPELINE                            │
│                 (Next.js API route)                          │
│                                                              │
│  User question                                               │
│     │                                                        │
│     ├──► OpenAI embed ──► dense query vector                 │
│     └──► vocab lookup ──► sparse query vector                │
│                                                              │
│  Qdrant prefetch:                                            │
│     ├── dense cosine    top-50                               │
│     └── sparse BM25     top-50                               │
│            │                                                 │
│            ▼                                                 │
│     Qdrant RRF fusion ──► unified top-50                     │
│            │              (single round-trip)                │
│            ▼                                                 │
│     Cohere Rerank v3.5 ──► top-5                             │
│            │                                                 │
│            ▼                                                 │
│     GPT-4o streaming                                         │
│     (system prompt: cite every claim as [source:page])       │
│            │                                                 │
│            ▼                                                 │
│     SSE stream ──► sources panel + streaming answer          │
└─────────────────────────────────────────────────────────────┘
```

---

## Chunking Strategy

**Choice: recursive paragraph → sentence splitter, 512 tokens target, 64 token overlap**

### Why not fixed-character splitting?

ATPL material mixes dense prose (weather theory), structured lists (ICAO limits), and formula-heavy sections (navigation). Fixed-character splits bisect sentences mid-concept. A paragraph-first approach keeps the "smallest coherent unit" intact.

### Why 512 tokens?

`text-embedding-3-small` was trained on 8192-token context but retrieval quality degrades for long inputs on specific factual tasks. 512 tokens ≈ 2–3 dense paragraphs — in ATPL material that typically covers one complete concept: one regulation, one formula with its conditions, one weather phenomenon.

Smaller chunks (256 tokens) lose the surrounding context that disambiguates jargon. *"Critical altitude"* means different things in engine performance vs. pressurisation. Without the surrounding sentences, the embedding drifts.

### Why 64-token overlap?

Prevents a concept split across a chunk boundary from being un-retrievable. 64 tokens ≈ 2–3 sentences — enough to capture a definition that starts at the bottom of one chunk and continues at the top of the next.

### Why not semantic/embedding-based splitting?

Requires embedding every candidate split point — expensive and slow for large corpora. The content structure (paragraphs already encode topic boundaries) makes it unnecessary here.

---

## Retrieval Pipeline

| Step | What happens | Why |
|---|---|---|
| **Dense retrieval** | Query embedded with `text-embedding-3-small`, cosine search, top-50 | Catches semantic similarity: paraphrased questions still find the right passage |
| **Sparse retrieval** | Query tokenised → vocab lookup → BM25-weighted vector, top-50 | Catches exact ICAO codes, altitude values, regulation numbers — critical for ATPL where exact values are tested |
| **RRF fusion** | Qdrant fuses both ranked lists with Reciprocal Rank Fusion | Single round-trip. No client-side merge logic. Handles list-length asymmetry correctly |
| **Cohere Rerank v3.5** | Cross-encoder reads (query, passage) pairs jointly, returns top-5 | Cross-encoder quality at API-call cost. Filters surface matches that aren't actually relevant. Adds ~150ms, removes ~35–40% of retrieval noise |
| **GPT-4o streaming** | System prompt forces `[source:page]` citation on every factual claim | Citations are non-negotiable for a study tool. Wrong answers with no citations are worse than no answers |

---

## What I Dropped From My Coursework Version (and Why)

This project was a deliberate break from patterns I'd normalised in coursework. Here's the honest accounting:

### LangChain

**What I used it for:** `RetrievalQA` chain, prompt templates, text splitters.

**Why I dropped it:** LangChain hides the prompt, hides the chunking logic, and hides the retrieval call. When retrieval quality is bad, you can't see why. When the prompt produces wrong citations, you can't see the prompt. It broke across two minor version bumps during a single project. The abstraction adds zero value over calling the OpenAI SDK directly — it just adds a dependency and an indirection layer.

**What I replaced it with:** Direct `openai` SDK. The system prompt is a string I wrote and can read. The chunker is 60 lines I understand. Retrieval is one function call.

### Firebase

**What I used it for:** Storing embeddings in Firestore documents, computing cosine similarity in Python at query time.

**Why I dropped it:** Firebase has no vector operations. The coursework hack was O(n) per query — every query scans every document. At 5,000 chunks it was already slow. The read costs were $0.06 per 10k reads, unsuitable beyond toy scale. It was the wrong tool being forced into a use case it doesn't support.

**What I replaced it with:** Qdrant Cloud. Purpose-built for vectors. Free tier: 1GB storage. Supports both dense and sparse vectors natively, with RRF fusion inside the database — no client-side logic needed.

### LLM temperature 0.7

**What I used:** Default temperature from tutorial code.

**Why I dropped it:** ATPL answers are factual. Temperature 0.7 produces fluent but occasionally wrong interpolations — the model invents plausible-sounding altitudes and regulation numbers with confidence. For a study tool that's actively harmful.

**What I replaced it with:** Temperature 0.1. Answers are deterministic and conservative. If the model isn't sure, it says so.

### Stuffing all retrieved chunks into context

**What I used:** Top-20 chunks passed directly to the LLM.

**Why I dropped it:** 20 chunks × 512 tokens = 10k tokens of context minimum. GPT-4o handles it but: (a) costs more, (b) "lost in the middle" — recall degrades for passages in the middle of long contexts, (c) noisy context makes the LLM hedge and produce weaker answers.

**What I replaced it with:** Retrieve 50, rerank to 5, send 5. The reranker does the filtering work that the LLM shouldn't have to do.

---

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js 14 App Router + Tailwind | SSE streaming via `ReadableStream` |
| Deployment | Vercel | Zero config for Next.js |
| Vector DB | Qdrant Cloud (free tier) | Hybrid search, RRF fusion, native sparse vectors |
| Embeddings | OpenAI `text-embedding-3-small` | $0.02/1M tokens. 1536 dimensions |
| LLM | OpenAI GPT-4o streaming | Direct `openai` SDK. No wrapper |
| Reranker | Cohere Rerank v3.5 | Free tier. Cross-encoder quality |
| **Not used** | LangChain, LlamaIndex, Firebase, Pinecone | Deliberate omissions — see above |

---

## Setup

### Prerequisites

- Node.js 20+
- [Qdrant Cloud](https://cloud.qdrant.io) account (free tier)
- OpenAI API key
- [Cohere](https://cohere.com) API key (free tier)

### Environment

```bash
cp .env.local.example .env.local
# Fill in:
# OPENAI_API_KEY
# QDRANT_URL      (e.g. https://xxxx.eu-central-1-0.aws.cloud.qdrant.io)
# QDRANT_API_KEY
# COHERE_API_KEY
```

### Install

```bash
npm install
```

### Ingest your PDFs

```bash
# Place PDFs in ./pdfs/

npm run create-collection   # one-time: creates Qdrant collection
npm run ingest              # PDF → chunks → embed → upsert
```

The ingest script outputs `docs/vocab.json` and `docs/idf.json` — commit these, they're needed at runtime for query-side sparse vectors.

### Run locally

```bash
npm run dev
# → http://localhost:3000
```

### Generate synthetic study material (for testing without real PDFs)

```bash
npm run generate-pdfs   # creates 5 synthetic ATPL PDFs in ./pdfs/
npm run ingest
```

---

## Cost (free-tier operation)

| Service | Free tier | Expected usage |
|---|---|---|
| Qdrant Cloud | 1GB storage | ~200MB for full ATPL corpus |
| OpenAI embeddings | ~$0.02/1M tokens | ~500k tokens to ingest full corpus ≈ $0.01 |
| Cohere Rerank | Trial → Production (free for dev) | ~5 calls per query |
| OpenAI GPT-4o | Pay per use | ~$0.005 per question |

---

## Skills Demonstrated

- **Production-ready RAG systems:** hybrid retrieval, reranking, source citation, streaming — without framework wrappers
- **Vector database integration:** Qdrant Cloud collection design, sparse + dense indexing, RRF fusion queries
- **Retrieval quality engineering:** chunking strategy decisions with measurable rationale, reranker integration, prompt design for factual grounding
- **Direct SDK usage:** OpenAI, Cohere, Qdrant — no LangChain, no abstraction layers

---

## File Structure

```
atpl-companion/
├── scripts/
│   ├── create-collection.ts       # one-time Qdrant collection setup
│   ├── ingest.ts                  # PDF → chunks → embed → upsert
│   └── generate-synthetic-pdfs.ts # test data generator
├── src/
│   ├── app/
│   │   ├── page.tsx               # single-page UI
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── api/ask/route.ts       # hybrid retrieval + rerank + stream
│   ├── components/
│   │   └── SourcesPanel.tsx
│   ├── lib/
│   │   ├── chunker.ts             # recursive splitter with overlap
│   │   ├── embed.ts               # OpenAI embeddings
│   │   ├── qdrant.ts              # typed Qdrant client + hybrid search
│   │   ├── rerank.ts              # Cohere rerank with graceful fallback
│   │   └── sparse.ts              # TF-IDF sparse vector builder
│   └── types/index.ts
├── docs/                          # generated vocab/IDF (committed — needed at runtime)
├── pdfs/                          # your PDFs go here (gitignored)
└── .env.local.example
```
