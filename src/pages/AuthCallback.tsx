import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase automatically parses hash params
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth error:", error);
          navigate("/login");
          return;
        }

        if (!session) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const { data: { session: retrySession }, error: retryError } = await supabase.auth.getSession();

          if (retryError || !retrySession) {
            navigate("/login");
            return;
          }

          const user = retrySession.user;
          localStorage.setItem("bys_user_id", user.id);
          localStorage.setItem("bys_user_email", user.email || "");

          // Clear sensitive data from URL
          window.history.replaceState({}, document.title, window.location.pathname);

          const isOnboarded = localStorage.getItem("bys_onboarding_complete") === "true";
          navigate(isOnboarded ? "/dashboard" : "/onboarding");
          return;
        }

        const user = session.user;
        localStorage.setItem("bys_user_id", user.id);
        localStorage.setItem("bys_user_email", user.email || "");

        // Clear sensitive data from URL (removes access_token, refresh_token, etc)
        window.history.replaceState({}, document.title, window.location.pathname);

        const isOnboarded = localStorage.getItem("bys_onboarding_complete") === "true";
        navigate(isOnboarded ? "/dashboard" : "/onboarding");
      } catch (err) {
        console.error("Auth callback error:", err);
        navigate("/login");
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
