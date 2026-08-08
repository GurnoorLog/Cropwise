import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

interface BrandIconProps {
  className?: string;
}

function TwitterIcon({ className }: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  );
}

function InstagramIcon({ className }: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function LinkedinIcon({ className }: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

const FEATURES = [
  {
    label: "Real-time intelligence",
    title: "Predictive Market Analytics",
    description:
      "Receive alerts when market demand peaks for your specific variety and region.",
  },
  {
    label: "Direct Logistics",
    title: "Elite Buyer Network",
    description:
      "Skip the middlemen and connect directly with vetted high-volume distribution partners.",
  },
  {
    label: "Global Standards",
    title: "Quality Assurance",
    description:
      "Transparent grading and documentation for domestic and international trade compliance.",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { session, signInWithGoogle } = useAuth();

  const handleEnter = async () => {
    if (session) {
      navigate("/dashboard");
    } else {
      await signInWithGoogle();
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col isolate bg-[hsl(201,100%,13%)]">
      {/* Background Video Layer */}
      <div className="fixed inset-0 w-full h-full -z-20 overflow-hidden">
        <video autoPlay muted loop playsInline className="w-full h-full object-cover">
          <source
            src="https://designerstephen.github.io/public-assets/videos/serene-art-hero.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 video-overlay" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 w-full bg-transparent">
        <div className="max-w-[1280px] mx-auto px-8 py-6 grid grid-cols-2 md:grid-cols-3 items-center">
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="font-serif text-[30px] text-white tracking-tight"
          >
            Harvest Window
            <sup className="text-[14px] ml-0.5">®</sup>
          </a>

          <div className="flex justify-end md:col-start-3">
            <button
              onClick={handleEnter}
              className="pill-button inline-flex bg-black text-white px-6 py-2.5 rounded-full text-[14px] font-medium cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              {session ? "Dashboard" : "Sign In"}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-32 pb-20 z-10">
        <div className="w-full max-w-[1280px] text-center">
          <h1 className="fade-rise stagger-1 font-serif hero-heading text-white mb-6">
            Maximize every harvest with{" "}
            <br className="hidden md:block" /> precision market timing.
          </h1>

          <p className="fade-rise stagger-2 max-w-[670px] mx-auto text-lg md:text-xl text-white/70 font-light leading-relaxed mb-12">
            Harvest Window leverages predictive analytics to identify the
            optimal moment to sell your crops, connecting premium growers with
            high-value global buyers.
          </p>

          <div className="fade-rise stagger-3 flex flex-col md:flex-row justify-center gap-12 max-w-[1000px] mx-auto">
            {FEATURES.map((feature) => (
              <div key={feature.label} className="text-left">
                <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-4">
                  {feature.label}
                </p>
                <h3 className="text-white text-xl font-medium mb-3">
                  {feature.title}
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <div className="fade-rise stagger-4 mt-16">
            <button
              onClick={handleEnter}
              className="pill-button inline-flex bg-white text-black px-14 py-5 rounded-full text-base font-medium shadow-xl cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              {session ? "Enter the Platform" : "Sign in with Google"}
            </button>
          </div>
        </div>
      </main>

      {/* Decorative bottom bar */}
      <footer className="z-10 p-8 flex justify-between items-end">
        <div className="hidden md:block">
          <p className="text-white/40 text-xs tracking-[0.2em] uppercase font-semibold">
            © 2024 HARVEST WINDOW TECHNOLOGIES
          </p>
        </div>
        <div className="flex gap-6">
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            aria-label="Twitter"
            className="text-white/40 hover:text-white transition-colors"
          >
            <TwitterIcon className="w-5 h-5" />
          </a>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            aria-label="Instagram"
            className="text-white/40 hover:text-white transition-colors"
          >
            <InstagramIcon className="w-5 h-5" />
          </a>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            aria-label="LinkedIn"
            className="text-white/40 hover:text-white transition-colors"
          >
            <LinkedinIcon className="w-5 h-5" />
          </a>
        </div>
      </footer>
    </div>
  );
}
