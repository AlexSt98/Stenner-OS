import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import type { NexusConversation } from '../../types/nexus';
import { timeAgo } from '../../lib/date';

interface ConversationSidebarProps {
  conversations: NexusConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export function ConversationSidebar({ conversations, activeId, onSelect, onNew, onDelete }: ConversationSidebarProps) {
  return (
    <div className="stenner-card p-3 flex flex-col h-full">
      <button
        onClick={onNew}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[12.5px] font-semibold transition-colors mb-3"
      >
        <Plus size={14} /> New conversation
      </button>

      <div className="text-[10.5px] font-bold tracking-wide text-zinc-600 px-1 mb-1.5">RECENT</div>
      <div className="flex-1 overflow-y-auto space-y-0.5">
        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`group w-full flex items-start gap-2 px-2.5 py-2 rounded-lg text-left transition-colors ${
              activeId === c.id ? 'bg-violet-600/15 border border-violet-500/20' : 'hover:bg-white/[0.05] border border-transparent'
            }`}
          >
            <MessageSquare size={13} className="text-zinc-500 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-medium text-zinc-200 truncate">{c.title}</div>
              <div className="text-[10.5px] text-zinc-600">{timeAgo(c.updatedAt)}</div>
            </div>
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(c.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded text-zinc-600 hover:text-red-400 shrink-0"
            >
              <Trash2 size={12} />
            </span>
          </button>
        ))}
        {conversations.length === 0 && <div className="text-[12px] text-zinc-600 px-2 py-4 text-center">No conversations yet.</div>}
      </div>
    </div>
  );
}
