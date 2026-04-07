import { useListEpisodes, useDeleteEpisode, getListEpisodesQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Trash2, Headphones, Clock, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function formatDuration(seconds: number | null) {
  if (!seconds) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Library() {
  const { data: episodes, isLoading } = useListEpisodes();
  const deleteEpisode = useDeleteEpisode();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = async (id: number) => {
    try {
      await deleteEpisode.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListEpisodesQueryKey() });
      toast({ title: "Episode deleted" });
    } catch (e) {
      toast({ title: "Failed to delete episode", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl relative z-10">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Your Library</h1>
          <p className="text-muted-foreground">All your produced episodes</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 text-white rounded-full">
          <Link href="/">
            <MicIcon className="mr-2 h-4 w-4" />
            New Episode
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : episodes?.length === 0 ? (
        <div className="text-center py-24 space-y-6">
          <div className="bg-white/5 p-6 rounded-full inline-block mb-4">
            <Headphones className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold text-white">No episodes yet</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            You haven't produced any episodes. Head to the studio to create your first podcast.
          </p>
          <Button asChild size="lg" className="rounded-full">
            <Link href="/">Start Production</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {episodes?.map((episode, idx) => (
            <motion.div
              key={episode.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="flex flex-col h-full bg-white/5 border-white/10 hover:border-primary/50 transition-colors overflow-hidden group">
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      {episode.format.replace("_", " ")}
                    </Badge>
                    {episode.status === "ready" && (
                      <span className="flex items-center text-xs font-mono text-muted-foreground bg-black/20 px-2 py-1 rounded">
                        <Clock className="mr-1 h-3 w-3" />
                        {formatDuration(episode.duration)}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {episode.topic}
                  </h3>
                  
                  <div className="mt-auto pt-4 space-y-3">
                    <div className="flex items-center text-xs text-muted-foreground gap-1.5">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(episode.createdAt), { addSuffix: true })}
                    </div>
                    
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      Hosted by {episode.hosts.map(h => h.name).join(" & ")}
                    </div>
                  </div>
                </div>

                <div className="bg-black/20 p-4 border-t border-white/5 flex items-center justify-between">
                  {episode.status === "ready" ? (
                    <Button asChild size="sm" className="rounded-full bg-white text-black hover:bg-gray-200">
                      <Link href={`/episodes/${episode.id}`}>
                        <Play className="mr-2 h-4 w-4" />
                        Play
                      </Link>
                    </Button>
                  ) : (
                    <Badge variant="secondary" className="bg-orange-500/20 text-orange-400">
                      {episode.status}
                    </Badge>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                    onClick={() => handleDelete(episode.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function MicIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  )
}
