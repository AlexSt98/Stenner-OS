import { useNavigate } from 'react-router-dom';
import { ArrowRight, Image as ImageIcon } from 'lucide-react';
import { useStore } from '../../store/useStore';

export function IdeasWidget() {
  const navigate = useNavigate();
  const ideas = useStore((s) => s.ideas);

  return (
    <div className="stenner-card p-4">
      <div className="flex items-center mb-3.5">
        <h2 className="text-[12.5px] font-bold tracking-wide text-zinc-300">IDEAS VAULT</h2>
        <button
          onClick={() => navigate('/ideas')}
          className="ml-auto flex items-center gap-1 text-[11.5px] text-zinc-500 hover:text-white font-medium"
        >
          View all <ArrowRight size={11} />
        </button>
      </div>
      <div className="space-y-2">
        {ideas.slice(0, 3).map((idea) => (
          <button
            key={idea.id}
            onClick={() => navigate('/ideas')}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.04] text-left transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-yellow-500/20 to-pink-500/20 flex items-center justify-center shrink-0">
              {idea.imageUrl ? (
                <img src={idea.imageUrl} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <ImageIcon size={14} className="text-yellow-400/70" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-medium truncate">{idea.title}</div>
              <div className="flex items-center gap-1 mt-1">
                {idea.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.05] text-zinc-400">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </button>
        ))}
        {ideas.length === 0 && <div className="text-[12.5px] text-zinc-500 py-4 text-center">No ideas yet.</div>}
      </div>
    </div>
  );
}
