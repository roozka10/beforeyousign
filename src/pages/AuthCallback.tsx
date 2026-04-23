import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Exchange code for session (PKCE flow)
        const { data, error } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );

        if (!error && data.session) {
          const user = data.session.user;
          localStorage.setItem("bys_user_id", user.id);
          localStorage.setItem("bys_user_email", user.email ?? "");
          window.history.replaceState({}, document.title, window.location.pathname);
          const isOnboarded = localStorage.getItem("bys_onboarding_complete") === "true";
          navigate(isOnboarded ? "/dashboard" : "/onboarding", { replace: true });
          return;
        }

        // Fallback: try getSession (implicit flow / hash)
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (!sessionError && sessionData.session) {
          const user = sessionData.session.user;
          localStorage.setItem("bys_user_id", user.id);
          localStorage.setItem("bys_user_email", user.email ?? "");
          window.history.replaceState({}, document.title, window.location.pathname);
          const isOnboarded = localStorage.getItem("bys_onboarding_complete") === "true";
          navigate(isOnboarded ? "/dashboard" : "/onboarding", { replace: true });
          return;
        }

        // Wait and retry once more
        await new Promise(resolve => setTimeout(resolve, 1500));
        const { data: retryData } = await supabase.auth.getSession();

        if (retryData.session) {
          const user = retryData.session.user;
          localStorage.setItem("bys_user_id", user.id);
          localStorage.setItem("bys_user_email", user.email ?? "");
          window.history.replaceState({}, document.title, window.location.pathname);
          const isOnboarded = localStorage.getItem("bys_onboarding_complete") === "true";
          navigate(isOnboarded ? "/dashboard" : "/onboarding", { replace: true });
          return;
        }

        // No session found — back to login
        navigate("/login", { replace: true });
      } catch (err) {
        console.error("Auth callback error:", err);
        navigate("/login", { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
