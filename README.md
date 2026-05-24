# ATPL Companion

An AI study assistant for ATPL (Airline Transport Pilot Licence) exam preparation. Ask it questions in plain English, get cited answers straight from the study material.

Built as a learning project to move from tutorial-style code to production patterns.

---

## What it does

You type a question. It searches your ATPL study PDFs, finds the most relevant passages, and gives you a cited answer — with a reference to the exact page it came from.

![Stack](https://img.shields.io/badge/Next.js_14-black?style=flat-square&logo=next.js)
![Qdrant](https://img.shields.io/badge/Qdrant-Cloud-crimson?style=flat-square)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-green?style=flat-square)
![Cohere](https://img.shields.io/badge/Cohere-Rerank-coral?style=flat-square)

---

## How it works

```
Your question
     │
     ▼
Search study material two ways:
  - Meaning-based search (finds similar concepts)
  - Keyword search (finds exact terms like "FL350" or "QNH")
     │
     ▼
Combine and rerank the best results
     │
     ▼
GPT-4o reads the top passages and writes an answer
with [source:page] citations on every fact
     │
     ▼
Answer streams to your screen in real time
```

---

## Tech stack

| What | Tool | Why |
|---|---|---|
| Frontend | Next.js 14 + Tailwind | Simple, deploys easily to Vercel |
| Vector database | Qdrant Cloud | Stores the study material as searchable vectors |
| Embeddings | OpenAI text-embedding-3-small | Converts text into numbers the search can use |
| LLM | GPT-4o | Writes the final answer |
| Reranker | Cohere Rerank v3.5 | Picks the best 5 passages from the top 50 results |

---

## What I learned building this

### Chunking (splitting the PDFs into pieces)

Before searching, every PDF gets split into ~512-token chunks (roughly 2–3 paragraphs). Each chunk overlaps slightly with the next so concepts don't get cut off mid-sentence.

Why this size? Small enough that each chunk covers one idea. Big enough that the idea has enough context to be understood on its own.

### Hybrid search

Most beginner RAG tutorials use only one type of search — semantic (meaning-based). This one uses two:

- **Dense search** — finds passages with similar meaning, even if they use different words
- **Sparse search (BM25)** — finds exact keyword matches

Both matter for ATPL. Semantic search handles conceptual questions. BM25 handles exact terms like regulation numbers, altitudes, and ICAO codes that the exam tests verbatim.

### Reranking

After getting 50 candidates from search, a reranker reads each one alongside the question and re-scores them. This step catches passages that matched on surface words but aren't actually useful.

---

## What I dropped from my earlier (tutorial) version

| Old habit | Why I dropped it |
|---|---|
| LangChain | Hides what the code actually does. Hard to debug when results are wrong. |
| Firebase as a vector store | Firebase isn't built for this — it required scanning every document per query. Very slow and expensive. |
| Temperature 0.7 | ATPL exams test exact values. A "creative" LLM invents wrong numbers confidently. Switched to 0.1. |
| Passing all 20 results to the LLM | More context isn't always better. Noisy context makes answers worse. Now: retrieve 50, rerank to 5, send 5. |

---

## Setup

**You'll need:**
- Node.js 20+
- A free [Qdrant Cloud](https://cloud.qdrant.io) account
- An [OpenAI](https://platform.openai.com) API key
- A free [Cohere](https://cohere.com) API key

```bash
# 1. Clone and install
git clone https://github.com/bbm0r/atpl-companion.git
cd atpl-companion
npm install

# 2. Add your keys
cp .env.local.example .env.local
# Fill in OPENAI_API_KEY, QDRANT_URL, QDRANT_API_KEY, COHERE_API_KEY

# 3. Set up the database and ingest your PDFs
# Place your PDF files in ./pdfs/
npm run create-collection
npm run ingest

# 4. Run it
npm run dev
# → http://localhost:3000
```

**No PDFs?** Generate synthetic ATPL study material for testing:
```bash
npm run generate-pdfs
npm run ingest
```

---

## Project structure

```
atpl-companion/
├── scripts/
│   ├── create-collection.ts    # set up the Qdrant database
│   ├── ingest.ts               # load PDFs into the database
│   └── generate-synthetic-pdfs.ts
├── src/
│   ├── app/
│   │   ├── page.tsx            # the UI
│   │   └── api/ask/route.ts    # the search + answer logic
│   └── lib/
│       ├── chunker.ts          # splits PDFs into pieces
│       ├── embed.ts            # converts text to vectors
│       ├── qdrant.ts           # talks to the vector database
│       ├── rerank.ts           # re-scores search results
│       └── sparse.ts           # keyword search vectors
└── .env.local.example
```
