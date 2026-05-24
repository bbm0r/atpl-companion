export interface ChunkPayload {
  source: string;
  page: number;
  chunkIndex: number;
  text: string;
  [key: string]: unknown; // satisfies Qdrant's Record<string, unknown> payload constraint
}

export interface RetrievedChunk {
  id: string;
  score: number;
  payload: ChunkPayload;
}

export interface Source {
  source: string;
  page: number;
  text: string;
}

export interface AskRequest {
  question: string;
}

export interface AskStreamEvent {
  type: "chunk" | "sources" | "error";
  content?: string;
  sources?: Source[];
  message?: string;
}
