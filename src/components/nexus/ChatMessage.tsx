import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles } from 'lucide-react';
import type { NexusMessage } from '../../types/nexus';

const MARKDOWN_COMPONENTS = {
  h1: (props: React.ComponentProps<'h1'>) => <h1 className="text-[16px] font-bold mt-3 mb-1.5 first:mt-0" {...props} />,
  h2: (props: React.ComponentProps<'h2'>) => <h2 className="text-[14.5px] font-bold mt-3 mb-1.5 first:mt-0" {...props} />,
  h3: (props: React.ComponentProps<'h3'>) => <h3 className="text-[13.5px] font-bold mt-2.5 mb-1 first:mt-0" {...props} />,
  p: (props: React.ComponentProps<'p'>) => <p className="leading-relaxed mb-2 last:mb-0" {...props} />,
  ul: (props: React.ComponentProps<'ul'>) => <ul className="list-disc list-inside space-y-1 mb-2 marker:text-violet-400" {...props} />,
  ol: (props: React.ComponentProps<'ol'>) => <ol className="list-decimal list-inside space-y-1 mb-2 marker:text-violet-400" {...props} />,
  li: (props: React.ComponentProps<'li'>) => <li className="leading-relaxed" {...props} />,
  strong: (props: React.ComponentProps<'strong'>) => <strong className="font-semibold text-zinc-100" {...props} />,
  a: (props: React.ComponentProps<'a'>) => <a className="text-violet-400 hover:text-violet-300 underline" target="_blank" rel="noreferrer" {...props} />,
  code: ({ className, ...props }: React.ComponentProps<'code'>) =>
    className ? (
      <code className={`block ${className}`} {...props} />
    ) : (
      <code className="px-1 py-0.5 rounded bg-white/10 text-[12px] font-mono text-pink-300" {...props} />
    ),
  pre: (props: React.ComponentProps<'pre'>) => (
    <pre className="my-2 p-3 rounded-lg bg-black/40 border border-white/10 overflow-x-auto text-[12px] font-mono leading-relaxed" {...props} />
  ),
  table: (props: React.ComponentProps<'table'>) => (
    <div className="my-2 overflow-x-auto stenner-scroll-x">
      <table className="w-full text-[12.5px] border-collapse" {...props} />
    </div>
  ),
  th: (props: React.ComponentProps<'th'>) => <th className="text-left px-2.5 py-1.5 border-b border-white/15 font-semibold text-zinc-300" {...props} />,
  td: (props: React.ComponentProps<'td'>) => <td className="px-2.5 py-1.5 border-b border-white/5 text-zinc-400" {...props} />,
  blockquote: (props: React.ComponentProps<'blockquote'>) => (
    <blockquote className="border-l-2 border-violet-500/40 pl-3 my-2 text-zinc-400 italic" {...props} />
  ),
};

interface ChatMessageProps {
  message: NexusMessage;
  actionCard?: React.ReactNode;
}

export function ChatMessage({ message, actionCard }: ChatMessageProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-violet-600 text-white text-[13.5px] leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles size={13} className="text-white" />
      </div>
      <div className="max-w-[85%] min-w-0">
        <div className="px-4 py-2.5 rounded-2xl rounded-tl-sm stenner-card text-[13.5px] text-zinc-200">
          {message.content ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
              {message.content}
            </ReactMarkdown>
          ) : (
            <span className="text-zinc-500">...</span>
          )}
        </div>
        {actionCard && <div className="mt-2">{actionCard}</div>}
      </div>
    </div>
  );
}
