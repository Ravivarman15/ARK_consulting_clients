import { motion } from "framer-motion";
import { AlertTriangle, MinusCircle, CheckCircle, Crown } from "lucide-react";
import {
  formatINR, formatSignedINR, type PlanSummary, type Projection,
} from "@/utils/planner";

// Status is never carried by color alone — every badge pairs its tone with an
// icon and a word.
const STATUS: Record<
  Projection["status"],
  { label: string; icon: typeof AlertTriangle; chip: string; ring: string }
> = {
  Loss: {
    label: "Danger zone", icon: AlertTriangle,
    chip: "bg-red-500/10 text-red-600 border-red-500/25",
    ring: "border-border",
  },
  "Near breakeven": {
    label: "Near breakeven", icon: MinusCircle,
    chip: "bg-amber-400/15 text-amber-700 border-amber-400/30",
    ring: "border-amber-400/60 shadow-lg",
  },
  Profitable: {
    label: "Profitable", icon: CheckCircle,
    chip: "bg-green-500/10 text-green-700 border-green-500/25",
    ring: "border-border",
  },
  Peak: {
    label: "Peak", icon: Crown,
    chip: "bg-accent/15 text-accent-foreground border-accent/35",
    ring: "border-accent/50",
  },
};

export const ProjectionGrid = ({ projections }: { projections: Projection[] }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {projections.map((p, i) => {
      const s = STATUS[p.status];
      const Icon = s.icon;
      return (
        <motion.div
          key={p.occupancyPercent}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.35 }}
          className={`flex flex-col rounded-2xl border-2 bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${s.ring}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-lg font-black leading-tight text-foreground">
                {p.occupancyPercent}% occupancy
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {p.seats} seats filled
              </p>
            </div>
            <span className={`flex flex-shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${s.chip}`}>
              <Icon className="h-3 w-3" /> {s.label}
            </span>
          </div>

          <div className="my-4 space-y-1.5 border-y border-border py-3">
            {p.groups.map((g) => (
              <div key={g.name} className="flex items-baseline justify-between gap-2 text-xs">
                <span className="truncate text-muted-foreground">
                  {g.name.replace(/ Batches$/, "")}{" "}
                  <span className="text-foreground/50">({g.students})</span>
                </span>
                <span className="flex-shrink-0 font-semibold text-foreground">{formatINR(g.annualRevenue)}</span>
              </div>
            ))}
          </div>

          <dl className="mt-auto space-y-1.5 text-xs">
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-muted-foreground">Annual revenue</dt>
              <dd className="font-display font-bold text-foreground">{formatINR(p.annualRevenue)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-muted-foreground">Monthly revenue</dt>
              <dd className="font-semibold text-foreground">{formatINR(p.monthlyRevenue)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-muted-foreground">Monthly expenses</dt>
              <dd className="font-semibold text-foreground">{formatINR(p.monthlyExpenses)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-2 border-t border-border pt-1.5">
              <dt className="font-semibold text-foreground">
                {p.monthlySurplus >= 0 ? "Monthly surplus" : "Monthly shortfall"}
              </dt>
              <dd className={`font-display font-black ${p.monthlySurplus >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatSignedINR(p.monthlySurplus)}
              </dd>
            </div>
          </dl>
        </motion.div>
      );
    })}
  </div>
);

export const ProjectionTable = ({ projections }: { projections: Projection[] }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[560px] border-collapse text-sm">
      <thead>
        <tr className="border-b border-border text-left">
          {["Occupancy", "Seats", "Annual revenue", "Monthly", "vs expenses", "Status"].map((h) => (
            <th key={h} className="px-3 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {projections.map((p) => (
          <tr key={p.occupancyPercent} className="border-b border-border/60 transition-colors hover:bg-muted/40">
            <td className="px-3 py-2.5 font-semibold text-foreground">{p.occupancyPercent}%</td>
            <td className="px-3 py-2.5 text-muted-foreground">{p.seats}</td>
            <td className="px-3 py-2.5 font-semibold text-foreground">{formatINR(p.annualRevenue)}</td>
            <td className="px-3 py-2.5 text-muted-foreground">{formatINR(p.monthlyRevenue)}</td>
            <td className={`px-3 py-2.5 font-semibold ${p.monthlySurplus >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatSignedINR(p.monthlySurplus)}/mo
            </td>
            <td className="px-3 py-2.5 text-muted-foreground">{STATUS[p.status].label}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/** The four headline numbers under the projection cards. */
export const PlanFacts = ({ summary }: { summary: PlanSummary }) => {
  const facts = [
    {
      label: "Breakeven point",
      value: summary.breakevenOccupancy != null ? `~${Math.round(summary.breakevenOccupancy)}%` : "Not reachable",
      sub: summary.breakevenSeats != null
        ? `~${summary.breakevenSeats} seats`
        : "Raise fees or add capacity",
    },
    {
      label: "Annual expenses",
      value: formatINR(summary.annualExpenses),
      sub: `${formatINR(summary.monthlyExpenses)} × 12`,
    },
    {
      label: "Revenue at 100%",
      value: formatINR(summary.maxAnnualRevenue),
      sub: "max potential",
    },
    {
      label: "Best ROI seats",
      value: summary.bestRoiGroup?.name.replace(/ Batches$/, "") ?? "—",
      sub: summary.bestRoiGroup
        ? `${formatINR(summary.bestRoiGroup.perSeatMonthly)}/seat/month`
        : "add a standard first",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {facts.map((f) => (
        <div key={f.label} className="rounded-2xl border border-border bg-muted/40 p-4 text-center">
          <p className="text-[11px] font-semibold text-muted-foreground">{f.label}</p>
          <p className="mt-1 font-display text-xl font-black leading-tight text-foreground sm:text-2xl">{f.value}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{f.sub}</p>
        </div>
      ))}
    </div>
  );
};
