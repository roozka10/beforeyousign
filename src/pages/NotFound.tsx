import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-6">
      {/* Animated background blobs */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-warning/5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />

      <div className="relative z-10 text-center max-w-2xl animate-fade-up">
        {/* Penguin with playful animation */}
        <div className="mb-8 flex justify-center">
          <div className="text-9xl animate-bounce" style={{ animationDuration: "2s" }}>
            🐧
          </div>
        </div>

        {/* 404 Text with 3D effect */}
        <div className="mb-8">
          <h1 className="text-7xl md:text-8xl font-bold tracking-tighter mb-4">
            <span className="bg-gradient-to-r from-primary via-primary/80 to-warning bg-clip-text text-transparent">
              404
            </span>
          </h1>
          <p className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            Page not found
          </p>
        </div>

        {/* Playful message */}
        <div className="mb-10 space-y-3">
          <p className="text-xl text-muted-foreground">
            The penguin got confused and landed on the wrong ice floe.
          </p>
          <p className="text-base text-muted-foreground">
            This page doesn't exist, but don't worry — we've got plenty of contracts for you to read (or not).
          </p>
        </div>

        {/* Game-like interactive element */}
        <div className="mb-12 p-6 rounded-3xl bg-card border border-border shadow-card inline-block">
          <div className="text-sm font-mono text-primary mb-2">
            ERROR_CODE: PAGE_LOST
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            Status: Lost in the contract wilderness 🏔️
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/dashboard">
            <Button
              size="lg"
              className="h-12 px-8 rounded-2xl bg-primary hover:bg-primary/90 hover:brightness-110 text-primary-foreground font-medium text-base shadow-glow transition-smooth flex items-center gap-2"
            >
              <Home className="w-5 h-5" />
              Go to Dashboard
            </Button>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="h-12 px-8 rounded-2xl border border-border bg-background hover:bg-accent text-foreground font-medium text-base transition-smooth flex items-center gap-2 inline-flex"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>

        {/* Fun footer message */}
        <p className="mt-12 text-xs text-muted-foreground italic">
          "At least you found one thing without reading the fine print." — beforeyousign
        </p>
      </div>

      {/* Floating penguin easter egg animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(-5deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default NotFound;
