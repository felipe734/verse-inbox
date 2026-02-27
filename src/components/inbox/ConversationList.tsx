import Link from "next/link";
import type { ConversationRow } from "@/lib/inbox/queries";

function formatDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 24 * 60 * 60 * 1000) return "Today";
  if (diff < 2 * 24 * 60 * 60 * 1000) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function inboxHref(conversationId: string, filter?: string, teamId?: string) {
  const params = new URLSearchParams();
  if (filter && filter !== "all") params.set("filter", filter);
  if (teamId) params.set("teamId", teamId);
  const q = params.toString();
  return q ? `/inbox/${conversationId}?${q}` : `/inbox/${conversationId}`;
}

export function ConversationList({
  conversations,
  currentId,
  filter,
  teamId,
}: {
  conversations: ConversationRow[];
  currentId: string | null;
  filter?: string;
  teamId?: string;
}) {
  return (
    <div className="w-80 shrink-0 border-r border-slate-200 bg-white flex flex-col overflow-hidden">
      <div className="p-2 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700">Chats</h3>
      </div>
      <ul className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <li className="p-4 text-sm text-slate-500">No conversations</li>
        ) : (
          conversations.map((c) => (
            <li key={c.id}>
              <Link
                href={inboxHref(c.id, filter, teamId)}
                className={`block border-b border-slate-50 p-3 hover:bg-slate-50 ${
                  currentId === c.id ? "bg-slate-100" : ""
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center text-slate-600 text-sm font-medium shrink-0">
                    {c.phone.slice(-2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-medium text-slate-900 truncate">{c.phone}</span>
                      <span className="text-xs text-slate-500 shrink-0">{formatDate(c.last_message_at)}</span>
                    </div>
                    <p className="text-sm text-slate-600 truncate mt-0.5">
                      {c.last_message_preview || "—"}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {c.tag_names.slice(0, 2).map((name) => (
                        <span
                          key={name}
                          className="inline-block px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-800"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
