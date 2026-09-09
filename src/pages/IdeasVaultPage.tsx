import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Button } from '../components/common/Button';
import { IdeaCard } from '../components/ideas/IdeaCard';
import { IdeaFormModal } from '../components/ideas/IdeaFormModal';
import type { Idea } from '../types';

export function IdeasVaultPage() {
  const ideas = useStore((s) => s.ideas);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Idea | null>(null);

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold">Ideas Vault</h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">Capture everything. Turn the good ones into tasks, projects or board items.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
          <Plus size={14} /> New idea
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {ideas.map((idea) => (
          <IdeaCard key={idea.id} idea={idea} onEdit={setEditing} />
        ))}
      </div>

      {ideas.length === 0 && (
        <div className="stenner-card py-16 text-center text-zinc-500 text-[13px]">
          The vault is empty. <button onClick={() => setCreating(true)} className="text-violet-400 hover:underline">Add your first idea</button>
        </div>
      )}

      <IdeaFormModal open={creating} onClose={() => setCreating(false)} />
      <IdeaFormModal open={!!editing} onClose={() => setEditing(null)} idea={editing} />
    </div>
  );
}
