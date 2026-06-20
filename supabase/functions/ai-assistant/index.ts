// DineFlow AI Assistant — streaming chat using Lovable AI Gateway
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are DineFlow AI, the assistant for a smart restaurant POS platform.
You help the user (admin/owner, cashier, kitchen staff or customer) with:
- Sales insights, demand forecasts, popular items, peak hours.
- Inventory & supplier suggestions (e.g., "Milk low — restock 2L from Aavin").
- Kitchen prioritization & delay risk.
- Menu recommendations & combo suggestions for customers.
- Simulation what-ifs (rush hour, shortages, delays).

Keep replies short, friendly, action-oriented. Use bullet points and bold key numbers when useful.
You are operating on DEMO data — feel free to make plausible, illustrative predictions.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const context = typeof body?.context === "string" ? body.context : "";

    const fullMessages = [
      { role: "system", content: SYSTEM_PROMPT + (context ? `\n\nLive context:\n${context}` : "") },
      ...messages,
    ];

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: fullMessages,
        stream: true,
      }),
    });

    if (!upstream.ok) {
      const txt = await upstream.text();
      return new Response(JSON.stringify({ error: `Upstream ${upstream.status}`, detail: txt }), {
        status: upstream.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pass through SSE stream
    return new Response(upstream.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
