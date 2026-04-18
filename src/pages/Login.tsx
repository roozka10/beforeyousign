import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
  </svg>
);

const Login = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-background grid grid-cols-1 lg:grid-cols-2 animate-fade-up">
      {/* Left: sign-in side */}
      <div className="flex items-center justify-center p-8 md:p-12 lg:p-16 min-h-screen">
        <div className="w-full max-w-md">
          {/* Logo mark */}
          <div className="flex items-center gap-1 mb-8">
            <span className="block w-1.5 h-4 rounded-sm bg-primary/60" />
            <span className="block w-1.5 h-7 rounded-sm bg-primary" />
            <span className="block w-1.5 h-5 rounded-sm bg-primary/80" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Welcome to beforeyousign
          </h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Create a free account to stop signing sketchy contracts you didn't actually read.
          </p>

          <div className="relative mb-6">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="w-full h-12 bg-secondary hover:bg-accent border-border gap-3 text-base font-medium"
            >
              <GoogleIcon />
              Sign up with Google
            </Button>
            <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-glow">
              Last used
            </span>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="h-px bg-border flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px bg-border flex-1" />
          </div>

          <label className="block text-sm font-medium mb-2">Email</label>
          <Input
            type="email"
            placeholder="zuck@meta.com"
            className="h-12 bg-secondary border-border mb-5"
          />

          <Button
            onClick={() => navigate("/dashboard")}
            className="w-full h-12 bg-primary hover:bg-primary/90 hover:brightness-110 text-primary-foreground text-base font-medium shadow-glow transition-smooth"
          >
            Sign up with email
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-6">
            By signing up, you agree to our{" "}
            <a href="/terms" className="underline hover:text-foreground transition-colors">
              Terms of Service
            </a>
            {" "}and{" "}
            <a href="/privacy" className="underline hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            .
          </p>
          <p className="text-xs text-muted-foreground text-center mt-3 cursor-pointer hover:text-foreground transition-colors">
            Need help?
          </p>
        </div>
      </div>

      {/* Right: funny quote panel */}
      <div className="hidden lg:flex items-center justify-center bg-secondary/30 p-12 lg:p-20 border-l border-border min-h-screen relative overflow-hidden px-[60px]">
        <div className="absolute -top-40 -right-40 w-[28rem] h-[28rem] rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-[28rem] h-[28rem] rounded-full bg-warning/5 blur-3xl pointer-events-none" />

        <figure className="relative max-w-md text-center">
          <div className="text-6xl mb-8">💸</div>
          <blockquote className="text-3xl md:text-4xl font-semibold tracking-tight leading-snug">
            "I read the whole contract,"
            <span className="block text-primary mt-2">said no one ever.</span>
          </blockquote>
          <figcaption className="text-sm text-muted-foreground mt-8">
            — Literally everyone, before signing
          </figcaption>
        </figure>
      </div>
    </div>
  );
};

export default Login;
