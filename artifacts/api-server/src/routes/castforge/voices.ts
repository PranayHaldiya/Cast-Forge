import { Router, type IRouter } from "express";
import { PreviewVoiceBody, PreviewVoiceResponse, SaveVoiceBody, SaveVoiceResponse } from "@workspace/api-zod";
import { createVoicePreviews, saveVoice } from "../../lib/elevenlabs.js";

const router: IRouter = Router();

router.post("/castforge/voices/preview", async (req, res): Promise<void> => {
  const parsed = PreviewVoiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const previews = await createVoicePreviews(
    parsed.data.description,
    parsed.data.sampleText ?? undefined,
  );

  res.json(PreviewVoiceResponse.parse({ previews }));
});

router.post("/castforge/voices/save", async (req, res): Promise<void> => {
  const parsed = SaveVoiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const voiceId = await saveVoice(
    parsed.data.generatedVoiceId,
    parsed.data.name,
    parsed.data.description,
  );

  res.json(SaveVoiceResponse.parse({ voiceId, name: parsed.data.name }));
});

export default router;
