import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "wouter";
import { useGetEpisode } from "@workspace/api-client-react";
import WaveSurfer from "wavesurfer.js";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Play, Pause, SkipBack, SkipForward, Download,
  Share2, ChevronDown, ChevronUp, Radio, ArrowLeft, Mic2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const FORMAT_LABELS: Record<string, string> = {
  comedy: "COMEDY", debate: "DEBATE", explainer: "EXPLAINER",
  true_crime: "TRUE CRIME", hot_takes: "HOT TAKES", interview: "INTERVIEW",
};

export default function EpisodePlayer() {
  const params = useParams();
  const id = Number(params.id);
  const { data: episode, isLoading } = useGetEpisode(id, { query: { enabled: !!id } });
  const { toast } = useToast();

  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showScript, setShowScript] = useState(false);

  useEffect(() => {
    if (!waveformRef.current || !episode?.audioUrl) return;

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "rgba(234, 170, 52, 0.25)",
      progressColor: "rgba(234, 170, 52, 0.85)",
      cursorColor: "rgba(230, 57, 70, 0.8)",
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      height: 80,
      normalize: true,
      url: episode.audioUrl,
    });

    ws.on("ready", () => setDuration(ws.getDuration()));
    ws.on("audioprocess", () => setCurrentTime(ws.getCurrentTime()));
    ws.on("play", () => setIsPlaying(true));
    ws.on("pause", () => setIsPlaying(false));
    ws.on("finish", () => setIsPlaying(false));

    wavesurferRef.current = ws;
    return () => ws.destroy();
  }, [episode?.audioUrl]);

  const togglePlay = () => wavesurferRef.current?.playPause();
  const skip = (s: number) => wavesurferRef.current?.skip(s);
  const cyclePlaybackRate = () => {
    const rates = [0.5, 1, 1.25, 1.5, 2];
    const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(next);
    wavesurferRef.current?.setPlaybackRate(next);
  };
  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copied" });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground/40">
          <Radio className="h-7 w-7 animate-spin" style={{ animationDuration: "2s" }} />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em]">Tuning in</span>
        </div>
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="font-display text-5xl tracking-wide text-foreground">NOT FOUND</h2>
          <Link href="/episodes" className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl relative z-10">

      {/* Breadcrumb */}
      <div className="mb-10">
        <Link href="/episodes" className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/40 hover:text-muted-foreground transition-colors">
          <ArrowLeft className="h-3 w-3" /> Library
        </Link>
      </div>

      {/* Header */}
      <div className="mb-12 space-y-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary border border-primary/30 rounded-sm px-1.5 py-0.5">
            {FORMAT_LABELS[episode.format] ?? episode.format}
          </span>
        </div>
        <h1 className="font-display text-[clamp(2rem,6vw,4rem)] leading-none tracking-wide text-foreground">
          {episode.topic.toUpperCase()}
        </h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mic2 className="h-4 w-4 text-primary shrink-0" />
          <span className="font-sans">{episode.hosts.map((h) => h.name).join(" & ")}</span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-border mb-10" />

      {/* Player */}
      <div className="rounded-sm border border-border bg-card/60 p-6 md:p-8 mb-10 space-y-8">
        {/* Waveform */}
        <div ref={waveformRef} className="w-full" />

        {/* Time + Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="font-mono text-sm text-muted-foreground tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={() => skip(-15)}
              className="h-10 w-10 flex items-center justify-center rounded-sm border border-border text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
            >
              <SkipBack className="h-4 w-4" />
            </button>

            <button
              onClick={togglePlay}
              className="h-14 w-14 flex items-center justify-center rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all amber-glow"
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6 ml-0.5" />
              )}
            </button>

            <button
              onClick={() => skip(15)}
              className="h-10 w-10 flex items-center justify-center rounded-sm border border-border text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={cyclePlaybackRate}
              className="px-3 py-1.5 rounded-sm border border-border font-mono text-xs text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors tabular-nums w-12 text-center"
            >
              {playbackRate}x
            </button>
            {episode.audioUrl && (
              <a
                href={episode.audioUrl}
                download
                className="h-8 w-8 flex items-center justify-center rounded-sm border border-border text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
              </a>
            )}
            <button
              onClick={copyShareLink}
              className="h-8 w-8 flex items-center justify-center rounded-sm border border-border text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Hosts + Script grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-14">
        {/* Hosts */}
        <div className="space-y-3">
          <div className="flex items-center gap-4 mb-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/50">Hosts</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          {episode.hosts.map((host, i) => (
            <div key={i} className="p-4 rounded-sm border border-border bg-card/40 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <h4 className="font-sans font-semibold text-sm text-foreground">{host.name}</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pl-3.5">{host.description}</p>
            </div>
          ))}
        </div>

        {/* Script */}
        <div className="md:col-span-2">
          {episode.scriptText && (
            <div className="rounded-sm border border-border bg-card/40 overflow-hidden">
              <button
                onClick={() => setShowScript(!showScript)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-card/80 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/50">Script</span>
                  <div className="h-px w-12 bg-border" />
                </div>
                {showScript
                  ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>

              <AnimatePresence>
                {showScript && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden border-t border-border"
                  >
                    <ScrollArea className="h-[380px] p-5">
                      <div className="font-mono text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
                        {episode.scriptText}
                      </div>
                    </ScrollArea>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
