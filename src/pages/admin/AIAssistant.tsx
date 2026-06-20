import { useState, useRef, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { DemoBadge } from "@/components/DemoBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Loader2, User as UserIcon } from "lucide-react";
import { useStore, formatINR } from "@/lib/store";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Msg { role: "user" | "assistant"; content: string; }

const QUICK = [
  "What are today's top selling items?",
  "Predict tomorrow's coffee demand",
  "Which ingredients should I restock?",
  "Suggest a combo for a budget customer",
  "How can I reduce kitchen delays at 7 PM?",
];

export default function AIAssistantPage() {
  const { products, ingredients, orders } = useStore();
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! I'm **DineFlow AI**. I can analyse your sales, predict demand, suggest restocks and explain insights. Ask me anything." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, loading]);

  const buildContext = () => {
    const top = [...products].sort((a, b) => b.sold_today - a.sold_today).slice(0, 5)
      .map(p => `${p.name}: ${p.sold_today} sold, stock ${p.stock_qty}`).join("; ");
    const low = ingredients.filter(i => i.current_stock < i.min_stock_level * 2)
      .map(i => `${i.name} (${i.current_stock}${i.unit}, supplier ${i.supplier_name})`).join("; ");
    const revenue = orders.filter(o => o.payment_status === "paid").reduce((s, o) => s + o.total_amount, 0) + 12480;
    return `Today revenue ~${formatINR(revenue)}. Top items: ${top}. Low stock: ${low || "none critical"}.`;
  };

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: next, context: buildContext() }),
      });
      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "");
        if (res.status === 429) toast.error("Rate limit reached. Try again shortly.");
        else if (res.status === 402) toast.error("AI credits exhausted. Please top up.");
        else toast.error("AI request failed");
        setMessages(m => [...m, { role: "assistant", content: `Sorry, I couldn't reach the AI gateway. ${errText.slice(0, 120)}` }]);
        setLoading(false);
        return;
      }

      setMessages(m => [...m, { role: "assistant", content: "" }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assembled = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              assembled += delta;
              setMessages(m => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", content: assembled };
                return copy;
              });
            }
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <DemoBadge />
      <div className="p-6 lg:p-8 max-w-5xl mx-auto h-screen flex flex-col">
        <PageHeader icon={Sparkles} title="AI Assistant" description="Ask DineFlow AI about sales, predictions, inventory and customers" />

        <Card className="flex-1 flex flex-col shadow-soft overflow-hidden min-h-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg gradient-warm flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                  {m.role === "assistant"
                    ? <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1"><ReactMarkdown>{m.content || "…"}</ReactMarkdown></div>
                    : m.content}
                </div>
                {m.role === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-3"><div className="w-8 h-8 rounded-lg gradient-warm flex items-center justify-center"><Loader2 className="w-4 h-4 text-white animate-spin" /></div><div className="bg-secondary rounded-2xl px-4 py-2.5 text-sm text-muted-foreground">Thinking…</div></div>
            )}
          </div>

          <div className="border-t border-border p-3 space-y-2">
            <div className="flex gap-1.5 flex-wrap">
              {QUICK.map(q => (
                <button key={q} disabled={loading} onClick={() => send(q)} className="text-xs px-2.5 py-1 rounded-full bg-secondary hover:bg-secondary/70 transition-colors disabled:opacity-50">{q}</button>
              ))}
            </div>
            <form onSubmit={e => { e.preventDefault(); send(input); }} className="flex gap-2">
              <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask anything about your restaurant…" disabled={loading} />
              <Button type="submit" disabled={loading || !input.trim()}><Send className="w-4 h-4" /></Button>
            </form>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
