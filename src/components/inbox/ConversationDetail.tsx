import { MessageTimeline } from "./MessageTimeline";
import { ReplyBox } from "./ReplyBox";
import { AssigneeSelect } from "./AssigneeSelect";
import { TagBadges } from "./TagBadges";
import { InternalNoteForm } from "./InternalNoteForm";

type Tag = { id: string; name: string; slug: string; color: string | null };
type User = { id: string; name: string | null; email: string };

export function ConversationDetail({
  conversationId,
  phone,
  assignedToId,
  assignedToName,
  tags,
  allTags,
  users,
  messages,
  notes,
}: {
  conversationId: string;
  phone: string;
  assignedToId: string | null;
  assignedToName: string | null;
  tags: Tag[];
  allTags: Tag[];
  users: User[];
  messages: { id: string; direction: string; text: string | null; status: string | null; timestamp: string }[];
  notes: { id: string; body: string; created_at: string; author_name: string | null }[];
}) {
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="font-semibold text-slate-900">{phone}</h3>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-slate-600">Assign:</span>
            <AssigneeSelect
              conversationId={conversationId}
              currentUserId={assignedToId}
              currentName={assignedToName}
              users={users}
            />
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <TagBadges conversationId={conversationId} currentTags={tags} allTags={allTags} />
        </div>
        <InternalNoteForm conversationId={conversationId} />
      </header>
      <MessageTimeline messages={messages} notes={notes} />
      <ReplyBox conversationId={conversationId} />
    </div>
  );
}
