import { useEffect, useState } from "react";
import { signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUserLoading(false);
      if (u) navigate("/dashboard", { replace: true });
    });
    return unsub;
  }, [navigate]);

  async function handleGoogleSignIn() {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/dashboard", { replace: true });
    } catch (e: any) {
      setError(e?.message ?? "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  if (userLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-8">
        <h1 className="text-2xl font-semibold text-gray-100 text-center">FarmCast</h1>
        <p className="mt-2 text-sm text-gray-400 text-center">
          AI-powered agri-weather intelligence for Kenyan farmers
        </p>

        <div className="mt-8">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-white/5 py-3 text-sm text-gray-100 hover:bg-white/10"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-gray-100" />
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 533.5 544.3" className="h-5 w-5" aria-hidden>
                  <path fill="#4285F4" d="M533.5 278.4c0-17.4-1.4-34.1-4.1-50.3H272v95h147.4c-6.4 34.7-25.6 64.1-54.6 83.7v69.6h88.1c51.6-47.6 81.6-117.7 81.6-198z"/>
                  <path fill="#34A853" d="M272 544.3c73.5 0 135.3-24.3 180.4-66.1l-88.1-69.6c-24.5 16.5-55.8 26-92.3 26-70.9 0-131-47.9-152.4-112.2H30.1v70.7C75.3 486.5 167.7 544.3 272 544.3z"/>
                  <path fill="#FBBC05" d="M119.6 325.1c-10.9-32.6-10.9-67.5 0-100.1V154.3H30.1C-5.5 208.1-5.5 336.2 30.1 399.8l89.5-74.7z"/>
                  <path fill="#EA4335" d="M272 107.8c39.8 0 75.6 13.7 103.8 40.6l78-78C399.6 24.2 340.8 0 272 0 167.7 0 75.3 57.8 30.1 154.3l89.5 70.7C141 155.7 201.1 107.8 272 107.8z"/>
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}
