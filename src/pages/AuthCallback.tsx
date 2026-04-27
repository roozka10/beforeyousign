import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // PKCE flow: exchange code for session
        const { data, error } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );

        const saveProfile = async (userId: string, email: string, fullName?: string, avatarUrl?: string) => {
          await supabase.from("profiles").upsert({
            id: userId,
            email,
            full_name: fullName ?? null,
            avatar_url: avatarUrl ?? null,
            updated_at: new Date().toISOString(),
          }, { onConflict: "id" });

          // Ensure user_credits row exists
          await supabase.from("user_credits").upsert({
            user_id: userId,
            credits: 0,
            plan: "pay_per_use",
          }, { onConflict: "user_id", ignoreDuplicates: true });
        };

        if (!error && data.session) {
          const user = data.session.user;
          await saveProfile(
            user.id,
            user.email ?? "",
            user.user_metadata?.full_name,
            user.user_metadata?.avatar_url
          );
          window.history.replaceState({}, document.title, window.location.pathname);
          navigate("/dashboard", { replace: true });
          return;
        }

        // Fallback: implicit/hash flow
        const { data: sessionData } = await supabase.auth.getSession();

        if (sessionData.session) {
          const user = sessionData.session.user;
          await saveProfile(
            user.id,
            user.email ?? "",
            user.user_metadata?.full_name,
            user.user_metadata?.avatar_url
          );
          window.history.replaceState({}, document.title, window.location.pathname);
          navigate("/dashboard", { replace: true });
          return;
        }

        // Retry once
        await new Promise(resolve => setTimeout(resolve, 1500));
        const { data: retryData } = await supabase.auth.getSession();

        if (retryData.session) {
          const user = retryData.session.user;
          await saveProfile(
            user.id,
            user.email ?? "",
            user.user_metadata?.full_name,
            user.user_metadata?.avatar_url
          );
          window.history.replaceState({}, document.title, window.location.pathname);
          navigate("/dashboard", { replace: true });
          return;
        }

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
