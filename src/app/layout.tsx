import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ATPL Companion",
  description: "RAG-powered ATPL study assistant",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
