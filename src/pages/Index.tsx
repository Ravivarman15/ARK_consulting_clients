import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight, TrendingDown, Users, DollarSign, AlertTriangle,
  BarChart3, Shield, Target, Layers, Zap, Building, BookOpen,
  CheckCircle, ChevronRight, ArrowDown, Sparkles, Star
} from "lucide-react";
import arkLogo from "@/assets/ark-logo.png";
import Footer from "@/components/Footer";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const } }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const Index = () => {
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  // Calculator and tabs state
  const [calcStrength, setCalcStrength] = useState<string>("100–200");
  const [calcRevenue, setCalcRevenue] = useState<string>("1.5–3 L");
  const [activeMetricTab, setActiveMetricTab] = useState<string>("financial");

  const getCalculatorResults = () => {
    let currentRevVal = 100000;
    if (calcRevenue === "1.5–3 L") currentRevVal = 225000;
    else if (calcRevenue === "3–6 L") currentRevVal = 450000;
    else if (calcRevenue === "6 L+") currentRevVal = 750000;

    let potentialRevVal = 150000;
    if (calcStrength === "50–100") potentialRevVal = 300000;
    else if (calcStrength === "100–200") potentialRevVal = 500000;
    else if (calcStrength === "200+") potentialRevVal = 850000;

    let monthlyGap = Math.max(0, potentialRevVal - currentRevVal);
    if (monthlyGap === 0) {
      monthlyGap = Math.round(currentRevVal * 0.12);
      potentialRevVal = currentRevVal + monthlyGap;
    }

    const annualImpact = monthlyGap * 12;

    return {
      current: currentRevVal,
      potential: potentialRevVal,
      gap: monthlyGap,
      annual: annualImpact
    };
  };

  const calcResults = getCalculatorResults();

  const formatCalcCurrency = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
    return `₹${val}`;
  };


  return (
    <div className="flex min-h-screen flex-col bg-background overflow-x-hidden">
      {/* ═══════════════════════════════════════════════════════════
          SECTION 1 — HERO
       ═══════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-primary">
        {/* Ambient background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-accent/6 blur-[120px]" />
          <div className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full bg-highlight/4 blur-[100px]" />
          <div className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 80px, white 80px, white 81px)" }} />
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 py-16 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* ── LEFT: Copy & CTA ── */}
            <div className="text-center lg:text-left">
              {/* Logo + Badge row */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }} className="flex items-center gap-4 mb-8 justify-center lg:justify-start">
                <div className="relative group">
                  <div className="absolute -inset-2 rounded-2xl bg-accent/15 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-700" />
                  <div className="relative rounded-xl border-2 border-accent/20 bg-primary-foreground/8 p-3 backdrop-blur-md shadow-lg transition-all duration-500 hover:border-accent/40">
                    <img src={arkLogo} alt="ARK Consulting" className="h-12 w-12 object-contain" />
                  </div>
                </div>
                <div>
                  <p className="font-display font-black text-primary-foreground text-lg leading-tight">ARK Consulting</p>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 border border-accent/20 px-3 py-0.5 text-accent text-[10px] font-bold tracking-widest uppercase mt-1">
                    <Sparkles className="h-3 w-3" /> Free Audit
                  </span>
                </div>
              </motion.div>

              {/* Headline */}
              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="mx-auto lg:mx-0 max-w-xl font-display text-3xl font-black leading-[1.12] text-primary-foreground sm:text-4xl md:text-5xl">
                Most Coaching Institutes Operate at{" "}
                <span className="relative inline-block">
                  <span className="text-accent">70% Efficiency</span>
                  <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.9, duration: 0.5 }}
                    className="absolute -bottom-1 left-0 right-0 h-1 bg-accent/40 rounded-full origin-left" />
                </span>
                <br className="hidden sm:block" />
                <span className="text-primary-foreground/80">Without Knowing It.</span>
              </motion.h1>

              {/* Subheading */}
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.6 }}
                className="mx-auto lg:mx-0 mt-5 max-w-lg text-sm text-primary-foreground/55 sm:text-base md:text-lg leading-relaxed">
                Get a Free 12-Metric Institutional Structural Audit.{" "}
                <span className="text-primary-foreground/75 font-medium">
                  Identify Revenue Leakage, Cost Stress, and Scalability Gaps.
                </span>
              </motion.p>

              {/* CTA */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}
                className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Link to="/questionnaire"
                  className="group inline-flex items-center gap-3 rounded-2xl bg-accent px-8 py-4 sm:px-10 sm:py-5 font-display text-base sm:text-lg font-black text-accent-foreground shadow-float transition-all duration-300 hover:scale-105 hover:gap-4 hover:shadow-xl hover:shadow-accent/25">
                  Get My Free Structural Audit
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>

              {/* Trust signals */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }}
                className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-primary-foreground/40 text-xs sm:text-sm">
                {[
                  { text: "5 min assessment", icon: "⏱" },
                  { text: "15 questions", icon: "📋" },
                  { text: "Instant results", icon: "⚡" },
                  { text: "No obligation", icon: "🔓" },
                ].map((item) => (
                  <span key={item.text} className="flex items-center gap-1.5">
                    <span className="text-sm">{item.icon}</span>
                    {item.text}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* ── RIGHT: Before / After ARK Chart ── */}
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
              className="w-full max-w-lg mx-auto lg:mx-0 lg:ml-auto">

              <div className="bg-primary-foreground/[0.04] border border-primary-foreground/10 rounded-[2rem] p-6 sm:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
                {/* Decorative corner glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/8 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-highlight/6 rounded-full blur-2xl pointer-events-none" />

                {/* Chart header */}
                <div className="relative z-10 flex items-center justify-between mb-6">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-foreground/40">Performance Comparison</p>
                    <h3 className="font-display font-black text-primary-foreground text-lg mt-0.5">Before vs After ARK</h3>
                  </div>
                  <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-green-400 text-[10px] font-bold uppercase tracking-wider">Live Data</span>
                  </div>
                </div>

                {/* Bar Chart */}
                <div className="relative z-10 space-y-5">
                  {[
                    { metric: "Revenue Efficiency", before: 58, after: 92, unit: "%" },
                    { metric: "Fee Realisation", before: 62, after: 89, unit: "%" },
                    { metric: "Batch Utilisation", before: 45, after: 85, unit: "%" },
                    { metric: "Lead Conversion", before: 30, after: 72, unit: "%" },
                    { metric: "Scalability Index", before: 35, after: 88, unit: "%" },
                  ].map((item, i) => (
                    <div key={item.metric} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-primary-foreground/70 text-xs font-semibold">{item.metric}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-primary-foreground/30 text-[10px] font-bold">{item.before}{item.unit}</span>
                          <ArrowRight className="h-3 w-3 text-accent/60" />
                          <span className="text-accent text-xs font-black">{item.after}{item.unit}</span>
                        </div>
                      </div>
                      <div className="relative h-2.5 rounded-full bg-primary-foreground/5 overflow-hidden">
                        {/* Before bar (faded) */}
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.before}%` }}
                          transition={{ delay: 0.6 + i * 0.12, duration: 0.8, ease: "easeOut" }}
                          className="absolute inset-y-0 left-0 rounded-full bg-highlight/40"
                        />
                        {/* After bar (accent, layered on top) */}
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.after}%` }}
                          transition={{ delay: 0.9 + i * 0.12, duration: 1, ease: "easeOut" }}
                          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent to-accent/80"
                          style={{ zIndex: 1 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="relative z-10 mt-6 pt-5 border-t border-primary-foreground/8 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-2 rounded-sm bg-highlight/40" />
                      <span className="text-primary-foreground/40 text-[10px] font-semibold">Before</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-2 rounded-sm bg-accent" />
                      <span className="text-primary-foreground/60 text-[10px] font-semibold">After ARK</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-primary-foreground/30 uppercase tracking-wider font-bold">Avg. Improvement</p>
                    <p className="font-display font-black text-accent text-lg leading-none mt-0.5 text-glow-accent">+38%</p>
                  </div>
                </div>

                {/* Bottom stats strip */}
                <div className="relative z-10 mt-5 grid grid-cols-3 gap-3">
                  {[
                    { label: "Leakage Fixed", value: "₹4.2L/mo", color: "text-green-400" },
                    { label: "Metrics Scored", value: "12", color: "text-accent" },
                    { label: "Audit Time", value: "5 min", color: "text-primary-foreground/80" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-primary-foreground/3 border border-primary-foreground/5 rounded-xl p-3 text-center">
                      <p className={`font-display font-black text-sm ${stat.color}`}>{stat.value}</p>
                      <p className="text-primary-foreground/30 text-[9px] font-bold uppercase tracking-wider mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} transition={{ delay: 1.4 }}
            className="mt-12 text-center">
            <ArrowDown className="mx-auto h-5 w-5 text-primary-foreground/30 animate-bounce" />
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 2 — THE PROBLEM
       ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-gradient-warm relative">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
            className="mx-auto max-w-3xl text-center">
            <motion.p variants={fadeUp} custom={0}
              className="text-sm font-bold uppercase tracking-[0.2em] text-highlight mb-4">Sound Familiar?</motion.p>
            <motion.h2 variants={fadeUp} custom={1}
              className="font-display text-2xl sm:text-3xl font-bold text-primary mb-6 md:text-4xl leading-tight">
              The Silent Structural Gaps Killing Your Growth
            </motion.h2>
            <motion.p variants={fadeUp} custom={2}
              className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto mb-14">
              These aren't admissions problems. They're structural design failures that compound every month.
            </motion.p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger}
            className="mx-auto max-w-4xl grid gap-4 sm:grid-cols-2">
            {[
              { icon: TrendingDown, text: "Revenue plateau despite growing student numbers", detail: "More students ≠ more profit when structure is broken." },
              { icon: DollarSign, text: "Premium programs sitting underutilised", detail: "You built them, but the pipeline isn't converting." },
              { icon: AlertTriangle, text: "Salary pressure rising faster than revenue", detail: "Teacher costs eating into margins with no structural fix." },
              { icon: Users, text: "Founder dependency blocking scale", detail: "If you step away for a week, everything slows down." },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp} custom={i}
                className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm transition-all duration-300 hover:border-highlight/30 hover:shadow-lg hover:-translate-y-1">
                <div className="flex-shrink-0 rounded-xl bg-highlight/8 p-3 transition-colors duration-300 group-hover:bg-highlight/15">
                  <item.icon className="h-5 w-5 text-highlight" />
                </div>
                <div>
                  <p className="font-display font-bold text-foreground mb-1 text-sm sm:text-base leading-snug">{item.text}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.detail}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 3 — THE DIAGNOSTIC FRAMEWORK
       ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
            className="mx-auto max-w-3xl text-center mb-14">
            <motion.div variants={fadeUp} custom={0}
              className="inline-flex items-center gap-2 rounded-full bg-accent/12 border border-accent/20 px-5 py-2 mb-6">
              <Star className="h-4 w-4 text-accent" />
              <span className="font-display text-sm font-bold text-accent-foreground">The ARK Institutional Structural Audit™</span>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1}
              className="font-display text-2xl sm:text-3xl font-bold text-primary mb-4 md:text-4xl leading-tight">
              12 Metrics That Define Your Institute's Health
            </motion.h2>
            <motion.p variants={fadeUp} custom={2}
              className="text-muted-foreground text-base sm:text-lg">
              A data-driven RAG evaluation covering every structural dimension of your coaching business.
            </motion.p>
          </motion.div>

          {/* Tabs header */}
          <div className="flex justify-center mb-8 gap-2 border-b border-border pb-4 overflow-x-auto">
            {[
              { id: "financial", label: "Financial Metrics", icon: DollarSign },
              { id: "operations", label: "Operational Metrics", icon: Building },
              { id: "growth", label: "Growth & Scale", icon: Zap }
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeMetricTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveMetricTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    isActive 
                      ? "bg-accent text-accent-foreground shadow-md hover-glow scale-105"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <TabIcon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <motion.div 
            key={activeMetricTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto max-w-5xl grid gap-4 sm:grid-cols-2 lg:grid-cols-2"
          >
            {/* Filtered list of metrics */}
            {(() => {
              const metricsMap: Record<string, Array<{ icon: any; name: string; desc: string }>> = {
                financial: [
                  { icon: TrendingDown, name: "Revenue Efficiency", desc: "Translating student volume to revenue efficiently." },
                  { icon: DollarSign, name: "Fee Realisation", desc: "Pricing power vs segment benchmarks." },
                  { icon: BarChart3, name: "Salary vs Revenue", desc: "Operating margin health relative to payroll." },
                  { icon: Shield, name: "Cash-Flow Discipline", desc: "Fee collection predictability & pending defaults." }
                ],
                operations: [
                  { icon: Users, name: "Batch Utilisation", desc: "Optimal class sizes vs wasteful runs." },
                  { icon: Building, name: "Space Monetisation", desc: "Revenue return per square foot of teaching area." },
                  { icon: Users, name: "Teacher Dependency", desc: "Key-person operational disruption risk." },
                  { icon: Layers, name: "Founder Dependency", desc: "Systems delegation vs owner manual override." }
                ],
                growth: [
                  { icon: BookOpen, name: "Program Mix Strength", desc: "Premium high-value offerings in your portfolio." },
                  { icon: AlertTriangle, name: "Dropout & Retention", desc: "Term-time dropout rates impacting stability." },
                  { icon: Target, name: "Lead Conversion", desc: "Admissions funnel success rate from enquiries." },
                  { icon: Zap, name: "Scalability Readiness", desc: "Structural maturity score to replicate operations." }
                ]
              };
              return metricsMap[activeMetricTab].map((metric) => (
                <div key={metric.name}
                  className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:border-accent/40 hover:shadow-lg hover:-translate-y-1">
                  <div className="rounded-xl bg-primary/6 p-3 text-primary flex-shrink-0 transition-colors duration-300 group-hover:bg-accent group-hover:text-accent-foreground">
                    <metric.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-display text-base font-bold text-foreground mb-1 leading-snug">{metric.name}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{metric.desc}</p>
                  </div>
                </div>
              ));
            })()}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 4 — INTERACTIVE REVENUE LEAKAGE CALCULATOR
       ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-gradient-primary relative overflow-hidden">
        {/* Ambient background dots */}
        <div className="absolute inset-0 bg-dot-pattern-dense pointer-events-none opacity-40" />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-accent/5 blur-[100px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-highlight/4 blur-[80px]" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <span className="text-accent text-xs font-bold uppercase tracking-[0.2em] mb-4 inline-block bg-accent/10 px-4 py-1.5 rounded-full border border-accent/20">
                Interactive Leakage Simulator
              </span>
              <h2 className="font-display text-3xl font-bold text-primary-foreground md:text-5xl leading-tight">
                How Much Revenue Are You Leaving on the Table?
              </h2>
              <p className="text-primary-foreground/60 text-sm sm:text-base mt-3 max-w-2xl mx-auto">
                Select your parameters below to simulate your current structural optimization opportunity.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* INPUTS COLUMN */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                {/* Selector 1 */}
                <div className="bg-primary-foreground/5 border border-primary-foreground/10 rounded-2xl p-6 backdrop-blur-sm">
                  <h3 className="text-primary-foreground/80 font-display font-semibold text-sm mb-4 flex items-center gap-2">
                    <Users className="h-4 w-4 text-accent" /> Active Student Strength
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {["< 50", "50–100", "100–200", "200+"].map((option) => (
                      <button
                        key={option}
                        onClick={() => setCalcStrength(option)}
                        className={`py-3 px-4 rounded-xl font-display text-sm font-semibold border transition-all duration-300 ${
                          calcStrength === option
                            ? "bg-accent text-accent-foreground border-accent shadow-md scale-[1.02]"
                            : "bg-primary-foreground/5 text-primary-foreground/70 border-primary-foreground/10 hover:bg-primary-foreground/10"
                        }`}
                      >
                        {option} students
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selector 2 */}
                <div className="bg-primary-foreground/5 border border-primary-foreground/10 rounded-2xl p-6 backdrop-blur-sm">
                  <h3 className="text-primary-foreground/80 font-display font-semibold text-sm mb-4 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-accent" /> Current Monthly Revenue
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {["< 1.5 L", "1.5–3 L", "3–6 L", "6 L+"].map((option) => (
                      <button
                        key={option}
                        onClick={() => setCalcRevenue(option)}
                        className={`py-3 px-4 rounded-xl font-display text-sm font-semibold border transition-all duration-300 ${
                          calcRevenue === option
                            ? "bg-accent text-accent-foreground border-accent shadow-md scale-[1.02]"
                            : "bg-primary-foreground/5 text-primary-foreground/70 border-primary-foreground/10 hover:bg-primary-foreground/10"
                        }`}
                      >
                        ₹ {option}/mo
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* OUTPUT CARD COLUMN */}
              <div className="lg:col-span-7">
                <div className="h-full rounded-3xl bg-primary-foreground/5 border border-primary-foreground/15 backdrop-blur-md overflow-hidden flex flex-col justify-between shadow-2xl relative">
                  <div className="absolute top-0 right-0 p-4">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-highlight bg-highlight/10 border border-highlight/20 px-2.5 py-1 rounded-full">
                      Estimate Profile
                    </span>
                  </div>

                  <div className="p-6 sm:p-8 md:p-10 flex-1">
                    <p className="text-primary-foreground/40 text-xs font-bold uppercase tracking-[0.15em] mb-6">
                      Estimated Leakage Summary
                    </p>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-primary-foreground/10 pb-4">
                        <span className="text-primary-foreground/70 text-sm sm:text-base">Current Revenue Tier</span>
                        <span className="font-display font-bold text-primary-foreground text-base sm:text-lg">
                          {formatCalcCurrency(calcResults.current)}/mo
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between border-b border-primary-foreground/10 pb-4">
                        <span className="text-primary-foreground/70 text-sm sm:text-base flex items-center gap-1.5">
                          Benchmark Target <Sparkles className="h-3.5 w-3.5 text-accent animate-pulse" />
                        </span>
                        <span className="font-display font-bold text-accent text-base sm:text-lg">
                          {formatCalcCurrency(calcResults.potential)}/mo
                        </span>
                      </div>

                      {/* Visual Bar Comparison */}
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between text-xs text-primary-foreground/45">
                          <span>Revenue Comparison Scale</span>
                          <span>{Math.round((calcResults.current / calcResults.potential) * 100)}% Efficient</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-primary-foreground/10 overflow-hidden flex">
                          <div 
                            className="bg-highlight h-full rounded-l-full transition-all duration-500 ease-out" 
                            style={{ width: `${Math.min(100, (calcResults.current / calcResults.potential) * 100)}%` }} 
                          />
                          <div 
                            className="bg-accent h-full rounded-r-full transition-all duration-500 ease-out opacity-80" 
                            style={{ width: `${Math.max(0, 100 - (calcResults.current / calcResults.potential) * 100)}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Highlights section */}
                  <div className="bg-highlight/10 border-t border-highlight/20 p-6 sm:p-8">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-primary-foreground/50 text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em]">Monthly Leakage</p>
                        <p className="font-display font-black text-highlight text-xl sm:text-3xl mt-1 text-glow-highlight">
                          {formatCalcCurrency(calcResults.gap)} / mo
                        </p>
                      </div>
                      <div className="border-l border-primary-foreground/10 pl-6">
                        <p className="text-primary-foreground/50 text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em]">Annual Scaling Impact</p>
                        <p className="font-display font-black text-highlight text-xl sm:text-3xl mt-1 text-glow-highlight">
                          {formatCalcCurrency(calcResults.annual)} / yr
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action link */}
                  <div className="p-4 sm:p-5 bg-primary-foreground/3 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-primary-foreground/55 text-xs text-center sm:text-left italic max-w-sm">
                      This leakage represents structural layout inefficiencies. Take the full 12-metric audit to generate your RAG score.
                    </p>
                    <Link 
                      to="/questionnaire" 
                      className="group flex items-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground font-display font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-accent/20 transition-all hover:scale-105"
                    >
                      Audit My Centre
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 5 — HOW IT WORKS
       ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
            className="mx-auto max-w-3xl text-center mb-14">
            <motion.h2 variants={fadeUp} custom={0}
              className="font-display text-2xl sm:text-3xl font-bold text-primary mb-4 md:text-4xl">
              How It Works
            </motion.h2>
            <motion.p variants={fadeUp} custom={1}
              className="text-muted-foreground text-base sm:text-lg">
              A structured path from diagnosis to transformation.
            </motion.p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger}
            className="mx-auto max-w-4xl grid gap-5 sm:gap-6 md:grid-cols-3">
            {[
              {
                step: "01", title: "Free Structural Audit",
                desc: "Complete the 15-question diagnostic. Get your Structural Efficiency Index and Revenue Leakage estimate instantly.",
                accentColor: "bg-accent", borderColor: "border-accent/20", iconBg: "bg-accent/10",
              },
              {
                step: "02", title: "Snapshot Report",
                desc: "Receive your 12-metric RAG evaluation with benchmarks and risk zones. Understand where you stand.",
                accentColor: "bg-highlight", borderColor: "border-highlight/20", iconBg: "bg-highlight/10",
              },
              {
                step: "03", title: "Strategic Intervention",
                desc: "If structural correction is needed, explore a guided redesign session with ARK's consulting team.",
                accentColor: "bg-primary", borderColor: "border-primary/20", iconBg: "bg-primary/10",
              },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp} custom={i}
                className={`relative rounded-2xl border ${item.borderColor} bg-card p-6 sm:p-7 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}>
                <div className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${item.accentColor} text-primary-foreground font-display font-bold text-xl shadow-md`}>
                  {item.step}
                </div>
                <h3 className="font-display text-lg font-bold text-foreground mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                {i < 2 && (
                  <ChevronRight className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 h-6 w-6 text-border" />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 6 — AUTHORITY
       ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-gradient-warm">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
            className="mx-auto max-w-3xl">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-12">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">Why ARK?</p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-primary md:text-4xl leading-tight">
                Built From the Classroom, Not a Boardroom
              </h2>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={stagger} className="space-y-4">
              {[
                { icon: Building, text: "ARK is a working institution — not theoretical consultants", detail: "Every framework we teach, we run ourselves. Since 2016 in Chennai." },
                { icon: BookOpen, text: "Real operational experience with real classrooms", detail: "We've faced the same salary pressures, dropout challenges, and scaling decisions you face." },
                { icon: BarChart3, text: "Systems-driven approach — not opinion-based advice", detail: "Our audit is data-first. Every recommendation is backed by structural benchmarks." },
                { icon: Users, text: "Founder-led consulting with skin in the game", detail: "You speak directly with people who run institutions — not junior consultants reading scripts." },
              ].map((item, i) => (
                <motion.div key={i} variants={fadeUp} custom={i}
                  className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6 transition-all duration-300 hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5">
                  <div className="flex-shrink-0 rounded-xl bg-primary/8 p-3">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-foreground mb-1 text-sm sm:text-base">{item.text}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.detail}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 7 — FINAL CTA
       ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-32 bg-gradient-primary relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-accent/8 blur-[100px]" />
          <div className="absolute top-[-15%] left-[-5%] w-[300px] h-[300px] rounded-full bg-highlight/5 blur-[80px]" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}>
            <motion.div variants={fadeUp} custom={0} className="mb-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-accent/20 px-4 py-1.5 text-accent text-xs font-bold tracking-widest uppercase backdrop-blur-sm">
                Free Assessment
              </span>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1}
              className="mx-auto max-w-3xl font-display text-2xl sm:text-3xl font-bold text-primary-foreground md:text-5xl mb-6 leading-tight">
              Calculate Your Structural Efficiency Score
            </motion.h2>
            <motion.p variants={fadeUp} custom={2}
              className="mx-auto max-w-xl text-primary-foreground/50 text-base sm:text-lg mb-10 leading-relaxed">
              15 questions. 5 minutes. Know exactly where your institution stands — and what it's costing you.
            </motion.p>
            <motion.div variants={fadeUp} custom={3}>
              <Link to="/questionnaire"
                className="group inline-flex items-center gap-3 rounded-2xl bg-accent px-8 py-4 sm:px-12 sm:py-5 font-display text-base sm:text-lg font-bold text-accent-foreground shadow-float transition-all duration-300 hover:scale-105 hover:gap-4 hover:shadow-xl">
                Get My Free Structural Audit
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
            <motion.p variants={fadeUp} custom={4}
              className="mt-6 text-primary-foreground/30 text-sm">
              No payment required. No obligation. Just clarity.
            </motion.p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
