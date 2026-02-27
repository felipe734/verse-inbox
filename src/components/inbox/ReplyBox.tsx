"use client";

import { useState } from "react";

export function ReplyBox({ conversationId }: { conversationId: string }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/send/wa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, text: text.trim() }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Send failed");
        return;
      }
      setText("");
      window.location.reload();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-3 border-t border-slate-200 bg-white">
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message (WhatsApp)"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </form>
  );
}
