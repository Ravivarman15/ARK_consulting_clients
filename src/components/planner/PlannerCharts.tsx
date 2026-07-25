import {
  Bar, BarChart, CartesianGrid, Cell, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { formatINR, formatINRFull, type PlanSummary, type Projection } from "@/utils/planner";

// Each chart plots ONE measure (annual revenue) against a single axis, so a
// single hue carries magnitude and the dashed line carries the expense
// threshold. No categorical palette is in play — bars are not identities.
const REVENUE = "#2166B8";
const REVENUE_DIM = "#9CB8DA";
const EXPENSE = "#DC2626";
const AXIS = "#7A8699";
const GRID = "#E6E9EF";

const axisProps = {
  stroke: AXIS,
  tick: { fill: AXIS, fontSize: 11 },
  tickLine: false,
} as const;

interface TipRow {
  label: string;
  value: string;
  muted?: boolean;
}

const Tip = ({ title, rows }: { title: string; rows: TipRow[] }) => (
  <div className="rounded-xl border border-border bg-card px-3.5 py-2.5 shadow-lg">
    <p className="mb-1.5 font-display text-xs font-bold text-foreground">{title}</p>
    {rows.map((r) => (
      <p key={r.label} className={`text-xs leading-relaxed ${r.muted ? "text-muted-foreground" : "text-foreground"}`}>
        <span className="text-muted-foreground">{r.label}: </span>
        <span className="font-semibold">{r.value}</span>
      </p>
    ))}
  </div>
);

/** Annual revenue contributed by each standard group, against annual expenses. */
export const GroupRevenueChart = ({ summary }: { summary: PlanSummary }) => {
  const data = [
    ...summary.groups.map((g) => ({
      name: g.name.replace(/ Batches$/, ""),
      revenue: g.annualRevenue,
      students: g.enrolled,
      seats: g.seats,
      isTotal: false,
    })),
    {
      name: "Total",
      revenue: summary.annualRevenue,
      students: summary.totalEnrolled,
      seats: summary.totalSeats,
      isTotal: true,
    },
  ];

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-sm font-bold text-foreground">Annual revenue by group</h3>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
          <span className="inline-block h-0 w-4 border-t-2 border-dashed" style={{ borderColor: EXPENSE }} />
          Annual expenses {formatINR(summary.annualExpenses)}
        </span>
      </div>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 4 }} barCategoryGap="28%">
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="name" {...axisProps} axisLine={{ stroke: GRID }} interval={0} />
            <YAxis {...axisProps} axisLine={false} width={54} tickFormatter={(v: number) => formatINR(v)} />
            <Tooltip
              cursor={{ fill: "rgba(33,102,184,0.06)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as (typeof data)[number];
                return (
                  <Tip
                    title={d.name}
                    rows={[
                      { label: "Annual revenue", value: formatINRFull(d.revenue) },
                      { label: "Students", value: `${d.students} of ${d.seats} seats` },
                    ]}
                  />
                );
              }}
            />
            <ReferenceLine
              y={summary.annualExpenses}
              stroke={EXPENSE}
              strokeDasharray="6 4"
              strokeWidth={2}
              label={{ value: "Expenses", position: "right", fill: EXPENSE, fontSize: 10, fontWeight: 700 }}
            />
            <Bar dataKey="revenue" radius={[4, 4, 0, 0]} maxBarSize={62}>
              {data.map((d) => (
                <Cell key={d.name} fill={d.isTotal ? REVENUE : REVENUE_DIM} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
        The <span className="font-semibold text-foreground">Total</span> bar must clear the dashed line for the
        year to break even.
      </p>
    </div>
  );
};

/** Annual revenue at each occupancy step, against annual expenses. */
export const ProjectionChart = ({
  projections,
  annualExpenses,
}: {
  projections: Projection[];
  annualExpenses: number;
}) => {
  const data = projections.map((p) => ({
    name: `${p.occupancyPercent}%`,
    seats: p.seats,
    revenue: p.annualRevenue,
    surplus: p.monthlySurplus,
    covers: p.annualRevenue >= annualExpenses,
  }));

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-sm font-bold text-foreground">Annual revenue by occupancy</h3>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
          <span className="inline-block h-0 w-4 border-t-2 border-dashed" style={{ borderColor: EXPENSE }} />
          Annual expenses {formatINR(annualExpenses)}
        </span>
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 4 }} barCategoryGap="30%">
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="name" {...axisProps} axisLine={{ stroke: GRID }} interval={0} />
            <YAxis {...axisProps} axisLine={false} width={54} tickFormatter={(v: number) => formatINR(v)} />
            <Tooltip
              cursor={{ fill: "rgba(33,102,184,0.06)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as (typeof data)[number];
                return (
                  <Tip
                    title={`${d.name} occupancy — ${d.seats} seats`}
                    rows={[
                      { label: "Annual revenue", value: formatINRFull(d.revenue) },
                      {
                        label: d.surplus >= 0 ? "Monthly surplus" : "Monthly shortfall",
                        value: formatINRFull(Math.abs(d.surplus)),
                      },
                    ]}
                  />
                );
              }}
            />
            <ReferenceLine
              y={annualExpenses}
              stroke={EXPENSE}
              strokeDasharray="6 4"
              strokeWidth={2}
              label={{ value: "Expenses", position: "right", fill: EXPENSE, fontSize: 10, fontWeight: 700 }}
            />
            <Bar dataKey="revenue" radius={[4, 4, 0, 0]} maxBarSize={72}>
              {data.map((d) => (
                <Cell key={d.name} fill={d.covers ? REVENUE : REVENUE_DIM} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
        Solid bars clear annual expenses; pale bars fall short. Exact figures are in the table below.
      </p>
    </div>
  );
};
