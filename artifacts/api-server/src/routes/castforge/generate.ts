import path from "path";
import { Router, type IRouter, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, episodesTable } from "@workspace/db";
import { GenerateEpisodeBody } from "@workspace/api-zod";
import {
  createVoicePreviews,
  saveVoice,
  generateDialogue,
  generateSoundEffect,
  generateMusic,
  getUploadsDir,
} from "../../lib/elevenlabs.js";
import { generateScript, scriptToText } from "../../lib/script-generator.js";
import { mixAudio, getAudioDuration } from "../../lib/audio-mixer.js";
import { logger } from "../../lib/logger.js";

const router: IRouter = Router();

const SFX_PROMPTS: Record<string, string> = {
  comedy: "upbeat rimshot and comedic drum roll for a comedy podcast transition",
  debate: "dramatic orchestral sting and gavel bang for a debate show",
  explainer: "gentle rising whoosh and soft chime for an educational podcast transition",
  true_crime: "dark suspenseful drone with heartbeat pulse for a true crime podcast",
  hot_takes: "punchy electronic bass drop and crowd cheer for an opinion show",
  interview: "warm acoustic guitar strum for a podcast interview segment",
};

const MUSIC_PROMPTS: Record<string, string> = {
  comedy: "Upbeat playful podcast intro jingle, energetic brass and drums, no vocals, comedy show vibes",
  debate: "Dramatic orchestral podcast intro, powerful brass and strings, no vocals, intense debate atmosphere",
  explainer: "Warm curious podcast intro, gentle piano and subtle synths, no vocals, educational discovery feeling",
  true_crime: "Dark mysterious ambient podcast intro, low sustained piano and distant drones, no vocals, ominous crime atmosphere",
  hot_takes: "Punchy electronic podcast intro, heavy bass and driving rhythm, no vocals, high energy opinion show",
  interview: "Professional warm podcast intro, smooth acoustic guitar and light percussion, no vocals, conversational interview feel",
};

function sendEvent(res: Response, data: Record<string, unknown>) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

