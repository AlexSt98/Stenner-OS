import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Sparkles, WifiOff, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { useStore } from '../store/useStore';
import type { NexusMessage, NexusRole } from '../types/nexus';
import { nowISO } from '../lib/date';
import { buildSystemPrompt } from '../lib/nexus/systemPrompt';
import { fetchNexusStatus, streamNexusReply, type NexusStatus } from '../lib/nexus/client';
import { generateDemoResponse } from '../lib/nexus/demoResponder';
import { ChatMessage } from '../components/nexus/ChatMessage';
import { ThinkingIndicator } from '../components/nexus/ThinkingIndicator';
import { QuickPrompts } from '../components/nexus/QuickPrompts';
import { ConversationSidebar } from '../components/nexus/ConversationSidebar';
import { ActionCard } from '../components/nexus/ActionCard';

function titleFromMessage(text: string) {
  const clean = text.trim().replace(/\s+/g, ' ');
  return clean.length > 42 ? `${clean.slice(0, 42)}…` : clean || 'New conversation';
}

/** Fakes a progressive reveal for demo-mode responses so the UX matches the real streaming path. */
function revealProgressively(text: string, onDelta: (delta: string) => void, onDone: () => void) {
  let i = 0;
  const step = () => {
    const chunk = text.slice(i, i + 3);
    i += 3;
    onDelta(chunk);
    if (i < text.length) {
      window.setTimeout(step, 12);
    } else {
      onDone();
    }
  };
  step();
}

export function NexusPage() {
  const navigate = useNavigate();
  const conversations = useStore((s) => s.nexusConversations);
  const createNexusConversation = useStore((s) => s.createNexusConversation);
  const appendNexusMessage = useStore((s) => s.appendNexusMessage);
  const updateNexusMessage = useStore((s) => s.updateNexusMessage);
  const renameNexusConversation = useStore((s) => s.renameNexusConversation);
  const deleteNexusConversation = useStore((s) => s.deleteNexusConversation);
  const recordNexusUsage = useStore((s) => s.recordNexusUsage);

  const [activeId, setActiveId] = useState<string | null>(conversations[0]?.id ?? null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<NexusStatus>({ connected: false, provider: 'gemini' });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNexusStatus().then(setStatus);
  }, []);

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const lastMessage = active?.messages[active.messages.length - 1];
  const messageCount = active?.messages.length;
  const lastMessageContent = lastMessage?.content;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messageCount, lastMessageContent]);

  const historyForRequest = useMemo(
    () => (active ? active.messages.filter((m) => m.content).map((m) => ({ role: m.role as NexusRole, content: m.content })) : []),
    [active]
  );

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    let conversationId = activeId;
    if (!conversationId) {
      const conv = createNexusConversation(titleFromMessage(trimmed));
      conversationId = conv.id;
      setActiveId(conv.id);
    } else if (active && active.messages.length === 0) {
      renameNexusConversation(conversationId, titleFromMessage(trimmed));
    }

    const userMessage: NexusMessage = { id: uuid(), role: 'user', content: trimmed, timestamp: nowISO() };
    appendNexusMessage(conversationId, userMessage);
    setInput('');
    setSending(true);

    const { prompt, contextLabels } = buildSystemPrompt(trimmed);
    const modelMessageId = uuid();
    appendNexusMessage(conversationId, { id: modelMessageId, role: 'model', content: '', contextLabels, timestamp: nowISO() });

    const finish = (text: string, toolCall?: NexusMessage['toolCall']) => {
      updateNexusMessage(conversationId!, modelMessageId, { content: text, toolCall: toolCall ?? null, toolCallResolution: toolCall ? undefined : null });
      setSending(false);
    };

    if (!status.connected) {
      const result = generateDemoResponse(trimmed);
      let acc = '';
      revealProgressively(
        result.text,
        (delta) => {
          acc += delta;
          updateNexusMessage(conversationId!, modelMessageId, { content: acc });
        },
        () => finish(result.text, result.toolCall)
      );
      return;
    }

    try {
      let acc = '';
      const result = await streamNexusReply({
        systemPrompt: prompt,
        history: [...historyForRequest, { role: 'user', content: trimmed }],
        onDelta: (delta) => {
          acc += delta;
          updateNexusMessage(conversationId!, modelMessageId, { content: acc });
        },
      });
      if (result.usage) recordNexusUsage(result.usage);
      finish(result.text, result.toolCall);
    } catch (err) {
      finish(err instanceof Error ? `⚠️ ${err.message}` : '⚠️ Something went wrong talking to NEXUS.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-88px)] flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <div>
          <h1 className="text-[20px] font-bold flex items-center gap-2">
            <Sparkles size={19} className="text-violet-400" /> NEXUS
          </h1>
          <p className="text-[12.5px] text-zinc-500 mt-0.5">The intelligence behind your workflow.</p>
        </div>
        {!status.connected && (
          <button
            onClick={() => navigate('/settings')}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-yellow-500/25 bg-yellow-500/[0.06] text-yellow-400 text-[12px] font-medium hover:bg-yellow-500/10 transition-colors"
          >
            <WifiOff size={12} /> Demo mode — connect a provider <ExternalLink size={11} />
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
        <div className="hidden lg:block min-h-0">
          <ConversationSidebar
            conversations={conversations}
            activeId={activeId}
            onSelect={setActiveId}
            onNew={() => setActiveId(null)}
            onDelete={(id) => {
              deleteNexusConversation(id);
              if (activeId === id) setActiveId(null);
            }}
          />
        </div>

        <div className="stenner-card flex flex-col min-h-0 p-4">
          {!active || active.messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center mb-4">
                <Sparkles size={26} className="text-white" />
              </div>
              <h2 className="text-[22px] font-bold">What do you want to figure out?</h2>
              <p className="text-[13px] text-zinc-500 mt-1.5 max-w-md">
                Ask about your tasks, TEOPM workday, projects, calendar, English practice, or ideas — NEXUS reads STENNER OS's live data to answer.
              </p>
              <div className="mt-6 max-w-2xl">
                <QuickPrompts onSelect={send} disabled={sending} />
              </div>
            </div>
          ) : (
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-1 pb-2">
              {active.messages.map((m) => (
                <ChatMessage
                  key={m.id}
                  message={m}
                  actionCard={
                    m.toolCall ? (
                      <ActionCard
                        call={m.toolCall}
                        resolution={m.toolCallResolution}
                        onResolve={(resolution) => updateNexusMessage(active.id, m.id, { toolCallResolution: resolution })}
                      />
                    ) : undefined
                  }
                />
              ))}
              {sending && active.messages[active.messages.length - 1]?.content === '' && <ThinkingIndicator />}
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-[var(--color-border-soft)]">
            {active && active.messages.length > 0 && (
              <div className="mb-2.5">
                <QuickPrompts onSelect={send} disabled={sending} />
              </div>
            )}
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder="Ask NEXUS anything..."
                rows={1}
                className="stenner-input flex-1 px-3.5 py-2.5 text-[13.5px] placeholder:text-zinc-600 resize-none max-h-32"
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || sending}
                className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:pointer-events-none text-white transition-colors shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
