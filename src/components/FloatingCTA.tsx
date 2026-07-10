import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const FloatingCTA = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 1.5, duration: 0.5, ease: "easeOut" }}
      className="fixed bottom-6 right-6 z-50 sm:bottom-8 sm:right-8"
    >
      <Link
        to="/questionnaire"
        className="group flex items-center gap-2.5 rounded-2xl bg-accent px-6 py-3.5 sm:px-8 sm:py-4 font-display text-sm sm:text-base font-bold text-accent-foreground shadow-float transition-all duration-300 hover:scale-105 hover:gap-3.5 animate-pulse-glow"
      >
        <span>Start Audit</span>
        <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
      </Link>
    </motion.div>
  );
};

export default FloatingCTA;
