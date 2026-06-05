import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `Schrijf Nederlandse e-mails in een professionele, toegankelijke en soepel lezende stijl. De toon is zakelijk maar nooit stijf of overdreven formeel. Mails klinken natuurlijk, alsof ze geschreven zijn door iemand uit een modern corporate team dat veel events, interne communicatie en externe samenwerkingen organiseert. Schrijf vloeiend en logisch opgebouwd. Houd de toon warm, menselijk en licht gezellig waar passend. Vermijd overdreven enthousiasme, marketingtaal of te blije formuleringen. Schrijf direct maar vriendelijk. Gebruik geen smileys of emojis. Gebruik geen em dashes of andere opvallende leestekens voor stijl. Vermijd stijve formuleringen zoals "Hierbij deel ik u mede". Vermijd cliché zakelijke taal. Houd de doelgroep in gedachten: hoogopgeleide professionals zoals advocaten, consultants en zakelijke relaties. Interne mails mogen iets losser zijn dan externe mails. Liever "Ik hoor graag van je" dan "Ik zie uw reactie met belangstelling tegemoet". Liever "Laat vooral weten" dan "Graag vernemen wij". Geen geforceerde humor, geen overdreven formele afsluiters, geen em dashes, geen smileys. Houd de balans tussen professioneel, soepel en licht persoonlijk.

Schrijf de mail als platte tekst (geen markdown). Begin direct met de aanhef.`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY niet ingesteld" }, { status: 500 });
  }

  let body: { prompt: string; eventName?: string; recipientName?: string; eventContext?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldig verzoek" }, { status: 400 });
  }

  const { prompt, eventName, recipientName, eventContext } = body;
  if (!prompt?.trim()) {
    return NextResponse.json({ error: "Prompt is verplicht" }, { status: 400 });
  }

  const contextParts: string[] = [];
  if (eventName) contextParts.push(`Event: ${eventName}`);
  if (eventContext) contextParts.push(eventContext);
  if (recipientName) contextParts.push(`Ontvanger: ${recipientName}`);
  const contextLine = contextParts.length ? `\n[Context: ${contextParts.join(" | ")}]\n` : "";

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
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
