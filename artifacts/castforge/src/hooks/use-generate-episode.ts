import { useState, useEffect } from "react";
import { type GenerateEpisodeBody } from "@workspace/api-client-react";

export type GenerationStep = {
  step: "start" | "voices" | "voices_done" | "script" | "sfx" | "recording" | "mastering" | "done" | "error";
  message: string;
  progress: number;
  episodeId?: number;
  audioUrl?: string;
  duration?: number;
};

export function useGenerateEpisode() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<GenerationStep | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async (body: GenerateEpisodeBody) => {
    setIsGenerating(true);
    setCurrentStep({ step: "start", message: "Connecting to studio...", progress: 0 });
    setError(null);

    try {
      const response = await fetch("/api/castforge/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Failed to start generation");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.replace("data: ", "");
            if (dataStr === "[DONE]") {
              break;
            }
            try {
              const data = JSON.parse(dataStr) as GenerationStep;
              setCurrentStep(data);
              if (data.step === "error") {
                setError(data.message);
                setIsGenerating(false);
              }
              if (data.step === "done") {
                setIsGenerating(false);
              }
            } catch (e) {
              console.error("Failed to parse SSE data", e);
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setIsGenerating(false);
    }
  };

  return { generate, isGenerating, currentStep, error };
}
