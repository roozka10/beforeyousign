import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log("AuthCallback: Processing OAuth redirect...");
        console.log("URL hash:", window.location.hash);

        // Supabase automatically parses hash params
        const { data: { session }, error } = await supabase.auth.getSession();

        console.log("Session status:", { session: !!session, error });

        if (error) {
          console.error("Auth error:", error);
          alert("Auth error: " + error.message);
          navigate("/login");
          return;
        }

        if (!session) {
          console.log("No session found, retrying...");
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const { data: { session: retrySession }, error: retryError } = await supabase.auth.getSession();
          console.log("Retry session status:", { session: !!retrySession, error: retryError });

          if (retryError) {
            alert("Auth retry error: " + retryError.message);
            navigate("/login");
            return;
          }

          if (!retrySession) {
            console.error("Still no session after retry");
            alert("Failed to establish session");
            navigate("/login");
            return;
          }

          const user = retrySession.user;
          console.log("Logged in user:", user.email);
          localStorage.setItem("bys_user_id", user.id);
          localStorage.setItem("bys_user_email", user.email || "");

          const isOnboarded = localStorage.getItem("bys_onboarding_complete") === "true";
          console.log("Redirecting to:", isOnboarded ? "dashboard" : "onboarding");
          navigate(isOnboarded ? "/dashboard" : "/onboarding");
          return;
        }

        const user = session.user;
        console.log("Logged in user:", user.email);
        localStorage.setItem("bys_user_id", user.id);
        localStorage.setItem("bys_user_email", user.email || "");

        const isOnboarded = localStorage.getItem("bys_onboarding_complete") === "true";
        console.log("Redirecting to:", isOnboarded ? "dashboard" : "onboarding");
        navigate(isOnboarded ? "/dashboard" : "/onboarding");
      } catch (err) {
        console.error("Auth callback error:", err);
        alert("Error: " + (err as Error).message);
        navigate("/login");
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground mb-2">Signing you in...</p>
        <p className="text-xs text-muted-foreground">Check browser console for details (F12)</p>
      </div>
    </div>
  );
};

export default AuthCallback;
// Force redeploy
