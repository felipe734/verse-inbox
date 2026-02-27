"use client";

import Link from "next/link";

type Filter = "all" | "mine" | "unassigned" | "team";
type Team = { id: string; name: string; slug: string };

export function Sidebar({
  filter,
  teamId,
  teams,
}: {
  filter: Filter;
  teamId?: string;
  teams: Team[];
}) {
  const base = "/inbox";
  const filterHref = (f: Filter, tid?: string) => {
    if (f === "team" && tid) return `${base}?filter=team&teamId=${tid}`;
    return `${base}?filter=${f}`;
  };

  return (
    <aside className="w-56 shrink-0 border-r border-slate-200 bg-white flex flex-col">
      <div className="p-3 border-b border-slate-100">
        <h2 className="font-semibold text-slate-800">Verse Inbox</h2>
      </div>
      <nav className="p-2 flex flex-col gap-0.5">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider px-2 py-1">Filters</span>
        <Link
          href={filterHref("all")}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            filter === "all" && !teamId ? "bg-slate-200 text-slate-900" : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          All
        </Link>
        <Link
          href={filterHref("mine")}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            filter === "mine" ? "bg-slate-200 text-slate-900" : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          Mine
        </Link>
        <Link
          href={filterHref("unassigned")}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            filter === "unassigned" ? "bg-slate-200 text-slate-900" : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          Unassigned
        </Link>
      </nav>
      {teams.length > 0 && (
        <>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider px-2 py-1 mt-2">Teams</span>
          {teams.map((t) => (
            <Link
              key={t.id}
              href={filterHref("team", t.id)}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                filter === "team" && teamId === t.id ? "bg-slate-200 text-slate-900" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {t.name}
            </Link>
          ))}
        </>
      )}
      <div className="mt-auto p-2">
        <Link
          href="/api/auth/signout"
          className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
        >
          Sign out
        </Link>
      </div>
    </aside>
  );
}
