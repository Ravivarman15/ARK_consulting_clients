import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Loader2, TrendingUp, Users, DollarSign, Building, Target, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import arkLogo from "@/assets/ark-logo.png";
import ScoreCard from "@/components/ScoreCard";
import { calculateAudit, type AuditResult } from "@/utils/scoring";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface FormData {
  institutionName: string;
  ownerName: string;
  email: string;
  phone: string;
  location: string;
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
}

const initialFormData: FormData = {
  institutionName: "", ownerName: "", email: "", phone: "", location: "",
  studentStrength: "", monthlyRevenue: "", avgFeePerStudent: "", highestAnnualFee: "",
  avgStudentsPerBatch: "", totalBatchesPerDay: "", totalTeachingArea: "",
  salaryPercentOfRevenue: "", feeCollectionMethod: "", feePendingPercentage: "",
  monthlyEnquiries: "", conversionRate: "", studentDropoutRate: "",
  teacherLeaveImpact: "", ownerDailyInvolvement: "",
};

const sections = [
  {
    id: "contact", title: "Institution Details", icon: Building,
    questions: [
      { key: "institutionName", label: "Institution Name", type: "text", required: true },
      { key: "ownerName", label: "Owner / Director Name", type: "text", required: true },
      { key: "email", label: "Email Address", type: "email", required: true },
      { key: "phone", label: "Contact Number", type: "tel", required: true },
      { key: "location", label: "Location / City", type: "text", required: true },
    ],
  },
  {
    id: "revenue", title: "Revenue & Pricing", icon: DollarSign,
    questions: [
      { key: "studentStrength", label: "Current active student strength", type: "radio", options: ["< 50", "50–100", "100–200", "200+"], required: true },
      { key: "monthlyRevenue", label: "Average monthly revenue (₹)", type: "radio", options: ["< 1.5 L", "1.5–3 L", "3–6 L", "6 L+"], required: true },
      { key: "avgFeePerStudent", label: "Average fee per student (monthly)", type: "radio", options: ["< ₹2,000", "₹2,000–3,000", "₹3,000–5,000", "₹5,000+"], required: true },
      { key: "highestAnnualFee", label: "Highest annual fee charged (₹)", type: "radio", options: ["< 30,000", "30,000–50,000", "50,000–75,000", "75,000+"], required: true },
    ],
  },
  {
    id: "capacity", title: "Batch & Capacity", icon: Users,
    questions: [
      { key: "avgStudentsPerBatch", label: "Average students per batch", type: "radio", options: ["< 15", "15–20", "20–25", "25+"], required: true },
      { key: "totalBatchesPerDay", label: "Total batches run per day", type: "radio", options: ["1–2", "3–4", "5–6", "7+"], required: true, hint: "A batch is one class session where a specific group of students uses a classroom during a particular time slot. If your classroom runs sessions at 4 PM, 5 PM, and 6 PM with different groups, that's 3 batches. Count total sessions across all classrooms in a single day." },
      { key: "totalTeachingArea", label: "Total usable teaching area", type: "radio", options: ["< 500 sq.ft", "500–1,000 sq.ft", "1,000–1,500 sq.ft", "1,500+ sq.ft"], required: true },
    ],
  },
  {
    id: "cost", title: "Cost & Cash Discipline", icon: TrendingUp,
    questions: [
      { key: "salaryPercentOfRevenue", label: "Salary as % of revenue", type: "radio", options: ["> 50%", "40–50%", "30–40%", "< 30%"], required: true, hint: "This is the share of your total monthly income that goes towards paying teaching and non-teaching staff. E.g. if monthly revenue is ₹2,00,000 and total salary is ₹1,00,000, that's 50%. Ideally this should stay below 40–45% for a healthy institution." },
      { key: "feeCollectionMethod", label: "Fee collection mode", type: "radio", options: ["Monthly", "Quarterly", "Term-wise", "Annual upfront"], required: true },
      { key: "feePendingPercentage", label: "% fees pending at any time", type: "radio", options: ["< 5%", "5–10%", "10–20%", "20%+"], required: true },
    ],
  },
  {
    id: "growth", title: "Admissions & Growth", icon: Target,
    questions: [
      { key: "monthlyEnquiries", label: "Monthly enquiries received", type: "radio", options: ["< 20", "20–50", "50–100", "100+"], required: true },
      { key: "conversionRate", label: "Enquiry → admission conversion", type: "radio", options: ["< 10%", "10–20%", "20–30%", "30%+"], required: true },
    ],
  },
  {
    id: "stability", title: "Stability & Scalability", icon: Building,
    questions: [
      { key: "studentDropoutRate", label: "Student dropout rate", type: "radio", options: ["< 3%", "3–5%", "5–10%", "10%+"], required: true },
      { key: "teacherLeaveImpact", label: "If one key teacher leaves, impact", type: "radio", options: ["No impact", "Minor disruption", "Serious disruption", "Centre cannot function"], required: true, hint: "A key teacher is anyone whose absence directly disrupts classes — typically because they're the only one teaching a particular subject or batch. If no one else can substitute, they are a key teacher. High dependency on 1–2 teachers is a structural risk." },
      { key: "ownerDailyInvolvement", label: "Owner involvement required daily", type: "radio", options: ["< 2 hrs", "2–4 hrs", "4–6 hrs", "Full day"], required: true, hint: "How many hours per day does the academy need you physically present or actively involved — resolving issues, managing staff, handling parents, or running classes yourself. Lower involvement means your academy is better systemised and can scale without you." },
    ],
  },
];

