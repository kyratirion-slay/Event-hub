import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `Je bent een professionele eventmanager die vlotte, informele zakelijke mails schrijft in het Nederlands. Je schrijfstijl is:

- Warm en persoonlijk, maar professioneel
- Direct en to-the-point — geen overbodige opsmuk
- Informeel maar respectvol (gebruik "je" niet "u", tenzij context formeel is)
- Actief en energiek
- Geen clichéopeners zoals "Naar aanleiding van" of "Hierbij informeer ik u"
- Begin altijd met de kern: wie je bent en wat je wil
- Sluit af met een duidelijke call-to-action of volgende stap
- Gebruik korte alinea's, witregel tussen alinea's
- Voeg altijd een passende aanhef en afsluiting toe

Schrijf de mail als platte tekst (geen markdown). Begin direct met de aanhef.`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY niet ingesteld" }, { status: 500 });
  }

  let body: { prompt: string; eventName?: string; recipientName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldig verzoek" }, { status: 400 });
  }

  const { prompt, eventName, recipientName, eventContext } = body as {
    prompt: string; eventName?: string; recipientName?: string; eventContext?: string;
  };
  if (!prompt?.trim()) {
    return NextResponse.json({ error: "Prompt is verplicht" }, { status: 400 });
  }

  const contextParts: string[] = [];
  if (eventName) contextParts.push(`Event: ${eventName}`);
  if (eventContext) contextParts.push(eventContext);
  if (recipientName) contextParts.push(`Ontvanger: ${recipientName}`);
  const contextLine = contextParts.length ? `\n[Context: ${contextParts.join(" | ")}]\n` : "";

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `${contextLine}Schrijf een mail op basis van het volgende verzoek:\n\n${prompt}`,
        },
      ],
    });

    const text = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    return NextResponse.json({ mail: text });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Onbekende fout";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
