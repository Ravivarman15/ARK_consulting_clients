 import arkLogo from "@/assets/ark-logo.png";
import { Sparkles } from "lucide-react";
 
 const Header = () => {
   return (
    <header className="relative w-full overflow-hidden bg-gradient-primary py-6 shadow-lg md:py-8">
      {/* Background decorative elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-10 -right-20 h-32 w-32 rounded-full bg-highlight/10 blur-3xl" />
        <div className="absolute left-1/4 top-0 h-px w-32 bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
        <div className="absolute bottom-0 right-1/4 h-px w-32 bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      </div>

      <div className="container relative z-10 mx-auto flex flex-col items-center justify-center px-4">
        {/* Logo container with glow effect */}
        <div className="group relative">
          <div className="absolute -inset-2 rounded-2xl bg-accent/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
          <div className="relative rounded-2xl border-2 border-accent/30 bg-primary-foreground/10 p-3 backdrop-blur-sm transition-all duration-300 hover:border-accent/60 hover:shadow-accent">
            <img 
              src={arkLogo} 
              alt="ARK Learning Arena Logo" 
              className="h-16 w-16 object-contain transition-transform duration-500 group-hover:scale-110 md:h-20 md:w-20"
            />
          </div>
        </div>

        {/* Title with enhanced styling */}
        <div className="mt-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 animate-bounce-subtle text-accent md:h-5 md:w-5" />
          <h1 className="text-center font-display text-2xl font-bold tracking-tight text-primary-foreground md:text-4xl">
            ARK Learning Arena
          </h1>
          <Sparkles className="h-4 w-4 animate-bounce-subtle text-accent md:h-5 md:w-5" style={{ animationDelay: "0.5s" }} />
        </div>

        {/* Tagline */}
        <p className="mt-2 font-sans text-sm font-medium tracking-widest text-primary-foreground/70 uppercase">
          Unlock Your Potential
        </p>
       </div>

      {/* Bottom wave decoration */}
      <div className="absolute -bottom-1 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 60L48 55C96 50 192 40 288 35C384 30 480 30 576 33.3C672 37 768 43 864 45C960 47 1056 45 1152 41.7C1248 38 1344 33 1392 30L1440 27V60H1392C1344 60 1248 60 1152 60C1056 60 960 60 864 60C768 60 672 60 576 60C480 60 384 60 288 60C192 60 96 60 48 60H0Z" fill="hsl(0 0% 100%)" />
        </svg>
      </div>
     </header>
   );
 };
 
 export default Header;