router.post("/castforge/generate", async (req, res): Promise<void> => {
  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const parsed = GenerateEpisodeBody.safeParse(req.body);
  if (!parsed.success) {
    sendEvent(res, { step: "error", message: "Invalid request: " + parsed.error.message, progress: 0 });
    res.end();
    return;
  }

  const { topic, format, hosts } = parsed.data;

  // Insert episode with "generating" status
  const [episode] = await db
    .insert(episodesTable)
    .values({
      topic,
      format,
      hosts: hosts.map((h) => ({ name: h.name, description: h.description, voiceId: null })),
      status: "generating",
    })
    .returning();

  req.log.info({ episodeId: episode.id }, "Starting episode generation");
  sendEvent(res, { step: "start", episodeId: episode.id, message: "Starting your podcast...", progress: 5 });

  try {
    // ─── STEP 1: Voice Design (parallel for each host) ───
    sendEvent(res, { step: "voices", message: "Casting your hosts...", progress: 10 });

    const voiceIds: string[] = [];
    const hostsWithVoices = await Promise.all(
      hosts.map(async (host, idx) => {
        const sampleText = getSampleText(format, host.name);
        const previews = await createVoicePreviews(host.description, sampleText);
        if (!previews || previews.length === 0) {
          throw new Error(`No voice preview generated for host: ${host.name}`);
        }
        // Save the first preview as the actual voice
        const voiceId = await saveVoice(
          previews[0].generatedVoiceId,
          `CastForge-${host.name}-${episode.id}`,
          host.description,
        );
        voiceIds[idx] = voiceId;
        return { name: host.name, description: host.description, voiceId };
      }),
    );

    req.log.info({ episodeId: episode.id, voiceIds }, "Voices created");
    sendEvent(res, { step: "voices_done", message: `Hosts cast: ${hosts.map((h) => h.name).join(" & ")}`, progress: 28 });

    // ─── STEP 2: Script Generation + SFX/Music (parallel) ───
    sendEvent(res, { step: "script", message: "Writing the script...", progress: 32 });

    const [scriptLines, sfxBuffer, musicBuffer] = await Promise.all([
      generateScript(topic, format, hosts),
      generateSoundEffect(SFX_PROMPTS[format] ?? SFX_PROMPTS.explainer, 3).catch((e) => {
        req.log.warn({ err: e }, "SFX generation failed, skipping");
        return undefined;
      }),
      generateMusic(MUSIC_PROMPTS[format] ?? MUSIC_PROMPTS.explainer, 10000).catch((e) => {
        req.log.warn({ err: e }, "Music generation failed, skipping");
        return undefined;
      }),
    ]);

    req.log.info({ episodeId: episode.id, lineCount: scriptLines.length }, "Script generated");
    sendEvent(res, { step: "sfx", message: "Setting the stage...", progress: 55 });

    // Map script voice labels (A, B, C) to actual voice IDs
    const dialogueInputs = scriptLines.map((line) => {
      const idx = line.voice.charCodeAt(0) - 65;
      const voiceId = voiceIds[idx] ?? voiceIds[0];
      return { voiceId, text: line.text };
    });

    // ─── STEP 3: Text-to-Dialogue ───
    sendEvent(res, { step: "recording", message: "Recording...", progress: 65 });

    const dialogueBuffer = await generateDialogue(dialogueInputs);
    req.log.info({ episodeId: episode.id, bytes: dialogueBuffer.length }, "Dialogue generated");

    // ─── STEP 4: Audio Mixing ───
    sendEvent(res, { step: "mastering", message: "Mastering...", progress: 82 });

    const filename = `episode-${episode.id}.mp3`;
    const outputPath = await mixAudio({
      introMusicBuffer: musicBuffer ?? undefined,
      dialogueBuffer,
      outroMusicBuffer: musicBuffer ?? undefined,
      outputFilename: filename,
    });

    const duration = await getAudioDuration(outputPath);
    const audioUrl = `/api/castforge/audio/${filename}`;
    const scriptText = scriptToText(scriptLines, hosts);

    // ─── STEP 5: Update DB ───
    await db
      .update(episodesTable)
      .set({
        hosts: hostsWithVoices,
        audioUrl,
        scriptText,
        duration: duration > 0 ? duration : null,
        status: "ready",
      })
      .where(eq(episodesTable.id, episode.id));

    req.log.info({ episodeId: episode.id, duration, audioUrl }, "Episode generation complete");
    sendEvent(res, {
      step: "done",
      episodeId: episode.id,
      audioUrl,
      duration,
      progress: 100,
      message: "Your podcast is ready!",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    req.log.error({ episodeId: episode.id, err }, "Episode generation failed");

    await db
      .update(episodesTable)
      .set({ status: "failed", errorMessage: message })
      .where(eq(episodesTable.id, episode.id));

    sendEvent(res, { step: "error", episodeId: episode.id, message, progress: 0 });
  }

  res.end();
});

// Serve audio files
router.get("/castforge/audio/:filename", (req, res): void => {
  const rawFilename = Array.isArray(req.params.filename)
    ? req.params.filename[0]
    : req.params.filename;

  // Sanitize filename - only allow alphanumeric, dash, underscore, dot
  const safe = rawFilename.replace(/[^a-zA-Z0-9\-_.]/g, "");
  if (!safe || !safe.endsWith(".mp3")) {
    res.status(400).json({ error: "Invalid filename" });
    return;
  }

  const filePath = path.join(getUploadsDir(), safe);
  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Accept-Ranges", "bytes");
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).json({ error: "Audio file not found" });
    }
  });
});

function getSampleText(format: string, hostName: string): string {
  const samples: Record<string, string> = {
    comedy: `Okay, so here's the thing—${hostName} and I completely disagree on this, and I think that's what makes it so interesting.`,
    debate: `The evidence is clear, and I'm going to walk you through exactly why the conventional wisdom here is completely wrong.`,
    explainer: `Wait, so you're telling me that the thing we all think we know about this is actually completely backwards?`,
    true_crime: `What happened next is something no one—not even the investigators—saw coming. And trust me, once you hear this, you won't sleep tonight.`,
    hot_takes: `I'm just going to say it. Everyone's been dancing around this for years and I'm done. Here's the truth.`,
    interview: `I've spent the last fifteen years studying this, and what I discovered changed everything I thought I knew.`,
  };
  return samples[format] ?? samples.explainer;
}

export default router;
