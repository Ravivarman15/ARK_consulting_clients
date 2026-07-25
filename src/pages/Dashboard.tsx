import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Users, Loader2, Search, ShieldCheck, User as UserIcon,
  Building, Mail, Phone, MapPin, Calendar, CreditCard, LogOut,
  BarChart3, Layers, RefreshCw, CircleDot, Inbox,
} from "lucide-react";
import arkLogo from "@/assets/ark-logo.png";
import { useAuth, type Profile } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatINR, summarise, type StandardGroup } from "@/utils/planner";

interface ScenarioRow {
  id: string;
  user_id: string;
  name: string;
  monthly_expenses: number;
  groups: StandardGroup[];
  updated_at: string;
}

interface AuditRow {
  id: string;
  user_id: string | null;
  email: string;
  institution_name: string;
  efficiency_percent: number | null;
  health_verdict: string | null;
  created_at: string;
}

type RoleFilter = "all" | "client" | "management";

const relativeDate = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const Dashboard = () => {
  const { profile, signOut } = useAuth();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioRow[]>([]);
  const [audits, setAudits] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [p, s, a] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("planner_scenarios").select("id,user_id,name,monthly_expenses,groups,updated_at"),
      supabase
        .from("audit_submissions")
        .select("id,user_id,email,institution_name,efficiency_percent,health_verdict,created_at")
        .order("created_at", { ascending: false }),
    ]);
    setProfiles((p.data ?? []) as Profile[]);
    setScenarios((s.data ?? []) as unknown as ScenarioRow[]);
    setAudits((a.data ?? []) as AuditRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // Newly registered clients appear without a manual refresh.
    const channel = supabase
      .channel("profiles-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return profiles.filter((p) => {
      if (roleFilter !== "all" && p.role !== roleFilter) return false;
      if (!q) return true;
      return [p.full_name, p.institution_name, p.email, p.phone, p.location]
        .some((f) => (f ?? "").toLowerCase().includes(q));
    });
  }, [profiles, query, roleFilter]);

  const stats = useMemo(() => {
    const clients = profiles.filter((p) => p.role === "client");
    const weekAgo = Date.now() - 7 * 86_400_000;
    return [
      { label: "Total accounts", value: profiles.length, icon: Users, sub: `${clients.length} clients` },
      {
        label: "New this week",
        value: profiles.filter((p) => new Date(p.created_at).getTime() > weekAgo).length,
        icon: CircleDot, sub: "signed up in last 7 days",
      },
      {
        label: "Paying clients", value: clients.filter((p) => p.is_paid).length,
        icon: CreditCard, sub: `of ${clients.length} clients`,
      },
      { label: "Audits submitted", value: audits.length, icon: BarChart3, sub: "all time" },
    ];
  }, [profiles, audits]);

  return (
    <div className="min-h-screen bg-gradient-warm pb-16">
      <header className="sticky top-0 z-40 border-b border-primary-foreground/10 bg-primary/95 shadow-lg backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={arkLogo} alt="ARK" className="h-9 w-9 rounded-xl" />
            <div className="hidden sm:block">
              <p className="font-display text-sm font-black leading-tight text-primary-foreground">Management Dashboard</p>
              <p className="text-[10px] text-primary-foreground/40">{profile?.full_name || profile?.email}</p>
            </div>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button onClick={load}
              className="flex items-center gap-1.5 rounded-xl border border-primary-foreground/10 bg-primary-foreground/5 px-3 py-2 text-xs font-semibold text-primary-foreground/70 transition-all hover:bg-primary-foreground/10">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <Link to="/planner"
              className="flex items-center gap-1.5 rounded-xl border border-accent/25 bg-accent/10 px-3 py-2 text-xs font-bold text-accent transition-all hover:bg-accent/20">
              <Layers className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Planner</span>
            </Link>
            <button onClick={() => signOut()}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-primary-foreground/50 transition-all hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto space-y-6 px-4 py-6 sm:py-8">
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-highlight">
            <ShieldCheck className="h-3 w-3" /> Management access
          </p>
          <h1 className="font-display text-2xl font-black text-primary sm:text-3xl">Client directory</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everyone who has signed up, what they submitted, and the plans they are building.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <s.icon className="h-3.5 w-3.5" />
                <p className="text-[11px] font-semibold">{s.label}</p>
              </div>
              <p className="mt-1.5 font-display text-2xl font-black leading-none text-foreground sm:text-3xl">{s.value}</p>
              <p className="mt-1.5 text-[11px] text-muted-foreground">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[14rem] flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, institution, email, phone or city…"
              className="w-full rounded-2xl border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="flex gap-1 rounded-2xl border border-border bg-card p-1">
            {(["all", "client", "management"] as const).map((r) => (
              <button key={r} onClick={() => setRoleFilter(r)}
                className={`rounded-xl px-4 py-2 font-display text-xs font-bold capitalize transition-all ${
                  roleFilter === r ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}>
                {r === "all" ? "All" : `${r}s`}
              </button>
            ))}
          </div>
        </div>

        {/* Directory */}
        {loading ? (
          <div className="rounded-2xl border border-border bg-card py-20 text-center">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-accent" />
            <p className="mt-3 text-sm text-muted-foreground">Loading accounts…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card py-20 text-center">
            <Inbox className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-3 font-display text-sm font-bold text-foreground">No accounts match</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {profiles.length === 0 ? "Nobody has signed up yet." : "Try a different search or filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p, i) => {
              const theirScenarios = scenarios.filter((s) => s.user_id === p.id);
              const theirAudits = audits.filter((a) => a.user_id === p.id || a.email === p.email);
              const isOpen = expandedId === p.id;
              const isManagementRow = p.role === "management";

              return (
                <motion.div key={p.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.3 }}
                  className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
                  <button onClick={() => setExpandedId(isOpen ? null : p.id)}
                    className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 p-4 text-left sm:flex-nowrap sm:p-5"
                    aria-expanded={isOpen}>
                    <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl font-display text-sm font-black ${
                      isManagementRow ? "bg-accent/15 text-accent-foreground" : "bg-primary/8 text-primary"
                    }`}>
                      {(p.full_name || p.email).charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 font-display text-sm font-bold text-foreground">
                        {p.full_name || "—"}
                        {isManagementRow && (
                          <span className="flex items-center gap-1 rounded-full border border-accent/30 bg-accent/12 px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                            <ShieldCheck className="h-2.5 w-2.5" /> Management
                          </span>
                        )}
                        {!isManagementRow && p.is_paid && (
                          <span className="flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/12 px-2 py-0.5 text-[10px] font-bold text-green-700">
                            <CreditCard className="h-2.5 w-2.5" /> Paid
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {p.institution_name || "No institution given"} · {p.email}
                      </p>
                    </div>

                    <div className="flex flex-shrink-0 items-center gap-4 text-right">
                      <div className="hidden sm:block">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Plans</p>
                        <p className="font-display text-sm font-bold text-foreground">{theirScenarios.length}</p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Audits</p>
                        <p className="font-display text-sm font-bold text-foreground">{theirAudits.length}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Joined</p>
                        <p className="text-xs font-semibold text-foreground">{relativeDate(p.created_at)}</p>
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      className="overflow-hidden border-t border-border bg-muted/30">
                      <div className="space-y-5 p-4 sm:p-5">
                        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {[
                            { icon: UserIcon, label: "Client name", value: p.full_name || "—" },
                            { icon: Building, label: "Institution", value: p.institution_name || "—" },
                            { icon: Mail, label: "Email", value: p.email },
                            { icon: Phone, label: "Phone", value: p.phone || "—" },
                            { icon: MapPin, label: "City", value: p.location || "—" },
                            {
                              icon: Calendar, label: "Signed up",
                              value: new Date(p.created_at).toLocaleString("en-IN", {
                                day: "numeric", month: "short", year: "numeric",
                                hour: "2-digit", minute: "2-digit",
                              }),
                            },
                          ].map((f) => (
                            <div key={f.label} className="rounded-xl border border-border bg-card p-3">
                              <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                <f.icon className="h-3 w-3" /> {f.label}
                              </dt>
                              <dd className="mt-1 break-words text-sm font-semibold text-foreground">{f.value}</dd>
                            </div>
                          ))}
                        </dl>

                        {/* Their saved plans */}
                        <div>
                          <h3 className="mb-2 font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Saved plans
                          </h3>
                          {theirScenarios.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No planner activity yet.</p>
                          ) : (
                            <div className="space-y-2">
                              {theirScenarios.map((s) => {
                                const sum = summarise({
                                  name: s.name, institutionName: "",
                                  monthlyExpenses: Number(s.monthly_expenses),
                                  groups: s.groups ?? [],
                                });
                                return (
                                  <div key={s.id}
                                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
                                    <div>
                                      <p className="text-sm font-semibold text-foreground">{s.name}</p>
                                      <p className="text-[11px] text-muted-foreground">
                                        {sum.totalEnrolled}/{sum.totalSeats} seats ·{" "}
                                        {Math.round(sum.occupancy * 100)}% occupancy · updated {relativeDate(s.updated_at)}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-display text-sm font-black text-foreground">
                                        {formatINR(sum.annualRevenue)}
                                      </p>
                                      <p className={`text-[11px] font-semibold ${
                                        sum.monthlySurplus >= 0 ? "text-green-600" : "text-red-600"
                                      }`}>
                                        {formatINR(sum.monthlySurplus)}/mo
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Their audits */}
                        <div>
                          <h3 className="mb-2 font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Audit submissions
                          </h3>
                          {theirAudits.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No audit submitted yet.</p>
                          ) : (
                            <div className="space-y-2">
                              {theirAudits.map((a) => (
                                <div key={a.id}
                                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">{a.health_verdict ?? "Audit"}</p>
                                    <p className="text-[11px] text-muted-foreground">
                                      {a.institution_name} · {relativeDate(a.created_at)}
                                    </p>
                                  </div>
                                  <p className="font-display text-sm font-black text-foreground">
                                    {a.efficiency_percent != null ? `${a.efficiency_percent}%` : "—"}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        <Link to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to ARK Consulting
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
