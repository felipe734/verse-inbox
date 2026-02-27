"use client";

import { useState } from "react";

export function InternalNoteForm({ conversationId }: { conversationId: string }) {
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setBody("");
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
      <input
        type="text"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add internal note (e.g. @Team - ...)"
        className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || !body.trim()}
        className="rounded bg-slate-600 px-3 py-1 text-sm text-white hover:bg-slate-500 disabled:opacity-50"
      >
        Add note
      </button>
    </form>
  );
}
