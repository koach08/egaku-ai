"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { MessageCircleIcon, XIcon, SendIcon, Loader2Icon, SparklesIcon } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface PromptAssistantProps {
  token: string | null;
  onUsePrompt?: (prompt: string) => void;
}

const QUICK_PROMPTS = [
  "Help me create a stunning landscape",
  "I want to make anime-style art",
  "How do I make photorealistic portraits?",
  "Suggest a creative prompt for me",
];

export function PromptAssistant({ token, onUsePrompt }: PromptAssistantProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || !token) return;

    const userMsg: Message = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.promptAssist(token, msg, messages);
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to get response";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const extractPrompt = (text: string): string | null => {
    // Try to find text between quotes or after "Prompt:" label
    const patterns = [
      /[Pp]rompt:\s*"([^"]+)"/,
      /[Pp]rompt:\s*`([^`]+)`/,
      /[Pp]rompt:\s*\n(.+)/,
      /"([^"]{20,})"/,
    ];
    for (const p of patterns) {
      const match = text.match(p);
      if (match) return match[1].trim();
    }
    return null;
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105"
      >
        <SparklesIcon className="size-5" />
        <span className="text-sm font-medium hidden sm:inline">Prompt Assistant</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] max-h-[600px] bg-background border rounded-xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-purple-600/10">
        <div className="flex items-center gap-2">
          <SparklesIcon className="size-4 text-purple-500" />
          <span className="text-sm font-semibold">Prompt Assistant</span>
        </div>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
          <XIcon className="size-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[400px]">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              I can help you write better prompts. Try asking:
            </p>
            <div className="space-y-2">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg border hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-purple-600 text-white"
                  : "bg-muted"
              }`}
            >
              <div className="whitespace-pre-wrap break-words">{msg.content}</div>
              {msg.role === "assistant" && onUsePrompt && extractPrompt(msg.content) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 text-xs h-7"
                  onClick={() => onUsePrompt(extractPrompt(msg.content)!)}
                >
                  Use this prompt
                </Button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-3 py-2">
              <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2"
        >
          <Textarea
            placeholder="Ask about prompts..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={1}
            className="resize-none text-sm min-h-[36px]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!input.trim() || loading}
            className="shrink-0 h-9 w-9 p-0"
          >
            <SendIcon className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
