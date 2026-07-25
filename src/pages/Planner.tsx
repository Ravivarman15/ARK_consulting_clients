import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Plus, Minus, Trash2, Settings2, Check, X, Loader2, Users,
  TrendingUp, TrendingDown, Wallet, PieChart, LayoutDashboard, LogOut,
  AlertTriangle, CheckCircle, RotateCcw, Sparkles, IndianRupee, ClipboardList,
} from "lucide-react";
import arkLogo from "@/assets/ark-logo.png";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { GroupRevenueChart, ProjectionChart } from "@/components/planner/PlannerCharts";
import { PlanFacts, ProjectionGrid, ProjectionTable } from "@/components/planner/ProjectionGrid";
import {
  createDefaultState, feeOf, formatINR, formatINRFull, formatSignedINR,
  project, PROJECTION_STEPS, summarise, uid,
  type PlannerState, type Standard, type StandardGroup,
} from "@/utils/planner";

type SaveState = "idle" | "saving" | "saved" | "error";

const QUICK_FILLS = [0, 25, 50, 75, 100];

const Planner = () => {
  const { user, profile, isManagement, signOut } = useAuth();
  const { toast } = useToast();

  const [state, setState] = useState<PlannerState | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [editingStandardId, setEditingStandardId] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  const scenarioIdRef = useRef<string | null>(null);
  const loadedRef = useRef(false);

  // ── Load the user's saved plan (or seed a fresh one) ───────────────────────
  useEffect(() => {
    if (!user) return;
    let active = true;

    supabase
      .from("planner_scenarios")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        if (data) {
          scenarioIdRef.current = data.id;
          setState({
            name: data.name,
            institutionName: data.institution_name,
            monthlyExpenses: Number(data.monthly_expenses),
            groups: (data.groups as unknown as StandardGroup[]) ?? [],
          });
        } else {
          setState(createDefaultState(profile?.institution_name ?? ""));
        }
        // Flip only after the first state lands so the load itself never saves.
        loadedRef.current = true;
      });

    return () => { active = false; };
  }, [user, profile?.institution_name]);

  // ── Debounced autosave ────────────────────────────────────────────────────
  useEffect(() => {
    if (!state || !user || !loadedRef.current) return;
    setSaveState("saving");

    const timer = setTimeout(async () => {
      const payload = {
        user_id: user.id,
        name: state.name,
        institution_name: state.institutionName,
        monthly_expenses: state.monthlyExpenses,
        groups: state.groups as unknown as never,
      };

      const { error } = scenarioIdRef.current
        ? await supabase.from("planner_scenarios").update(payload).eq("id", scenarioIdRef.current)
        : await supabase
            .from("planner_scenarios")
            .insert(payload)
            .select("id")
            .single()
            .then(({ data, error: e }) => {
              if (data) scenarioIdRef.current = data.id;
              return { error: e };
            });

      setSaveState(error ? "error" : "saved");
    }, 800);

    return () => clearTimeout(timer);
  }, [state, user]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const patchGroup = useCallback((groupId: string, patch: Partial<StandardGroup>) => {
    setState((prev) =>
      prev ? { ...prev, groups: prev.groups.map((g) => (g.id === groupId ? { ...g, ...patch } : g)) } : prev
    );
  }, []);

  const patchStandard = useCallback((groupId: string, standardId: string, patch: Partial<Standard>) => {
    setState((prev) =>
      prev
        ? {
            ...prev,
            groups: prev.groups.map((g) =>
              g.id !== groupId
                ? g
                : {
                    ...g,
                    standards: g.standards.map((s) => {
                      if (s.id !== standardId) return s;
                      const next = { ...s, ...patch };
                      // Enrollment can never exceed the seats that exist.
                      next.enrolled = Math.min(next.enrolled, next.capacity);
                      return next;
                    }),
                  }
            ),
          }
        : prev
    );
  }, []);

  const addStandard = useCallback((groupId: string) => {
    const id = uid();
    setState((prev) =>
      prev
        ? {
            ...prev,
            groups: prev.groups.map((g) =>
              g.id !== groupId
                ? g
                : {
                    ...g,
                    standards: [
                      ...g.standards,
                      { id, name: "New standard", code: "", capacity: 20, enrolled: 0, annualFee: null },
                    ],
                  }
            ),
          }
        : prev
    );
    setEditingStandardId(id);
  }, []);

  const removeStandard = useCallback((groupId: string, standardId: string) => {
    setState((prev) =>
      prev
        ? {
            ...prev,
            groups: prev.groups.map((g) =>
              g.id !== groupId ? g : { ...g, standards: g.standards.filter((s) => s.id !== standardId) }
            ),
          }
        : prev
    );
  }, []);

  const addGroup = useCallback(() => {
    const id = uid();
    setState((prev) =>
      prev
        ? { ...prev, groups: [...prev.groups, { id, name: "New group", annualFee: 50000, standards: [] }] }
        : prev
    );
    setEditingGroupId(id);
  }, []);

  const removeGroup = useCallback((groupId: string) => {
    setState((prev) => (prev ? { ...prev, groups: prev.groups.filter((g) => g.id !== groupId) } : prev));
  }, []);

  const fillAll = useCallback((percent: number) => {
    setState((prev) =>
      prev
        ? {
            ...prev,
            groups: prev.groups.map((g) => ({
              ...g,
              standards: g.standards.map((s) => ({ ...s, enrolled: Math.round(s.capacity * (percent / 100)) })),
            })),
          }
        : prev
    );
  }, []);

  const resetPlan = useCallback(() => {
    setState(createDefaultState(profile?.institution_name ?? ""));
    toast({ title: "Plan reset", description: "Standards and fees are back to the ARK defaults." });
  }, [profile?.institution_name, toast]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const summary = useMemo(() => (state ? summarise(state) : null), [state]);
  const projections = useMemo(
    () => (state ? PROJECTION_STEPS.map((p) => project(state, p)) : []),
    [state]
  );
  if (!state || !summary) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-primary">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent" />
          <p className="mt-4 text-sm text-primary-foreground/40">Loading your plan…</p>
        </div>
      </div>
    );
  }

  const inProfit = summary.monthlySurplus >= 0;

  const kpis = [
    {
      label: "Current revenue", value: formatINR(summary.annualRevenue), sub: "annual",
      icon: TrendingUp, tone: "text-foreground",
    },
    {
      label: "Monthly revenue", value: formatINR(summary.monthlyRevenue), sub: "avg per month",
      icon: Wallet, tone: "text-foreground",
    },
    {
      label: inProfit ? "Monthly surplus" : "Monthly shortfall",
      value: formatSignedINR(summary.monthlySurplus),
      sub: `vs ${formatINR(summary.monthlyExpenses)} expenses`,
      icon: inProfit ? TrendingUp : TrendingDown,
      tone: inProfit ? "text-green-600" : "text-red-600",
    },
    {
      label: "Overall occupancy", value: `${Math.round(summary.occupancy * 100)}%`,
      sub: `${summary.totalEnrolled} / ${summary.totalSeats} seats`,
      icon: PieChart, tone: "text-foreground",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-warm pb-16">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-primary-foreground/10 bg-primary/95 shadow-lg backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={arkLogo} alt="ARK" className="h-9 w-9 rounded-xl" />
            <div className="hidden sm:block">
              <p className="font-display text-sm font-black leading-tight text-primary-foreground">Standard Planner</p>
              <p className="text-[10px] text-primary-foreground/40">{profile?.institution_name || "ARK Consulting"}</p>
            </div>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <SaveBadge state={saveState} />
            {isManagement && (
              <Link to="/dashboard"
                className="flex items-center gap-1.5 rounded-xl border border-accent/25 bg-accent/10 px-3 py-2 text-xs font-bold text-accent transition-all hover:bg-accent/20">
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            )}
            <Link to="/questionnaire"
              className="flex items-center gap-1.5 rounded-xl border border-primary-foreground/10 bg-primary-foreground/5 px-3 py-2 text-xs font-semibold text-primary-foreground/70 transition-all hover:bg-primary-foreground/10">
              <ClipboardList className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Audit</span>
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
        {/* ── Title ── */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-highlight">
              <Sparkles className="h-3 w-3" /> Interactive enrollment model
            </p>
            <input
              value={state.name}
              onChange={(e) => setState({ ...state, name: e.target.value })}
              className="-ml-1 w-full max-w-md rounded-lg border border-transparent bg-transparent px-1 font-display text-2xl font-black text-primary outline-none transition-colors hover:border-border focus:border-accent focus:bg-card sm:text-3xl"
              aria-label="Plan name"
            />
            <p className="mt-1 text-sm text-muted-foreground">
              Drag the sliders to plan your enrollment mix — every figure recalculates live.
            </p>
          </div>
          <button onClick={resetPlan}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-muted-foreground transition-all hover:border-highlight/40 hover:text-foreground">
            <RotateCcw className="h-3.5 w-3.5" /> Reset to defaults
          </button>
        </div>

        {/* ── KPI strip ── */}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <k.icon className="h-3.5 w-3.5" />
                <p className="text-[11px] font-semibold">{k.label}</p>
              </div>
              <p className={`mt-1.5 font-display text-2xl font-black leading-none sm:text-3xl ${k.tone}`}>{k.value}</p>
              <p className="mt-1.5 text-[11px] text-muted-foreground">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Status banner ── */}
        <div className={`flex items-start gap-3 rounded-2xl border p-4 ${
          inProfit ? "border-green-500/25 bg-green-500/8" : "border-red-500/25 bg-red-500/8"
        }`}>
          {inProfit
            ? <CheckCircle className="mt-0.5 h-4.5 w-4.5 flex-shrink-0 text-green-600" />
            : <AlertTriangle className="mt-0.5 h-4.5 w-4.5 flex-shrink-0 text-red-600" />}
          <p className={`text-sm font-semibold leading-relaxed ${inProfit ? "text-green-800" : "text-red-800"}`}>
            {inProfit ? (
              <>Covering expenses with {formatINR(summary.monthlySurplus)}/month to spare
                {summary.breakevenOccupancy != null && (
                  <span className="font-normal"> — breakeven sits at ~{Math.round(summary.breakevenOccupancy)}% occupancy.</span>
                )}
              </>
            ) : (
              <>Shortfall of {formatINR(Math.abs(summary.monthlySurplus) * 12)}/year — need{" "}
                {formatINR(Math.abs(summary.monthlySurplus))} more per month
                {summary.breakevenSeats != null && (
                  <span className="font-normal">
                    {" "}({summary.breakevenSeats - summary.totalEnrolled > 0
                      ? `${summary.breakevenSeats - summary.totalEnrolled} more admissions`
                      : "adjust your fees"}).
                  </span>
                )}
              </>
            )}
          </p>
        </div>

        {/* ── Controls ── */}
        <div className="grid gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5 lg:grid-cols-[auto_1fr_auto] lg:items-end">
          <div>
            <label htmlFor="monthly-expenses" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Fixed monthly expenses
            </label>
            <div className="relative">
              <IndianRupee className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                id="monthly-expenses"
                type="number" min={0} step={1000}
                value={state.monthlyExpenses}
                onChange={(e) => setState({ ...state, monthlyExpenses: Math.max(0, Number(e.target.value) || 0) })}
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-8 pr-3 font-display text-sm font-bold text-foreground outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20 lg:w-48"
              />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {formatINR(state.monthlyExpenses * 12)} per year
            </p>
          </div>

          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Fill every batch to
            </p>
            <div className="inline-flex w-full overflow-hidden rounded-xl border border-border bg-background sm:w-auto">
              {QUICK_FILLS.map((p, i) => (
                <button key={p} onClick={() => fillAll(p)}
                  className={`flex-1 px-3 py-2.5 font-display text-xs font-bold text-foreground transition-all hover:bg-accent hover:text-accent-foreground sm:flex-none sm:px-5 ${
                    i > 0 ? "border-l border-border" : ""
                  }`}>
                  {p}%
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/50 px-4 py-2.5 lg:flex-col lg:items-end lg:justify-center lg:text-right">
            <p className="text-[11px] font-semibold text-muted-foreground">Total capacity</p>
            <p className="font-display text-lg font-black text-foreground">{summary.totalSeats} seats</p>
          </div>
        </div>

        {/* ── Standards ── */}
        <div className="space-y-5">
          {state.groups.map((group) => {
            const groupSummary = summary.groups.find((g) => g.id === group.id)!;
            const isEditingGroup = editingGroupId === group.id;

            return (
              <section key={group.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                {/* Group header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-3 sm:px-5">
                  {isEditingGroup ? (
                    <div className="flex flex-1 flex-wrap items-center gap-2">
                      <input
                        value={group.name}
                        onChange={(e) => patchGroup(group.id, { name: e.target.value })}
                        placeholder="Group name"
                        className="min-w-[10rem] flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold text-foreground outline-none focus:border-accent"
                      />
                      <div className="relative">
                        <IndianRupee className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="number" min={0} step={1000}
                          value={group.annualFee}
                          onChange={(e) => patchGroup(group.id, { annualFee: Math.max(0, Number(e.target.value) || 0) })}
                          className="w-36 rounded-lg border border-border bg-background py-2 pl-7 pr-2 text-sm font-semibold text-foreground outline-none focus:border-accent"
                          aria-label="Group annual fee per student"
                        />
                      </div>
                      <button onClick={() => setEditingGroupId(null)}
                        className="rounded-lg bg-accent p-2 text-accent-foreground transition-all hover:bg-accent/90" aria-label="Done">
                        <Check className="h-4 w-4" />
                      </button>
                      <button onClick={() => { removeGroup(group.id); setEditingGroupId(null); }}
                        className="rounded-lg border border-red-500/30 p-2 text-red-600 transition-all hover:bg-red-500/10" aria-label="Delete group">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h2 className="font-display text-sm font-black uppercase tracking-wider text-foreground">
                          {group.name}
                          <span className="ml-2 font-sans text-xs font-semibold normal-case tracking-normal text-muted-foreground">
                            {formatINRFull(group.annualFee)}/year per student
                          </span>
                        </h2>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {groupSummary.enrolled} / {groupSummary.seats} seats ·{" "}
                          <span className="font-semibold text-foreground">{formatINR(groupSummary.annualRevenue)}</span> annual
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => addStandard(group.id)}
                          className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition-all hover:border-accent hover:text-accent-foreground">
                          <Plus className="h-3.5 w-3.5" /> Standard
                        </button>
                        <button onClick={() => setEditingGroupId(group.id)}
                          className="rounded-lg border border-border bg-background p-2 text-muted-foreground transition-all hover:text-foreground"
                          aria-label={`Edit ${group.name}`}>
                          <Settings2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Standard rows */}
                <div className="divide-y divide-border/60">
                  {group.standards.length === 0 && (
                    <p className="px-5 py-6 text-center text-sm text-muted-foreground">
                      No standards yet — add one to start planning this group.
                    </p>
                  )}

                  {group.standards.map((standard) => {
                    const fee = feeOf(standard, group);
                    const enrolled = Math.min(standard.enrolled, standard.capacity);
                    const revenue = enrolled * fee;
                    const pct = standard.capacity > 0 ? Math.round((enrolled / standard.capacity) * 100) : 0;
                    const setEnrolled = (v: number) =>
                      patchStandard(group.id, standard.id, {
                        enrolled: Math.max(0, Math.min(standard.capacity, v)),
                      });
                    const isEditing = editingStandardId === standard.id;

                    return (
                      <div key={standard.id} className="px-4 py-4 transition-colors hover:bg-muted/30 sm:px-5">
                        {/* Row 1 — identity + revenue + edit */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm font-semibold text-foreground">
                              <span className="truncate">{standard.name}</span>
                              {standard.code && (
                                <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                                  {standard.code}
                                </span>
                              )}
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              {formatINRFull(fee)}/yr
                              {standard.annualFee !== null && (
                                <span className="ml-1 font-semibold text-highlight">· custom fee</span>
                              )}
                            </p>
                          </div>

                          <div className="flex flex-shrink-0 items-center gap-2.5">
                            <div className="text-right">
                              <p className="font-display text-sm font-black leading-none text-foreground sm:text-base">
                                {revenue > 0 ? formatINR(revenue) : "₹0"}
                              </p>
                              <p className="mt-0.5 text-[10px] text-muted-foreground">annual</p>
                            </div>
                            <button onClick={() => setEditingStandardId(isEditing ? null : standard.id)}
                              className={`flex-shrink-0 rounded-lg border p-2 transition-all ${
                                isEditing
                                  ? "border-accent bg-accent text-accent-foreground"
                                  : "border-border text-muted-foreground hover:border-accent/50 hover:text-foreground"
                              }`}
                              aria-label={`Edit ${standard.name}`}
                              aria-expanded={isEditing}>
                              {isEditing ? <X className="h-4 w-4" /> : <Settings2 className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Row 2 — stepper · slider · live count */}
                        <div className="mt-3 flex items-center gap-2 sm:gap-3">
                          <button
                            onClick={() => setEnrolled(enrolled - 1)}
                            disabled={enrolled <= 0}
                            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-all hover:border-accent hover:text-foreground disabled:opacity-40 disabled:hover:border-border"
                            aria-label={`One fewer student in ${standard.name}`}>
                            <Minus className="h-4 w-4" />
                          </button>

                          <Slider
                            value={[enrolled]}
                            max={Math.max(1, standard.capacity)}
                            step={1}
                            onValueChange={([v]) => setEnrolled(v)}
                            className="flex-1"
                            thumbClassName="h-6 w-6"
                            aria-label={`Students enrolled in ${standard.name}`}
                          />

                          <button
                            onClick={() => setEnrolled(enrolled + 1)}
                            disabled={enrolled >= standard.capacity}
                            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-all hover:border-accent hover:text-foreground disabled:opacity-40 disabled:hover:border-border"
                            aria-label={`One more student in ${standard.name}`}>
                            <Plus className="h-4 w-4" />
                          </button>

                          <div className="flex w-[5.5rem] flex-shrink-0 items-baseline justify-end gap-0.5 sm:w-24">
                            <span className="font-display text-lg font-black tabular-nums text-foreground">{enrolled}</span>
                            <span className="text-xs text-muted-foreground">/{standard.capacity}</span>
                          </div>

                          <span className="hidden w-11 flex-shrink-0 rounded-md bg-primary/10 py-1 text-center text-[11px] font-bold tabular-nums text-primary sm:inline-block">
                            {pct}%
                          </span>
                        </div>

                        {/* Inline editor */}
                        <AnimatePresence initial={false}>
                          {isEditing && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.22 }}
                              className="overflow-hidden">
                              <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl border border-accent/25 bg-accent/5 p-4 sm:grid-cols-2 lg:grid-cols-4">
                                <LabelledInput label="Standard name" value={standard.name}
                                  onChange={(v) => patchStandard(group.id, standard.id, { name: v })} />
                                <LabelledInput label="Batch code" value={standard.code} placeholder="e.g. A"
                                  onChange={(v) => patchStandard(group.id, standard.id, { code: v })} />
                                <LabelledInput label="Seats (capacity)" type="number" value={String(standard.capacity)}
                                  onChange={(v) => patchStandard(group.id, standard.id, { capacity: Math.max(0, Number(v) || 0) })} />
                                <div>
                                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Annual fee per student
                                  </label>
                                  <div className="relative">
                                    <IndianRupee className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                      type="number" min={0} step={1000}
                                      value={standard.annualFee ?? group.annualFee}
                                      onChange={(e) =>
                                        patchStandard(group.id, standard.id, {
                                          annualFee: Math.max(0, Number(e.target.value) || 0),
                                        })
                                      }
                                      className="w-full rounded-lg border border-border bg-background py-2 pl-7 pr-2 text-sm font-semibold text-foreground outline-none focus:border-accent"
                                    />
                                  </div>
                                  <label className="mt-1.5 flex cursor-pointer items-center gap-1.5 text-[11px] text-muted-foreground">
                                    <input type="checkbox" checked={standard.annualFee === null}
                                      onChange={(e) =>
                                        patchStandard(group.id, standard.id, {
                                          annualFee: e.target.checked ? null : group.annualFee,
                                        })
                                      }
                                      className="h-3.5 w-3.5 accent-current" />
                                    Use the group fee ({formatINRFull(group.annualFee)})
                                  </label>
                                </div>
                                <div className="sm:col-span-2 lg:col-span-4">
                                  <button
                                    onClick={() => { removeStandard(group.id, standard.id); setEditingStandardId(null); }}
                                    className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-600 transition-all hover:bg-red-500/10">
                                    <Trash2 className="h-3.5 w-3.5" /> Remove this standard
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          <button onClick={addGroup}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card/50 py-4 font-display text-sm font-bold text-muted-foreground transition-all hover:border-accent hover:bg-accent/5 hover:text-accent-foreground">
            <Plus className="h-4 w-4" /> Add a standard group
          </button>
        </div>

        {/* ── Charts ── */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <GroupRevenueChart summary={summary} />
        </div>

        {/* ── Projections ── */}
        <div className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-highlight">
              <Users className="h-3 w-3" /> Occupancy projections
            </p>
            <h2 className="font-display text-xl font-black text-primary sm:text-2xl">
              What each fill rate is worth
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Every batch filled to the same percentage, priced at the fees configured above.
            </p>
          </div>

          <ProjectionGrid projections={projections} />
          <PlanFacts summary={summary} />
          <ProjectionChart projections={projections} annualExpenses={summary.annualExpenses} />
          <ProjectionTable projections={projections} />
        </div>

        <Link to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to ARK Consulting
        </Link>
      </div>
    </div>
  );
};

const LabelledInput = ({
  label, value, onChange, type = "text", placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) => (
  <div>
    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</label>
    <input
      type={type} value={value} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground outline-none focus:border-accent"
    />
  </div>
);

const SaveBadge = ({ state }: { state: SaveState }) => {
  const map: Record<SaveState, { text: string; className: string; spin?: boolean }> = {
    idle: { text: "", className: "" },
    saving: { text: "Saving…", className: "text-primary-foreground/40", spin: true },
    saved: { text: "Saved", className: "text-green-400" },
    error: { text: "Not saved", className: "text-red-400" },
  };
  const s = map[state];
  if (!s.text) return null;
  return (
    <span className={`hidden items-center gap-1.5 px-2 text-[11px] font-semibold sm:flex ${s.className}`}>
      {s.spin ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
      {s.text}
    </span>
  );
};

export default Planner;
