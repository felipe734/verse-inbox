import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type ConversationRow = {
  id: string;
  lead_id: string;
  phone: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  assigned_to_id: string | null;
  assigned_to_name: string | null;
  tag_ids: string[];
  tag_names: string[];
};

export async function getConversations(
  filter: "all" | "mine" | "unassigned" | "team",
  userEmail: string,
  teamId?: string
): Promise<ConversationRow[]> {
  const supabase = createSupabaseAdminClient();

  const { data: userData } = await supabase.from("users").select("id").eq("email", userEmail).maybeSingle();
  const userId = userData?.id ?? null;

  const { data: convs, error: convError } = await supabase
    .from("conversations")
    .select(
      "id, lead_id, last_message_at, leads!inner(phone), conversation_assignments(user_id, users(name))"
    )
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (convError || !convs) return [];

  type ConvRow = {
    id: string;
    lead_id: string;
    last_message_at: string | null;
    leads: { phone: string } | { phone: string }[];
    conversation_assignments: Array<{ user_id: string | null; users: { name: string | null } | null }> | null;
  };
  let filtered = convs as unknown as ConvRow[];
  const getPhone = (r: ConvRow) => (Array.isArray(r.leads) ? r.leads[0]?.phone : r.leads?.phone) ?? "";
  const getAssignment = (r: ConvRow) => r.conversation_assignments?.[0];

  if (filter === "mine") {
    if (!userId) return [];
    filtered = filtered.filter((c) => getAssignment(c)?.user_id === userId);
  } else if (filter === "unassigned") {
    filtered = filtered.filter((c) => !getAssignment(c)?.user_id);
  } else if (filter === "team" && teamId) {
    const { data: tm } = await supabase
      .from("team_members")
      .select("user_id")
      .eq("team_id", teamId);
    const teamUserIds = new Set((tm ?? []).map((r) => r.user_id));
    filtered = filtered.filter((c) => teamUserIds.has(getAssignment(c)?.user_id ?? ""));
  }

  const ids = filtered.map((c) => c.id);
  if (ids.length === 0) return [];

  const [messagesRes, tagsRes] = await Promise.all([
    supabase.from("messages").select("conversation_id, text").in("conversation_id", ids).order("timestamp", { ascending: false }),
    supabase.from("conversation_tags").select("conversation_id, tags(id, name)").in("conversation_id", ids),
  ]);

  const latestByConv = new Map<string, string>();
  for (const m of messagesRes.data ?? []) {
    const cid = (m as { conversation_id: string }).conversation_id;
    if (!latestByConv.has(cid))
      latestByConv.set(cid, (m as { text: string | null }).text ?? "");
  }
  const tagsByConv = new Map<string, { id: string; name: string }[]>();
  for (const t of tagsRes.data ?? []) {
    const row = t as { conversation_id: string; tags: { id: string; name: string } | { id: string; name: string }[] | null };
    const tags = row.tags == null ? [] : Array.isArray(row.tags) ? row.tags : [row.tags];
    for (const tag of tags) {
      const arr = tagsByConv.get(row.conversation_id) ?? [];
      arr.push(tag);
      tagsByConv.set(row.conversation_id, arr);
    }
  }

  return filtered.map((c) => {
    const assignment = getAssignment(c);
    return {
      id: c.id,
      lead_id: c.lead_id,
      phone: getPhone(c),
      last_message_at: c.last_message_at,
      last_message_preview: latestByConv.get(c.id) ?? null,
      assigned_to_id: assignment?.user_id ?? null,
      assigned_to_name: assignment?.users?.name ?? null,
      tag_ids: (tagsByConv.get(c.id) ?? []).map((x) => x.id),
      tag_names: (tagsByConv.get(c.id) ?? []).map((x) => x.name),
    };
  });
}

export async function getAllTags(): Promise<{ id: string; name: string; slug: string; color: string | null }[]> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from("tags").select("id, name, slug, color").order("name");
  return data ?? [];
}

export async function getTeams(): Promise<{ id: string; name: string; slug: string }[]> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from("teams").select("id, name, slug").order("name");
  return data ?? [];
}

export async function getConversationDetail(conversationId: string) {
  const supabase = createSupabaseAdminClient();

  const { data: conv, error: convError } = await supabase
    .from("conversations")
    .select("id, lead_id, wa_id, last_message_at, leads(phone), conversation_assignments(user_id, users(name))")
    .eq("id", conversationId)
    .single();

  if (convError || !conv) return null;

  const c = conv as unknown as {
    id: string;
    lead_id: string;
    wa_id: string;
    last_message_at: string | null;
    leads: { phone: string } | { phone: string }[] | null;
    conversation_assignments: Array<{ user_id: string | null; users: { name: string | null } | null }> | null;
  };
  const phone = c.leads ? (Array.isArray(c.leads) ? c.leads[0]?.phone : c.leads.phone) ?? "" : "";

  const [tagsRes, messagesRes, notesRes, usersRes] = await Promise.all([
    supabase.from("conversation_tags").select("tags(id, name, slug, color)").eq("conversation_id", conversationId),
    supabase.from("messages").select("id, direction, text, status, timestamp").eq("conversation_id", conversationId).order("timestamp"),
    supabase.from("internal_notes").select("id, body, created_at, users(name)").eq("conversation_id", conversationId).order("created_at"),
    supabase.from("users").select("id, name, email").order("name"),
  ]);

  const assignment = c.conversation_assignments?.[0];
  return {
    conversation: {
      id: c.id,
      lead_id: c.lead_id,
      wa_id: c.wa_id,
      phone,
      last_message_at: c.last_message_at,
      assigned_to_id: assignment?.user_id ?? null,
      assigned_to_name: assignment?.users?.name ?? null,
    },
    tags: (tagsRes.data ?? []).flatMap((r) => {
      const t = (r as { tags: { id: string; name: string; slug: string; color: string | null } | { id: string; name: string; slug: string; color: string | null }[] | null }).tags;
      return t == null ? [] : Array.isArray(t) ? t : [t];
    }),
    messages: messagesRes.data ?? [],
    notes: (notesRes.data ?? []).map((n) => {
      const row = n as unknown as { id: string; body: string; created_at: string; users: { name: string | null } | { name: string | null }[] | null };
      const u = row.users;
      const authorName = u == null ? null : Array.isArray(u) ? u[0]?.name ?? null : u.name ?? null;
      return { id: row.id, body: row.body, created_at: row.created_at, author_name: authorName };
    }),
    users: usersRes.data ?? [],
  };
}
