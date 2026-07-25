/**
 * Standard Revenue Planner — model and math.
 *
 * A plan is a list of standard *groups* (NEET, Senior, Kids, Nestlings…), each
 * holding *standards* (a class/batch: "12th Std", "NEET Repeater A"). A group
 * carries the headline annual fee; a standard inherits it unless it sets its
 * own. Seat sliders move `enrolled` between 0 and `capacity`, and every figure
 * on the page is derived from that — nothing is stored twice.
 */

export interface Standard {
  id: string;
  name: string;
  /** Short batch code shown next to the name, e.g. "A". Optional. */
  code: string;
  capacity: number;
  enrolled: number;
  /** Per-student annual fee. Null means "use the group fee". */
  annualFee: number | null;
}

export interface StandardGroup {
  id: string;
  name: string;
  /** Default per-student annual fee for standards in this group. */
  annualFee: number;
  standards: Standard[];
}

export interface PlannerState {
  name: string;
  institutionName: string;
  /** Fixed monthly operating cost — rent, salaries, utilities. */
  monthlyExpenses: number;
  groups: StandardGroup[];
}

export const uid = () => Math.random().toString(36).slice(2, 10);

/** A standard's effective fee: its own override, else the group's. */
export const feeOf = (standard: Standard, group: StandardGroup) =>
  standard.annualFee ?? group.annualFee;

// ─── Defaults ────────────────────────────────────────────────────────────────
// Seeded from the batch sheet the management team shared: 305 seats across
// four groups. Everything here is editable in the UI.

export const DEFAULT_MONTHLY_EXPENSES = 550000;

const std = (name: string, code: string, capacity: number): Standard => ({
  id: uid(), name, code, capacity, enrolled: 0, annualFee: null,
});

export const createDefaultGroups = (): StandardGroup[] => [
  {
    id: uid(),
    name: "NEET Batches",
    annualFee: 100000,
    standards: [
      std("NEET Repeater A", "A", 25),
      std("NEET Repeater B", "B", 25),
      std("NEET Repeater C", "C", 25),
    ],
  },
  {
    id: uid(),
    name: "Senior Batches",
    annualFee: 60000,
    standards: [
      std("12th Std – SB", "J", 25),
      std("12th ICSE & CBSE", "L", 15),
      std("11th Std", "N", 20),
      std("10th Std – SB", "H", 25),
      std("10th Std – CBSE", "I", 15),
      std("10th Std – ICSE", "K", 20),
    ],
  },
  {
    id: uid(),
    name: "Kids Batches",
    annualFee: 22000,
    standards: [
      std("9th Std", "D", 25),
      std("8th Std", "E", 15),
      std("7th Std", "F", 15),
      std("6th Std", "G", 15),
      std("5th Std", "M", 15),
      std("4th Std", "O", 15),
    ],
  },
  {
    id: uid(),
    name: "Nestlings",
    annualFee: 84000,
    standards: [std("Nestlings", "P", 10)],
  },
];

export const createDefaultState = (institutionName = ""): PlannerState => ({
  name: "Enrollment plan",
  institutionName,
  monthlyExpenses: DEFAULT_MONTHLY_EXPENSES,
  groups: createDefaultGroups(),
});

// ─── Derived figures ─────────────────────────────────────────────────────────

export interface GroupSummary {
  id: string;
  name: string;
  seats: number;
  enrolled: number;
  annualRevenue: number;
  occupancy: number;
}

export interface PlanSummary {
  groups: GroupSummary[];
  totalSeats: number;
  totalEnrolled: number;
  annualRevenue: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  annualExpenses: number;
  monthlySurplus: number;
  occupancy: number;
  /** Annual revenue if every seat were filled. */
  maxAnnualRevenue: number;
  /** Occupancy % at which revenue covers expenses, or null if unreachable. */
  breakevenOccupancy: number | null;
  /** Seats that must be filled to break even, or null if unreachable. */
  breakevenSeats: number | null;
  /** Highest revenue-per-seat group — where the next admission pays most. */
  bestRoiGroup: { name: string; perSeatMonthly: number } | null;
}

