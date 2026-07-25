/**
 * Every price in the product lives here. Razorpay wants paise, the UI wants
 * Indian-formatted rupees — both are derived from the same number so they can
 * never drift apart.
 */

export const formatPrice = (rupees: number) => `₹${rupees.toLocaleString("en-IN")}`;

/** One-off charge that unlocks the full 12-metric audit report. */
export const REPORT_UNLOCK_PRICE = 599;

export const toPaise = (rupees: number) => Math.round(rupees * 100);

export interface ConsultingTier {
  id: string;
  title: string;
  price: number | null;
  priceNote?: string;
  desc: string;
  features: string[];
  cta: string;
  /** Tailwind classes, kept alongside the tier so the ladder stays declarative. */
  bg: string;
  border: string;
  btnClass: string;
  colorAccent: string;
  numBg: string;
}

export const CONSULTING_TIERS: ConsultingTier[] = [
  {
    id: "diagnostic",
    title: "Diagnostic Review",
    price: 599,
    priceNote: "45-minute live session",
    desc: "We break down your report, quantify your revenue ceiling, and identify your top 2 structural corrections.",
    features: ["Revenue gap breakdown", "Top 2 leak zones identified", "₹1Cr billing viability assessment"],
    cta: "Book Diagnostic Review",
    bg: "bg-accent/5 hover:bg-accent/10",
    border: "border-accent/30 hover:border-accent/60",
    btnClass: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-accent/20",
    colorAccent: "text-accent",
    numBg: "bg-accent text-accent-foreground",
  },
  {
    id: "deep-dive",
    title: "Deep-Dive Session",
    price: 999,
    priceNote: "90-minute working session",
    desc: "An extended walkthrough covering your batch architecture, fee ladder and enrollment plan, built live with you.",
    features: ["Standard-by-standard fee review", "Batch fill & occupancy modelling", "Written action summary"],
    cta: "Book Deep-Dive Session",
    bg: "bg-amber-400/5 hover:bg-amber-400/10",
    border: "border-amber-400/30 hover:border-amber-400/60",
    btnClass: "bg-amber-400 text-primary hover:bg-amber-300 shadow-amber-400/20",
    colorAccent: "text-amber-300",
    numBg: "bg-amber-400 text-primary",
  },
  {
    id: "architecture",
    title: "Strategic Architecture",
    price: 9999,
    priceNote: "architectural blueprinting",
    desc: "Complete structural redesign plan. Fee structure, batch architecture, premium program layering, and 90-day roadmap.",
    features: ["Fee structure redesign", "Batch architecture blueprint", "90-day correction plan"],
    cta: "Enquire via WhatsApp",
    bg: "bg-highlight/5 hover:bg-highlight/10",
    border: "border-highlight/30 hover:border-highlight/60",
    btnClass: "bg-highlight text-highlight-foreground hover:bg-highlight/90 shadow-highlight/20",
    colorAccent: "text-highlight",
    numBg: "bg-highlight text-highlight-foreground",
  },
  {
    id: "implementation",
    title: "Implementation Program",
    price: 100000,
    priceNote: "full-scale implementation",
    desc: "Structured execution support. SOPs, teacher allocation, admission funnel, collection discipline, and 60-90 day handholding.",
    features: ["Full systems setup", "SOP documentation", "60-90 day support"],
    cta: "Enquire via WhatsApp",
    bg: "bg-green-500/5 hover:bg-green-500/10",
    border: "border-green-500/30 hover:border-green-500/60",
    btnClass: "bg-green-500 text-primary-foreground hover:bg-green-600 shadow-green-500/20",
    colorAccent: "text-green-400",
    numBg: "bg-green-500 text-primary-foreground",
  },
];
