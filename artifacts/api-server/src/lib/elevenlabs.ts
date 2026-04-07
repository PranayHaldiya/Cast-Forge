import path from "path";
import fs from "fs";

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

const MIN_PREVIEW_TEXT_LENGTH = 100;
const MIN_VOICE_DESC_LENGTH = 20;

function padText(text: string, minLength: number, padWith: string): string {
  if (text.length >= minLength) return text;
  return text + " " + padWith.slice(0, minLength - text.length - 1);
}

export async function createVoicePreviews(
  description: string,
  sampleText?: string,
): Promise<VoicePreview[]> {
  const rawText = sampleText ?? "Hello and welcome to the show. Today we're going to dive into something truly fascinating that I think you'll find really interesting and worth your time.";
  const text = padText(rawText, MIN_PREVIEW_TEXT_LENGTH, "Today we are going to talk about something genuinely fascinating and thought-provoking that will keep you engaged throughout the entire episode.");
  const safeDescription = padText(description, MIN_VOICE_DESC_LENGTH, "A professional podcast host with a clear and engaging voice.");
  const res = await fetch(`${BASE_URL}/text-to-voice/create-previews`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      voice_description: safeDescription,
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
  const safeDescription = padText(description, MIN_VOICE_DESC_LENGTH, "A professional podcast host with a clear and engaging voice.");
  const res = await fetch(`${BASE_URL}/text-to-voice/create-voice-from-preview`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ generated_voice_id: generatedVoiceId, voice_name: name, voice_description: safeDescription }),
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

/**
 * Generate multi-speaker dialogue by synthesizing each line sequentially
 * to avoid hitting ElevenLabs concurrent request limits.
 */
export async function generateDialogue(inputs: DialogueInput[]): Promise<Buffer[]> {
  const buffers: Buffer[] = [];
  for (const input of inputs) {
    const buf = await textToSpeechFlash(input.voiceId, input.text);
    buffers.push(buf);
  }
  return buffers;
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
