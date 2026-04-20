import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          navigate("/login");
          return;
        }

        const user = session.user;
        localStorage.setItem("bys_user_id", user.id);
        localStorage.setItem("bys_user_email", user.email || "");

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
