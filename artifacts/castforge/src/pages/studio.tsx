import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useGenerateEpisode } from "@/hooks/use-generate-episode";
import { Button } from "@/components/ui/button";
import { Loader2, Mic2, AlertCircle } from "lucide-react";

export default function Studio() {
  const [, setLocation] = useLocation();
  const { generate, currentStep, error } = useGenerateEpisode();
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    
    const payloadStr = sessionStorage.getItem("castforge_generation_payload");
    if (!payloadStr) {
      setLocation("/");
      return;
    }

    try {
      const payload = JSON.parse(payloadStr);
      hasStarted.current = true;
      generate(payload);
    } catch (e) {
      setLocation("/");
    }
  }, [generate, setLocation]);

  useEffect(() => {
    if (currentStep?.step === "done" && currentStep.episodeId) {
      // Small delay for dramatic effect
      const timer = setTimeout(() => {
        sessionStorage.removeItem("castforge_generation_payload");
        setLocation(`/episodes/${currentStep.episodeId}`);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, setLocation]);

  const progress = currentStep?.progress || 0;

  return (
    <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)] p-4 relative z-10">
      <div className="max-w-xl w-full text-center space-y-8">
        
        {error ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-destructive/10 border border-destructive/20 rounded-2xl p-8 space-y-4"
          >
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-2xl font-bold text-white">Production Failed</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button 
              variant="outline" 
              onClick={() => setLocation("/")}
              className="mt-4"
            >
              Try Again
            </Button>
          </motion.div>
        ) : (
          <>
            <div className="relative h-48 w-full flex items-center justify-center">
              {/* Studio recording indicator */}
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute w-32 h-32 rounded-full bg-primary/20 blur-2xl"
              />
              <div className="relative flex items-center gap-2">
                <Mic2 className="h-12 w-12 text-primary" />
                <span className="text-primary font-bold text-2xl tracking-widest uppercase">REC</span>
                <motion.div 
                  animate={{ opacity: [1, 0, 1] }} 
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-3 h-3 rounded-full bg-destructive"
                />
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                {currentStep?.message || "Preparing studio..."}
              </h2>
              
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-primary to-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              
              <p className="text-xl text-muted-foreground font-mono">
                {progress}%
              </p>
            </div>

            {/* Audio Waveform Animation purely for aesthetics */}
            <div className="flex items-center justify-center gap-1 h-16 pt-8">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1.5 bg-primary/50 rounded-full"
                  animate={{
                    height: ["20%", "100%", "20%"]
                  }}
                  transition={{
                    duration: 1 + Math.random(),
                    repeat: Infinity,
                    delay: Math.random() * 2
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
