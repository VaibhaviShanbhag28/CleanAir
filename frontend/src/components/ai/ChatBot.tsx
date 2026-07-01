import React, { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button, Spinner } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';

interface Msg { role: 'user' | 'assistant'; content: string; }

const SUGGESTIONS = [
  'What is safe AQI for jogging?',
  'How to report a garbage fire?',
  'How do I earn Karma points?',
  'Best areas in Bengaluru today?',
];

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: '👋 Hi! I\'m your CleanAir Assistant. Ask me anything about pollution, reports, or eco-tips for Bengaluru!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { currentAQI } = useAppStore();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { role: 'user', content: text };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await api.ai.chat(
        [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        'Bengaluru',
        `Current AQI: ${currentAQI}`
      );
      setMessages(m => [...m, { role: 'assistant', content: res.reply }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Sorry, I\'m having trouble connecting. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 gradient-green rounded-full shadow-2xl flex items-center justify-center text-2xl hover:scale-110 transition-transform"
        title="CleanAir Assistant"
      >
        {open ? '✕' : '🤖'}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-card rounded-2xl shadow-2xl border flex flex-col animate-fade-in overflow-hidden" style={{ height: '480px' }}>
          {/* Header */}
          <div className="gradient-green p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-xl">🤖</div>
            <div>
              <p className="font-bold text-white text-sm">CleanAir Assistant</p>
              <p className="text-white/70 text-xs">Powered by Gemini AI</p>
            </div>
            <div className="ml-auto w-2 h-2 bg-green-300 rounded-full animate-pulse" />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
            {messages.map((m, i) => (
              <div key={i} className={cn('flex gap-2', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                {m.role === 'assistant' && <div className="w-7 h-7 rounded-full gradient-green flex items-center justify-center text-sm flex-shrink-0">🤖</div>}
                <div className={cn('max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed', m.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-accent text-foreground rounded-bl-sm')}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full gradient-green flex items-center justify-center text-sm">🤖</div>
                <div className="bg-accent rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                  {[0,1,2].map(i => <span key={i} className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)} className="text-xs bg-accent hover:bg-primary/10 hover:text-primary border rounded-full px-2.5 py-1 transition-colors text-muted-foreground">
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t flex gap-2">
            <input
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send(input)}
              placeholder="Ask about pollution, tips..."
              className="flex-1 text-sm bg-accent rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
            />
            <Button size="icon" onClick={() => send(input)} disabled={!input.trim() || loading}>
              {loading ? <Spinner size="sm" /> : '➤'}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
