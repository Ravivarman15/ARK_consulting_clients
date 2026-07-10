interface FormData {
  studentStrength: string;
  monthlyRevenue: string;
  avgFeePerStudent: string;
  highestAnnualFee: string;
  avgStudentsPerBatch: string;
  totalBatchesPerDay: string;
  totalTeachingArea: string;
  salaryPercentOfRevenue: string;
  feeCollectionMethod: string;
  feePendingPercentage: string;
  monthlyEnquiries: string;
  conversionRate: string;
  studentDropoutRate: string;
  teacherLeaveImpact: string;
  ownerDailyInvolvement: string;
  [key: string]: string | string[];
}

export interface ScoreResult {
  category: string;
  score: "GREEN" | "AMBER" | "RED";
  label: string;
  details: string;
}

export interface LeakageItem {
  area: string;
  estimatedMonthly: string;
  lowEstimate: number;
  highEstimate: number;
}

export interface AuditResult {
  scores: ScoreResult[];
  efficiencyPercent: number;
  healthVerdict: string;
  leakageItems: LeakageItem[];
  totalLeakageLow: number;
  totalLeakageHigh: number;
}

// Score values for efficiency calculation
const SCORE_VAL: Record<string, number> = { GREEN: 3, AMBER: 2, RED: 1 };

