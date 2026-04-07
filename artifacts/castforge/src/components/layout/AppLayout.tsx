import { Link, useLocation } from "wouter";
import { Mic2, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";

export function Navbar() {
  const [location] = useLocation();
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-background/90 backdrop-blur-md">
      <div className="container flex h-14 items-center justify-between mx-auto px-4 md:px-8">
        {/* Wordmark */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex items-center justify-center h-8 w-8 rounded bg-primary/15 border border-primary/20 group-hover:bg-primary/25 transition-colors">
            <Mic2 className="h-4 w-4 text-primary" />
          </div>
          <span className="font-display text-2xl leading-none text-foreground tracking-wider">
            CASTFORGE
          </span>
        </Link>

        {/* Nav links + auth */}
        <div className="flex items-center gap-1">
          {isAuthenticated && (
            <Link
              href="/episodes"
              className={`font-mono text-xs uppercase tracking-widest px-4 py-2 rounded transition-colors ${
                location === "/episodes"
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Library
            </Link>
          )}
          <Link
            href="/"
            className={`font-mono text-xs uppercase tracking-widest px-4 py-2 rounded transition-colors flex items-center gap-2 ${
              location === "/"
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="onair-dot inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            Studio
          </Link>

          {/* Auth control */}
          {!isLoading && (
            <div className="ml-3 flex items-center gap-2 pl-3 border-l border-white/[0.06]">
              {isAuthenticated ? (
                <>
                  {user?.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      alt={user.firstName ?? "User"}
                      className="h-7 w-7 rounded-full object-cover border border-white/10"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                      <span className="font-mono text-[10px] text-primary font-bold">
                        {(user?.firstName?.[0] ?? user?.email?.[0] ?? "?").toUpperCase()}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={logout}
                    className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-white/5"
                    title="Log out"
                  >
                    <LogOut className="h-3 w-3" />
                    <span className="hidden sm:inline">Out</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={login}
                  className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-primary hover:text-primary/80 transition-colors px-3 py-1.5 rounded border border-primary/30 hover:bg-primary/10"
                >
                  <LogIn className="h-3 w-3" />
                  Log In
                </button>
              )}
            </div>
          )}
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
        {/* Warm radial ambient — centered bloom */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(234,170,52,0.05) 0%, transparent 70%)",
          }}
        />
        {children}
      </main>
    </div>
  );
}
