import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import api from "../services/api";

/**
 * A simple chat interface that posts messages to POST /api/ai/chat
 * and renders the conversation. Falls back to a
 * friendly notice if the AI endpoint isn't available yet.
 */
export default function AIChat({ initialMessage }) {
  const [messages, setMessages] = useState(() =>
    initialMessage
      ? [{ role: "assistant", content: initialMessage }]
      : [
          {
            role: "assistant",
            content:
              "Hi! I'm your AI Investment Advisor. Tell me about your investment goals, risk tolerance and budget, and I'll suggest educational options to explore.",
          },
        ]
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      // POST /api/ai/chat
      const { data } = await api.post("/ai/chat", { messages: nextMessages });
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            err?.response?.status === 404
              ? "Could not reach the AI Advisor service. Is the backend running?"
              : "Something went wrong reaching the AI service. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[32rem] flex-col rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-800/50">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="mt-1 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                <Bot className="h-4 w-4" />
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                m.role === "user"
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
              }`}
            >
              {m.content}
            </div>
            {m.role === "user" && (
              <div className="mt-1 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-200">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-slate-200 p-3 dark:border-slate-800">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tell me your investment goals..."
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex items-center justify-center rounded-lg bg-brand-600 p-2.5 text-white hover:bg-brand-700 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
