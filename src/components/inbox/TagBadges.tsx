"use client";

import { useState } from "react";

type Tag = { id: string; name: string; slug: string; color: string | null };

export function TagBadges({
  conversationId,
  currentTags,
  allTags,
}: {
  conversationId: string;
  currentTags: Tag[];
  allTags: Tag[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const currentIds = new Set(currentTags.map((t) => t.id));

  async function toggleTag(tagId: string) {
    setLoading(true);
    const next = currentIds.has(tagId) ? currentTags.filter((t) => t.id !== tagId).map((t) => t.id) : [...currentTags.map((t) => t.id), tagId];
    try {
      await fetch(`/api/conversations/${conversationId}/tags`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagIds: next }),
      });
      setOpen(false);
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {currentTags.map((t) => (
        <span
          key={t.id}
          className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium text-white"
          style={{ backgroundColor: t.color ?? "#64748b" }}
        >
          {t.name}
        </span>
      ))}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          disabled={loading}
          className="rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-50"
        >
          + Tag
        </button>
        {open && (
          <div className="absolute top-full left-0 mt-1 rounded border border-slate-200 bg-white shadow-lg z-10 py-1 min-w-[120px]">
            {allTags.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTag(t.id)}
                className="block w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50"
              >
                {t.name} {currentIds.has(t.id) ? "✓" : ""}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