export const calculateAudit = (formData: FormData): AuditResult => {
  const scores: ScoreResult[] = [];

  // 1. Revenue Efficiency
  const st = formData.studentStrength;
  const rev = formData.monthlyRevenue;
  let s1: "GREEN" | "AMBER" | "RED" = "RED";
  let l1 = "";

  if ((st === "200+" && (rev === "6 L+" || rev === "3–6 L")) ||
      (st === "100–200" && (rev === "3–6 L" || rev === "6 L+")) ||
      (st === "50–100" && (rev === "1.5–3 L" || rev === "3–6 L" || rev === "6 L+")) ||
      (st === "< 50" && rev === "1.5–3 L")) {
    s1 = "GREEN"; l1 = "Revenue meets or exceeds benchmark";
  } else if ((st === "100–200" && rev === "1.5–3 L") || (st === "50–100" && rev === "< 1.5 L") || (st === "< 50" && rev === "< 1.5 L")) {
    s1 = "AMBER"; l1 = "Revenue at 70-90% of benchmark";
  } else {
    s1 = "RED"; l1 = "Revenue significantly below benchmark";
  }
  scores.push({ category: "Revenue Efficiency", score: s1, label: l1, details: `Students: ${st}, Revenue: ${rev}` });

  // 2. Fee Realisation
  const fee = formData.avgFeePerStudent;
  let s2: "GREEN" | "AMBER" | "RED" = fee === "₹5,000+" || fee === "₹3,000–5,000" ? "GREEN" : fee === "₹2,000–3,000" ? "AMBER" : "RED";
  scores.push({ category: "Fee Realisation", score: s2, label: s2 === "GREEN" ? "Strong fee realisation" : s2 === "AMBER" ? "Moderate fee realisation" : "Low fee realisation", details: `Average fee: ${fee}` });

  // 3. Batch Utilisation
  const batch = formData.avgStudentsPerBatch;
  let s3: "GREEN" | "AMBER" | "RED" = batch === "20–25" ? "GREEN" : batch === "15–20" ? "AMBER" : "RED";
  scores.push({ category: "Batch Utilisation", score: s3, label: s3 === "GREEN" ? "Optimal batch size (20-25)" : s3 === "AMBER" ? "Below optimal (<20)" : batch === "< 15" ? "Underutilised (<15)" : "Overcrowded (25+)", details: `Per batch: ${batch}` });

  // 4. Program Mix
  const hf = formData.highestAnnualFee;
  let s4: "GREEN" | "AMBER" | "RED" = hf === "75,000+" ? "GREEN" : hf === "50,000–75,000" ? "AMBER" : "RED";
  scores.push({ category: "Program Mix Strength", score: s4, label: s4 === "GREEN" ? "Premium programs available" : s4 === "AMBER" ? "Mid-tier programs only" : "No premium programs", details: `Highest fee: ${hf}` });

  // 5. Salary vs Revenue
  const sal = formData.salaryPercentOfRevenue;
  let s5: "GREEN" | "AMBER" | "RED" = sal === "< 30%" ? "GREEN" : sal === "30–40%" ? "AMBER" : "RED";
  scores.push({ category: "Salary vs Revenue", score: s5, label: s5 === "GREEN" ? "Healthy salary ratio" : s5 === "AMBER" ? "Moderate salary burden" : "High salary burden", details: `Salary %: ${sal}` });

  // 6. Cash-Flow Discipline
  const fm = formData.feeCollectionMethod;
  const pend = formData.feePendingPercentage;
  let s6: "GREEN" | "AMBER" | "RED" = "RED";
  if ((fm === "Term-wise" || fm === "Annual upfront") && pend === "< 5%") s6 = "GREEN";
  else if (fm === "Quarterly" && (pend === "5–10%" || pend === "< 5%")) s6 = "AMBER";
  else if (fm === "Monthly" || pend === "20%+" || pend === "10–20%") s6 = "RED";
  else s6 = "AMBER";
  scores.push({ category: "Cash-Flow Discipline", score: s6, label: s6 === "GREEN" ? "Excellent cash flow discipline" : s6 === "AMBER" ? "Moderate cash flow discipline" : "Poor cash flow discipline", details: `Collection: ${fm}, Pending: ${pend}` });

  // 7. Dropout Risk
  const dr = formData.studentDropoutRate;
  let s7: "GREEN" | "AMBER" | "RED" = dr === "< 3%" ? "GREEN" : dr === "3–5%" ? "AMBER" : "RED";
  scores.push({ category: "Dropout & Retention", score: s7, label: s7 === "GREEN" ? "Low dropout risk" : s7 === "AMBER" ? "Moderate dropout risk" : "High dropout risk", details: `Dropout rate: ${dr}` });

  // 8. Teacher Dependency
  const ti = formData.teacherLeaveImpact;
  let s8: "GREEN" | "AMBER" | "RED" = ti === "No impact" ? "GREEN" : ti === "Minor disruption" ? "AMBER" : "RED";
  scores.push({ category: "Teacher Dependency", score: s8, label: s8 === "GREEN" ? "No key-person risk" : s8 === "AMBER" ? "Partial teacher dependency" : "Critical teacher dependency", details: `If key teacher leaves: ${ti}` });

  // 9. Space Monetisation (derive from area + revenue)
  const area = formData.totalTeachingArea;
  let s9: "GREEN" | "AMBER" | "RED" = "RED";
  // Heuristic: small area + high revenue = GREEN, large area + low revenue = RED
  if ((area === "< 500 sq.ft" || area === "500–1,000 sq.ft") && (rev === "3–6 L" || rev === "6 L+")) s9 = "GREEN";
  else if ((area === "1,000–1,500 sq.ft" && (rev === "3–6 L" || rev === "6 L+")) || (area === "500–1,000 sq.ft" && rev === "1.5–3 L")) s9 = "AMBER";
  else if (area === "1,500+ sq.ft" && (rev === "6 L+")) s9 = "GREEN";
  else if (area === "1,500+ sq.ft" && rev === "3–6 L") s9 = "AMBER";
  else s9 = "RED";
  scores.push({ category: "Space Monetisation", score: s9, label: s9 === "GREEN" ? "High space ROI" : s9 === "AMBER" ? "Moderate space utilisation" : "Low space ROI", details: `Area: ${area}, Revenue: ${rev}` });

  // 10. Lead Conversion
  const conv = formData.conversionRate;
  let s10: "GREEN" | "AMBER" | "RED" = conv === "30%+" ? "GREEN" : conv === "20–30%" ? "AMBER" : conv === "10–20%" ? "AMBER" : "RED";
  scores.push({ category: "Lead Conversion", score: s10, label: s10 === "GREEN" ? "Strong conversion (30%+)" : s10 === "AMBER" ? "Moderate conversion" : "Poor conversion (<10%)", details: `Conversion: ${conv}` });

  // 11. Founder Dependency
  const own = formData.ownerDailyInvolvement;
  let s11: "GREEN" | "AMBER" | "RED" = own === "< 2 hrs" ? "GREEN" : own === "2–4 hrs" ? "AMBER" : "RED";
  scores.push({ category: "Founder Dependency", score: s11, label: s11 === "GREEN" ? "Runs without owner" : s11 === "AMBER" ? "Needs owner monitoring" : "Owner is the system", details: `Daily involvement: ${own}` });

  // 12. Scalability Readiness (composite)
  const greenSoFar = scores.filter(s => s.score === "GREEN").length;
  let s12: "GREEN" | "AMBER" | "RED" = greenSoFar >= 8 ? "GREEN" : greenSoFar >= 5 ? "AMBER" : "RED";
  scores.push({ category: "Scalability Readiness", score: s12, label: s12 === "GREEN" ? "Scale-ready institution" : s12 === "AMBER" ? "Needs restructuring to scale" : "Not ready to scale", details: `Based on composite structural health` });

  // Structural Efficiency %
  const totalScore = scores.reduce((acc, s) => acc + SCORE_VAL[s.score], 0);
  const maxScore = scores.length * 3;
  const efficiencyPercent = Math.round((totalScore / maxScore) * 100);

  // Health Verdict (formula-based)
  const gc = scores.filter(s => s.score === "GREEN").length;
  const rc = scores.filter(s => s.score === "RED").length;
  let healthVerdict: string;
  if (gc >= 9) healthVerdict = "Scale-Ready Institution";
  else if (gc >= 6) healthVerdict = "Optimise & Scale";
  else if (rc >= 4) healthVerdict = "Structural Risk — Stabilise First";
  else healthVerdict = "Stabilise & Optimise Before Scaling";

  // Revenue Leakage Estimator
  const leakageItems: LeakageItem[] = [];

  // Revenue gap
  if (s1 !== "GREEN") {
    leakageItems.push({
      area: "Revenue efficiency gap vs benchmark",
      estimatedMonthly: s1 === "RED" ? "₹1.5–2.5L" : "₹0.5–1.5L",
      lowEstimate: s1 === "RED" ? 150000 : 50000,
      highEstimate: s1 === "RED" ? 250000 : 150000,
    });
  }

  // Dropout leakage
  if (s7 !== "GREEN") {
    leakageItems.push({
      area: "Dropout & retention impact",
      estimatedMonthly: s7 === "RED" ? "₹40k–80k" : "₹15k–40k",
      lowEstimate: s7 === "RED" ? 40000 : 15000,
      highEstimate: s7 === "RED" ? 80000 : 40000,
    });
  }

  // Space underutilisation
  if (s9 !== "GREEN") {
    leakageItems.push({
      area: "Space monetisation gap",
      estimatedMonthly: s9 === "RED" ? "₹40k–70k" : "₹20k–40k",
      lowEstimate: s9 === "RED" ? 40000 : 20000,
      highEstimate: s9 === "RED" ? 70000 : 40000,
    });
  }

  // Conversion improvement
  if (s10 !== "GREEN") {
    leakageItems.push({
      area: "Conversion improvement potential",
      estimatedMonthly: s10 === "RED" ? "₹40k–60k" : "₹20k–40k",
      lowEstimate: s10 === "RED" ? 40000 : 20000,
      highEstimate: s10 === "RED" ? 60000 : 40000,
    });
  }

  // Fee under-realisation
  if (s2 !== "GREEN") {
    leakageItems.push({
      area: "Fee under-realisation",
      estimatedMonthly: s2 === "RED" ? "₹50k–1L" : "₹20k–50k",
      lowEstimate: s2 === "RED" ? 50000 : 20000,
      highEstimate: s2 === "RED" ? 100000 : 50000,
    });
  }

  const totalLeakageLow = leakageItems.reduce((acc, l) => acc + l.lowEstimate, 0);
  const totalLeakageHigh = leakageItems.reduce((acc, l) => acc + l.highEstimate, 0);

  return {
    scores,
    efficiencyPercent,
    healthVerdict,
    leakageItems,
    totalLeakageLow,
    totalLeakageHigh,
  };
};

// Keep backward compat
export const calculateScores = (formData: any): ScoreResult[] => {
  return calculateAudit(formData).scores;
};
