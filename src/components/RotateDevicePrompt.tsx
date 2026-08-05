import { useEffect, useState } from "react";

export default function RotateDevicePrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const check = () => {
      const isMobile =
        window.matchMedia("(max-width: 900px)").matches ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );
      const isPortrait = window.matchMedia("(orientation: portrait)").matches;
      setShow(isMobile && isPortrait);
    };
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/95 backdrop-blur-md px-6 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-aurora blur-2xl opacity-50 animate-pulse-glow" />
        <div className="relative text-7xl animate-float-slow" style={{ animation: "rotate-hint 2s ease-in-out infinite" }}>
          📱
        </div>
      </div>
      <h2 className="text-2xl font-black text-aurora mb-3">Rotate Your Device</h2>
      <p className="text-muted-foreground max-w-xs leading-relaxed">
        Pookoo Run is best played in <span className="text-foreground font-semibold">landscape mode</span>.
        Please turn your phone sideways to start your adventure.
      </p>
      <div className="mt-6 text-xs uppercase tracking-[0.3em] text-accent">Waiting for landscape…</div>
      <style>{`
        @keyframes rotate-hint {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-90deg); }
        }
      `}</style>
    </div>
  );
}
