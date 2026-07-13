import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, TrendingUp, DollarSign, Users, Building, BookOpen,
  AlertTriangle, CheckCircle, XCircle, Briefcase, Lock, Unlock,
  MessageCircle, Sparkles, Crown, Award, FileDown, ChevronRight,
  Target, Zap, BarChart3, Shield, Layers, ArrowRight
} from "lucide-react";
import jsPDF from "jspdf";
import arkLogo from "@/assets/ark-logo.png";
import type { AuditResult, ScoreResult, LeakageItem } from "@/utils/scoring";

interface ScoreCardProps {
  auditResult: AuditResult;
  onBackHome: () => void;
  institutionName: string;
}

const categoryIcons: Record<string, any> = {
  "Revenue Efficiency": TrendingUp,
  "Fee Realisation": DollarSign,
  "Batch Utilisation": Users,
  "Program Mix Strength": BookOpen,
  "Salary vs Revenue": BarChart3,
  "Cash-Flow Discipline": Shield,
  "Dropout & Retention": AlertTriangle,
  "Teacher Dependency": Users,
  "Space Monetisation": Building,
  "Lead Conversion": Target,
  "Founder Dependency": Layers,
  "Scalability Readiness": Zap,
};

const categoryMeta: Record<string, {
  shortDesc: string;
  whatItMeans: string;
  benchmark: string;
  greenIndicator: string;
  amberIndicator: string;
  redIndicator: string;
}> = {
  "Revenue Efficiency": {
    shortDesc: "How well your student count translates into actual revenue.",
    whatItMeans: "Revenue efficiency measures whether your institution is pricing correctly relative to the number of students enrolled.",
    benchmark: "100 students should generate ₹3–4L/month. 200+ students → ₹6L+/month.",
    greenIndicator: "Revenue meets or exceeds benchmark for your segment.",
    amberIndicator: "Revenue gap identified. Pricing or program mix correction opportunity exists.",
    redIndicator: "Significant revenue under-indexing detected. Structural pricing review required.",
  },
  "Fee Realisation": {
    shortDesc: "Average monthly fee collected per student vs market benchmarks.",
    whatItMeans: "Fee realisation reflects your pricing power and the perceived value of your programs in the market.",
    benchmark: "Target ₹3,500+/student/month. Below ₹2,000 indicates severe underpricing.",
    greenIndicator: "Strong pricing power relative to market.",
    amberIndicator: "Fee realisation improvement opportunity identified.",
    redIndicator: "Fee levels critically below market benchmarks. Revenue ceiling constrained.",
  },
  "Batch Utilisation": {
    shortDesc: "How optimally your teaching batches are filled.",
    whatItMeans: "Underfilled batches waste teacher time and infrastructure. Overfilled batches damage learning quality.",
    benchmark: "Ideal batch size is 20–25 students. Below 15 is unviable; above 25 reduces quality.",
    greenIndicator: "Batch utilisation within optimal range.",
    amberIndicator: "Batch fill rate below optimal. Capacity improvement opportunity.",
    redIndicator: "Batch structure inefficiency detected. Restructuring required.",
  },
  "Program Mix Strength": {
    shortDesc: "Whether you have premium, high-value programs in your portfolio.",
    whatItMeans: "Institutions with ₹75k+ annual programs have significantly higher revenue per student and better brand equity.",
    benchmark: "At least one program priced at ₹75,000+ annually marks premium positioning.",
    greenIndicator: "Premium program portfolio established.",
    amberIndicator: "Mid-tier programs present. Premium tier opportunity exists.",
    redIndicator: "No premium programs. Revenue ceiling significantly constrained.",
  },
  "Salary vs Revenue": {
    shortDesc: "Staff salary costs as a proportion of total revenue.",
    whatItMeans: "If salary exceeds 45% of revenue, the institute has thin or negative operating margins.",
    benchmark: "Salary should be under 35% of monthly revenue for a healthy institution.",
    greenIndicator: "Salary ratio within healthy bounds.",
    amberIndicator: "Salary burden approaching stress threshold. Cost structure review recommended.",
    redIndicator: "Salary consuming unsustainable proportion of revenue. Structural cost review required.",
  },
  "Cash-Flow Discipline": {
    shortDesc: "How your fee collection method impacts monthly cash predictability.",
    whatItMeans: "Monthly collection creates unpredictable cash flows and high default rates.",
    benchmark: "Term/Annual collection with under 5% pending fees is the gold standard.",
    greenIndicator: "Cash flow discipline strong. Financial planning capacity intact.",
    amberIndicator: "Cash flow improvement opportunity identified. Collection mode shift recommended.",
    redIndicator: "Cash-flow instability detected. Collection discipline restructuring required.",
  },
  "Dropout & Retention": {
    shortDesc: "Rate at which students exit mid-program.",
    whatItMeans: "High dropout rates signal poor retention and erode revenue predictability.",
    benchmark: "Below 3% dropout is excellent. Above 5% requires intervention.",
    greenIndicator: "Retention metrics within healthy range.",
    amberIndicator: "Dropout risk building. Retention correction opportunity identified.",
    redIndicator: "Dropout levels damaging revenue stability. Retention framework required.",
  },
  "Teacher Dependency": {
    shortDesc: "How heavily operations depend on specific teachers.",
    whatItMeans: "If a key teacher leaves and your centre is disrupted, you have a structural vulnerability.",
    benchmark: "No operational disruption on teacher exit is the standard for scalable institutions.",
    greenIndicator: "Operationally resilient. No key-person risk.",
    amberIndicator: "Partial teacher dependency detected. Structural risk present.",
    redIndicator: "Critical teacher dependency. Operational continuity at risk.",
  },
  "Space Monetisation": {
    shortDesc: "Revenue generated relative to your centre's usable space.",
    whatItMeans: "Space is your largest fixed cost. Revenue per square foot determines profitability.",
    benchmark: "₹1L+ per 100 sq.ft/month is excellent. Below ₹75k signals underutilisation.",
    greenIndicator: "Space ROI within benchmark. Expansion may be viable.",
    amberIndicator: "Space underutilisation detected. Optimisation opportunity exists.",
    redIndicator: "Space ROI critically low. Timetable and utilisation restructuring required.",
  },
  "Lead Conversion": {
    shortDesc: "Percentage of enquiries that convert into confirmed admissions.",
    whatItMeans: "Low conversion with high enquiries means you are generating awareness but failing to close.",
    benchmark: "25%+ conversion is strong. Below 15% indicates a broken admissions funnel.",
    greenIndicator: "Conversion funnel performing well.",
    amberIndicator: "Conversion improvement opportunity identified. Admissions process review recommended.",
    redIndicator: "Significant lead wastage detected. Admissions funnel restructuring required.",
  },
  "Founder Dependency": {
    shortDesc: "How much the centre depends on the owner's daily presence.",
    whatItMeans: "If the institution stops functioning when the owner steps away, it is not a business — it is a job.",
    benchmark: "The centre should run 30 days without the owner with no disruption.",
    greenIndicator: "Business runs independently. Scale and expansion viable.",
    amberIndicator: "Owner still a critical decision point. Delegation structure needed.",
    redIndicator: "Owner is the operating system. Scalability blocked.",
  },
  "Scalability Readiness": {
    shortDesc: "Your institution's readiness to expand or replicate.",
    whatItMeans: "Scalability requires a replicable model, operational independence, and structural health across metrics.",
    benchmark: "8+ healthy metrics + owner independence = expansion-ready.",
    greenIndicator: "Structural foundations support expansion.",
    amberIndicator: "Core gaps must be addressed before scaling.",
    redIndicator: "Scaling is not viable in current structural state. Stabilise first.",
  },
};

