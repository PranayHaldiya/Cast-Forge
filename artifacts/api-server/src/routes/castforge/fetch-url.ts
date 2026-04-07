import { Router, type IRouter } from "express";
import { FetchUrlTopicBody } from "@workspace/api-zod";
import { ai } from "@workspace/integrations-gemini-ai";
import { logger } from "../../lib/logger.js";

const router: IRouter = Router();

function extractTextFromHtml(html: string): { title: string; text: string } {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/&[a-z]+;/gi, " ").trim() : "";

  // Extract meta description
  const metaMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  const metaDesc = metaMatch ? metaMatch[1].trim() : "";

  // Remove script, style, nav, header, footer, aside blocks
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<aside[\s\S]*?<\/aside>/gi, " ");

  // Extract main content area if it exists
  const mainMatch = cleaned.match(/<(?:main|article)[^>]*>([\s\S]*?)<\/(?:main|article)>/i);
  if (mainMatch) cleaned = mainMatch[1];

  // Strip all remaining HTML tags and decode common entities
  const text = cleaned
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s{3,}/g, "\n\n")
    .trim();

  const combined = [metaDesc, text].filter(Boolean).join("\n\n");
  // Limit to ~5000 chars to keep Gemini prompt reasonable
  return { title, text: combined.slice(0, 5000) };
}

router.post("/castforge/fetch-url", async (req, res): Promise<void> => {
  const parsed = FetchUrlTopicBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid URL" });
    return;
  }

  const { url } = parsed.data;

  // Only allow http/https
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      res.status(400).json({ error: "Only http and https URLs are supported" });
      return;
    }
  } catch {
    res.status(400).json({ error: "Malformed URL" });
    return;
  }

  // Fetch the page
  let html: string;
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CastForge/1.0; +https://castforge.app)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      res.status(400).json({ error: `Failed to fetch URL (${response.status})` });
      return;
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      res.status(400).json({ error: "URL does not point to a readable webpage" });
      return;
    }
    html = await response.text();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch URL";
    res.status(400).json({ error: msg });
    return;
  }

  const { title, text } = extractTextFromHtml(html);

  if (!text || text.length < 50) {
    res.status(400).json({ error: "Could not extract readable content from this URL" });
    return;
  }

  // Ask Gemini to distill the page content into a great podcast topic
  const prompt = `You are a podcast producer. A user wants to turn the following article/webpage into a podcast episode.

PAGE TITLE: ${title || "(no title)"}
SOURCE URL: ${url}

PAGE CONTENT (excerpt):
${text}

Your job: Write a single, punchy podcast topic description (2–3 sentences max) that:
1. Captures the core subject and most interesting angle from this content
2. Sounds exciting and worth discussing on a podcast  
3. Includes 1–2 specific facts, names, or details from the content that make it feel real and specific
4. Does NOT say "in this episode" or "today we discuss" — just describe the topic itself

Return ONLY the topic description, no preamble, no quotes, no labels.`;

  let topic: string;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 512 },
    });
    topic = (response.text ?? "").trim().replace(/^[:\-–—,\.]+\s*/, "");
    if (!topic) throw new Error("Empty response from AI");
  } catch (aiErr) {
    logger.warn({ err: aiErr }, "Gemini topic extraction failed, using fallback");
    // Fallback: use the page title as topic
    topic = title || url;
  }

  res.json({
    topic,
    sourceTitle: title || parsedUrl.hostname,
    sourceUrl: url,
  });
});

export default router;
