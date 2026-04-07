import path from "path";
import fs from "fs";
import { Readable } from "stream";

const BASE_URL = "https://api.elevenlabs.io/v1";

function getApiKey(): string {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY must be set");
  return key;
}

function getHeaders(extra?: Record<string, string>) {
  return {
    "xi-api-key": getApiKey(),
    "Content-Type": "application/json",
    ...extra,
  };
}

async function handleResponse(res: Response, label: string): Promise<Buffer> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ElevenLabs ${label} failed (${res.status}): ${text}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export interface VoicePreview {
  generatedVoiceId: string;
  audioBase64: string;
  mediaType: string;
}

export async function createVoicePreviews(
  description: string,
  sampleText?: string,
): Promise<VoicePreview[]> {
  const text = sampleText ?? "Hello and welcome to the show! I'm so excited to be here with you today.";
  const res = await fetch(`${BASE_URL}/text-to-voice/create-previews`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      voice_description: description,
      text,
      auto_generate_text: false,
    }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Voice preview failed (${res.status}): ${errorText}`);
  }
  const data = (await res.json()) as {
    previews: Array<{ generated_voice_id: string; audio_sample: string; media_type: string }>;
  };
  return (data.previews ?? []).map((p) => ({
    generatedVoiceId: p.generated_voice_id,
    audioBase64: p.audio_sample,
    mediaType: p.media_type ?? "audio/mpeg",
  }));
}

export async function saveVoice(
  generatedVoiceId: string,
  name: string,
  description: string,
): Promise<string> {
  const res = await fetch(`${BASE_URL}/text-to-voice/create`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ generated_voice_id: generatedVoiceId, voice_name: name, voice_description: description }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Save voice failed (${res.status}): ${errorText}`);
  }
  const data = (await res.json()) as { voice_id: string };
  return data.voice_id;
}

export interface DialogueInput {
  voiceId: string;
  text: string;
}

export async function generateDialogue(inputs: DialogueInput[]): Promise<Buffer> {
  const res = await fetch(`${BASE_URL}/text-to-dialogue`, {
    method: "POST",
    headers: { ...getHeaders(), Accept: "audio/mpeg" },
    body: JSON.stringify({
      inputs: inputs.map((i) => ({ voice_id: i.voiceId, text: i.text })),
      model_id: "eleven_v3",
    }),
  });
  return handleResponse(res, "text-to-dialogue");
}

export async function generateSoundEffect(
  description: string,
  durationSeconds = 3,
): Promise<Buffer> {
  const res = await fetch(`${BASE_URL}/sound-generation`, {
    method: "POST",
    headers: { ...getHeaders(), Accept: "audio/mpeg" },
    body: JSON.stringify({
      text: description,
      duration_seconds: durationSeconds,
      prompt_influence: 0.7,
    }),
  });
  return handleResponse(res, "sound-generation");
}

export async function generateMusic(
  prompt: string,
  lengthMs = 12000,
): Promise<Buffer> {
  const res = await fetch(`${BASE_URL}/music/stream`, {
    method: "POST",
    headers: { ...getHeaders(), Accept: "audio/mpeg" },
    body: JSON.stringify({
      prompt,
      music_length_ms: lengthMs,
    }),
  });
  return handleResponse(res, "music/stream");
}

export async function textToSpeechFlash(voiceId: string, text: string): Promise<Buffer> {
  const res = await fetch(`${BASE_URL}/text-to-speech/${voiceId}/stream`, {
    method: "POST",
    headers: { ...getHeaders(), Accept: "audio/mpeg" },
    body: JSON.stringify({
      text,
      model_id: "eleven_flash_v2_5",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });
  return handleResponse(res, "text-to-speech");
}

// Get uploads directory, creating it if it doesn't exist
export function getUploadsDir(): string {
  const dir = path.join(process.cwd(), "uploads", "castforge");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function saveAudioFile(buffer: Buffer, filename: string): string {
  const dir = getUploadsDir();
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

export function deleteAudioFile(filename: string): void {
  const dir = getUploadsDir();
  const filePath = path.join(dir, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