const formatCurrency = (n: number) => {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}k`;
  return `₹${n}`;
};

const ScoreCard = ({ auditResult, onBackHome, institutionName }: ScoreCardProps) => {
  const { scores, efficiencyPercent, healthVerdict, leakageItems, totalLeakageLow, totalLeakageHigh } = auditResult;
  const [isPaid, setIsPaid] = useState(false);
  const [showWhatsAppSticky, setShowWhatsAppSticky] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [displayPercent, setDisplayPercent] = useState(0);
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const greenCount = scores.filter((s) => s.score === "GREEN").length;
  const amberCount = scores.filter((s) => s.score === "AMBER").length;
  const redCount = scores.filter((s) => s.score === "RED").length;

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress((window.scrollY / totalScroll) * 100);
      }
      setShowWhatsAppSticky(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let start = 0;
    const end = efficiencyPercent;
    if (start === end) {
      setDisplayPercent(end);
      return;
    }
    const duration = 1500;
    const startTime = performance.now();
    let animationFrameId: number;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress * (2 - progress); // Ease out quad
      setDisplayPercent(Math.round(ease * end));
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [efficiencyPercent]);

  const getHealthColor = () => {
    if (efficiencyPercent >= 80) return { color: "text-green-500", bg: "bg-green-500/15", border: "border-green-500/40", bar: "bg-green-500" };
    if (efficiencyPercent >= 60) return { color: "text-amber-400", bg: "bg-amber-400/15", border: "border-amber-400/40", bar: "bg-amber-400" };
    return { color: "text-red-500", bg: "bg-red-500/15", border: "border-red-500/40", bar: "bg-red-500" };
  };

  const handlePayment = () => {
    const loadRazorpay = () =>
      new Promise<boolean>((resolve) => {
        if ((window as any).Razorpay) { resolve(true); return; }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

    loadRazorpay().then((loaded) => {
      if (!loaded) { alert("Failed to load payment gateway. Please try again."); return; }
      const options = {
        key: "rzp_live_SJsZnzaEsydgeI",
        amount: 89900,
        currency: "INR",
        name: "ARK Consulting",
        description: "Institutional Structural Performance Audit — Full Report",
        image: arkLogo,
        handler: () => setIsPaid(true),
        prefill: { name: institutionName },
        notes: { institution: institutionName },
        theme: { color: "#0B2C55" },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    });
  };

  const handleWhatsApp = () => {
    window.open(
      "https://wa.me/917639399217?text=Hi%20ARK%20Team%2C%20I%20reviewed%20my%20diagnostic%20report%20and%20would%20like%20to%20proceed%20with%20consulting.",
      "_blank"
    );
  };

   // ── PDF Generator ──────────────────────────────────────────────────────────
  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const PW = 210, PH = 297, ML = 16, MR = 16;
    const CW = PW - ML - MR;
    const FOOTER_H = 14;
    const SAFE_BOT = PH - FOOTER_H - 6;

    type RGB = [number, number, number];
    const NAVY: RGB = [10, 40, 80];
    const GOLD: RGB = [245, 182, 0];
    const WHITE: RGB = [255, 255, 255];
    const GRAY_MD: RGB = [115, 125, 145];
    const GRAY_DK: RGB = [50, 55, 70];
    const GRAY_LT: RGB = [240, 242, 245];

    const C: Record<string, { bg: RGB; bar: RGB; text: RGB; bdr: RGB }> = {
      GREEN: { bg: [231, 249, 239], bar: [34, 197, 94], text: [14, 98, 46], bdr: [148, 213, 175] },
      AMBER: { bg: [255, 250, 228], bar: [245, 180, 20], text: [125, 85, 0], bdr: [220, 188, 85] },
      RED: { bg: [255, 237, 237], bar: [239, 68, 68], text: [175, 24, 24], bdr: [218, 150, 150] },
    };

    let curY = 0, pgNum = 1;
    const fi = (...c: RGB) => doc.setFillColor(...c);
    const ink = (...c: RGB) => doc.setTextColor(...c);
    const sf = (w: "normal" | "bold", s: number) => { doc.setFont("helvetica", w); doc.setFontSize(s); };
    const san = (t: string): string => String(t ?? "").replace(/₹/g, "Rs.").replace(/[–—]/g, "-").replace(/['']/g, "'").replace(/[""]/g, '"').replace(/[^\x00-\x7F]/g, "");
    const W = (text: string, maxW: number): string[] => doc.splitTextToSize(san(text), maxW) as string[];

    const guard = (need: number) => { if (curY + need > SAFE_BOT) { doc.addPage(); pgNum++; curY = 22; } };

    const drawFooter = (pg: number, total: number) => {
      fi(...NAVY); doc.rect(0, PH - FOOTER_H, PW, FOOTER_H, "F");
      fi(...GOLD); doc.rect(0, PH - FOOTER_H, PW, 0.8, "F");
      sf("bold", 9); ink(...GOLD);
      doc.text("ARK Consulting  |  +91 76393 99217", ML, PH - 4.5);
      sf("normal", 8); ink(160, 180, 210);
      doc.text("Confidential", PW / 2, PH - 4.5, { align: "center" });
      sf("bold", 9); ink(130, 155, 195);
      doc.text(`Page ${pg} of ${total}`, PW - MR, PH - 4.5, { align: "right" });
    };

    const sectionHeader = (title: string) => {
      guard(18);
      fi(...NAVY); doc.rect(0, curY, PW, 14, "F");
      fi(...GOLD); doc.rect(0, curY + 14, PW, 0.8, "F");
      sf("bold", 13); ink(...GOLD); doc.text(title, ML + 4, curY + 9.5);
      curY += 20;
    };

    // ── COVER PAGE ──
    fi(...NAVY); doc.rect(0, 0, PW, PH, "F");
    fi(18, 56, 100); doc.rect(0, 0, PW, PH - 40, "F");
    fi(...GOLD); doc.rect(0, PH - 40, PW, 1.5, "F");

    try { doc.addImage(arkLogo, "PNG", ML, 16, 34, 34); } catch (_) { }

    sf("bold", 10); ink(160, 185, 220);
    doc.text("ARK CONSULTING  |  INSTITUTIONAL AUDIT DIVISION", ML, 58);

    sf("bold", 30); ink(...GOLD);
    doc.text("Institutional", ML, 90);
    doc.text("Structural Performance", ML, 106);
    sf("bold", 30); ink(...WHITE);
    doc.text("Audit", ML, 122);

    fi(...GOLD); doc.rect(ML, 128, 50, 1.5, "F");
    sf("normal", 13); ink(185, 205, 235);
    doc.text("12-Metric RAG Evaluation", ML, 140);

    // Prepared for box
    fi(10, 40, 80); doc.rect(0, 155, PW, 44, "F");
    fi(...GOLD); doc.rect(0, 155, 6, 44, "F");
    sf("bold", 10); ink(...GOLD); doc.text("PREPARED FOR", ML + 12, 168);
    sf("bold", 20); ink(...WHITE); doc.text(W(institutionName, PW - ML - 30), ML + 12, 180);

    sf("normal", 10); ink(155, 175, 210);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`, ML, PH - 24);

    // Cover stats
    const SCOL = PW / 3, SY = PH - 70;
    [
      { count: greenCount, label: "Healthy", s: "GREEN" },
      { count: amberCount, label: "Needs Attention", s: "AMBER" },
      { count: redCount, label: "Structural Risk", s: "RED" },
    ].forEach((item, i) => {
      const sx = i * SCOL;
      fi(...C[item.s].bar); doc.rect(sx, SY, SCOL, 2.5, "F");
      sf("bold", 32); ink(...C[item.s].bar); doc.text(String(item.count), sx + SCOL / 2, SY + 20, { align: "center" });
      sf("normal", 10); ink(200, 215, 235); doc.text(item.label, sx + SCOL / 2, SY + 28, { align: "center" });
    });

    // ── PAGE 2 — EXECUTIVE SUMMARY ──
    doc.addPage(); pgNum++; curY = 0;
    fi(...NAVY); doc.rect(0, 0, PW, 26, "F");
    fi(...GOLD); doc.rect(0, 26, PW, 1, "F");
    sf("bold", 14); ink(...GOLD); doc.text("Executive Structural Insight", ML, 17);
    sf("normal", 10); ink(160, 185, 220); doc.text(san(institutionName), PW - MR, 17, { align: "right" });
    curY = 34;

    // Efficiency Index box
    const hBg: RGB = efficiencyPercent >= 80 ? [231, 249, 239] : efficiencyPercent >= 60 ? [255, 250, 228] : [255, 237, 237];
    const hText: RGB = efficiencyPercent >= 80 ? [14, 98, 46] : efficiencyPercent >= 60 ? [125, 85, 0] : [175, 24, 24];
    const hBar: RGB = efficiencyPercent >= 80 ? C.GREEN.bar : efficiencyPercent >= 60 ? C.AMBER.bar : C.RED.bar;

    fi(...hBg); doc.rect(0, curY, PW, 30, "F");
    fi(...hBar); doc.rect(0, curY, 6, 30, "F");
    sf("bold", 10); ink(...GRAY_MD); doc.text("STRUCTURAL EFFICIENCY INDEX", ML + 10, curY + 10);
    sf("bold", 22); ink(...hText); doc.text(`${efficiencyPercent}%`, ML + 10, curY + 22);
    sf("bold", 14); ink(...hText); doc.text(healthVerdict, ML + 35, curY + 22);
    curY += 38;

    // Executive narrative
    sf("normal", 12); ink(...GRAY_DK);
    const narrative = `${san(institutionName)} demonstrates ${greenCount >= 6 ? "solid" : greenCount >= 3 ? "moderate" : "weak"} structural fundamentals. Operating at approximately ${efficiencyPercent}% structural efficiency, this indicates that ${100 - efficiencyPercent}% of potential revenue and operational leverage is currently unrealised. ${redCount >= 4 ? "Critical structural gaps require immediate attention before any growth is viable." : amberCount > greenCount ? "The primary opportunity lies in optimisation and retention correction." : "The institution is positioned for strategic growth with targeted improvements."}`;
    const narLines = W(narrative, CW - 10);
    guard(narLines.length * 5.5 + 10);
    doc.text(narLines, ML + 5, curY);
    curY += narLines.length * 5.5 + 12;

    // Revenue Leakage Table
    if (leakageItems.length > 0) {
      sectionHeader("ESTIMATED REVENUE OPTIMISATION RANGE");

      // Table header
      fi(...GRAY_LT); doc.rect(ML, curY, CW, 10, "F");
      sf("bold", 12); ink(...NAVY); doc.text("Leak Zone", ML + 6, curY + 7);
      doc.text("Estimated Monthly Impact", PW - MR - 6, curY + 7, { align: "right" });
      curY += 12;

      leakageItems.forEach((item, idx) => {
        guard(12);
        const rowBg: RGB = idx % 2 === 0 ? [252, 253, 255] : [245, 247, 250];
        fi(...rowBg); doc.rect(ML, curY, CW, 11, "F");
        sf("normal", 12); ink(...GRAY_DK); doc.text(san(item.area), ML + 6, curY + 7.5);
        sf("bold", 12); ink(...NAVY); doc.text(san(item.estimatedMonthly) + "/month", PW - MR - 6, curY + 7.5, { align: "right" });
        curY += 11;
      });

      // Total row
      guard(14);
      fi(...C.RED.bg); doc.rect(ML, curY, CW, 13, "F");
      fi(...C.RED.bar); doc.rect(ML, curY, 5, 13, "F");
      sf("bold", 12); ink(...C.RED.text); doc.text("Total Estimated Opportunity", ML + 10, curY + 9);
      sf("bold", 13); ink(...C.RED.text);
      doc.text(`${san(formatCurrency(totalLeakageLow))} - ${san(formatCurrency(totalLeakageHigh))} / month`, PW - MR - 6, curY + 9, { align: "right" });
      curY += 18;

      sf("normal", 12); ink(...GRAY_MD);
      const discLines = W("This estimate is directional. A structured intervention is required to validate and sequence corrections.", CW - 10);
      doc.text(discLines, ML + 5, curY);
      curY += discLines.length * 5.5 + 12;
    }

    // 12 Metric RAG Summary
    sectionHeader("12-METRIC RAG EVALUATION");

    scores.forEach((score, idx) => {
      const SC = C[score.score];
      const meta = categoryMeta[score.category];
      const indicator = score.score === "GREEN" ? meta?.greenIndicator : score.score === "AMBER" ? meta?.amberIndicator : meta?.redIndicator;

      sf("normal", 12);
      const indLines = W(indicator ?? "", CW - 36);
      const cardH = 22 + indLines.length * 5.5;
      guard(cardH + 4);

      fi(...SC.bg); doc.rect(ML, curY, CW, cardH, "F");
      fi(...SC.bar); doc.rect(ML, curY, 6, cardH, "F");
      // Bottom border
      doc.setDrawColor(...SC.bdr); doc.setLineWidth(0.3);
      doc.line(ML, curY + cardH, ML + CW, curY + cardH);

      sf("bold", 13); ink(...NAVY); doc.text(san(`${idx + 1}. ${score.category}`), ML + 12, curY + 9);

      // Badge
      const displayLabel = score.score === "GREEN" ? "Healthy" : score.score === "AMBER" ? "Needs Attention" : "Structural Risk";
      const badgeW = doc.getTextWidth(displayLabel) + 8;
      fi(...SC.bar); doc.roundedRect(PW - MR - badgeW - 4, curY + 3, badgeW, 8, 4, 4, "F");
      sf("bold", 8); ink(...WHITE); doc.text(displayLabel, PW - MR - badgeW / 2 - 4, curY + 8.5, { align: "center" });

      sf("normal", 12); ink(...GRAY_DK); doc.text(san(score.label), ML + 12, curY + 16);
      sf("normal", 12); ink(...SC.text); doc.text(indLines, ML + 12, curY + 22);

      curY += cardH + 4;
    });

    // What This Doesn't Cover
    sectionHeader("WHAT THIS SNAPSHOT DOES NOT COVER");

    const notCovered = [
      "Fee restructuring models",
      "Batch architecture simulation",
      "Timetable monetisation planning",
      "Dropout control framework",
      "90-day correction roadmap",
    ];
    notCovered.forEach((item) => {
      guard(8);
      sf("normal", 12); ink(...GRAY_DK);
      doc.text(`   •   ${item}`, ML + 6, curY + 5);
      curY += 8;
    });
    curY += 6;
    sf("normal", 12); ink(...GRAY_MD);
    const closingLines = W("If you would like a structured plan built from this data, you may consider a strategic intervention session with ARK Consulting.", CW - 10);
    doc.text(closingLines, ML + 5, curY);
    curY += closingLines.length * 5.5 + 12;

    // CTA
    guard(34);
    fi(14, 100, 52); doc.rect(0, curY, PW, 34, "F");
    fi(10, 80, 40); doc.rect(0, curY, 6, 34, "F");
    sf("bold", 16); ink(...WHITE); doc.text("Ready for a Structured Intervention?", PW / 2, curY + 13, { align: "center" });
    sf("normal", 12); ink(190, 232, 210); doc.text("+91 76393 99217  |  ARK Consulting", PW / 2, curY + 22, { align: "center" });
    sf("normal", 10); ink(220, 245, 232); doc.text("No obligation. Just clarity.", PW / 2, curY + 29, { align: "center" });

    // Footers
    const total = doc.getNumberOfPages();
    for (let p = 1; p <= total; p++) { doc.setPage(p); drawFooter(p, total); }

    doc.save(`ARK-Structural-Performance-Audit-${san(institutionName).replace(/\s+/g, "-")}.pdf`);
  };

  // ── UI ──────────────────────────────────────────────────────────────────────
  const healthColor = getHealthColor();
  const [activeFilter, setActiveFilter] = useState<"ALL" | "GREEN" | "AMBER" | "RED">("ALL");

  const scoreColors = {
    GREEN: { bg: "bg-green-500", text: "text-green-700", border: "border-green-500", light: "bg-green-50", badge: "bg-green-500", accent: "border-l-green-500" },
    AMBER: { bg: "bg-accent", text: "text-amber-700", border: "border-accent", light: "bg-amber-50", badge: "bg-amber-500", accent: "border-l-amber-500" },
    RED: { bg: "bg-red-500", text: "text-red-700", border: "border-red-500", light: "bg-red-50", badge: "bg-red-500", accent: "border-l-red-500" },
  };

  const scoreWord: Record<string, string> = { GREEN: "Healthy", AMBER: "Needs Attention", RED: "Structural Risk" };

  const leakIcons: Record<string, any> = {
    "Dropout": AlertTriangle,
    "Conversion": Target,
    "Fee": DollarSign,
    "Teacher": Users,
    "Batch": Building,
  };

  const getLeakIcon = (area: string) => {
    for (const key of Object.keys(leakIcons)) {
      if (area.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(area.toLowerCase())) {
        return leakIcons[key];
      }
    }
    return TrendingUp;
  };

  const maxLeak = Math.max(...leakageItems.map(item => item.highEstimate || 1), 1);

  const handleFilterClick = (filterId: "ALL" | "GREEN" | "AMBER" | "RED") => {
    if (activeFilter === filterId) {
      setActiveFilter("ALL");
    } else {
      setActiveFilter(filterId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/95 to-primary/85 relative overflow-hidden pb-12">
      {/* Scroll Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-accent via-highlight to-green-500 z-50 transition-all duration-100" 
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Ambient background dots */}
      <div className="absolute inset-0 bg-dot-pattern-dense pointer-events-none opacity-30" />
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-accent/8 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-highlight/8 rounded-full blur-3xl" />
      </div>

      {/* Sticky WhatsApp */}
      <AnimatePresence>
        {showWhatsAppSticky && (
          <motion.button initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
            onClick={handleWhatsApp}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-green-500 hover:bg-green-600 text-primary-foreground font-bold px-5 py-3.5 rounded-2xl shadow-2xl shadow-green-500/40 transition-all hover:scale-105">
            <MessageCircle className="h-5 w-5" /> Talk to ARK
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── HERO HEADER ── */}
      <header className="relative w-full overflow-hidden border-b border-primary-foreground/5 bg-primary/20 backdrop-blur-md">
        <div className="relative z-10 px-6 md:px-10 lg:px-16 pt-8 pb-8">
          <div className="flex items-center justify-between mb-8">
            <button onClick={onBackHome} className="flex items-center gap-2 text-primary-foreground/60 hover:text-primary-foreground text-sm font-medium transition-colors bg-primary-foreground/5 px-4 py-2 rounded-xl border border-primary-foreground/10 hover:bg-primary-foreground/10">
              <ArrowLeft className="h-4 w-4" /> Back Home
            </button>
            <div className="flex items-center gap-2">
              <div className="h-px w-6 bg-accent/40" />
              <p className="text-accent text-[10px] font-bold tracking-widest uppercase">Institutional Scorecard</p>
              <div className="h-px w-6 bg-accent/40" />
            </div>
            <Award className="h-5 w-5 text-accent/60 animate-pulse" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Efficiency speed meter gauge */}
            <div className="lg:col-span-7">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <p className="text-accent/80 text-xs font-bold uppercase tracking-widest mb-3">Institutional Performance Summary</p>
                <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-primary-foreground leading-tight mb-6">{institutionName}</h1>

                {/* SVG circular dial widget */}
                <div className="flex flex-col sm:flex-row items-center gap-6 bg-primary-foreground/5 border border-primary-foreground/10 p-6 rounded-[2rem] backdrop-blur-sm relative overflow-hidden">
                  <div className="relative w-32 h-32 flex items-center justify-center flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="52"
                        className="stroke-primary-foreground/10 fill-none"
                        strokeWidth="10"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="52"
                        className="fill-none transition-all duration-1000 ease-out"
                        strokeWidth="10"
                        strokeDasharray={`${2 * Math.PI * 52}`}
                        strokeDashoffset={`${2 * Math.PI * 52 * (1 - displayPercent / 100)}`}
                        stroke={
                          efficiencyPercent >= 80 
                            ? "hsl(142, 76%, 45%)" 
                            : efficiencyPercent >= 60 
                            ? "hsl(45, 100%, 51%)" 
                            : "hsl(0, 84%, 60%)"
                        }
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-display font-black text-3xl text-primary-foreground tracking-tighter text-glow-accent">
                        {displayPercent}%
                      </span>
                      <span className="text-[9px] uppercase tracking-wider font-bold text-primary-foreground/40">
                        Index
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 text-center sm:text-left space-y-1.5">
                    <p className="text-primary-foreground/50 text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em]">
                      Structural Audit Verdict
                    </p>
                    <h3 className={`font-display font-black text-xl sm:text-2xl text-glow-accent ${healthColor.color}`}>
                      {healthVerdict}
                    </h3>
                    <p className="text-primary-foreground/60 text-xs sm:text-sm leading-relaxed max-w-sm">
                      Your centre is operating at approximately {efficiencyPercent}% structural efficiency. Resolving key gaps will release operational leverage.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Counts profile grid */}
            <div className="lg:col-span-5">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Healthy", count: greenCount, bar: "bg-green-500", text: "text-green-400", border: "border-green-500/30", bg: "bg-green-500/10", id: "GREEN", glow: "pulse-glow-green" },
                  { label: "Needs Attention", count: amberCount, bar: "bg-amber-400", text: "text-amber-400", border: "border-amber-400/30", bg: "bg-amber-400/10", id: "AMBER", glow: "pulse-glow-amber" },
                  { label: "Structural Risk", count: redCount, bar: "bg-red-500", text: "text-red-400", border: "border-red-500/30", bg: "bg-red-500/10", id: "RED", glow: "pulse-glow-red" },
                ].map((item, i) => {
                  const isActive = activeFilter === item.id;
                  return (
                    <motion.button 
                      key={item.label} 
                      onClick={() => handleFilterClick(item.id as any)}
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: 0.2 + i * 0.08 }}
                      className={`w-full relative overflow-hidden backdrop-blur-sm shadow-sm transition-all duration-300 rounded-[1.5rem] p-5 text-center border cursor-pointer hover:scale-[1.04] ${item.bg} ${
                        isActive 
                          ? `ring-2 ring-offset-2 ring-offset-primary ring-white scale-[1.03] ${item.glow}` 
                          : `${item.border} hover:border-white/20`
                      }`}
                    >
                      <div className={`absolute top-0 left-0 right-0 h-1.5 ${item.bar} rounded-t-2xl`} />
                      <div className={`text-4xl sm:text-5xl font-display font-black ${item.text} mb-1`}>{item.count}</div>
                      <div className="text-primary-foreground/50 text-[10px] sm:text-xs leading-snug font-medium">{item.label}</div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <div className="relative z-10 px-6 md:px-10 lg:px-16 py-8 space-y-6">

        {/* Revenue Leakage Estimator */}
        {leakageItems.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="w-full rounded-[2rem] bg-primary-foreground/5 backdrop-blur-md border border-primary-foreground/10 overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-highlight/5 rounded-full blur-xl pointer-events-none" />
            <div className="px-6 py-5 border-b border-primary-foreground/10 flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-accent animate-pulse" />
              <h2 className="font-display font-bold text-primary-foreground text-lg">Estimated Revenue Optimisation Range</h2>
            </div>
            <div className="divide-y divide-primary-foreground/5">
              {leakageItems.map((item, i) => {
                const LIcon = getLeakIcon(item.area);
                const percent = ((item.highEstimate || 0) / maxLeak) * 100;
                return (
                  <div key={i} className="relative flex items-center justify-between px-6 py-4 transition-all hover:bg-primary-foreground/3 overflow-hidden">
                    {/* Background Progress bar */}
                    <div 
                      className="absolute top-0 left-0 bottom-0 bg-accent/5 transition-all duration-1000 ease-out" 
                      style={{ width: `${percent}%` }}
                    />
                    
                    <span className="relative z-10 text-primary-foreground/75 text-sm flex items-center gap-2">
                      <span className="p-1 rounded bg-primary-foreground/10 text-accent">
                        <LIcon className="h-3.5 w-3.5" />
                      </span>
                      {item.area}
                    </span>
                    <span className="relative z-10 font-display font-bold text-primary-foreground text-sm">{item.estimatedMonthly}/mo</span>
                  </div>
                );
              })}
            </div>
            <div className="px-6 py-5 bg-highlight/10 border-t border-highlight/20 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="font-display font-bold text-highlight text-sm sm:text-base">Total Estimated Opportunity</span>
              <span className="font-display font-black text-highlight text-xl sm:text-2xl text-glow-highlight">
                {formatCurrency(totalLeakageLow)} – {formatCurrency(totalLeakageHigh)} / month
              </span>
            </div>
            <div className="px-6 py-3 bg-primary-foreground/3 text-center sm:text-left">
              <p className="text-primary-foreground/45 text-[11px] italic">
                *This estimate is directional. A structured intervention is required to validate and sequence corrections.
              </p>
            </div>
          </motion.div>
        )}

        {/* 12-Metric RAG Overview with Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full rounded-[2.5rem] bg-white/95 backdrop-blur-md border border-white/20 shadow-2xl p-6 sm:p-10"
        >
          <div className="flex flex-col items-center gap-4 mb-6">
            <h2 className="text-primary font-display font-black text-2xl flex items-center gap-3 text-center">
              <BarChart3 className="h-6 w-6 text-accent" />
              12-Metric RAG Evaluation
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm text-center max-w-xl">
              Filter metrics below by health status to target structural risks.
            </p>
          </div>

          {/* Tabs/Filter switcher */}
          <div className="flex flex-wrap justify-center mb-8 gap-2 border-b border-slate-200 pb-5">
            {[
              { id: "ALL", label: `All Metrics (${scores.length})`, colorClass: "bg-primary text-white border-transparent" },
              { id: "RED", label: `Risks (${scores.filter(s => s.score === "RED").length})`, colorClass: "bg-red-600 text-white border-transparent" },
              { id: "AMBER", label: `Needs Attention (${scores.filter(s => s.score === "AMBER").length})`, colorClass: "bg-amber-500 text-white border-transparent" },
              { id: "GREEN", label: `Healthy (${scores.filter(s => s.score === "GREEN").length})`, colorClass: "bg-green-600 text-white border-transparent" }
            ].map((filter) => {
              const isActive = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 border ${
                    isActive 
                      ? `${filter.colorClass} shadow-md scale-[1.03]`
                      : "text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-800 bg-white"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {scores
                .filter(score => activeFilter === "ALL" || score.score === activeFilter)
                .map((score, i) => {
                  const meta = categoryMeta[score.category];
                  const colors = scoreColors[score.score];
                  const Icon = categoryIcons[score.category] || TrendingUp;
                  const accentBg = score.score === "GREEN" ? "bg-green-500" : score.score === "AMBER" ? "bg-amber-400" : "bg-red-500";
                  const cardBg = score.score === "GREEN" ? "bg-green-50/60" : score.score === "AMBER" ? "bg-amber-50/60" : "bg-red-50/60";
                  const cardBdr = score.score === "GREEN" ? "border-green-100/80" : score.score === "AMBER" ? "border-amber-100/80" : "border-red-100/80";
                  const indicator = score.score === "GREEN" ? meta?.greenIndicator : score.score === "AMBER" ? meta?.amberIndicator : meta?.redIndicator;
                  const isExpanded = expandedMetric === score.category;

                  return (
                    <motion.div
                      layout
                      key={score.category}
                      onClick={() => setExpandedMetric(isExpanded ? null : score.category)}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className={`${cardBg} border ${cardBdr} rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden cursor-pointer hover:scale-[1.02] hover:shadow-md hover:border-slate-300/50 transition-all`}
                    >
                      <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${accentBg} rounded-l-2xl`} />
                      
                      <div className="pl-2 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-white shadow-sm border border-slate-100">
                            <Icon className={`h-4.5 w-4.5 ${colors.text}`} />
                          </div>
                          <span className="font-bold text-base text-primary leading-tight">{score.category}</span>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${colors.badge} text-white shadow-sm flex-shrink-0`}>
                          {scoreWord[score.score]}
                        </span>
                      </div>
                      
                      <div className="space-y-2 pl-2">
                        <p className={`text-sm font-semibold ${colors.text}`}>{score.label}</p>
                        <p className={`text-xs text-slate-500 leading-relaxed ${isExpanded ? "" : "line-clamp-2"}`}>{indicator}</p>
                      </div>

                      {/* Expandable Section */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                            className="pl-2 pt-2 border-t border-slate-200/60 mt-2 space-y-3"
                            onClick={(e) => e.stopPropagation()} // stop parent click
                          >
                            <div className="bg-white/80 rounded-xl p-3 border border-slate-100">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">What This Measures</p>
                              <p className="text-xs text-slate-600 leading-relaxed">{meta?.whatItMeans}</p>
                            </div>

                            {!isPaid ? (
                              <div className="bg-primary/5 rounded-xl p-3 border border-dashed border-primary/20 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <Lock className="h-3.5 w-3.5 text-accent animate-pulse" />
                                  <p className="text-[10px] font-bold text-primary/70 uppercase tracking-wider">Metrics & Benchmarks Locked</p>
                                </div>
                                <button 
                                  onClick={handlePayment} 
                                  className="text-[10px] font-black text-accent hover:text-accent/80 transition-colors uppercase tracking-wider"
                                >
                                  Unlock Now
                                </button>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-2">
                                <div className="bg-red-500/5 rounded-xl p-3 border border-red-500/10">
                                  <p className="text-[10px] font-bold text-red-700/80 uppercase tracking-wider mb-1">Your Metrics</p>
                                  <p className="text-xs text-foreground font-semibold">{score.details}</p>
                                </div>
                                <div className="bg-green-500/5 rounded-xl p-3 border border-green-500/10">
                                  <p className="text-[10px] font-bold text-green-700/80 uppercase tracking-wider mb-1">Audit Benchmark</p>
                                  <p className="text-xs text-foreground font-semibold leading-relaxed">{meta?.benchmark}</p>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="pl-2 flex justify-center text-slate-300 hover:text-slate-400 transition-colors mt-1">
                        <ChevronRight className={`h-4 w-4 transform transition-transform duration-300 ${isExpanded ? "rotate-90 text-accent animate-pulse" : ""}`} />
                      </div>
                    </motion.div>
                  );
                })}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* ── DETAILED BREAKDOWN (paywall / unlocked) ── */}
        {!isPaid ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="w-full rounded-[2.5rem] bg-primary-foreground/5 border-2 border-accent/20 overflow-hidden relative shadow-2xl p-1">
            <div className="blur-sm opacity-20 pointer-events-none p-6 space-y-4 select-none">
              {scores.slice(0, 4).map((score) => {
                const colors = scoreColors[score.score];
                const meta = categoryMeta[score.category];
                return (
                  <div key={score.category} className={`p-5 rounded-xl ${colors.light} border-l-4 ${colors.accent}`}>
                    <span className="font-bold text-sm text-primary">{score.category}</span>
                    <p className="text-xs text-muted-foreground mt-1">{meta?.whatItMeans}</p>
                  </div>
                );
              })}
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-primary/85 backdrop-blur-sm p-6 sm:p-10">
              <div className="text-center max-w-xl bg-primary-foreground/5 border border-primary-foreground/15 p-8 rounded-[2rem] shadow-2xl backdrop-blur-lg relative overflow-hidden shimmer-effect">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/20 border border-accent/40 mb-5">
                  <Lock className="h-8 w-8 text-accent text-glow-accent animate-pulse" />
                </div>
                <h3 className="font-display font-black text-2xl sm:text-3xl text-primary-foreground mb-3 text-glow-accent">Unlock Full Assessment Report</h3>
                <p className="text-primary-foreground/60 text-xs sm:text-sm mb-6 leading-relaxed">
                  Gain immediate access to full structural standard comparisons, diagnostic risk profiles, and download a custom-branded PDF report.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-8 max-w-md mx-auto">
                  {[
                    "Benchmark gaps per metric",
                    "Detailed standard ratios",
                    "Downloadable PDF report",
                    "No expiration — access anytime"
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs text-primary-foreground/80">
                      <CheckCircle className="h-4.5 w-4.5 text-green-400 flex-shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <motion.button onClick={handlePayment} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-display font-black text-base sm:text-lg shadow-xl shadow-accent/20 transition-all hover:shadow-accent/45">
                  <Crown className="h-5 w-5 animate-pulse" />
                  Unlock Full Report — ₹899
                  <ChevronRight className="h-5 w-5" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="w-full rounded-[2rem] overflow-hidden border border-green-500/30 shadow-2xl">
            <div className="bg-gradient-to-r from-green-600 to-green-500 px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Unlock className="h-5 w-5 text-primary-foreground animate-bounce-subtle" />
                <h3 className="font-display font-bold text-lg text-primary-foreground">Full Structural Breakdown — Unlocked</h3>
              </div>
              <motion.button onClick={handleDownloadPDF} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 bg-white text-green-700 font-bold text-sm px-5 py-2.5 rounded-xl shadow transition-all hover:bg-green-50">
                <FileDown className="h-4 w-4" /> Download PDF Report
              </motion.button>
            </div>
            <div className="bg-primary-foreground/5 p-4 sm:p-6 grid grid-cols-1 xl:grid-cols-2 gap-4">
              {scores.map((score, index) => {
                const colors = scoreColors[score.score];
                const meta = categoryMeta[score.category];
                const Icon = categoryIcons[score.category] || TrendingUp;
                const indicator = score.score === "GREEN" ? meta?.greenIndicator : score.score === "AMBER" ? meta?.amberIndicator : meta?.redIndicator;
                const accentBg = score.score === "GREEN" ? "bg-green-500" : score.score === "AMBER" ? "bg-amber-400" : "bg-red-500";
                return (
                  <motion.div key={score.category} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * index }}
                    className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border flex flex-col justify-between hover:scale-[1.01] transition-all">
                    <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 border-b border-border relative">
                      <div className={`absolute top-0 left-0 right-0 h-1 ${accentBg}`} />
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${colors.light}`}>
                          <Icon className={`h-4.5 w-4.5 ${colors.text}`} />
                        </div>
                        <div>
                          <p className="text-muted-foreground text-[10px] font-semibold uppercase">Metric {index + 1}</p>
                          <h4 className="font-display font-bold text-sm sm:text-base text-foreground leading-tight">{score.category}</h4>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${colors.badge} text-primary-foreground`}>{scoreWord[score.score]}</span>
                    </div>
                    
                    {/* Comparative blocks */}
                    <div className="p-4 space-y-3">
                      <p className={`text-sm font-semibold ${colors.text} leading-snug`}>{score.label}</p>
                      
                      <div className="grid grid-cols-1 gap-2.5">
                        <div className="bg-secondary/40 rounded-xl p-3 border border-border/40">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">What This Measures</p>
                          <p className="text-xs text-foreground/75 leading-relaxed">{meta?.whatItMeans}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-red-500/5 rounded-xl p-3 border border-red-500/10">
                            <p className="text-[10px] font-bold text-red-700/80 uppercase tracking-wider mb-1">Your Metrics</p>
                            <p className="text-xs text-foreground font-semibold">{score.details}</p>
                          </div>
                          <div className="bg-green-500/5 rounded-xl p-3 border border-green-500/10">
                            <p className="text-[10px] font-bold text-green-700/80 uppercase tracking-wider mb-1">Audit Benchmark</p>
                            <p className="text-xs text-foreground font-semibold leading-relaxed">{meta?.benchmark}</p>
                          </div>
                        </div>

                        <div className={`${colors.light} rounded-xl p-3 border border-l-4 ${colors.accent}`}>
                          <p className="text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <Target className={`h-3.5 w-3.5 ${colors.text}`} />
                            <span className={colors.text}>RAG Impact Diagnostic</span>
                          </p>
                          <p className={`text-xs leading-relaxed font-semibold ${colors.text}`}>{indicator}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── WHAT THIS DOESN'T COVER ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="w-full rounded-[2rem] bg-primary-foreground/5 border border-primary-foreground/10 p-6 sm:p-8 backdrop-blur-sm shadow-xl">
          <h3 className="font-display font-bold text-primary-foreground text-lg mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-accent animate-pulse" /> What This Snapshot Does Not Cover
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {[
              "Fee restructuring models",
              "Batch architecture simulation",
              "Timetable monetisation planning",
              "Dropout control framework",
              "90-day correction roadmap",
              "Teacher allocation strategy",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-sm text-primary-foreground/60 p-2.5 rounded-xl bg-primary-foreground/3">
                <XCircle className="h-4 w-4 text-primary-foreground/30 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <p className="text-primary-foreground/45 text-xs sm:text-sm leading-relaxed border-t border-primary-foreground/5 pt-4">
            If you would like a structured plan built from this data, you may consider a strategic intervention session with ARK Consulting.
          </p>
        </motion.div>

        {/* ── CONSULTING LADDER ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="w-full relative">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-primary-foreground/10" />
            <h2 className="text-primary-foreground font-display font-black text-xl sm:text-2xl flex items-center gap-2 text-glow-accent">
              <Sparkles className="h-5 w-5 text-accent animate-pulse" /> Structured Next Steps
            </h2>
            <div className="h-px flex-1 bg-primary-foreground/10" />
          </div>
          
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Timeline connector line */}
            <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-gradient-to-r from-accent/25 via-highlight/25 to-green-500/25 hidden md:block -translate-y-1/2 pointer-events-none" />
            <div className="absolute left-10 top-12 bottom-12 w-0.5 bg-gradient-to-b from-accent/25 via-highlight/25 to-green-500/25 block md:hidden pointer-events-none" />

            {[
              {
                title: "Diagnostic Review",
                price: "₹899",
                desc: "45-minute live session. We break down your report, quantify your revenue ceiling, and identify your top 2 structural corrections.",
                features: ["Revenue gap breakdown", "Top 2 leak zones identified", "₹1Cr billing viability assessment"],
                cta: "Book Diagnostic Review",
                bg: "bg-accent/5 hover:bg-accent/10",
                border: "border-accent/30 hover:border-accent/60",
                btnClass: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-accent/20",
                colorAccent: "text-accent",
                numBg: "bg-accent text-accent-foreground"
              },
              {
                title: "Strategic Architecture",
                price: "Architectural Blueprinting",
                desc: "Complete structural redesign plan. Fee structure, batch architecture, premium program layering, and 90-day roadmap.",
                features: ["Fee structure redesign", "Batch architecture blueprint", "90-day correction plan"],
                cta: "Enquire via WhatsApp",
                bg: "bg-highlight/5 hover:bg-highlight/10",
                border: "border-highlight/30 hover:border-highlight/60",
                btnClass: "bg-highlight text-highlight-foreground hover:bg-highlight/90 shadow-highlight/20",
                colorAccent: "text-highlight",
                numBg: "bg-highlight text-highlight-foreground"
              },
              {
                title: "Implementation Program",
                price: "Full-Scale Implementation",
                desc: "Structured execution support. SOPs, teacher allocation, admission funnel, collection discipline, and 60-90 day handholding.",
                features: ["Full systems setup", "SOP documentation", "60-90 day support"],
                cta: "Enquire via WhatsApp",
                bg: "bg-green-500/5 hover:bg-green-500/10",
                border: "border-green-500/30 hover:border-green-500/60",
                btnClass: "bg-green-500 text-primary-foreground hover:bg-green-600 shadow-green-500/20",
                colorAccent: "text-green-400",
                numBg: "bg-green-500 text-primary-foreground"
              },
            ].map((tier, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 + i * 0.08 }}
                className={`${tier.bg} border-2 ${tier.border} rounded-3xl p-6 sm:p-8 flex flex-col justify-between backdrop-blur-sm relative overflow-hidden group shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2`}>
                
                {/* Timeline dot badge */}
                <div className="absolute top-4 left-4 md:static mb-6">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-sm ${tier.numBg} shadow-md`}>
                    {i + 1}
                  </span>
                </div>
                
                <div className="pt-6 md:pt-0">
                  <h3 className="font-display font-black text-primary-foreground text-xl mb-1 group-hover:text-glow-accent transition-all">{tier.title}</h3>
                  {tier.price && <p className={`font-display font-bold ${tier.colorAccent} text-lg mb-4`}>{tier.price}</p>}
                  <p className="text-primary-foreground/60 text-xs sm:text-sm leading-relaxed mb-6 border-b border-primary-foreground/5 pb-4">{tier.desc}</p>
                  
                  <div className="space-y-3 mb-8">
                    {tier.features.map((f) => (
                      <div key={f} className="flex items-center gap-2.5 text-xs text-primary-foreground/80">
                        <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <motion.button onClick={handleWhatsApp} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className={`w-full flex items-center justify-center gap-2 ${tier.btnClass} font-display font-black text-sm px-5 py-3.5 rounded-xl shadow-lg transition-all`}>
                  <MessageCircle className="h-4.5 w-4.5" /> {tier.cta}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Scoring Key + CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6" ref={bottomRef}>
          <div className="lg:col-span-2 bg-primary-foreground/5 border border-primary-foreground/10 rounded-[2rem] p-6 backdrop-blur-sm shadow-xl">
            <h3 className="font-display font-bold text-primary-foreground text-base mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" /> Scoring Classification Key
            </h3>
            <div className="space-y-2.5">
              {[
                { dot: "bg-green-500", label: "Healthy", desc: "Performing at benchmark standard — maintain and leverage for scaling." },
                { dot: "bg-amber-400", label: "Needs Attention", desc: "Operational gaps identified — optimization corrections recommended." },
                { dot: "bg-red-500", label: "Structural Risk", desc: "Critical structural stress points — immediate correction required." },
              ].map((k) => (
                <div key={k.label} className="flex items-start gap-3.5 p-3 rounded-2xl bg-primary-foreground/3 border border-primary-foreground/5 transition-all hover:bg-primary-foreground/5">
                  <div className={`w-3.5 h-3.5 rounded-full ${k.dot} mt-0.5 flex-shrink-0 shadow-sm`} />
                  <div>
                    <span className="text-primary-foreground text-sm font-bold">{k.label}</span>
                    <p className="text-primary-foreground/50 text-xs mt-0.5 leading-relaxed">{k.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-[2rem] p-6 flex flex-col items-start justify-between relative overflow-hidden shadow-2xl border border-green-500/20 hover:scale-[1.01] transition-transform">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_60%)] animate-pulse" />
            <div className="relative z-10">
              <h3 className="font-display font-black text-primary-foreground text-xl leading-tight mb-2">Ready for Guided System Redesign?</h3>
              <p className="text-primary-foreground/80 text-xs leading-relaxed mb-6">
                Connect directly with our consulting architects to review your results in detail.
              </p>
            </div>
            <motion.button onClick={handleWhatsApp} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              className="relative z-10 w-full flex items-center justify-center gap-2 bg-card text-green-700 font-display font-black text-sm px-5 py-3.5 rounded-xl shadow-xl transition-all hover:bg-green-50">
              <MessageCircle className="h-4.5 w-4.5" /> Continue to WhatsApp
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ScoreCard;
