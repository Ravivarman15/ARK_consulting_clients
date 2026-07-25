import type { ReactNode } from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import { Loader2, ShieldAlert, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const FullScreen = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-screen items-center justify-center bg-gradient-primary px-4">
    <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
      style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
    <div className="relative z-10 text-center">{children}</div>
  </div>
);

const Spinner = () => (
  <FullScreen>
    <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent" />
    <p className="mt-4 text-sm text-primary-foreground/40">Checking your session…</p>
  </FullScreen>
);

/** Requires any signed-in account. */
export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;
  if (!session) return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
};

/** Requires a management account — the client directory lives behind this. */
export const ManagementRoute = ({ children }: { children: ReactNode }) => {
  const { session, loading, isManagement } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;
  if (!session) return <Navigate to="/auth" replace state={{ from: location.pathname }} />;

  if (!isManagement) {
    return (
      <FullScreen>
        <div className="mx-auto max-w-sm rounded-[2rem] border border-primary-foreground/10 bg-primary-foreground/[0.04] p-8 shadow-2xl backdrop-blur-md">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-highlight/30 bg-highlight/12">
            <ShieldAlert className="h-7 w-7 text-highlight" />
          </div>
          <h1 className="font-display text-xl font-black text-primary-foreground">Management only</h1>
          <p className="mt-2 text-sm leading-relaxed text-primary-foreground/50">
            The client directory is restricted to the ARK management team.
          </p>
          <Link to="/planner"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 font-display text-sm font-bold text-accent-foreground shadow-lg transition-all hover:scale-105">
            <ArrowLeft className="h-4 w-4" /> Go to my planner
          </Link>
        </div>
      </FullScreen>
    );
  }

  return <>{children}</>;
};
