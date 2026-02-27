"use client";

import { useState } from "react";

type User = { id: string; name: string | null; email: string };

export function AssigneeSelect({
  conversationId,
  currentUserId,
  users,
}: {
  conversationId: string;
  currentUserId: string | null;
  currentName?: string | null;
  users: User[];
}) {
  const [value, setValue] = useState<string>(currentUserId ?? "");
  const [loading, setLoading] = useState(false);

  async function handleChange(userId: string) {
    setValue(userId);
    setLoading(true);
    try {
      await fetch(`/api/conversations/${conversationId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId || null }),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <select
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      disabled={loading}
      className="rounded border border-slate-300 px-2 py-1 text-sm"
    >
      <option value="">Unassigned</option>
      {users.map((u) => (
        <option key={u.id} value={u.id}>
          {u.name || u.email}
        </option>
      ))}
    </select>
  );
}
