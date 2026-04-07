import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "wouter";
import { useGetEpisode } from "@workspace/api-client-react";
import WaveSurfer from "wavesurfer.js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Play, Pause, SkipBack, SkipForward, Download, 
  Share2, ChevronDown, ChevronUp, Radio, Headphones 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

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
      waveColor: 'rgba(139, 92, 246, 0.4)', // primary/40
      progressColor: '#8B5CF6', // primary
      cursorColor: '#F59E0B', // accent
      barWidth: 3,
      barGap: 3,
      barRadius: 3,
      height: 100,
      normalize: true,
      url: episode.audioUrl,
    });

    ws.on('ready', () => {
      setDuration(ws.getDuration());
    });

    ws.on('audioprocess', () => {
      setCurrentTime(ws.getCurrentTime());
    });

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
    ws.on('finish', () => setIsPlaying(false));

    wavesurferRef.current = ws;

    return () => {
      ws.destroy();
    };
  }, [episode?.audioUrl]);

  const togglePlay = () => {
    wavesurferRef.current?.playPause();
  };

  const skip = (seconds: number) => {
    wavesurferRef.current?.skip(seconds);
  };

  const cyclePlaybackRate = () => {
    const rates = [0.5, 1, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    wavesurferRef.current?.setPlaybackRate(nextRate);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copied to clipboard!" });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4 text-muted-foreground">
          <Radio className="h-8 w-8 animate-bounce" />
          Tuning in...
        </div>
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">Episode not found</h2>
          <Button asChild variant="outline">
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl relative z-10 flex flex-col min-h-[calc(100vh-4rem)]">
      
      {/* Header Info */}
      <div className="text-center mb-12 mt-8 space-y-4">
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 mb-2">
          {episode.format.replace("_", " ")}
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold text-white max-w-3xl mx-auto leading-tight">
          {episode.topic}
        </h1>
        <p className="text-muted-foreground text-lg flex items-center justify-center gap-2">
          <Headphones className="h-5 w-5" />
          Hosted by {episode.hosts.map(h => h.name).join(" & ")}
        </p>
      </div>

      {/* Main Player Card */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden mb-12">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-50" />
        
        {/* Waveform */}
        <div className="w-full mb-8 relative">
          <div ref={waveformRef} className="w-full relative z-10" />
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-sm font-mono text-muted-foreground w-24 text-center md:text-left">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => skip(-15)} className="text-white hover:bg-white/10 rounded-full h-12 w-12">
              <SkipBack className="h-6 w-6" />
            </Button>
            
            <Button 
              size="icon" 
              onClick={togglePlay}
              className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all hover:scale-105"
            >
              {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
            </Button>
            
            <Button variant="ghost" size="icon" onClick={() => skip(15)} className="text-white hover:bg-white/10 rounded-full h-12 w-12">
              <SkipForward className="h-6 w-6" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={cyclePlaybackRate} className="font-mono bg-white/5 border-white/10 hover:bg-white/10 rounded-full w-14">
              {playbackRate}x
            </Button>
            
            {episode.audioUrl && (
              <Button asChild variant="outline" size="icon" className="bg-white/5 border-white/10 hover:bg-white/10 rounded-full">
                <a href={episode.audioUrl} download>
                  <Download className="h-4 w-4 text-white" />
                </a>
              </Button>
            )}
            
            <Button variant="outline" size="icon" onClick={copyShareLink} className="bg-white/5 border-white/10 hover:bg-white/10 rounded-full">
              <Share2 className="h-4 w-4 text-white" />
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12">
        {/* Hosts Info */}
        <div className="md:col-span-1 space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <MicIcon className="h-5 w-5 text-primary" />
            Your Hosts
          </h3>
          <div className="space-y-4">
            {episode.hosts.map((host, i) => (
              <Card key={i} className="p-4 bg-white/5 border-white/10">
                <h4 className="font-bold text-white">{host.name}</h4>
                <p className="text-sm text-muted-foreground mt-1">{host.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Script */}
        <div className="md:col-span-2">
          {episode.scriptText && (
            <Card className="bg-white/5 border-white/10 overflow-hidden">
              <Button 
                variant="ghost" 
                onClick={() => setShowScript(!showScript)}
                className="w-full flex items-center justify-between p-4 h-auto rounded-none hover:bg-white/10 text-white font-semibold text-lg"
              >
                Generated Script
                {showScript ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </Button>
              
              <AnimatePresence>
                {showScript && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <Separator className="bg-white/10" />
                    <div className="p-4 bg-black/20">
                      <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-4 whitespace-pre-wrap font-mono text-sm leading-relaxed text-muted-foreground">
                          {episode.scriptText}
                        </div>
                      </ScrollArea>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function MicIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  )
}
