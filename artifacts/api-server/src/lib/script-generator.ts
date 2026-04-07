import { ai } from "@workspace/integrations-gemini-ai";

export interface Host {
  name: string;
  description: string;
}

export interface ScriptLine {
  voice: string; // "A", "B", or "C"
  text: string;
}

const FORMAT_INSTRUCTIONS: Record<string, string> = {
  comedy: "witty banter, unexpected analogies, playful disagreements, comedic timing, running jokes",
  debate: "structured arguments, strong counterpoints, devil's advocate moments, occasional sarcasm",
  explainer: "curiosity-driven, genuine 'wait, really?' moments, building understanding together, enthusiastic discovery",
  true_crime: "suspenseful pacing, cliffhangers between exchanges, eerie details, hushed tones",
  hot_takes: "bold opinions, rapid-fire energy, 'I said what I said' attitude, provocative takes",
  interview: "one host asks probing questions, the other shares deep expertise, surprising revelations",
};

export async function generateScript(
  topic: string,
  format: string,
  hosts: Host[],
): Promise<ScriptLine[]> {
  const hostDescriptions = hosts
    .map((h, i) => `- Host ${String.fromCharCode(65 + i)} (${h.name}): ${h.description}`)
    .join("\n");

  const formatGuide = FORMAT_INSTRUCTIONS[format] ?? FORMAT_INSTRUCTIONS.explainer;
  const voiceLabels = hosts.map((_, i) => `"${String.fromCharCode(65 + i)}"`).join(" or ");

  const prompt = `You are a podcast script writer for CastForge. Generate a natural, engaging podcast script.

TOPIC: ${topic}
FORMAT: ${format}
HOSTS:
${hostDescriptions}

FORMAT STYLE: ${formatGuide}

RULES:
1. Write 18-25 exchanges (aim for 2-3 minutes of audio)
2. Make it sound like a REAL conversation — interruptions, reactions, tangents
3. Use emotion tags in square brackets: [laughing], [whispering], [excited], [serious], [sarcastic], [shocked], [thoughtful]
4. Use — for natural interruptions: "I think that's—"
5. Use ... for trailing off: "Well, the thing is..."
6. Include at least 3 genuinely interesting facts or insights
7. Open with a HOOK — never "welcome to the show" or "today we're talking about"
8. End with a memorable, punchy closing line
9. Keep exchanges short and punchy — real conversations aren't monologues
10. Include at least one unexpected or counterintuitive insight

OUTPUT FORMAT: Return ONLY a valid JSON array, no markdown, no backticks, no explanation:
[{"voice": ${voiceLabels}, "text": "..."}]`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
  });

  const raw = response.text ?? "[]";

  // Clean the response (remove any markdown if present)
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const parsed = JSON.parse(cleaned) as ScriptLine[];

  if (!Array.isArray(parsed)) {
    throw new Error("Script generator returned non-array response");
  }

  return parsed;
}

export function scriptToText(lines: ScriptLine[], hosts: Host[]): string {
  return lines
    .map((line) => {
      const idx = line.voice.charCodeAt(0) - 65;
      const host = hosts[idx] ?? hosts[0];
      return `${host.name}: ${line.text}`;
    })
    .join("\n");
}
