import { describe, it, expect } from "vitest";
import {
  createDefaultState, feeOf, formatINR, project, summarise,
  type PlannerState,
} from "@/utils/planner";

const fill = (state: PlannerState, percent: number): PlannerState => ({
  ...state,
  groups: state.groups.map((g) => ({
    ...g,
    standards: g.standards.map((s) => ({ ...s, enrolled: Math.round(s.capacity * (percent / 100)) })),
  })),
});

describe("planner defaults", () => {
  const state = createDefaultState();

  it("seeds 305 seats across four groups", () => {
    const s = summarise(state);
    expect(s.totalSeats).toBe(305);
    expect(s.groups.map((g) => g.seats)).toEqual([75, 120, 100, 10]);
  });

  it("prices full capacity at 1.774 Cr per year", () => {
    // NEET 75x1L + Senior 120x60k + Kids 100x22k + Nestlings 10x84k
    expect(summarise(state).maxAnnualRevenue).toBe(7500000 + 7200000 + 2200000 + 840000);
  });

  it("starts with zero enrolled, so zero revenue and a full shortfall", () => {
    const s = summarise(state);
    expect(s.totalEnrolled).toBe(0);
    expect(s.annualRevenue).toBe(0);
    expect(s.monthlySurplus).toBe(-550000);
  });
});

describe("summarise", () => {
  it("puts breakeven near 37% of seats on the default fee mix", () => {
    const s = summarise(createDefaultState());
    // 66L expenses / (1.774Cr / 305 seats) = ~114 seats
    expect(s.breakevenSeats).toBe(114);
    expect(Math.round(s.breakevenOccupancy!)).toBe(37);
  });

  it("names NEET as the best revenue-per-seat group", () => {
    const s = summarise(createDefaultState());
    expect(s.bestRoiGroup?.name).toBe("NEET Batches");
    expect(Math.round(s.bestRoiGroup!.perSeatMonthly)).toBe(8333);
  });

  it("caps revenue at capacity when enrolled exceeds seats", () => {
    const state = createDefaultState();
    state.groups[3].standards[0].enrolled = 999; // 10 seats available
    expect(summarise(state).groups[3].annualRevenue).toBe(10 * 84000);
  });

  it("honours a per-standard fee override", () => {
    const state = createDefaultState();
    state.groups[2].standards[0].annualFee = 50000; // 9th Std, 25 seats
    state.groups[2].standards[0].enrolled = 10;
    expect(feeOf(state.groups[2].standards[0], state.groups[2])).toBe(50000);
    expect(summarise(state).groups[2].annualRevenue).toBe(500000);
  });

  it("reports no breakeven when capacity cannot cover expenses", () => {
    const state = createDefaultState();
    state.monthlyExpenses = 10_000_000;
    expect(summarise(state).breakevenSeats).toBeNull();
  });
});

describe("project", () => {
  it("matches an equivalent manual fill of every batch", () => {
    for (const percent of [25, 50, 75, 100]) {
      const projected = project(createDefaultState(), percent);
      const manual = summarise(fill(createDefaultState(), percent));
      expect(projected.annualRevenue).toBe(manual.annualRevenue);
      expect(projected.seats).toBe(manual.totalEnrolled);
    }
  });

  it("flags a loss below breakeven and profit above it", () => {
    const state = createDefaultState();
    expect(project(state, 25).status).toBe("Loss");
    expect(project(state, 75).status).toBe("Profitable");
    expect(project(state, 100).status).toBe("Peak");
  });

  it("fills every seat at 100%", () => {
    const p = project(createDefaultState(), 100);
    expect(p.seats).toBe(305);
    expect(p.annualRevenue).toBe(17740000);
  });
});

describe("formatINR", () => {
  it("uses Indian crore/lakh/thousand units", () => {
    expect(formatINR(17740000)).toBe("₹1.77Cr");
    expect(formatINR(1100000)).toBe("₹11.0L");
    // Lakhs win over thousands from 1,00,000 up.
    expect(formatINR(458000)).toBe("₹4.6L");
    expect(formatINR(45800)).toBe("₹46K");
    expect(formatINR(0)).toBe("₹0");
    expect(formatINR(-45800)).toBe("-₹46K");
  });
});
