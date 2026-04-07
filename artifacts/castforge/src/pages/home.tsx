import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useGetHostPresets, useFetchUrlTopic, type GenerateEpisodeBodyFormat } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
  Mic, Zap, Users, ShieldAlert, Flame, Radio,
  Laugh, Swords, Search, GraduationCap, Mic2,
  Link2, X, Loader2, ArrowRight,
  type LucideIcon,
} from "lucide-react";

const PRESET_ICONS: Record<string, LucideIcon> = {
  Laugh, Swords, Search, GraduationCap, Flame, Mic2,
};

const FORMATS: { id: GenerateEpisodeBodyFormat; label: string; icon: LucideIcon; tag: string }[] = [
  { id: "comedy",    label: "Comedy Roast",    icon: Zap,        tag: "CHAOTIC" },
  { id: "debate",    label: "Fierce Debate",   icon: Users,      tag: "HEATED" },
  { id: "explainer", label: "Deep Explainer",  icon: Mic,        tag: "CLARITY" },
  { id: "true_crime",label: "True Crime",      icon: ShieldAlert,tag: "SUSPENSE" },
  { id: "hot_takes", label: "Hot Takes",       icon: Flame,      tag: "SPICY" },
  { id: "interview", label: "Expert Interview",icon: Radio,      tag: "IN-DEPTH" },
];

function isUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch { return false; }
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0 },
};

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: presets, isLoading: isPresetsLoading } = useGetHostPresets();
  const fetchUrlMutation = useFetchUrlTopic();

  const [topic, setTopic] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<GenerateEpisodeBodyFormat | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);
  const [sourceTitle, setSourceTitle] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);

  const handleTopicChange = useCallback((value: string) => {
    setTopic(value);
    if (isUrl(value)) {
      setDetectedUrl(value.trim());
    } else {
      setDetectedUrl(null);
      if (sourceUrl) { setSourceTitle(null); setSourceUrl(null); }
    }
  }, [sourceUrl]);

  const handleFetchUrl = async () => {
    if (!detectedUrl) return;
    try {
      const result = await fetchUrlMutation.mutateAsync({ data: { url: detectedUrl } });
      setTopic(result.topic);
      setSourceTitle(result.sourceTitle);
      setSourceUrl(result.sourceUrl);
      setDetectedUrl(null);
    } catch (err) {
      toast({
        title: "Could not read URL",
        description: err instanceof Error ? err.message : "Failed to extract content",
        variant: "destructive",
      });
    }
  };

  const clearSource = () => {
    setSourceTitle(null); setSourceUrl(null);
    setTopic(""); setDetectedUrl(null);
  };

  const handleGenerate = () => {
    if (!topic || topic.length < 3) {
      toast({ title: "Topic required", description: "Enter at least 3 characters.", variant: "destructive" });
      return;
    }
    if (!selectedFormat) {
      toast({ title: "Format required", description: "Pick a show format.", variant: "destructive" });
      return;
    }
    if (!selectedPresetId) {
      toast({ title: "Hosts required", description: "Select a host configuration.", variant: "destructive" });
      return;
    }
    const preset = presets?.find((p) => p.id === selectedPresetId);
    if (!preset) return;
    sessionStorage.setItem("castforge_generation_payload", JSON.stringify({
      topic, format: selectedFormat, hosts: preset.hosts,
    }));
    setLocation("/studio");
  };

  const isFetching = fetchUrlMutation.isPending;
  const canGenerate = !!(topic && topic.length >= 3 && selectedFormat && selectedPresetId);

  return (
    <div className="container mx-auto px-4 py-14 md:py-20 max-w-4xl relative z-10">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <motion.div
        className="mb-16 space-y-5"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.1 } } }}
      >
        {/* ON AIR badge */}
        <motion.div variants={fadeUp} className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-accent/15 border border-accent/25 font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
            <span className="onair-dot inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            On Air
          </span>
          {/* VU meter */}
          <div className="flex items-end gap-[3px] h-4">
            {[0.8, 1.2, 0.6, 1.0, 0.9, 1.3, 0.7].map((dur, i) => (
              <div
                key={i}
                className="vu-bar w-[3px] rounded-[1px] bg-primary/60"
                style={{ "--dur": `${dur}s`, animationDelay: `${i * 0.11}s` } as React.CSSProperties}
              />
            ))}
          </div>
        </motion.div>

        {/* Main headline */}
        <motion.h1 variants={fadeUp} className="font-display leading-none tracking-wide">
          <span className="block text-[clamp(3.5rem,12vw,8rem)] text-foreground">
            PRODUCE A PODCAST
          </span>
          <span className="block text-[clamp(3.5rem,12vw,8rem)] text-primary">
            IN 60 SECONDS.
          </span>
        </motion.h1>

        <motion.p variants={fadeUp} className="text-base md:text-lg text-muted-foreground max-w-xl font-sans leading-relaxed">
          Type a topic or paste a URL. Pick a vibe. Cast your hosts.
          The AI handles scripting, voices, sound design, and mixing.
        </motion.p>
      </motion.div>

      {/* ── Steps ────────────────────────────────────────────────── */}
      <motion.div
        className="space-y-14"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } } }}
      >

        {/* ── Step 01: Topic ─────────────────────────────────────── */}
        <motion.section variants={fadeUp} className="space-y-5">
          <StepLabel number="01" title="TOPIC" />

          <div className="space-y-3">
            <div className="relative group">
              {/* Gold left accent on focus */}
              <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-sm bg-primary/0 group-focus-within:bg-primary transition-colors duration-300" />

              <textarea
                value={topic}
                onChange={(e) => handleTopicChange(e.target.value)}
                placeholder={detectedUrl ? "URL detected — hit Extract to pull the topic" : "Type a topic or paste a URL to any article..."}
                rows={3}
                className="w-full resize-none bg-card/60 border border-border rounded-sm pl-6 pr-48 py-5 text-lg text-foreground placeholder:text-muted-foreground/40 font-sans leading-relaxed focus:outline-none focus:border-primary/50 focus:bg-card transition-colors"
              />

              {/* URL fetch button */}
              {detectedUrl && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <button
                    onClick={handleFetchUrl}
                    disabled={isFetching}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-primary text-primary-foreground font-mono text-xs uppercase tracking-wider hover:bg-primary/90 disabled:opacity-60 transition-colors"
                  >
                    {isFetching ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" />Reading</>
                    ) : (
                      <><Link2 className="h-3.5 w-3.5" />Extract</>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Source chip */}
            {sourceTitle && sourceUrl && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-card border border-border text-xs font-mono"
              >
                <Link2 className="h-3 w-3 text-primary shrink-0" />
                <span className="text-muted-foreground">SOURCE</span>
                <a href={sourceUrl} target="_blank" rel="noopener noreferrer"
                  className="text-primary hover:underline truncate max-w-[240px]">{sourceTitle}</a>
                <button onClick={clearSource} className="ml-1 text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </motion.div>
            )}

            {!detectedUrl && !sourceUrl && (
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/40 pl-1">
                Tip — paste any article URL to auto-extract the topic
              </p>
            )}
          </div>
        </motion.section>

        {/* ── Step 02: Format ────────────────────────────────────── */}
        <motion.section variants={fadeUp} className="space-y-5">
          <StepLabel number="02" title="FORMAT" />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {FORMATS.map((f) => {
              const Icon = f.icon;
              const active = selectedFormat === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedFormat(f.id)}
                  className={`relative flex flex-col gap-4 p-5 rounded-sm border text-left transition-all ${
                    active
                      ? "border-primary bg-primary/8 text-foreground"
                      : "border-border bg-card/40 text-muted-foreground hover:border-border/80 hover:bg-card/70 hover:text-foreground"
                  }`}
                >
                  {/* Active indicator bar */}
                  <div className={`absolute top-0 left-0 right-0 h-[2px] rounded-t-sm transition-all ${active ? "bg-primary" : "bg-transparent"}`} />
                  <div className="flex items-start justify-between">
                    <Icon className={`h-5 w-5 ${active ? "text-primary" : ""}`} />
                    <span className={`font-mono text-[9px] tracking-[0.18em] uppercase ${active ? "text-primary" : "text-muted-foreground/50"}`}>
                      {f.tag}
                    </span>
                  </div>
                  <span className="font-sans font-600 text-sm leading-tight">{f.label}</span>
                </button>
              );
            })}
          </div>
        </motion.section>

        {/* ── Step 03: Hosts ─────────────────────────────────────── */}
        <motion.section variants={fadeUp} className="space-y-5">
          <StepLabel number="03" title="HOSTS" />

          {isPresetsLoading ? (
            <div className="h-32 flex items-center justify-center rounded-sm border border-border bg-card/40">
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground/40 animate-pulse">
                Loading presets...
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {presets?.map((preset) => {
                const Icon = PRESET_ICONS[preset.icon] ?? Mic2;
                const active = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedPresetId(preset.id)}
                    className={`relative flex items-start gap-4 p-5 rounded-sm border text-left transition-all ${
                      active
                        ? "border-primary/50 bg-primary/6"
                        : "border-border bg-card/40 hover:border-border/80 hover:bg-card/70"
                    }`}
                  >
                    {/* Active left bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-sm transition-all ${active ? "bg-primary" : "bg-transparent"}`} />

                    <div className={`mt-0.5 p-2 rounded-sm border ${active ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"}`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-sans font-semibold text-sm ${active ? "text-foreground" : "text-foreground/80"}`}>{preset.name}</h3>
                        {active && (
                          <span className="font-mono text-[9px] uppercase tracking-widest text-primary border border-primary/30 rounded-sm px-1.5 py-0.5">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{preset.description}</p>
                      <div className="space-y-1.5">
                        {preset.hosts.map((host, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className={`w-1 h-1 rounded-full shrink-0 ${active ? "bg-primary" : "bg-muted-foreground/40"}`} />
                            <span className="font-mono text-[10px] text-foreground/70 font-medium shrink-0">{host.name}</span>
                            <span className="font-mono text-[10px] text-muted-foreground/60 truncate">{host.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </motion.section>

        {/* ── Generate ───────────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="pt-6 pb-14">
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={`group relative w-full flex items-center justify-center gap-3 py-5 rounded-sm font-display text-2xl tracking-[0.1em] transition-all ${
              canGenerate
                ? "bg-primary text-primary-foreground amber-glow hover:bg-primary/90 cursor-pointer"
                : "bg-card border border-border text-muted-foreground/40 cursor-not-allowed"
            }`}
          >
            {canGenerate && (
              <>
                {/* Shimmer sweep */}
                <div className="absolute inset-0 rounded-sm overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
              </>
            )}
            <Mic className="h-5 w-5" />
            GO ON AIR
            <ArrowRight className={`h-5 w-5 transition-transform ${canGenerate ? "group-hover:translate-x-1" : ""}`} />
          </button>

          {!canGenerate && (
            <p className="text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground/30 mt-3">
              {!topic ? "Enter a topic" : !selectedFormat ? "Pick a format" : "Select hosts"} to continue
            </p>
          )}
        </motion.div>

      </motion.div>
    </div>
  );
}

function StepLabel({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-[0.25em]">
        STEP {number}
      </span>
      <div className="h-px flex-1 bg-border" />
      <span className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-[0.25em]">
        {title}
      </span>
    </div>
  );
}
