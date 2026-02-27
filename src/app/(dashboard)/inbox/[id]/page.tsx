import { getConversations, getConversationDetail, getTeams, getAllTags } from "@/lib/inbox/queries";
import { Sidebar } from "@/components/inbox/Sidebar";
import { ConversationList } from "@/components/inbox/ConversationList";
import { ConversationDetail } from "@/components/inbox/ConversationDetail";
import { notFound, redirect } from "next/navigation";
import type { ConversationRow } from "@/lib/inbox/queries";
import { getSession } from "@/lib/auth";

type SearchParams = { filter?: string; teamId?: string };

export default async function InboxConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();
  const userEmail = session?.user?.email;
  if (!userEmail) {
    redirect("/login");
  }

  const { id } = await params;
  const { filter = "all", teamId } = await searchParams;
  const filterVal = (filter === "mine" || filter === "unassigned" || filter === "team" ? filter : "all") as "all" | "mine" | "unassigned" | "team";

  let conversations: ConversationRow[] = [];
  let teams: { id: string; name: string; slug: string }[] = [];
  let allTags: { id: string; name: string }[] = [];
  let detail: Awaited<ReturnType<typeof getConversationDetail>> = null;
  try {
    [conversations, detail, teams, allTags] = await Promise.all([
      getConversations(filterVal, userEmail, filterVal === "team" ? teamId : undefined),
      getConversationDetail(id),
      getTeams(),
      getAllTags(),
    ]);
  } catch (err) {
    console.error("[inbox/[id]] load error:", err);
  }

  if (!detail) notFound();

  return (
    <>
      <Sidebar filter={filterVal} teamId={teamId} teams={teams} />
      <ConversationList conversations={conversations} currentId={id} filter={filterVal} teamId={teamId} />
      <ConversationDetail
        conversationId={detail.conversation.id}
        phone={detail.conversation.phone}
        assignedToId={detail.conversation.assigned_to_id}
        assignedToName={detail.conversation.assigned_to_name}
        tags={detail.tags}
        allTags={allTags}
        users={detail.users}
        messages={detail.messages}
        notes={detail.notes}
      />
    </>
  );
}
