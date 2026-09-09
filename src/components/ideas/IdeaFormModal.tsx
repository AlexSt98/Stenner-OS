import { useEffect, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Label, TextInput, TextArea } from '../common/Fields';
import { Button } from '../common/Button';
import { useStore } from '../../store/useStore';
import type { Idea } from '../../types';

interface IdeaFormModalProps {
  open: boolean;
  onClose: () => void;
  idea?: Idea | null;
}

export function IdeaFormModal({ open, onClose, idea }: IdeaFormModalProps) {
  const addIdea = useStore((s) => s.addIdea);
  const updateIdea = useStore((s) => s.updateIdea);
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [url, setUrl] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (idea) {
      setTitle(idea.title);
      setDescription(idea.description);
      setTags(idea.tags.join(', '));
      setUrl(idea.url ?? '');
      setImageUrl(idea.imageUrl ?? null);
    } else {
      setTitle('');
      setDescription('');
      setTags('');
      setUrl('');
      setImageUrl(null);
    }
  }, [open, idea]);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const submit = () => {
    if (!title.trim()) return;
    const payload = {
      title: title.trim(),
      description,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      url: url || null,
      imageUrl,
    };
    if (idea) {
      updateIdea(idea.id, payload);
    } else {
      addIdea(payload);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={idea ? 'Edit idea' : 'New idea'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={!title.trim()}>
            {idea ? 'Save changes' : 'Save to vault'}
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <div>
          <Label>Title</Label>
          <TextInput autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Concepto para merch" />
        </div>
        <div>
          <Label>Description</Label>
          <TextArea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <Label>Reference URL (optional)</Label>
          <TextInput value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
        </div>
        <div>
          <Label>Tags (comma separated)</Label>
          <TextInput value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Merch, Ideas" />
        </div>
        <div>
          <Label>Image (optional)</Label>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
          {imageUrl ? (
            <div className="relative w-full h-32 rounded-lg overflow-hidden border border-white/10">
              <img src={imageUrl} className="w-full h-full object-cover" />
              <button
                onClick={() => setImageUrl(null)}
                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full h-20 rounded-lg border border-dashed border-white/15 flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-300 hover:border-white/25 transition-colors"
            >
              <ImagePlus size={15} /> <span className="text-[12.5px]">Click to add a reference image</span>
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
