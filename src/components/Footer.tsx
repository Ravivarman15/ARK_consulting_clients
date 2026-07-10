import { Instagram, Facebook, Mail, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gradient-primary text-primary-foreground">
      <div className="container mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="grid gap-10 sm:gap-8 md:grid-cols-3">
          {/* Social Links */}
          <div className="text-center md:text-left">
            <h3 className="mb-4 font-display text-base font-semibold tracking-wide uppercase text-primary-foreground/80">Connect With Us</h3>
            <div className="flex justify-center gap-3 md:justify-start">
              {[
                { href: "https://www.instagram.com/tuitionwithark?igsh=MjBjejQxaXV2dW1u", icon: Instagram, label: "Instagram" },
                { href: "https://www.facebook.com/share/1A7tt1xEm3/?mibextid=wwXIfr", icon: Facebook, label: "Facebook" },
                { href: "mailto:admin@thearktuition.com", icon: Mail, label: "Email" },
              ].map(({ href, icon: Icon, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                  className="group flex h-11 w-11 items-center justify-center rounded-xl bg-primary-foreground/8 border border-primary-foreground/10 transition-all duration-300 hover:bg-accent hover:text-accent-foreground hover:border-accent/40 hover:shadow-glow hover:scale-105">
                  <Icon className="h-4.5 w-4.5 transition-transform group-hover:scale-110" />
                </a>
              ))}
            </div>
            <p className="mt-3 text-sm text-primary-foreground/50">admin@thearktuition.com</p>
          </div>

          {/* Address 1 */}
          <div className="text-center">
            <h3 className="mb-4 font-display text-base font-semibold tracking-wide uppercase text-primary-foreground/80">Head Office</h3>
            <div className="flex items-start justify-center gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent/70" />
              <p className="text-sm leading-relaxed text-primary-foreground/60">
                No 36 G, North Parade Road<br />
                St.Thomas Mount<br />
                Chennai - 16
              </p>
            </div>
          </div>

          {/* Address 2 */}
          <div className="text-center md:text-right">
            <h3 className="mb-4 font-display text-base font-semibold tracking-wide uppercase text-primary-foreground/80">Other Branches</h3>
            <div className="flex items-start justify-center gap-2 md:justify-end">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent/70" />
              <p className="text-sm leading-relaxed text-primary-foreground/60">
                2/132 A, Bazzar Lane<br />
                St.Thomas Mount<br />
                Chennai - 16
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-primary-foreground/10 pt-6">
          <p className="text-center text-xs text-primary-foreground/30 tracking-wide">
            © {new Date().getFullYear()} ARK Learning Arena. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
