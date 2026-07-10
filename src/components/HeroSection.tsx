import { BookOpen, Users, Award, Target, TrendingUp, Layers } from "lucide-react";
import { motion } from "framer-motion";

const HeroSection = () => {
  return (
    <section className="bg-gradient-hero py-16 md:py-20">
      <div className="container mx-auto px-4">
        {/* Main Content */}
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 font-display text-3xl font-bold leading-tight text-primary opacity-0 animate-fade-in-up md:text-5xl lg:text-6xl" style={{ animationDelay: "0.1s" }}>
            Structure Meets Personalisation
          </h2>
          
          <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-muted-foreground opacity-0 animate-fade-in-up md:text-lg" style={{ animationDelay: "0.2s" }}>
            Since 2016, ARK Learning Arena in St. Thomas Mount, Chennai, has pioneered a balanced academic model — combining individual mentoring with batch discipline and structured delivery. We've solved what most tuition centres struggle with: delivering high-quality coaching with true personalised attention, without compromising on systems or outcomes.
          </p>

          {/* Features Grid */}
          <div className="mt-12 grid gap-4 opacity-0 animate-fade-in-up sm:grid-cols-2 lg:grid-cols-4" style={{ animationDelay: "0.3s" }}>
            <FeatureCard 
              icon={<Layers className="h-8 w-8" />}
              title="Multi-Layered Ladder"
              description="Primary to NEET preparation"
              delay={0}
            />
            <FeatureCard 
              icon={<Target className="h-8 w-8" />}
              title="Conceptual Grounding"
              description="Not rote, but understanding"
              delay={1}
            />
            <FeatureCard 
              icon={<Users className="h-8 w-8" />}
              title="Balanced Approach"
              description="Personal + batch discipline"
              delay={2}
            />
            <FeatureCard 
              icon={<Award className="h-8 w-8" />}
              title="Proven Credibility"
              description="Trusted since 2016"
              delay={3}
            />
          </div>
        </div>

        {/* Hook Section */}
        <div className="group mx-auto mt-16 max-w-3xl rounded-2xl border border-accent/30 bg-card p-8 shadow-lg opacity-0 animate-fade-in-up transition-all duration-500 hover:border-accent/60 hover:shadow-xl md:p-10" style={{ animationDelay: "0.4s" }}>
          <div className="mb-4 inline-block rounded-full bg-accent/20 px-4 py-1.5 transition-colors duration-300 group-hover:bg-accent/30">
            <span className="font-display text-sm font-semibold text-accent-foreground">🎯 Start Your Academic Journey</span>
          </div>
          <h3 className="mb-4 font-display text-xl font-bold text-primary md:text-2xl">
            Experience the ARK Difference
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed md:text-base">
            Whether you're building primary foundations, preparing for board exams, or targeting NEET — ARK's structured academic ladder ensures academic continuity and natural progression. Our questionnaire helps us understand your current level, learning goals, and preferred learning style. In just a few minutes, we'll map your personalized pathway from where you are to where you want to be — with the right balance of individual attention and systematic delivery.
          </p>
          <div className="mt-6 flex items-center gap-2 text-sm text-highlight">
            <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-highlight"></span>
            <span className="font-medium">Click the floating button to begin →</span>
          </div>
        </div>

        {/* Key Differentiator Section */}
        <div className="mx-auto mt-12 max-w-3xl text-center opacity-0 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 md:p-8">
            <p className="text-sm font-medium text-primary md:text-base">
              <span className="font-display font-bold">The ARK Model:</span> Not just a tuition centre — a replicable academic system built on trust, structure, and outcomes. We bridge the gap between mass coaching and small personalised centres.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({ 
  icon, 
  title, 
  description,
  delay = 0
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  delay?: number;
}) => {
  return (
    <div 
      className="group cursor-pointer rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-accent hover:shadow-lg hover:shadow-accent/10"
      style={{ animationDelay: `${delay * 0.1}s` }}
    >
      <div className="mb-3 inline-flex rounded-xl bg-primary/10 p-3 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-accent group-hover:text-accent-foreground group-hover:shadow-md">
        {icon}
      </div>
      <h4 className="mb-1 font-display text-base font-semibold text-foreground transition-colors duration-300 group-hover:text-primary">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
};

export default HeroSection;