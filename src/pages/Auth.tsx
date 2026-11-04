import { useState } from "react";
import { Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Loader2, Lock, Mail, User, Building,
  Phone, MapPin, ShieldCheck, Sparkles, CheckCircle, AlertCircle,
} from "lucide-react";
import arkLogo from "@/assets/ark-logo.png";
import { useAuth, isManagementEmail, MANAGEMENT_DOMAIN } from "@/contexts/AuthContext";

type Mode = "login" | "signup";

const fieldClass =
  "w-full rounded-2xl border border-primary-foreground/12 bg-primary-foreground/5 px-11 py-3.5 text-sm text-primary-foreground placeholder:text-primary-foreground/30 outline-none transition-all focus:border-accent/60 focus:bg-primary-foreground/8 focus:ring-2 focus:ring-accent/20";

// Declared at module scope: defining it inside Auth would give it a new
// identity each render, remounting the input and dropping focus per keystroke.
const Field = ({
  icon: Icon,
  ...props
}: { icon: typeof Mail } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="relative">
    <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-foreground/30" />
    <input className={fieldClass} {...props} />
  </div>
);

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, session, loading: authLoading } = useAuth();

  const [mode, setMode] = useState<Mode>(
    new URLSearchParams(location.search).get("mode") === "signup" ? "signup" : "login"
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [phone, setPhone] = useState("");
  const [locationCity, setLocationCity] = useState("");

  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/planner";
  const willBeManagement = mode === "signup" && isManagementEmail(email);

  if (!authLoading && session) return <Navigate to={redirectTo} replace />;

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);

    if (mode === "login") {
      const { error: err } = await signIn(email, password);
      setBusy(false);
      if (err) return setError(err);
      navigate(redirectTo, { replace: true });
      return;
    }

    if (password.length < 6) {
      setBusy(false);
      return setError("Password must be at least 6 characters.");
    }
    if (!fullName.trim() || !institutionName.trim()) {
      setBusy(false);
      return setError("Your name and institution name are both required.");
    }

    const { error: err } = await signUp({
      email, password, fullName, institutionName, phone, location: locationCity,
    });
    setBusy(false);
    if (err) return setError(err);
    navigate(redirectTo, { replace: true });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-primary px-4 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-[10%] -top-[20%] h-[700px] w-[700px] rounded-full bg-accent/6 blur-[120px]" />
        <div className="absolute -bottom-[20%] -left-[10%] h-[500px] w-[500px] rounded-full bg-highlight/5 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      </div>

      <Link to="/"
        className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-primary-foreground/50 transition-all hover:bg-primary-foreground/8 hover:text-primary-foreground sm:left-8 sm:top-8">
        <ArrowLeft className="h-4 w-4" /> Back to site
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="rounded-2xl border-2 border-accent/20 bg-primary-foreground/8 p-3 shadow-lg backdrop-blur-md">
            <img src={arkLogo} alt="ARK Consulting" className="h-12 w-12 object-contain" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-black text-primary-foreground">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1.5 max-w-xs text-sm text-primary-foreground/45">
            {mode === "login"
              ? "Sign in to open your planner and audit reports."
              : "One account for the Standard Planner and your structural audit."}
          </p>
        </div>

        <div className="rounded-[2rem] border border-primary-foreground/10 bg-primary-foreground/[0.04] p-6 shadow-2xl backdrop-blur-md sm:p-8">
          {/* Mode toggle */}
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl border border-primary-foreground/8 bg-primary-foreground/5 p-1">
            {(["login", "signup"] as const).map((m) => (
              <button key={m} type="button" onClick={() => switchMode(m)}
                className={`rounded-xl py-2.5 font-display text-sm font-bold transition-all duration-300 ${
                  mode === m
                    ? "bg-accent text-accent-foreground shadow-md"
                    : "text-primary-foreground/50 hover:text-primary-foreground/80"
                }`}>
                {m === "login" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
              <AnimatePresence initial={false} mode="popLayout">
                {mode === "signup" && (
                  <motion.div key="signup-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3.5 overflow-hidden">
                    <Field icon={User} type="text" placeholder="Your full name" autoComplete="name"
                      value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                    <Field icon={Building} type="text" placeholder="Institution / academy name" autoComplete="organization"
                      value={institutionName} onChange={(e) => setInstitutionName(e.target.value)} required />
                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                      <Field icon={Phone} type="tel" placeholder="Phone" autoComplete="tel"
                        value={phone} onChange={(e) => setPhone(e.target.value)} />
                      <Field icon={MapPin} type="text" placeholder="City"
                        value={locationCity} onChange={(e) => setLocationCity(e.target.value)} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Field icon={Mail} type="email" placeholder="Email address" autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Field icon={Lock} type="password" placeholder="Password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password} onChange={(e) => setPassword(e.target.value)} required />

              <AnimatePresence>
                {willBeManagement && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-start gap-2.5 rounded-2xl border border-accent/25 bg-accent/8 p-3.5">
                    <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
                    <p className="text-xs leading-relaxed text-primary-foreground/70">
                      <span className="font-bold text-accent">Management account detected.</span>{" "}
                      Full access at no cost, plus the client dashboard.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-start gap-2.5 rounded-2xl border border-red-500/25 bg-red-500/10 p-3.5">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                  <p className="text-xs leading-relaxed text-red-200">{error}</p>
                </motion.div>
              )}

              <motion.button type="submit" disabled={busy}
                whileHover={{ scale: busy ? 1 : 1.02 }} whileTap={{ scale: busy ? 1 : 0.98 }}
                className="!mt-5 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-accent px-6 py-4 font-display text-base font-black text-accent-foreground shadow-lg shadow-accent/20 transition-all hover:shadow-xl hover:shadow-accent/30 disabled:cursor-not-allowed disabled:opacity-60">
                {busy ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Please wait…</>
                ) : (
                  <>{mode === "login" ? "Sign in" : "Create account"} <ArrowRight className="h-5 w-5" /></>
                )}
              </motion.button>
            </form>
        </div>

        {mode === "signup" && (
          <div className="mt-5 rounded-2xl border border-primary-foreground/8 bg-primary-foreground/[0.03] p-4 backdrop-blur-sm">
            <p className="mb-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-primary-foreground/35">
              <Sparkles className="h-3 w-3 text-accent" /> Included with every account
            </p>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {["Standard revenue planner", "Occupancy projections", "12-metric audit", "PDF report export"].map((f) => (
                <span key={f} className="flex items-center gap-1.5 text-xs text-primary-foreground/55">
                  <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-green-400/70" /> {f}
                </span>
              ))}
            </div>
            <p className="mt-3 border-t border-primary-foreground/5 pt-3 text-[11px] leading-relaxed text-primary-foreground/30">
              ARK team members signing up with a <span className="font-semibold text-primary-foreground/50">{MANAGEMENT_DOMAIN}</span> address
              get everything free.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Auth;
