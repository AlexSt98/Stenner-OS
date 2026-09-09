import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Pencil, Trash2, CheckSquare, FolderKanban, LayoutGrid, Link2, ImageIcon } from 'lucide-react';
import type { Idea } from '../../types';
import { useStore } from '../../store/useStore';
import { useToastStore } from '../../store/useToastStore';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import { fmtDateShort } from '../../lib/date';

interface IdeaCardProps {
  idea: Idea;
  onEdit: (idea: Idea) => void;
}

export function IdeaCard({ idea, onEdit }: IdeaCardProps) {
  const navigate = useNavigate();
  const deleteIdea = useStore((s) => s.deleteIdea);
  const convertIdeaToTask = useStore((s) => s.convertIdeaToTask);
  const convertIdeaToProject = useStore((s) => s.convertIdeaToProject);
  const convertIdeaToBoardItem = useStore((s) => s.convertIdeaToBoardItem);
  const boards = useStore((s) => s.boards);
  const pushToast = useToastStore((s) => s.push);
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setMenuOpen(false));

  return (
    <div className="stenner-card stenner-card-hover p-3.5 flex flex-col">
      <div className="w-full h-28 rounded-lg bg-gradient-to-br from-yellow-500/15 to-pink-500/15 flex items-center justify-center overflow-hidden mb-3">
        {idea.imageUrl ? (
          <img src={idea.imageUrl} className="w-full h-full object-cover" />
        ) : (
          <ImageIcon size={22} className="text-yellow-400/50" />
        )}
      </div>

      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-semibold truncate">{idea.title}</div>
          <div className="text-[11.5px] text-zinc-500 mt-0.5">{fmtDateShort(idea.date)}</div>
        </div>
        <div className="relative shrink-0" ref={ref}>
          <button onClick={() => setMenuOpen((v) => !v)} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06]">
            <MoreHorizontal size={15} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-52 stenner-card shadow-2xl z-20 p-1.5 animate-stenner-fade-in">
              <button
                onClick={() => {
                  onEdit(idea);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-white/[0.06] text-[12.5px] text-zinc-200 text-left"
              >
                <Pencil size={13} /> Edit
              </button>
              <button
                onClick={() => {
                  const task = convertIdeaToTask(idea.id);
                  pushToast('Converted to task');
                  setMenuOpen(false);
                  void task;
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-white/[0.06] text-[12.5px] text-zinc-200 text-left"
              >
                <CheckSquare size={13} className="text-blue-400" /> Convert to task
              </button>
              <button
                onClick={() => {
                  convertIdeaToProject(idea.id);
                  pushToast('Converted to project');
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-white/[0.06] text-[12.5px] text-zinc-200 text-left"
              >
                <FolderKanban size={13} className="text-violet-400" /> Convert to project
              </button>
              <button
                onClick={() => {
                  const boardId = boards[0]?.id;
                  if (boardId) {
                    convertIdeaToBoardItem(idea.id, boardId);
                    pushToast('Added to board');
                    navigate(`/boards/${boardId}`);
                  }
                  setMenuOpen(false);
                }}
                disabled={boards.length === 0}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-white/[0.06] text-[12.5px] text-zinc-200 text-left disabled:opacity-40"
              >
                <LayoutGrid size={13} className="text-pink-400" /> Convert to board item
              </button>
              <div className="h-px bg-white/10 my-1" />
              <button
                onClick={() => {
                  deleteIdea(idea.id);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-red-500/10 text-[12.5px] text-red-400 text-left"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {idea.description && <p className="text-[12px] text-zinc-500 mt-2 line-clamp-2">{idea.description}</p>}

      <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
        {idea.tags.map((t) => (
          <span key={t} className="text-[10.5px] px-1.5 py-0.5 rounded bg-white/[0.05] text-zinc-400 border border-white/10">
            {t}
          </span>
        ))}
      </div>

      {idea.url && (
        <a href={idea.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11.5px] text-violet-400 hover:text-violet-300 mt-2.5">
          <Link2 size={11} /> Reference link
        </a>
      )}

      {idea.convertedTo && (
        <div className="text-[10.5px] text-green-400/80 mt-2 font-medium">
          ✓ Converted to {idea.convertedTo.type}
        </div>
      )}
    </div>
  );
}
