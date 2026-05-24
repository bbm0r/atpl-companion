"use client";

import { useState, useRef, useEffect } from "react";
import { SourcesPanel } from "@/components/SourcesPanel";
import type { Source, AskStreamEvent } from "@/types";

const PLACEHOLDER_QUESTIONS = [
  "What is the standard temperature at FL200?",
  "Explain the principles of the pitot-static system.",
  "What are the fuel requirements for IFR flight?",
  "Define coffin corner and the factors affecting it.",
];

export default function Home() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const answerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll answer into view as it streams
  useEffect(() => {
    if (answer && answerRef.current) {
      answerRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [answer]);

  async function handleAsk() {
    if (!question.trim() || loading) return;

    setLoading(true);
    setAnswer("");
    setSources([]);
    setError(null);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Request failed");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") break;

          const event: AskStreamEvent = JSON.parse(payload);
          if (event.type === "sources" && event.sources) {
            setSources(event.sources);
          } else if (event.type === "chunk" && event.content) {
            setAnswer((prev) => prev + event.content);
          } else if (event.type === "error") {
            throw new Error(event.message ?? "Stream error");
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  }

  return (
    <div className="min-h-screen bg-surface text-slate-200">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <span className="text-lg font-semibold tracking-tight text-white">
            ATPL Companion
          </span>
          <span className="rounded bg-accent/20 px-2 py-0.5 text-xs text-accent">
            v1
          </span>
          <span className="ml-auto text-xs text-slate-500">
            Hybrid RAG · GPT-4o · Qdrant
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Input area */}
        <div className="mb-8 rounded-xl border border-border bg-panel p-4">
          <textarea
            ref={textareaRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask an ATPL question… (Enter to send, Shift+Enter for newline)"
            className="w-full resize-none bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
            rows={3}
            disabled={loading}
          />
          <div className="mt-3 flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {PLACEHOLDER_QUESTIONS.slice(0, 2).map((q) => (
                <button
                  key={q}
                  onClick={() => setQuestion(q)}
                  className="rounded-md bg-surface px-2 py-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {q.length > 40 ? q.slice(0, 40) + "…" : q}
                </button>
              ))}
            </div>
            <button
              onClick={handleAsk}
              disabled={!question.trim() || loading}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-40 hover:opacity-90"
            >
              {loading ? "Thinking…" : "Ask"}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Answer + Sources grid */}
        {(answer || sources.length > 0 || loading) && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
            {/* Answer panel */}
            <div className="rounded-xl border border-border bg-panel p-6">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Answer
              </h2>
              {loading && !answer && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent" />
                  Retrieving context…
                </div>
              )}
              <div
                ref={answerRef}
                className="answer-prose whitespace-pre-wrap text-sm leading-relaxed text-slate-200"
              >
                {answer}
                {loading && answer && (
                  <span className="inline-block h-4 w-0.5 animate-pulse bg-accent align-middle ml-0.5" />
                )}
              </div>
            </div>

            {/* Sources panel */}
            <SourcesPanel sources={sources} />
          </div>
        )}

        {/* Empty state */}
        {!answer && !loading && !error && (
          <div className="mt-16 text-center">
            <p className="text-sm text-slate-500">
              Ask any ATPL question — meteorology, navigation, AGK, POF, radio comms, human performance.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {PLACEHOLDER_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => setQuestion(q)}
                  className="rounded-lg border border-border bg-panel px-3 py-2 text-xs text-slate-400 hover:border-accent/50 hover:text-slate-200 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
