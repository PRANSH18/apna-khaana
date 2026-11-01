'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Sparkles, X, MessageCircle } from 'lucide-react';
import { askSehat, type AgentContext } from '@/lib/agent';
import type { RecommendInput } from '@/lib/recommend';

type Msg = { from: 'user' | 'sehat'; text: string };

const SUGGESTIONS = ['How much protein this week?', 'Am I on track?', 'Make it higher protein', 'More south indian'];

export function SehatChat({ getContext, onRefine }: {
  getContext: () => AgentContext;
  onRefine: (patch: Partial<RecommendInput>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: 'sehat', text: 'Hi, I’m Sehat. Ask me about your targets or this week, or tell me how to change the plan. Type “help” to see what I can do.' },
  ]);
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, open]);

  function send(raw: string) {
    const message = raw.trim();
    if (!message) return;
    const reply = askSehat(message, getContext());
    setMsgs((m) => [...m, { from: 'user', text: message }, { from: 'sehat', text: reply.text }]);
    setText('');
    if (reply.patch) onRefine(reply.patch);
  }

  return (
    <>
      {/* Launcher — sits well clear of the mobile tab bar, the sticky checkout
          bar, and the Netlify badge (bottom-right on the deployed site), at a
          z-index above all of them. */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-[150px] right-4 z-[60] flex items-center gap-2 rounded-full bg-leaf px-4 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-leaf-dark md:bottom-24 md:right-6"
        aria-label={open ? 'Close Sehat chat' : 'Chat with Sehat'}
      >
        {open ? <X size={18} /> : <MessageCircle size={18} />}
        {!open && <span className="hidden sm:inline">Ask Sehat</span>}
      </button>

      {open && (
        <div className="fixed inset-x-3 bottom-[210px] z-[60] mx-auto flex max-h-[65vh] max-w-md flex-col overflow-hidden rounded-3xl border border-ink/10 bg-paper shadow-soft md:inset-x-auto md:right-6 md:bottom-40 md:w-96">
          <div className="flex items-center gap-2 border-b border-ink/10 bg-white px-5 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-wash">
              <Sparkles size={16} className="text-leaf" />
            </div>
            <div>
              <p className="text-sm font-semibold">Sehat</p>
              <p className="text-[11px] text-ink/45">Your meal-plan agent</p>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {msgs.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-5 ${msg.from === 'user' ? 'bg-leaf text-white' : 'border border-ink/10 bg-white text-ink/80'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {msgs.length <= 1 && (
            <div className="flex flex-wrap gap-2 px-4 pb-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border border-ink/15 px-3 py-1.5 text-xs text-ink/60 transition hover:border-leaf hover:text-leaf">
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); send(text); }}
            className="flex items-center gap-2 border-t border-ink/10 bg-white px-3 py-3"
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ask or tell Sehat…"
              className="flex-1 rounded-full border border-ink/15 px-4 py-2.5 text-sm focus:border-leaf"
            />
            <button type="submit" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-leaf text-white transition hover:bg-leaf-dark">
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
