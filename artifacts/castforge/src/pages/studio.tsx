import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useGenerateEpisode } from "@/hooks/use-generate-episode";
import { Mic2, AlertCircle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const STAGE_ORDER = [
  "voices",
  "script",
  "sfx",
  "recording",
  "stitching",
  "mastering",
  "done",
];

export default function Studio() {
  const [, setLocation] = useLocation();
  const { generate, currentStep, error } = useGenerateEpisode();
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    const payloadStr = sessionStorage.getItem("castforge_generation_payload");
    if (!payloadStr) { setLocation("/"); return; }
    try {
      const payload = JSON.parse(payloadStr);
      hasStarted.current = true;
      generate(payload);
    } catch {
      setLocation("/");
    }
  }, [generate, setLocation]);

  useEffect(() => {
    if (currentStep?.step === "done" && currentStep.episodeId) {
      const timer = setTimeout(() => {
        sessionStorage.removeItem("castforge_generation_payload");
        setLocation(`/episodes/${currentStep.episodeId}`);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, setLocation]);

  const progress = currentStep?.progress || 0;
  const isDone = currentStep?.step === "done";
  const currentStageIndex = currentStep?.step ? STAGE_ORDER.indexOf(currentStep.step) : -1;

  return (
    <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-3.5rem)] p-4 relative z-10">
      <div className="max-w-lg w-full space-y-12">

        {error ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 text-center"
          >
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-sm border border-accent/30 bg-accent/10">
              <AlertCircle className="h-8 w-8 text-accent" />
            </div>
            <div>
              <h2 className="font-display text-5xl tracking-wide text-foreground mb-3">PRODUCTION FAILED</h2>
              <p className="font-sans text-sm text-muted-foreground leading-relaxed">{error}</p>
            </div>
            <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm border border-border bg-card hover:bg-card/80 font-mono text-xs uppercase tracking-wider text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Try Again
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Top: REC indicator */}
            <div className="flex items-center justify-center gap-3">
              <motion.div
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 1.2, repeat: isDone ? 0 : Infinity }}
                className="h-2.5 w-2.5 rounded-full bg-accent"
              />
              <span className="font-mono text-sm uppercase tracking-[0.3em] text-muted-foreground">
                {isDone ? "Complete" : "Recording"}
              </span>
            </div>

            {/* Main waveform visual */}
            <div className="flex items-end justify-center gap-[3px] h-24">
              {[...Array(36)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-[4px] rounded-[2px] bg-primary/50"
                  animate={isDone
                    ? { height: "40%" }
                    : { height: ["8%", "80%", "25%", "95%", "15%", "60%", "30%"] }
                  }
                  transition={{
                    duration: 1.2 + (i % 5) * 0.15,
                    repeat: isDone ? 0 : Infinity,
                    delay: (i * 0.04) % 0.6,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>

            {/* Message */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep?.message ?? "init"}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="text-center space-y-2"
              >
                <h2 className="font-display text-[clamp(2rem,6vw,3.5rem)] leading-none tracking-wide text-foreground">
                  {isDone ? "EPISODE READY" : (currentStep?.message?.toUpperCase() ?? "PREPARING STUDIO")}
                </h2>
              </motion.div>
            </AnimatePresence>

            {/* Progress bar */}
            <div className="space-y-3">
              <div className="h-[3px] w-full bg-border rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>

              {/* Stage markers */}
              <div className="flex justify-between">
                {STAGE_ORDER.filter(s => s !== "done").map((stage, i) => {
                  const done = i <= currentStageIndex && !isDone ? true : isDone ? true : false;
                  const active = STAGE_ORDER[currentStageIndex] === stage;
                  return (
                    <div key={stage} className="flex flex-col items-center gap-1">
                      <div className={`h-1 w-1 rounded-full transition-colors ${
                        done || active ? "bg-primary" : "bg-border"
                      }`} />
                      <span className={`hidden md:block font-mono text-[8px] uppercase tracking-wider transition-colors ${
                        active ? "text-primary" : done ? "text-muted-foreground/60" : "text-muted-foreground/25"
                      }`}>
                        {stage.replace("_", " ")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Percentage */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground/40 uppercase tracking-widest">Progress</span>
              <span className="font-mono text-lg text-primary">{progress}%</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-border" />
              <div className="flex items-center gap-2">
                <Mic2 className="h-4 w-4 text-primary" />
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/40">
                  CastForge Studio
                </span>
              </div>
              <div className="h-px flex-1 bg-border" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
