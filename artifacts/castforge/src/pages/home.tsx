import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useGetHostPresets, useFetchUrlTopic, type GenerateEpisodeBodyFormat } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Mic, Zap, Users, ShieldAlert, Flame, Radio, AudioWaveform,
  Laugh, Swords, Search, GraduationCap, Mic2, Link2, X, Loader2,
  type LucideIcon,
} from "lucide-react";

const PRESET_ICONS: Record<string, LucideIcon> = {
  Laugh,
  Swords,
  Search,
  GraduationCap,
  Flame,
  Mic2,
};

const FORMATS: { id: GenerateEpisodeBodyFormat; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "comedy", label: "Comedy Roast", icon: <Zap className="h-5 w-5" />, desc: "High-energy banter and jokes" },
  { id: "debate", label: "Fierce Debate", icon: <Users className="h-5 w-5" />, desc: "Opposing views clashing" },
  { id: "explainer", label: "Deep Explainer", icon: <Mic className="h-5 w-5" />, desc: "Clear, structured breakdown" },
  { id: "true_crime", label: "True Crime", icon: <ShieldAlert className="h-5 w-5" />, desc: "Suspenseful investigation" },
  { id: "hot_takes", label: "Hot Takes", icon: <Flame className="h-5 w-5" />, desc: "Controversial opinions" },
  { id: "interview", label: "Expert Interview", icon: <Radio className="h-5 w-5" />, desc: "In-depth Q&A style" },
];

function isUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: presets, isLoading: isPresetsLoading } = useGetHostPresets();
  const fetchUrlMutation = useFetchUrlTopic();

  const [topic, setTopic] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<GenerateEpisodeBodyFormat | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // URL extraction state
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);
  const [sourceTitle, setSourceTitle] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);

  const handleTopicChange = useCallback((value: string) => {
    setTopic(value);
    if (isUrl(value)) {
      setDetectedUrl(value.trim());
    } else {
      setDetectedUrl(null);
      // If user edited the extracted topic manually, clear source attribution
      if (sourceUrl) {
        setSourceTitle(null);
        setSourceUrl(null);
      }
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
      const msg = err instanceof Error ? err.message : "Failed to extract content from this URL";
      toast({ title: "Could not read URL", description: msg, variant: "destructive" });
    }
  };

  const clearSource = () => {
    setSourceTitle(null);
    setSourceUrl(null);
    setTopic("");
    setDetectedUrl(null);
  };

  const handleGenerate = () => {
    if (!topic || topic.length < 3) {
      toast({ title: "Topic required", description: "Please enter a topic with at least 3 characters.", variant: "destructive" });
      return;
    }
    if (!selectedFormat) {
      toast({ title: "Format required", description: "Please select a show format.", variant: "destructive" });
      return;
    }
    if (!selectedPresetId) {
      toast({ title: "Hosts required", description: "Please select a host configuration.", variant: "destructive" });
      return;
    }

    const preset = presets?.find((p) => p.id === selectedPresetId);
    if (!preset) return;

    const payload = {
      topic,
      format: selectedFormat,
      hosts: preset.hosts,
    };

    sessionStorage.setItem("castforge_generation_payload", JSON.stringify(payload));
    setLocation("/studio");
  };

  const isFetching = fetchUrlMutation.isPending;

  return (
    <div className="container mx-auto px-4 py-12 md:py-24 max-w-5xl relative z-10">
      <div className="text-center mb-16 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-medium">
            <AudioWaveform className="h-4 w-4" />
            <span>Instant AI Podcast Studio</span>
          </div>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight text-white"
        >
          Produce a podcast <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">in 60 seconds.</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
        >
          Type a topic or paste a URL. Pick a vibe. Cast your hosts. Let the AI generate a fully produced, multi-voice audio experience instantly.
        </motion.p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-12"
      >
        {/* Step 1: Topic */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white/10 text-white font-bold">1</div>
            <h2 className="text-2xl font-bold text-white">What's the topic?</h2>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Input 
                value={topic}
                onChange={(e) => handleTopicChange(e.target.value)}
                placeholder="Type a topic or paste a URL to any article..."
                className="w-full text-xl md:text-2xl p-8 rounded-2xl bg-white/5 border-white/10 focus-visible:ring-primary h-24 placeholder:text-muted-foreground/50 transition-all focus:bg-white/10 pr-48"
              />

              {/* URL fetch button — shown when a URL is detected */}
              {detectedUrl && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Button
                    onClick={handleFetchUrl}
                    disabled={isFetching}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-white rounded-xl px-4 py-2 text-sm font-semibold"
                  >
                    {isFetching ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Reading...
                      </>
                    ) : (
                      <>
                        <Link2 className="mr-2 h-4 w-4" />
                        Extract Topic
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Source attribution chip */}
            {sourceTitle && sourceUrl && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 w-fit"
              >
                <Link2 className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-sm text-muted-foreground">Source:</span>
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline truncate max-w-xs"
                >
                  {sourceTitle}
                </a>
                <button
                  onClick={clearSource}
                  className="ml-1 text-muted-foreground hover:text-white transition-colors"
                  aria-label="Clear source"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )}

            {/* URL helper hint */}
            {!detectedUrl && !sourceUrl && (
              <p className="text-xs text-muted-foreground/50 pl-1">
                Tip: paste any article or blog URL to automatically extract the topic
              </p>
            )}
          </div>
        </section>

        {/* Step 2: Format */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white/10 text-white font-bold">2</div>
            <h2 className="text-2xl font-bold text-white">Choose the vibe</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {FORMATS.map((format) => (
              <Card 
                key={format.id}
                onClick={() => setSelectedFormat(format.id)}
                className={`p-4 cursor-pointer transition-all border-2 ${selectedFormat === format.id ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(139,92,246,0.2)]" : "border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10"}`}
              >
                <div className="flex flex-col gap-3">
                  <div className={`p-3 rounded-xl w-fit ${selectedFormat === format.id ? "bg-primary text-white" : "bg-white/10 text-muted-foreground"}`}>
                    {format.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{format.label}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{format.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Step 3: Hosts */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white/10 text-white font-bold">3</div>
            <h2 className="text-2xl font-bold text-white">Cast your hosts</h2>
          </div>
          
          {isPresetsLoading ? (
            <div className="h-40 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10">
              <div className="animate-pulse text-muted-foreground">Loading host presets...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {presets?.map((preset) => (
                <Card 
                  key={preset.id}
                  onClick={() => setSelectedPresetId(preset.id)}
                  className={`p-5 cursor-pointer transition-all border-2 ${selectedPresetId === preset.id ? "border-accent bg-accent/10 shadow-[0_0_20px_rgba(245,158,11,0.15)]" : "border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10"}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-white/5">
                      {(() => { const Icon = PRESET_ICONS[preset.icon] ?? Mic2; return <Icon className="h-6 w-6 text-primary" />; })()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-lg">{preset.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1 mb-3">{preset.description}</p>
                      <div className="space-y-2">
                        {preset.hosts.map((host, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                            <span className="text-white font-medium">{host.name}:</span>
                            <span className="text-muted-foreground truncate">{host.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        <div className="pt-8 pb-12 flex justify-center">
          <Button 
            size="lg" 
            onClick={handleGenerate}
            disabled={!topic || !selectedFormat || !selectedPresetId}
            className="text-lg px-12 py-8 rounded-full shadow-[0_0_40px_rgba(139,92,246,0.4)] hover:shadow-[0_0_60px_rgba(139,92,246,0.6)] transition-all bg-gradient-to-r from-primary to-accent hover:from-primary hover:to-accent/90 text-white font-bold border-none"
          >
            <Mic className="mr-2 h-5 w-5" />
            Generate Episode
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
