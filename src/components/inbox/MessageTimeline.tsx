function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function StatusIcon({ status }: { status: string | null }) {
  if (!status) return null;
  if (status === "read") return <span className="text-blue-500" title="Read">✓✓</span>;
  if (status === "delivered") return <span className="text-slate-400" title="Delivered">✓✓</span>;
  if (status === "sent") return <span className="text-slate-400" title="Sent">✓</span>;
  if (status === "failed") return <span className="text-red-500" title="Failed">✗</span>;
  return null;
}

export function MessageTimeline({
  messages,
  notes,
}: {
  messages: { id: string; direction: string; text: string | null; status: string | null; timestamp: string }[];
  notes: { id: string; body: string; created_at: string; author_name: string | null }[];
}) {
  type Item = { type: "message"; id: string; direction: string; text: string | null; status: string | null; timestamp: string } | { type: "note"; id: string; body: string; created_at: string; author_name: string | null };
  const items: Item[] = [
    ...messages.map((m) => ({ type: "message" as const, ...m })),
    ...notes.map((n) => ({ type: "note" as const, ...n })),
  ].sort((a, b) => new Date(a.type === "message" ? a.timestamp : a.type === "note" ? a.created_at : "").getTime() - new Date(b.type === "message" ? b.timestamp : b.type === "note" ? b.created_at : "").getTime());

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {items.map((item) => {
        if (item.type === "note") {
          return (
            <div key={`note-${item.id}`} className="flex justify-center">
              <div className="rounded-lg bg-slate-200 px-3 py-2 text-sm text-slate-700 max-w-[85%]">
                <span className="font-medium text-slate-600">@{item.author_name ?? "Team"}</span> {item.body}
                <div className="text-xs text-slate-500 mt-1">{formatTime(item.created_at)}</div>
              </div>
            </div>
          );
        }
        const isOut = item.direction === "out";
        return (
          <div key={item.id} className={`flex ${isOut ? "justify-end" : "justify-start"}`}>
            <div className={`rounded-lg px-3 py-2 max-w-[85%] ${isOut ? "bg-green-100 text-slate-900" : "bg-slate-200 text-slate-900"}`}>
              <p className="text-sm whitespace-pre-wrap">{item.text ?? "—"}</p>
              <div className="flex items-center justify-end gap-1 mt-1 text-xs text-slate-500">
                {formatTime(item.timestamp)}
                {isOut && <StatusIcon status={item.status} />}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
