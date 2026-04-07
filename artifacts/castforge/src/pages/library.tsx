import { useListEpisodes, useDeleteEpisode, getListEpisodesQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@workspace/replit-auth-web";
import { Play, Trash2, Headphones, Clock, Mic2, ArrowRight, LogIn } from "lucide-react";

function formatDuration(seconds: number | null) {
  if (!seconds) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const FORMAT_LABELS: Record<string, string> = {
  comedy: "COMEDY",
  debate: "DEBATE",
  explainer: "EXPLAINER",
  true_crime: "TRUE CRIME",
  hot_takes: "HOT TAKES",
  interview: "INTERVIEW",
};

export default function Library() {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const { data: episodes, isLoading } = useListEpisodes({ query: { enabled: isAuthenticated } });
  const deleteEpisode = useDeleteEpisode();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  if (authLoading) return null;

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-32 max-w-5xl flex flex-col items-center gap-6 text-center">
        <Mic2 className="h-12 w-12 text-primary/40" />
        <h2 className="font-display text-3xl tracking-wider">YOUR LIBRARY</h2>
        <p className="font-mono text-sm text-muted-foreground max-w-sm">
          Log in to view your generated episodes.
        </p>
        <button
          onClick={login}
          className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary px-5 py-3 rounded border border-primary/30 hover:bg-primary/10 transition-colors"
        >
          <LogIn className="h-4 w-4" />
          Log In
        </button>
      </div>
    );
  }

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await deleteEpisode.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListEpisodesQueryKey() });
      toast({ title: "Episode deleted" });
    } catch {
      toast({ title: "Failed to delete episode", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto px-4 py-14 max-w-5xl relative z-10">
      {/* Header */}
      <div className="flex items-end justify-between mb-12">
        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/50">
            Broadcast Archive
          </p>
          <h1 className="font-display text-[clamp(2.5rem,8vw,5rem)] leading-none tracking-wide text-foreground">
            YOUR LIBRARY
          </h1>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-primary text-primary-foreground font-mono text-xs uppercase tracking-wider hover:bg-primary/90 transition-colors"
        >
          <Mic2 className="h-3.5 w-3.5" />
          New Episode
        </Link>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 mb-10">
        <div className="h-px flex-1 bg-border" />
        {!isLoading && (
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/40">
            {episodes?.length ?? 0} episode{episodes?.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-sm bg-card/60 animate-pulse border border-border" />
          ))}
        </div>
      ) : episodes?.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-32 flex flex-col items-center gap-6 text-center"
        >
          <div className="p-6 rounded-sm border border-border bg-card/40">
            <Headphones className="h-10 w-10 text-muted-foreground/40" />
          </div>
          <div>
            <h2 className="font-display text-4xl tracking-wide text-foreground mb-2">NOTHING HERE YET</h2>
            <p className="font-sans text-sm text-muted-foreground max-w-xs">
              No episodes produced. Head to the studio to create your first podcast.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-sm bg-primary text-primary-foreground font-mono text-xs uppercase tracking-wider hover:bg-primary/90 transition-colors"
          >
            Open Studio <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {episodes?.map((episode, idx) => (
            <motion.div
              key={episode.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <Link href={`/episodes/${episode.id}`}>
                <div className="group relative flex items-center gap-5 p-5 rounded-sm border border-border bg-card/40 hover:border-primary/30 hover:bg-card/70 transition-all cursor-pointer">
                  {/* Left accent bar on hover */}
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-sm bg-transparent group-hover:bg-primary transition-colors" />

                  {/* Play button */}
                  <div className={`shrink-0 flex items-center justify-center h-12 w-12 rounded-sm border transition-colors ${
                    episode.status === "ready"
                      ? "border-primary/30 bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                      : "border-border bg-card text-muted-foreground/40"
                  }`}>
                    {episode.status === "ready" ? (
                      <Play className="h-5 w-5 ml-0.5" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary border border-primary/30 rounded-sm px-1.5 py-0.5">
                        {FORMAT_LABELS[episode.format] ?? episode.format}
                      </span>
                      {episode.status !== "ready" && (
                        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent border border-accent/30 rounded-sm px-1.5 py-0.5">
                          {episode.status}
                        </span>
                      )}
                    </div>
                    <h3 className="font-sans font-semibold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {episode.topic}
                    </h3>
                    <p className="font-mono text-[10px] text-muted-foreground/50 mt-1">
                      {episode.hosts.map((h) => h.name).join(" & ")}
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="shrink-0 text-right space-y-1">
                    {episode.status === "ready" && (
                      <p className="font-mono text-xs text-muted-foreground">
                        {formatDuration(episode.duration)}
                      </p>
                    )}
                    <p className="font-mono text-[10px] text-muted-foreground/40">
                      {formatDistanceToNow(new Date(episode.createdAt), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={(e) => handleDelete(episode.id, e)}
                    className="shrink-0 p-2 rounded-sm text-muted-foreground/30 hover:text-accent hover:bg-accent/10 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
