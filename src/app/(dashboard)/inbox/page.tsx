import { getConversations, getTeams } from "@/lib/inbox/queries";
import { Sidebar } from "@/components/inbox/Sidebar";
import { ConversationList } from "@/components/inbox/ConversationList";
import type { ConversationRow } from "@/lib/inbox/queries";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

type SearchParams = { filter?: string; teamId?: string };

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();
  const userEmail = session?.user?.email;
  if (!userEmail) {
    redirect("/login");
  }

  const { filter = "all", teamId } = await searchParams;
  const filterVal = (filter === "mine" || filter === "unassigned" || filter === "team" ? filter : "all") as "all" | "mine" | "unassigned" | "team";

  let conversations: ConversationRow[] = [];
  let teams: { id: string; name: string; slug: string }[] = [];
  try {
    [conversations, teams] = await Promise.all([
      getConversations(filterVal, userEmail, filterVal === "team" ? teamId : undefined),
      getTeams(),
    ]);
  } catch (err) {
    console.error("[inbox] load error:", err);
  }

  return (
    <>
      <Sidebar filter={filterVal} teamId={teamId} teams={teams} />
      <ConversationList conversations={conversations} currentId={null} filter={filterVal} teamId={teamId} />
      <div className="flex-1 flex items-center justify-center bg-slate-100 text-slate-500">
        Select a conversation
      </div>
    </>
  );
}