export const summarise = (state: PlannerState): PlanSummary => {
  const groups: GroupSummary[] = state.groups.map((g) => {
    const seats = g.standards.reduce((a, s) => a + s.capacity, 0);
    const enrolled = g.standards.reduce((a, s) => a + Math.min(s.enrolled, s.capacity), 0);
    const annualRevenue = g.standards.reduce(
      (a, s) => a + Math.min(s.enrolled, s.capacity) * feeOf(s, g),
      0
    );
    return { id: g.id, name: g.name, seats, enrolled, annualRevenue, occupancy: seats ? enrolled / seats : 0 };
  });

  const totalSeats = groups.reduce((a, g) => a + g.seats, 0);
  const totalEnrolled = groups.reduce((a, g) => a + g.enrolled, 0);
  const annualRevenue = groups.reduce((a, g) => a + g.annualRevenue, 0);
  const annualExpenses = state.monthlyExpenses * 12;

  const maxAnnualRevenue = state.groups.reduce(
    (a, g) => a + g.standards.reduce((b, s) => b + s.capacity * feeOf(s, g), 0),
    0
  );

  // Breakeven assumes the current enrollment *mix* scales up proportionally,
  // falling back to the full-capacity mix before anyone is enrolled.
  const mixAnnualRevenue = annualRevenue > 0 ? annualRevenue : maxAnnualRevenue;
  const mixSeats = annualRevenue > 0 ? totalEnrolled : totalSeats;
  const revenuePerSeat = mixSeats > 0 ? mixAnnualRevenue / mixSeats : 0;

  let breakevenSeats: number | null = null;
  let breakevenOccupancy: number | null = null;
  if (revenuePerSeat > 0) {
    const needed = Math.ceil(annualExpenses / revenuePerSeat);
    if (needed <= totalSeats) {
      breakevenSeats = needed;
      breakevenOccupancy = totalSeats ? (needed / totalSeats) * 100 : null;
    }
  }

  const bestRoiGroup = state.groups.reduce<{ name: string; perSeatMonthly: number } | null>(
    (best, g) => {
      const seats = g.standards.reduce((a, s) => a + s.capacity, 0);
      if (!seats) return best;
      const fees = g.standards.reduce((a, s) => a + s.capacity * feeOf(s, g), 0);
      const perSeatMonthly = fees / seats / 12;
      return !best || perSeatMonthly > best.perSeatMonthly ? { name: g.name, perSeatMonthly } : best;
    },
    null
  );

  return {
    groups,
    totalSeats,
    totalEnrolled,
    annualRevenue,
    monthlyRevenue: annualRevenue / 12,
    monthlyExpenses: state.monthlyExpenses,
    annualExpenses,
    monthlySurplus: annualRevenue / 12 - state.monthlyExpenses,
    occupancy: totalSeats ? totalEnrolled / totalSeats : 0,
    maxAnnualRevenue,
    breakevenOccupancy,
    breakevenSeats,
    bestRoiGroup,
  };
};

export interface Projection {
  occupancyPercent: number;
  seats: number;
  groups: { name: string; students: number; annualRevenue: number }[];
  annualRevenue: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlySurplus: number;
  status: "Loss" | "Near breakeven" | "Profitable" | "Peak";
}

/**
 * What the plan looks like if every group were filled to `percent` capacity.
 * Fills each group independently so the revenue mix stays true to the fees
 * actually configured — the per-group seat counts always add up to the total.
 */
export const project = (state: PlannerState, percent: number): Projection => {
  const groups = state.groups.map((g) => {
    const students = g.standards.reduce((a, s) => a + Math.round(s.capacity * (percent / 100)), 0);
    const annualRevenue = g.standards.reduce(
      (a, s) => a + Math.round(s.capacity * (percent / 100)) * feeOf(s, g),
      0
    );
    return { name: g.name, students, annualRevenue };
  });

  const seats = groups.reduce((a, g) => a + g.students, 0);
  const annualRevenue = groups.reduce((a, g) => a + g.annualRevenue, 0);
  const monthlyRevenue = annualRevenue / 12;
  const monthlySurplus = monthlyRevenue - state.monthlyExpenses;

  let status: Projection["status"];
  if (percent >= 100) status = "Peak";
  else if (monthlySurplus < 0) status = "Loss";
  else if (monthlySurplus < state.monthlyExpenses * 0.15) status = "Near breakeven";
  else status = "Profitable";

  return {
    occupancyPercent: percent,
    seats,
    groups,
    annualRevenue,
    monthlyRevenue,
    monthlyExpenses: state.monthlyExpenses,
    monthlySurplus,
    status,
  };
};

export const PROJECTION_STEPS = [25, 50, 75, 100];

// ─── Formatting (Indian numbering) ───────────────────────────────────────────

export const formatINR = (n: number): string => {
  const sign = n < 0 ? "-" : "";
  const v = Math.abs(n);
  if (v >= 1e7) return `${sign}₹${(v / 1e7).toFixed(2)}Cr`;
  if (v >= 1e5) return `${sign}₹${(v / 1e5).toFixed(1)}L`;
  if (v >= 1e3) return `${sign}₹${Math.round(v / 1e3)}K`;
  return `${sign}₹${Math.round(v)}`;
};

export const formatINRFull = (n: number): string =>
  `₹${Math.round(n).toLocaleString("en-IN")}`;

export const formatSignedINR = (n: number): string =>
  `${n >= 0 ? "+" : ""}${formatINR(n)}`;
