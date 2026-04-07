import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import { createRequire } from "module";
import { getUploadsDir } from "./elevenlabs.js";

const execAsync = promisify(exec);

function getFfmpegPath(): string {
  try {
    const require = createRequire(import.meta.url);
    const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
    return ffmpegInstaller.path;
  } catch {
    return "ffmpeg";
  }
}

function getFfprobePath(): string {
  return "ffprobe";
}

const FFMPEG = getFfmpegPath();

/**
 * Mix intro music + dialogue + outro music into a single MP3 using ffmpeg.
 * Falls back to returning dialogue-only if ffmpeg fails.
 */
export async function mixAudio(params: {
  introMusicBuffer?: Buffer;
  dialogueBuffer: Buffer;
  outroMusicBuffer?: Buffer;
  outputFilename: string;
}): Promise<string> {
  const dir = getUploadsDir();
  const tmpFiles: string[] = [];

  try {
    const outputPath = path.join(dir, params.outputFilename);

    if (!params.introMusicBuffer && !params.outroMusicBuffer) {
      fs.writeFileSync(outputPath, params.dialogueBuffer);
      return outputPath;
    }

    const dialoguePath = path.join(dir, `tmp_dialogue_${Date.now()}.mp3`);
    fs.writeFileSync(dialoguePath, params.dialogueBuffer);
    tmpFiles.push(dialoguePath);

    let inputArgs = "";
    let filterComplex = "";

    if (params.introMusicBuffer && params.outroMusicBuffer) {
      const introPath = path.join(dir, `tmp_intro_${Date.now()}.mp3`);
      const outroPath = path.join(dir, `tmp_outro_${Date.now()}.mp3`);
      fs.writeFileSync(introPath, params.introMusicBuffer);
      fs.writeFileSync(outroPath, params.outroMusicBuffer);
      tmpFiles.push(introPath, outroPath);

      inputArgs = `-i "${introPath}" -i "${dialoguePath}" -i "${outroPath}"`;
      filterComplex = `[0]atrim=duration=8,volume=0.4,afade=t=out:st=6:d=2[intro];[2]atrim=duration=8,volume=0.4,afade=t=in:st=0:d=2[outro];[intro][1][outro]concat=n=3:v=0:a=1[out]`;
    } else {
      fs.writeFileSync(outputPath, params.dialogueBuffer);
      return outputPath;
    }

    const cmd = `"${FFMPEG}" -y ${inputArgs} -filter_complex "${filterComplex}" -map "[out]" -ar 44100 -ab 128k "${outputPath}" 2>&1`;
    await execAsync(cmd, { timeout: 60000 });

    return outputPath;
  } catch {
    // Fallback: save dialogue without music
    const outputPath = path.join(dir, params.outputFilename);
    fs.writeFileSync(outputPath, params.dialogueBuffer);
    return outputPath;
  } finally {
    for (const f of tmpFiles) {
      try {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      } catch {}
    }
  }
}

/**
 * Concatenate an array of MP3 buffers into a single MP3.
 * Uses ffmpeg for clean concatenation, falls back to raw Buffer.concat
 * which works fine for sequential MP3 TTS audio.
 */
export async function concatenateAudioBuffers(buffers: Buffer[]): Promise<Buffer> {
  if (buffers.length === 0) return Buffer.alloc(0);
  if (buffers.length === 1) return buffers[0];

  const dir = getUploadsDir();
  const ts = Date.now();
  const tmpFiles: string[] = [];

  try {
    const inputPaths: string[] = [];
    for (let i = 0; i < buffers.length; i++) {
      const tmpPath = path.join(dir, `tmp_seg_${ts}_${i}.mp3`);
      fs.writeFileSync(tmpPath, buffers[i]);
      tmpFiles.push(tmpPath);
      inputPaths.push(tmpPath);
    }

    const concatListPath = path.join(dir, `tmp_concat_list_${ts}.txt`);
    const listContent = inputPaths.map((p) => `file '${p}'`).join("\n");
    fs.writeFileSync(concatListPath, listContent);
    tmpFiles.push(concatListPath);

    const outputPath = path.join(dir, `tmp_stitched_${ts}.mp3`);
    tmpFiles.push(outputPath);
    const cmd = `"${FFMPEG}" -y -f concat -safe 0 -i "${concatListPath}" -c copy "${outputPath}" 2>&1`;
    await execAsync(cmd, { timeout: 120000 });

    return fs.readFileSync(outputPath);
  } catch {
    // Fallback: raw MP3 concatenation — works fine for sequential TTS segments
    return Buffer.concat(buffers);
  } finally {
    for (const f of tmpFiles) {
      try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {}
    }
  }
}

/**
 * Get duration of an audio file in seconds using ffprobe.
 * Returns 0 if ffprobe is unavailable.
 */
export async function getAudioDuration(filePath: string): Promise<number> {
  try {
    const cmd = `${getFfprobePath()} -v error -show_entries format=duration -of csv=p=0 "${filePath}"`;
    const { stdout } = await execAsync(cmd, { timeout: 10000 });
    return Math.round(parseFloat(stdout.trim()));
  } catch {
    return 0;
  }
}
