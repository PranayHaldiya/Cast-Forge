import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, episodesTable } from "@workspace/db";
import {
  ListEpisodesResponse,
  GetEpisodeResponse,
  GetEpisodeParams,
  DeleteEpisodeParams,
} from "@workspace/api-zod";
import { deleteAudioFile } from "../../lib/elevenlabs.js";

const router: IRouter = Router();

router.get("/castforge/episodes", async (_req, res): Promise<void> => {
  const episodes = await db
    .select()
    .from(episodesTable)
    .orderBy(episodesTable.createdAt);

  const mapped = episodes.map((e) => ({
    id: e.id,
    topic: e.topic,
    format: e.format,
    hosts: e.hosts as Array<{ name: string; description: string; voiceId: string | null }>,
    audioUrl: e.audioUrl ?? null,
    scriptText: e.scriptText ?? null,
    duration: e.duration ?? null,
    status: e.status as "pending" | "generating" | "ready" | "failed",
    errorMessage: e.errorMessage ?? null,
    createdAt: e.createdAt.toISOString(),
  }));

  res.json(ListEpisodesResponse.parse(mapped));
});

router.get("/castforge/episodes/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetEpisodeParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [episode] = await db
    .select()
    .from(episodesTable)
    .where(eq(episodesTable.id, params.data.id));

  if (!episode) {
    res.status(404).json({ error: "Episode not found" });
    return;
  }

  res.json(
    GetEpisodeResponse.parse({
      id: episode.id,
      topic: episode.topic,
      format: episode.format,
      hosts: episode.hosts as Array<{ name: string; description: string; voiceId: string | null }>,
      audioUrl: episode.audioUrl ?? null,
      scriptText: episode.scriptText ?? null,
      duration: episode.duration ?? null,
      status: episode.status as "pending" | "generating" | "ready" | "failed",
      errorMessage: episode.errorMessage ?? null,
      createdAt: episode.createdAt.toISOString(),
    }),
  );
});

router.delete("/castforge/episodes/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteEpisodeParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [episode] = await db
    .select()
    .from(episodesTable)
    .where(eq(episodesTable.id, params.data.id));

  if (!episode) {
    res.status(404).json({ error: "Episode not found" });
    return;
  }

  // Delete audio file if it exists
  if (episode.audioUrl) {
    const filename = episode.audioUrl.split("/").pop();
    if (filename) deleteAudioFile(filename);
  }

  await db.delete(episodesTable).where(eq(episodesTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
