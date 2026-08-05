import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import PookooGame from "@/components/PookooGame";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pookoo Run — Run. Survive. Transform." },
      { name: "description", content: "A magical 2D endless runner. Outrun the firewolves, collect piplets, and transform with rare glowing pods." },
      { property: "og:title", content: "Pookoo Run — Run. Survive. Transform." },
      { property: "og:description", content: "A magical 2D endless runner. Outrun the firewolves, collect piplets, and transform with rare glowing pods." },
    ],
  }),
  component: Index,
});

function Index() {
  const [playing, setPlaying] = useState(false);

  if (playing) return <PookooGame onExit={() => setPlaying(false)} />;

  return (
    <div className="min-h-screen bg-hero relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 w-[420px] h-[420px] rounded-full blur-3xl opacity-40 bg-aurora animate-float-slow" />
        <div className="absolute top-1/3 -right-24 w-[460px] h-[460px] rounded-full blur-3xl opacity-30 bg-ember animate-float-slow" style={{ animationDelay: "1.5s" }} />
        <div className="absolute bottom-0 left-1/3 w-[360px] h-[360px] rounded-full blur-3xl opacity-25 bg-aurora animate-float-slow" style={{ animationDelay: "3s" }} />
        {/* Stars */}
        <div className="absolute inset-0 opacity-60" style={{
          backgroundImage: "radial-gradient(1px 1px at 20% 30%, white, transparent), radial-gradient(1px 1px at 60% 70%, white, transparent), radial-gradient(1.5px 1.5px at 80% 20%, white, transparent), radial-gradient(1px 1px at 40% 80%, white, transparent), radial-gradient(1px 1px at 90% 50%, white, transparent)",
          backgroundSize: "600px 600px",
        }} />
      </div>

      <header className="relative z-10 max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-aurora glow-accent flex items-center justify-center text-lg">✦</div>
          <span className="font-bold tracking-wide">POOKOO RUN</span>
        </div>
        <nav className="hidden sm:flex gap-7 text-sm text-muted-foreground">
          <a href="#about" className="hover:text-foreground transition">About</a>
          <a href="#how" className="hover:text-foreground transition">How to Play</a>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-12 sm:pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-border text-xs uppercase tracking-[0.25em] text-muted-foreground mb-8 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_10px_currentColor]" />
          A magical endless runner
        </div>
        <h1 className="text-6xl sm:text-8xl lg:text-9xl font-black tracking-tight text-aurora leading-[0.95] mb-6 animate-fade-in">
          POOKOO<br />RUN
        </h1>
        <p className="text-lg sm:text-2xl text-muted-foreground max-w-xl mx-auto mb-10 animate-fade-in">
          Run. Survive. Transform.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => setPlaying(true)}
            className="group inline-flex items-center gap-3 px-9 py-4 rounded-full bg-ember text-primary-foreground text-lg font-bold tracking-wide animate-pulse-glow hover:scale-105 transition-transform"
          >
            Start Run
            <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
          </button>
          <Link
            to="/leaderboard"
            className="inline-flex items-center gap-3 px-9 py-4 rounded-full glass border border-border text-lg font-bold tracking-wide hover:border-accent/60 hover:scale-105 transition"
          >
            <span>🏆</span> Leaderboard
          </Link>
        </div>
        <div className="mt-6 text-xs text-muted-foreground tracking-wider uppercase">Desktop & Mobile · 60 FPS</div>
      </section>

      {/* About */}
      <section id="about" className="relative z-10 max-w-6xl mx-auto px-6 pb-20">
        <div className="text-center mb-12">
          <div className="text-xs uppercase tracking-[0.3em] text-accent mb-3">The story</div>
          <h2 className="text-4xl sm:text-5xl font-bold">About</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          <AboutCard
            badge="Creator"
            title="Jivaansh Yadav"
            body="Pookoo Run is the work of Jivaansh Yadav — a love letter to fast-paced survival runners with soul."
            icon="✦"
          />
          <AboutCard
            badge="Inspiration"
            title="The Swapped vibe"
            body="Inspired by the atmosphere and adventure style of Swapped: a mysterious world where every second matters."
            icon="◈"
            highlight
          />
          <AboutCard
            badge="Mood"
            title="Adventurous · Mysterious"
            body="A magical, slightly haunted forest. Glowing pods. Hungry firewolves. The hunt never stops."
            icon="♢"
          />
        </div>
      </section>

      {/* How to play */}
      <section id="how" className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-[0.3em] text-accent mb-3">The rules</div>
          <h2 className="text-4xl sm:text-5xl font-bold">How to Play</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { t: "Run forever", d: "You're always moving forward. The world speeds up over time." },
            { t: "Collect Piplets", d: "Glowing green fruits. Grab one to instantly refill energy." },
            { t: "Find Glowing Pods", d: "Rare. Transforms POOKOO ↔ JAVAN. Javan can fly — briefly." },
            { t: "Outrun the wolves", d: "Firewolves chase. Low energy makes them faster. Don't stop too long." },
          ].map((s, i) => (
            <div key={i} className="glass rounded-2xl border border-border p-5 shadow-card hover:scale-[1.02] hover:border-accent/60 transition">
              <div className="text-3xl font-black text-aurora mb-3">{String(i + 1).padStart(2, "0")}</div>
              <div className="font-semibold mb-1">{s.t}</div>
              <div className="text-sm text-muted-foreground">{s.d}</div>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <button
            onClick={() => setPlaying(true)}
            className="inline-flex items-center gap-3 px-8 py-3.5 rounded-full bg-ember text-primary-foreground font-bold hover:scale-105 transition-transform glow-primary"
          >
            Begin the run →
          </button>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border/50 py-6 text-center text-xs text-muted-foreground">
        Pookoo Run · Created by Jivaansh Yadav
      </footer>
    </div>
  );
}

function AboutCard({
  badge, title, body, icon, highlight,
}: { badge: string; title: string; body: string; icon: string; highlight?: boolean }) {
  return (
    <div className={`relative rounded-2xl p-6 glass border shadow-card transition hover:-translate-y-1 ${
      highlight ? "border-accent/60 glow-accent" : "border-border hover:border-primary/60"
    }`}>
      <div className="absolute -top-3 left-5 px-2.5 py-0.5 rounded-full bg-background border border-border text-[10px] uppercase tracking-widest text-muted-foreground">
        {badge}
      </div>
      <div className="text-3xl mb-3 text-aurora">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
