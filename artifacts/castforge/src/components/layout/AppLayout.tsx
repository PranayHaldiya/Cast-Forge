import { Link } from "wouter";
import { Mic, Headphones, Library, Play } from "lucide-react";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between mx-auto px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-primary/20 p-2 rounded-xl text-primary group-hover:bg-primary/30 transition-colors">
            <Mic className="h-5 w-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white flex items-center">
            CastForge<span className="text-primary ml-1">.</span>
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/episodes" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors flex items-center gap-2">
            <Library className="h-4 w-4" />
            Library
          </Link>
          <Link href="/" className="text-sm font-medium bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-full transition-colors flex items-center gap-2">
            <Play className="h-4 w-4" />
            Studio
          </Link>
        </div>
      </div>
    </nav>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground dark selection:bg-primary/30 selection:text-primary-foreground">
      <Navbar />
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="pointer-events-none absolute -top-40 left-0 right-0 h-[500px] bg-primary/5 rounded-full blur-[120px] opacity-50" />
        <div className="pointer-events-none absolute bottom-0 -right-40 h-[400px] w-[600px] bg-accent/5 rounded-full blur-[100px] opacity-20" />
        {children}
      </main>
    </div>
  );
}
