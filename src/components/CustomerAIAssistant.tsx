import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";

interface Msg { role: "user" | "assistant"; content: string; }

export default function CustomerAIAssistant() {
  const { products, orders } = useStore();
  const { guestSignIn } = useAuth(); // ensure auth is loaded
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! I'm DineFlow Assistant. I can suggest combos, find quick items, use rewards, or track your order." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight; }, [messages]);

  function pushAssistant(text: string) {
    setMessages(m => [...m, { role: "assistant", content: text }]);
  }

  function fallbackReply(text: string) {
    const q = text.toLowerCase();
    
    if (q.includes("under") || q.includes("200")) {
      const m = parseInt((q.match(/(\d+)/) || [])[0] || "200", 10);
      const list = products.filter(p => p.price <= m).slice(0, 3);
      if (!list.length) return `No items found under ₹${m}.`;
      const txt = list.map(p => `${p.name} for ₹${p.price}`).join(" or ");
      return `Under ₹${m}, you can try ${txt}. ${list[0].name} is faster.`;
    }
    if (q.includes("fastest") || q.includes("fast") || q.includes("quick")) {
      const list = products.slice().sort((a, b) => a.prep_time_minutes - b.prep_time_minutes).slice(0, 4);
      return `Fastest items right now are ${list.map(p=>p.name).join(", ")}. ${list[0]?.name || "It"} takes about ${list[0]?.prep_time_minutes || 3} minutes.`;
    }
    if (q.includes("usual") || q.includes("my usual")) {
      const cust = useStore.getState().customer;
      if (cust.favorite_items.length > 0) {
        const favs = cust.favorite_items.slice(0, 2).map(id => products.find(p => p.id === id)?.name).filter(Boolean);
        return `You usually order ${favs.join(" and ")}. I can add ${favs.join(" + ")} to your cart.`;
      }
      return `I don't have your order history yet — try popular items like Coffee or Brownie.`;
    }
    if (q.includes("combo") || q.includes("best combo")) {
      return `Since you like Coffee, try Coffee + Brownie. It matches your past orders and is under ₹200.`;
    }
    if (q.includes("track")) {
      const active = orders.find(o => o.payment_status !== "paid");
      if (active) return `Your order #${active.order_number} is ${active.order_status === "sent_to_kitchen" ? "in the kitchen" : active.order_status} and the ETA is ${active.eta_minutes || 0} minutes.`;
      return `Currently you do not have an active order.`;
    }
    if (q.includes("reward") || q.includes("point")) {
      const cust = useStore.getState().customer;
      return `You have ${cust.loyalty_points} points. You can redeem 100 points for ₹20 off or save for 250 points to get ₹50 off.`;
    }
    if (q.includes("health") || q.includes("light") || q.includes("veg")) {
      return `For a healthy or veg option, try our Fresh Salad, Green Tea, or Veg Sandwich.`;
    }
    if (q.includes("popular")) {
      return `Our most popular items right now are Coffee, Burger, and Chocolate Brownie!`;
    }
    return "I can help you choose food, track your order, use rewards, or suggest combos. Try asking: 'Suggest under ₹200'.";
  }

  async function send(text: string) {
    if (!text.trim()) return;
    setMessages(m => [...m, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    // simulate small delay
    await new Promise(r => setTimeout(r, 400));
    try {
      // try remote AI gateway if configured
      if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;
        const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` }, body: JSON.stringify({ message: text }) });
        if (res.ok) {
          const j = await res.json();
          const reply = j?.reply || j?.message || (await res.text()).slice(0, 2000);
          pushAssistant(reply || "Sorry, no reply.");
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      // ignore and fallback
    }
    const reply = fallbackReply(text);
    pushAssistant(reply);
    setLoading(false);
  }

  const quicks = ["Suggest under ₹200", "Fastest food", "My usual order", "Best combo for me", "Healthy/light snack", "What is popular now?", "Use my rewards", "Track my order"];

  return (
    <Card className="p-5 lg:col-span-2 shadow-soft">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg gradient-warm flex items-center justify-center"><svg className="w-4 h-4 text-white"><circle cx="8" cy="8" r="8" /></svg></div>
        <div>
          <div className="font-semibold">DineFlow Assistant</div>
          <div className="text-xs text-muted-foreground">Ask for combos, quick items, rewards, or tracking</div>
        </div>
      </div>

      <div ref={boxRef} className="space-y-3 max-h-56 overflow-y-auto p-2 mb-3 border rounded">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`px-3 py-2 rounded-lg max-w-[80%] ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
              {m.content.split('\n').map((line, idx) => <div key={idx}>{line}</div>)}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {quicks.map(q => (
          <Button key={q} variant="outline" size="sm" onClick={() => send(q)}>{q}</Button>
        ))}
      </div>

      <div className="flex gap-2">
        <Input placeholder="Ask the assistant..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); send(input); } }} />
        <Button onClick={() => send(input)} disabled={!input.trim() || loading}>{loading ? "..." : "Send"}</Button>
      </div>
    </Card>
  );
}