const loaderMessages = [
  "Initializing institutional database comparison...",
  "Running RAG score calculations...",
  "Determining fee realization benchmarks...",
  "Auditing space-to-revenue utilization ratios...",
  "Assessing founder-person operational dependencies...",
  "Constructing 90-day correction blueprint...",
  "Finalizing structural efficiency audit report..."
];

const Questionnaire = () => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [currentSection, setCurrentSection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [showCalculationLoader, setShowCalculationLoader] = useState(false);
  const [loaderStage, setLoaderStage] = useState(0);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleChange = (key: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const validateSection = (sectionIndex: number) => {
    const section = sections[sectionIndex];
    const emptyFields = section.questions.filter((q) => {
      const value = formData[q.key as keyof FormData];
      return !value;
    });
    if (emptyFields.length > 0) {
      toast({ title: "Please complete all fields", description: `Missing: ${emptyFields.map((f) => f.label).join(", ")}`, variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateSection(currentSection) && currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSection(currentSection)) return;
    setIsSubmitting(true);
    setShowCalculationLoader(true);
    setLoaderStage(0);

    const interval = setInterval(() => {
      setLoaderStage((prev) => {
        if (prev >= loaderMessages.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 700);

    try {
      const result = calculateAudit(formData as any);

      await supabase.from("audit_submissions").insert({
        institution_name: formData.institutionName,
        owner_name: formData.ownerName,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        student_strength: formData.studentStrength,
        monthly_revenue: formData.monthlyRevenue,
        avg_fee_per_student: formData.avgFeePerStudent,
        highest_annual_fee: formData.highestAnnualFee,
        avg_students_per_batch: formData.avgStudentsPerBatch,
        total_batches_per_day: formData.totalBatchesPerDay,
        total_teaching_area: formData.totalTeachingArea,
        salary_percent_of_revenue: formData.salaryPercentOfRevenue,
        fee_collection_method: formData.feeCollectionMethod,
        fee_pending_percentage: formData.feePendingPercentage,
        monthly_enquiries: formData.monthlyEnquiries,
        conversion_rate: formData.conversionRate,
        student_dropout_rate: formData.studentDropoutRate,
        teacher_leave_impact: formData.teacherLeaveImpact,
        owner_daily_involvement: formData.ownerDailyInvolvement,
        efficiency_percent: result.efficiencyPercent,
        health_verdict: result.healthVerdict,
        total_leakage_low: result.totalLeakageLow,
        total_leakage_high: result.totalLeakageHigh,
      });

      fetch("https://hooks.zapier.com/hooks/catch/19399966/ulnsfpu/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "no-cors",
        body: JSON.stringify({
          ...formData,
          scores: result.scores,
          efficiencyPercent: result.efficiencyPercent,
          healthVerdict: result.healthVerdict,
          totalLeakageLow: result.totalLeakageLow,
          totalLeakageHigh: result.totalLeakageHigh,
          timestamp: new Date().toISOString(),
          source: "Institutional Structural Performance Audit",
        }),
      });

      // Bounded delay to complete stages before rendering dashboard
      await new Promise((resolve) => setTimeout(resolve, loaderMessages.length * 700 + 400));
      setAuditResult(result);
      toast({ title: "Audit Complete!", description: "Your Institutional Structural Performance Audit is ready." });
    } catch (error) {
      console.error("Error:", error);
      toast({ title: "Submission Error", description: "Please try again.", variant: "destructive" });
      setShowCalculationLoader(false);
    } finally {
      clearInterval(interval);
      setIsSubmitting(false);
    }
  };

  const totalQuestions = sections.reduce((a, s) => a + s.questions.filter((q) => q.type === "radio").length, 0);
  const answeredQuestions = sections.reduce((a, s) => a + s.questions.filter((q) => q.type === "radio" && formData[q.key as keyof FormData]).length, 0);
  const progress = Math.round((answeredQuestions / totalQuestions) * 100);

  if (showCalculationLoader) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-6 text-primary-foreground relative overflow-hidden">
        {/* Ambient background dots */}
        <div className="absolute inset-0 bg-dot-pattern-dense pointer-events-none opacity-30" />
        {/* Decorative background items */}
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-accent/8 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-highlight/8 rounded-full blur-3xl" />
        
        <div className="max-w-md w-full bg-primary-foreground/5 border border-primary-foreground/10 p-8 rounded-[2rem] backdrop-blur-md shadow-2xl flex flex-col items-center text-center relative z-10">
          {/* Radar Sweep / Spinner */}
          <div className="relative w-24 h-24 mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-primary-foreground/10" />
            <div className="absolute inset-0 rounded-full border-4 border-t-accent border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            <div className="absolute -inset-2 rounded-full border-2 border-accent/20 animate-ping opacity-75" />
            <div className="absolute inset-4 rounded-full bg-primary/40 flex items-center justify-center">
              <span className="font-display font-black text-sm text-accent">ARK</span>
            </div>
          </div>

          <h2 className="font-display text-2xl font-bold mb-2 text-glow-accent">Calculating Structural Efficiency</h2>
          <p className="text-primary-foreground/50 text-xs mb-6">Running custom benchmark comparisons against 2026 segment standards</p>
          
          {/* Loading stages checklist */}
          <div className="w-full text-left space-y-3 mb-4 bg-primary-foreground/3 p-5 rounded-2xl border border-primary-foreground/5">
            {loaderMessages.map((msg, idx) => {
              const isPast = idx < loaderStage;
              const isCurrent = idx === loaderStage;
              return (
                <div key={idx} className={`flex items-start gap-3 text-xs transition-all duration-300 ${
                  isPast ? "opacity-100 text-green-400" : isCurrent ? "opacity-100 text-accent font-semibold" : "opacity-25"
                }`}>
                  <span className="flex-shrink-0 mt-0.5">
                    {isPast ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : isCurrent ? (
                      <Loader2 className="h-4 w-4 animate-spin text-accent" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-primary-foreground/20" />
                    )}
                  </span>
                  <span className="leading-snug">{msg}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (auditResult) {
    return (
      <ScoreCard
        auditResult={auditResult}
        onBackHome={() => navigate("/")}
        institutionName={formData.institutionName || "Your Institution"}
      />
    );
  }

  const currentSectionData = sections[currentSection];
  const Icon = currentSectionData.icon;

  return (
    <div className="min-h-screen bg-gradient-primary pb-12 relative overflow-hidden">
      {/* Ambient background dots */}
      <div className="absolute inset-0 bg-dot-pattern-dense pointer-events-none opacity-35" />
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-primary-foreground/10 bg-primary/90 backdrop-blur-xl shadow-xl">
        <div className="container mx-auto flex items-center justify-between px-4 py-3 sm:py-4">
          <button onClick={() => navigate("/")}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-primary-foreground/60 transition-all hover:bg-primary-foreground/8 hover:text-primary-foreground text-sm font-medium">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="flex items-center gap-2.5">
            <img src={arkLogo} alt="ARK Logo" className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl shadow-md" />
            <span className="font-display font-bold text-primary-foreground text-base sm:text-lg">ARK Consulting</span>
          </div>
          <div className="w-16 sm:w-20" />
        </div>
      </header>

      {/* Progress */}
      <div className="sticky top-[57px] sm:top-[65px] z-30 bg-primary/95 backdrop-blur-xl border-b border-primary-foreground/8">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between text-xs sm:text-sm text-primary-foreground/60 mb-2">
            <span className="font-medium">Section {currentSection + 1} of {sections.length}</span>
            <span className="font-bold text-accent">{progress}% Complete</span>
          </div>
          <div className="h-1.5 sm:h-2 overflow-hidden rounded-full bg-primary-foreground/8">
            <div className="h-full rounded-full bg-accent transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Section Nav */}
      <div className="container mx-auto px-4 py-4 sm:py-6 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {sections.map((section, index) => {
            const SIcon = section.icon;
            const isCompleted = section.questions.every((q) => formData[q.key as keyof FormData]);
            const isCurrent = index === currentSection;
            return (
              <button key={section.id} onClick={() => setCurrentSection(index)}
                className={`flex items-center gap-1.5 sm:gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 border ${
                  isCurrent
                    ? "bg-accent text-accent-foreground border-accent shadow-lg font-bold scale-[1.02]"
                    : isCompleted
                    ? "bg-green-500/10 text-green-400 border-green-500/30"
                    : "bg-primary-foreground/5 text-primary-foreground/50 border-primary-foreground/10 hover:bg-primary-foreground/10"
                }`}>
                <SIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{section.title}</span>
                <span className="sm:hidden">{index + 1}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Area */}
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex items-center gap-2.5 rounded-2xl bg-accent/10 border border-accent/20 px-5 py-2.5 backdrop-blur-sm shadow-sm animate-float">
              <Icon className="h-5 w-5 text-accent animate-pulse" />
              <span className="text-base sm:text-lg font-semibold text-accent text-glow-accent">{currentSectionData.title}</span>
            </div>
            {currentSection === 0 && (
              <>
                <h1 className="mb-3 font-display font-bold text-3xl sm:text-4xl md:text-5xl text-primary-foreground leading-tight text-glow-accent">
                  Institutional Structural Audit
                </h1>
                <p className="text-primary-foreground/50 text-sm sm:text-lg max-w-xl mx-auto">
                  Provide your operational benchmarks below to compute your Structural Index.
                </p>
              </>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSection}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="space-y-6"
              >
                {currentSectionData.questions.map((question, qIndex) => (
                  <div key={question.key}
                    className="group rounded-3xl border border-primary-foreground/10 bg-card p-6 sm:p-8 shadow-xl transition-all duration-300 hover:border-accent/40 hover:shadow-2xl relative overflow-hidden"
                    style={{ animationDelay: `${qIndex * 0.05}s` }}>
                    <div className="absolute top-0 left-0 w-2.5 h-full bg-accent/20 group-hover:bg-accent/40 transition-colors" />

                    <label className="mb-5 flex items-start gap-4 pl-2">
                      <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl bg-accent text-xs sm:text-sm font-black text-accent-foreground shadow-md">
                        {qIndex + 1}
                      </span>
                      <span className="font-display font-bold text-foreground text-lg pt-0.5 leading-snug">
                        {question.label}
                        {question.required && <span className="ml-1 text-highlight">*</span>}
                      </span>
                    </label>

                    {'hint' in question && question.hint && (
                      <p className="ml-11 sm:ml-12 mb-5 text-xs sm:text-sm text-muted-foreground leading-relaxed bg-muted/50 rounded-xl px-4 py-3 border border-border/50">
                        💡 {question.hint}
                      </p>
                    )}

                    {question.type === "radio" && question.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-11 sm:ml-12">
                        {question.options.map((option) => {
                          const isSelected = formData[question.key as keyof FormData] === option;
                          return (
                            <label key={option}
                              className={`flex items-center justify-between gap-3 cursor-pointer rounded-2xl border-2 p-4 transition-all duration-300 ${
                                isSelected
                                  ? "border-accent bg-accent/8 shadow-md scale-[1.01]"
                                  : "border-border/60 hover:border-accent/30 hover:bg-accent/3 bg-card"
                              }`}>
                              <div className="flex items-center gap-3">
                                <input type="radio" name={question.key} value={option}
                                  checked={isSelected}
                                  onChange={(e) => handleChange(question.key as keyof FormData, e.target.value)}
                                  className="sr-only" />
                                <div className={`h-4.5 w-4.5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? "border-accent bg-accent" : "border-muted-foreground/30 bg-transparent"}`}>
                                  {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-accent-foreground" />}
                                </div>
                                <span className={`text-sm sm:text-base transition-colors ${isSelected ? "text-foreground font-semibold" : "text-foreground/70"}`}>{option}</span>
                              </div>
                              {isSelected && <CheckCircle className="h-5 w-5 text-accent flex-shrink-0" />}
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {(question.type === "text" || question.type === "email" || question.type === "tel") && (
                      <div className="ml-11 sm:ml-12">
                        <input type={question.type}
                          value={formData[question.key as keyof FormData]}
                          onChange={(e) => handleChange(question.key as keyof FormData, e.target.value)}
                          className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-foreground text-sm sm:text-base placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 transition-all shadow-inner"
                          required={question.required} />
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>

            <div className="flex gap-3 sm:gap-4 pt-6 sm:pt-8">
              {currentSection > 0 && (
                <button type="button" onClick={handleBack}
                  className="flex items-center gap-2 rounded-2xl bg-card border-2 border-primary-foreground/10 px-5 py-3.5 sm:px-6 font-semibold text-primary-foreground/80 text-sm sm:text-base transition-all hover:bg-primary-foreground/10 shadow-md">
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" /> Previous
                </button>
              )}
              {currentSection < sections.length - 1 ? (
                <button type="button" onClick={handleNext}
                  className="ml-auto flex items-center gap-2 rounded-2xl bg-accent px-6 sm:px-8 py-3.5 sm:py-4 font-bold text-accent-foreground text-sm sm:text-base shadow-lg shadow-accent/20 transition-all hover:shadow-xl hover:shadow-accent/30 hover:scale-[1.02]">
                  Next Section
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 rotate-180" />
                </button>
              ) : (
                <button type="submit" disabled={isSubmitting}
                  className="ml-auto group relative overflow-hidden rounded-2xl bg-highlight px-6 sm:px-8 py-3.5 sm:py-4 font-bold text-highlight-foreground text-sm sm:text-base shadow-lg shadow-highlight/20 transition-all hover:shadow-xl hover:shadow-highlight/30 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70">
                  <span className="relative z-10 flex items-center gap-2">
                    {isSubmitting ? (
                      <><Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> Calculating...</>
                    ) : (
                      <><Send className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" /> Generate Structural Audit</>
                    )}
                  </span>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Questionnaire;

