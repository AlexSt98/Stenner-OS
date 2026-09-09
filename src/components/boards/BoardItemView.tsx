import { useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { BoardItem } from '../../types';

interface BoardItemViewProps {
  item: BoardItem;
  onMove: (x: number, y: number) => void;
  onChangeContent: (content: string) => void;
  onDelete: () => void;
  scale: number;
}

export function BoardItemView({ item, onMove, onChangeContent, onDelete, scale }: BoardItemViewProps) {
  const [dragging, setDragging] = useState(false);
  const startRef = useRef({ mouseX: 0, mouseY: 0, itemX: 0, itemY: 0 });

  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;
    e.stopPropagation();
    setDragging(true);
    startRef.current = { mouseX: e.clientX, mouseY: e.clientY, itemX: item.x, itemY: item.y };

    const onMouseMove = (ev: MouseEvent) => {
      const dx = (ev.clientX - startRef.current.mouseX) / scale;
      const dy = (ev.clientY - startRef.current.mouseY) / scale;
      onMove(Math.round(startRef.current.itemX + dx), Math.round(startRef.current.itemY + dy));
    };
    const onMouseUp = () => {
      setDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const isSection = item.type === 'section';

  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: 'absolute',
        left: item.x,
        top: item.y,
        width: item.w,
        height: item.h,
        borderColor: `${item.color}55`,
        background: isSection ? `${item.color}0d` : `${item.color}1a`,
        cursor: dragging ? 'grabbing' : 'grab',
      }}
      className={`group rounded-xl border-2 ${isSection ? 'border-dashed' : 'border-solid'} p-3 select-none ${dragging ? 'shadow-2xl z-30' : 'z-10'}`}
    >
      <button
        onMouseDown={(e) => e.stopPropagation()}
        onClick={onDelete}
        className="absolute -top-2 -right-2 p-1 rounded-full bg-zinc-800 border border-white/10 text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
      >
        <X size={11} />
      </button>

      {isSection && (
        <div className="text-[11px] font-bold tracking-wide uppercase mb-1" style={{ color: item.color }}>
          {item.content}
        </div>
      )}

      {item.type === 'image' && item.content && (
        <img src={item.content} className="w-full h-full object-cover rounded-lg pointer-events-none" />
      )}

      {item.type === 'sticky' && (
        <textarea
          value={item.content}
          onChange={(e) => onChangeContent(e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-full h-[calc(100%-4px)] bg-transparent resize-none outline-none text-[12.5px] text-zinc-100 placeholder:text-zinc-600"
          placeholder="Type something..."
        />
      )}

      {item.type === 'text' && (
        <textarea
          value={item.content}
          onChange={(e) => onChangeContent(e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-full h-full bg-transparent resize-none outline-none text-[15px] font-semibold text-zinc-100 placeholder:text-zinc-600"
          placeholder="Heading..."
        />
      )}
    </div>
  );
}
