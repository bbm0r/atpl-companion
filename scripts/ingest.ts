/**
 * Ingestion pipeline: PDF files → chunks → embeddings → Qdrant
 *
 * Usage:
 *   1. Place PDFs in ./pdfs/
 *   2. npm run create-collection   (one-time)
 *   3. npm run ingest
 *
 * Outputs:
 *   - ./docs/vocab.json   (token→index map for sparse vectors)
 *   - ./docs/idf.json     (token→IDF weight)
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "fs";
import path from "path";
import crypto from "crypto";
import pdfParse from "pdf-parse";
import { chunkText } from "../src/lib/chunker";
import { embedTexts } from "../src/lib/embed";
import { upsertChunks, COLLECTION } from "../src/lib/qdrant";
import { buildDocSparse } from "../src/lib/sparse";
import type { ChunkPayload } from "../src/types";

const PDF_DIR = path.join(process.cwd(), "pdfs");
const DOCS_DIR = path.join(process.cwd(), "docs");
const BATCH_SIZE = 64;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function buildVocabAndIDF(allChunkTexts: string[]): {
  vocab: Record<string, number>;
  idf: Record<string, number>;
} {
  const df: Record<string, number> = {};
  const N = allChunkTexts.length;

  for (const text of allChunkTexts) {
    for (const t of Array.from(new Set(tokenize(text)))) df[t] = (df[t] ?? 0) + 1;
  }

  const vocab: Record<string, number> = {};
  const idf: Record<string, number> = {};
  let idx = 0;

  for (const [token, count] of Object.entries(df)) {
    if (count < 2) continue;
    vocab[token] = idx++;
    idf[token] = Math.log((N + 1) / (count + 1)) + 1;
  }

  return { vocab, idf };
}

type RawChunk = { source: string; page: number; chunkIndex: number; text: string };

async function main() {
  const pdfFiles = fs.readdirSync(PDF_DIR).filter((f) => f.endsWith(".pdf"));

  if (pdfFiles.length === 0) {
    console.error("No PDFs found in ./pdfs/ — add your ATPL study PDFs there.");
    process.exit(1);
  }

  console.log(`Found ${pdfFiles.length} PDF(s): ${pdfFiles.join(", ")}`);

  const rawChunks: RawChunk[] = [];

  // Step 1: extract text per page
  for (const file of pdfFiles) {
    const filePath = path.join(PDF_DIR, file);
    const source = path.basename(file, ".pdf");
    const buffer = fs.readFileSync(filePath);

    console.log(`\nParsing ${file}…`);

    const pageTexts: string[] = [];
    await pdfParse(buffer, {
      pagerender: (pageData: any) => {
        return pageData.getTextContent().then((content: any) => {
          const text = content.items.map((item: any) => item.str).join(" ").trim();
          pageTexts.push(text);
          return text;
        });
      },
    });

    for (let pageIdx = 0; pageIdx < pageTexts.length; pageIdx++) {
      const pageText = pageTexts[pageIdx];
      if (!pageText || pageText.length < 50) continue;

      const chunks = chunkText(pageText);
      for (let ci = 0; ci < chunks.length; ci++) {
        rawChunks.push({ source, page: pageIdx + 1, chunkIndex: ci, text: chunks[ci] });
      }
    }

    console.log(`  → ${pageTexts.length} pages, ${rawChunks.filter(c => c.source === source).length} chunks`);
  }

  console.log(`\nTotal chunks: ${rawChunks.length}`);

  // Step 2: build vocabulary and IDF
  console.log("Building vocabulary & IDF…");
  const { vocab, idf } = buildVocabAndIDF(rawChunks.map((c) => c.text));
  fs.mkdirSync(DOCS_DIR, { recursive: true });
  fs.writeFileSync(path.join(DOCS_DIR, "vocab.json"), JSON.stringify(vocab));
  fs.writeFileSync(path.join(DOCS_DIR, "idf.json"), JSON.stringify(idf));
  console.log(`  → Vocabulary size: ${Object.keys(vocab).length} terms`);

  // Step 3: embed in batches and upsert
  console.log("Embedding and upserting…");
  let processed = 0;

  for (let i = 0; i < rawChunks.length; i += BATCH_SIZE) {
    const batch = rawChunks.slice(i, i + BATCH_SIZE);
    const embeddings = await embedTexts(batch.map((c) => c.text));

    const points = batch.map((chunk, j) => {
      const hash = crypto
        .createHash("sha1")
        .update(`${chunk.source}:${chunk.page}:${chunk.chunkIndex}`)
        .digest("hex");
      // Format as UUID (8-4-4-4-12 from first 32 hex chars of SHA1)
      const id = `${hash.slice(0,8)}-${hash.slice(8,12)}-${hash.slice(12,16)}-${hash.slice(16,20)}-${hash.slice(20,32)}`;

      const sparse = buildDocSparse(chunk.text, vocab, idf);

      const payload: ChunkPayload = {
        source: chunk.source,
        page: chunk.page,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
      };

      return { id, dense: embeddings[j], sparse, payload };
    });

    await upsertChunks(points);
    processed += batch.length;
    process.stdout.write(`\r  ${processed}/${rawChunks.length} chunks upserted…`);
  }

  console.log(`\n\nDone! Collection "${COLLECTION}" is ready.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
