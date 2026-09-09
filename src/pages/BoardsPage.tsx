import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Type, StickyNote, ImagePlus, LayoutTemplate, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { BoardItemView } from '../components/boards/BoardItemView';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';

const STICKY_COLORS = ['#8b5cf6', '#3b82f6', '#22c55e', '#eab308', '#ec4899'];

export function BoardsPage() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const boards = useStore((s) => s.boards);
  const addBoard = useStore((s) => s.addBoard);
  const deleteBoard = useStore((s) => s.deleteBoard);
  const addBoardItem = useStore((s) => s.addBoardItem);
  const updateBoardItem = useStore((s) => s.updateBoardItem);
  const deleteBoardItem = useStore((s) => s.deleteBoardItem);
  const fileRef = useRef<HTMLInputElement>(null);
  const [namingBoard, setNamingBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!boardId && boards.length > 0) {
      navigate(`/boards/${boards[0].id}`, { replace: true });
    }
  }, [boardId, boards, navigate]);

  const board = boards.find((b) => b.id === boardId) ?? boards[0];
  let colorCursor = 0;
  const nextColor = () => STICKY_COLORS[colorCursor++ % STICKY_COLORS.length];

  const onFile = (file: File | undefined) => {
    if (!file || !board) return;
    const reader = new FileReader();
    reader.onload = () => {
      addBoardItem(board.id, { type: 'image', content: reader.result as string, w: 220, h: 160, x: 100, y: 100 });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold">Boards</h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">A visual workspace for references, moodboards and loose ideas.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setNamingBoard(true)}>
          <Plus size={14} /> New board
        </Button>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {boards.map((b) => (
          <button
            key={b.id}
            onClick={() => navigate(`/boards/${b.id}`)}
            className={`px-3 py-1.5 rounded-lg text-[12.5px] font-semibold border transition-colors ${
              board?.id === b.id ? 'bg-violet-600 border-violet-600 text-white' : 'border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            {b.name}
          </button>
        ))}
      </div>

      {board ? (
        <div className="stenner-card p-3">
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className="text-[13px] font-semibold text-zinc-300 mr-2">{board.name}</span>
            <Button variant="secondary" size="sm" onClick={() => addBoardItem(board.id, { type: 'text', content: '', color: nextColor(), w: 220, h: 60 })}>
              <Type size={13} /> Text
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => addBoardItem(board.id, { type: 'sticky', content: '', color: nextColor(), w: 180, h: 120 })}
            >
              <StickyNote size={13} /> Sticky
            </Button>
            <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
              <ImagePlus size={13} /> Image
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const name = prompt('Section name', 'New section');
                if (name) addBoardItem(board.id, { type: 'section', content: name, color: nextColor(), w: 260, h: 200 });
              }}
            >
              <LayoutTemplate size={13} /> Section
            </Button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
            <div className="ml-auto">
              <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={13} /> Delete board
              </Button>
            </div>
          </div>

          <div
            className="relative rounded-xl overflow-auto"
            style={{
              height: '65vh',
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              backgroundColor: 'var(--color-bg)',
            }}
          >
            <div style={{ position: 'relative', width: 1400, height: 900 }}>
              {board.items.map((item) => (
                <BoardItemView
                  key={item.id}
                  item={item}
                  scale={1}
                  onMove={(x, y) => updateBoardItem(board.id, item.id, { x, y })}
                  onChangeContent={(content) => updateBoardItem(board.id, item.id, { content })}
                  onDelete={() => deleteBoardItem(board.id, item.id)}
                />
              ))}
              {board.items.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-[13px] text-zinc-600">
                  Empty canvas — add text, stickies, sections or images above.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="stenner-card py-16 text-center text-zinc-500 text-[13px]">
          No boards yet. <button onClick={() => setNamingBoard(true)} className="text-violet-400 hover:underline">Create one</button>
        </div>
      )}

      <Modal
        open={namingBoard}
        onClose={() => setNamingBoard(false)}
        title="New board"
        width={380}
        footer={
          <>
            <Button variant="ghost" onClick={() => setNamingBoard(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!newBoardName.trim()}
              onClick={() => {
                const b = addBoard(newBoardName.trim());
                setNewBoardName('');
                setNamingBoard(false);
                navigate(`/boards/${b.id}`);
              }}
            >
              Create
            </Button>
          </>
        }
      >
        <input
          autoFocus
          value={newBoardName}
          onChange={(e) => setNewBoardName(e.target.value)}
          placeholder="e.g. Michiverso Merch"
          className="stenner-input w-full px-3 py-2 text-[13px]"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newBoardName.trim()) {
              const b = addBoard(newBoardName.trim());
              setNewBoardName('');
              setNamingBoard(false);
              navigate(`/boards/${b.id}`);
            }
          }}
        />
      </Modal>

      {board && (
        <Modal
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          title="Delete board?"
          width={380}
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  deleteBoard(board.id);
                  setConfirmDelete(false);
                  navigate('/boards');
                }}
              >
                Delete
              </Button>
            </>
          }
        >
          <p className="text-[13px] text-zinc-400">
            This permanently deletes "<span className="text-zinc-200">{board.name}</span>" and all its items.
          </p>
        </Modal>
      )}
    </div>
  );
}
