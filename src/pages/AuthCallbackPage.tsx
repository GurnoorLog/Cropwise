import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabase";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const handle = async () => {
      const oauthError = params.get("error") || params.get("error_description");
      if (oauthError) {
        setError(decodeURIComponent(oauthError));
        return;
      }

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !data.session) {
        setError("Sign-in did not complete. Please try again.");
        return;
      }

      navigate("/dashboard", { replace: true });
    };
    handle();
  }, [navigate, params]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[hsl(201,100%,13%)] text-white">
      {error ? (
        <>
          <p className="font-serif text-2xl mb-1">Sign-in failed</p>
          <p className="text-white/60 text-sm max-w-sm text-center">{error}</p>
          <a
            href="/"
            className="mt-4 inline-flex px-6 py-3 rounded-full bg-white text-black text-sm font-medium"
          >
            Back to Home
          </a>
        </>
      ) : (
        <>
          <Loader2 className="w-8 h-8 animate-spin text-white/60" />
          <p className="text-white/60 text-sm">Completing sign-in…</p>
        </>
      )}
    </div>
  );
}
