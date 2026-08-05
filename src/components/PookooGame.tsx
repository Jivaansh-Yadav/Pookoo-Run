import { useEffect, useRef, useState, useCallback } from "react";
import { submitScore } from "@/lib/leaderboard.functions";
import {
  getUsername, setUsername as persistUsername, recordRun, canSubmit, markSubmitted,
  validateUsername, type Achievement,
} from "@/lib/playerStats";

type Character = "pookoo" | "javan";
type GameState = "playing" | "paused" | "gameover";

interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  type: "log" | "rock" | "thorn" | "cliff" | "ruin" | "crystal";
}
interface Piplet {
  x: number;
  y: number;
  r: number;
  bob: number;
  collected: boolean;
}
interface Pod {
  x: number;
  y: number;
  r: number;
  bob: number;
  collected: boolean;
}
interface Particle {
  x: number; y: number; vx: number; vy: number; life: number; max: number;
  color: string; size: number;
}
interface Popup { text: string; life: number; max: number; }

// --- Tiny audio engine (no assets needed) ---
class GameAudio {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  musicGain: GainNode | null = null;
  sfxGain: GainNode | null = null;
  musicNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
  musicTimer: number | null = null;
  enabled = true;
  musicVol = 0.35;
  sfxVol = 0.6;

  init() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 1;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicVol;
    this.musicGain.connect(this.master);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.sfxVol;
    this.sfxGain.connect(this.master);
  }
  setMusic(v: number) { this.musicVol = v; if (this.musicGain) this.musicGain.gain.value = v; }
  setSfx(v: number) { this.sfxVol = v; if (this.sfxGain) this.sfxGain.gain.value = v; }

  blip(freq: number, dur = 0.12, type: OscillatorType = "sine", vol = 0.4) {
    if (!this.ctx || !this.sfxGain) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = 0;
    g.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g);
    g.connect(this.sfxGain);
    o.start();
    o.stop(this.ctx.currentTime + dur + 0.02);
  }
  noise(dur = 0.2, vol = 0.3, freq = 800) {
    if (!this.ctx || !this.sfxGain) return;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    src.connect(bp); bp.connect(g); g.connect(this.sfxGain);
    src.start();
  }
  eat() { this.blip(660, 0.08, "triangle", 0.35); setTimeout(() => this.blip(880, 0.1, "triangle", 0.3), 80); }
  pip() { this.blip(1200, 0.06, "sine", 0.3); }
  pod() { this.blip(440, 0.2, "sine", 0.4); setTimeout(() => this.blip(880, 0.25, "sine", 0.4), 100); setTimeout(() => this.blip(1320, 0.3, "sine", 0.4), 200); }
  transform() { for (let i = 0; i < 6; i++) setTimeout(() => this.blip(330 + i * 110, 0.1, "sawtooth", 0.25), i * 50); }
  wolf() { this.noise(0.3, 0.2, 300); this.blip(110, 0.4, "sawtooth", 0.18); }
  hurt() { this.blip(180, 0.2, "square", 0.4); }
  gameOver() { for (let i = 0; i < 5; i++) setTimeout(() => this.blip(440 - i * 60, 0.3, "sawtooth", 0.3), i * 150); }

  startMusic() {
    if (!this.ctx || !this.musicGain || this.musicTimer != null) return;
    const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33];
    let step = 0;
    const play = () => {
      if (!this.ctx || !this.musicGain) return;
      const note = scale[Math.floor(Math.random() * scale.length)] / 2;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = "triangle";
      o.frequency.value = note;
      g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.9);
      o.connect(g); g.connect(this.musicGain);
      o.start();
      o.stop(this.ctx.currentTime + 1);
      // Bass
      if (step % 2 === 0) {
        const b = this.ctx.createOscillator();
        const bg = this.ctx.createGain();
        b.type = "sine";
        b.frequency.value = note / 2;
        bg.gain.value = 0;
        bg.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 0.05);
        bg.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);
        b.connect(bg); bg.connect(this.musicGain);
        b.start();
        b.stop(this.ctx.currentTime + 1.3);
      }
      step++;
    };
    play();
    this.musicTimer = window.setInterval(play, 480);
  }
  stopMusic() {
    if (this.musicTimer != null) { clearInterval(this.musicTimer); this.musicTimer = null; }
  }
}

const audio = new GameAudio();

interface Props { onExit: () => void }

export default function PookooGame({ onExit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hud, setHud] = useState({
    energy: 100, piplets: 0, distance: 0, score: 0, char: "pookoo" as Character, speed: 1,
  });
  const [state, setState] = useState<GameState>("playing");
  const [finalStats, setFinalStats] = useState({
    score: 0, distance: 0, time: 0, character: "pookoo" as Character, transformed: false,
  });
  const [musicVol, setMusicVol] = useState(0.35);
  const [sfxVol, setSfxVol] = useState(0.6);
  const [showVol, setShowVol] = useState(false);
  const [unlocked, setUnlocked] = useState<Achievement[]>([]);
  const [achievementToast, setAchievementToast] = useState<Achievement | null>(null);
  const [toastExiting, setToastExiting] = useState(false);
  const [usernameInput, setUsernameInput] = useState<string>("");
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "submitted" | "error" | "skipped">("idle");
  const [submitError, setSubmitError] = useState<string>("");

  const stateRef = useRef<GameState>("playing");
  useEffect(() => { stateRef.current = state; }, [state]);

  const startTimeRef = useRef(Date.now());
  const recordedRef = useRef(false);

  useEffect(() => { setUsernameInput(getUsername()); }, []);

  // Drip achievement toasts (one at a time)
  useEffect(() => {
    if (achievementToast || unlocked.length === 0) return;
    const [next, ...rest] = unlocked;
    setAchievementToast(next);
    setUnlocked(rest);
    setToastExiting(false);
    const t1 = setTimeout(() => setToastExiting(true), 1700);
    const t2 = setTimeout(() => setAchievementToast(null), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [unlocked, achievementToast]);

  useEffect(() => {
    audio.init();
    audio.startMusic();
    return () => audio.stopMusic();
  }, []);
  useEffect(() => { audio.setMusic(musicVol); }, [musicVol]);
  useEffect(() => { audio.setSfx(sfxVol); }, [sfxVol]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    let W = 0, H = 0, dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // World
    const groundY = () => H - 90;
    const player = {
      x: 160, y: 0, vy: 0, w: 56, h: 64, onGround: true,
      char: "pookoo" as Character,
      eating: false, eatProgress: 0, eatDuration: 1.8,
      hurtFlash: 0,
      flyTime: 0, // for javan
      flyMax: 2.5,
      transformFlash: 0,
    };
    player.y = groundY() - player.h;

    let energy = 100;
    let piplets = 0;
    let distance = 0;
    let score = 0;
    let speed = 480; // px/sec — faster baseline
    const BASE_SPEED = 480;
    let wolfDist = 220; // distance behind player
    let transformed = false;
    // Speed-line streaks
    const streaks: { x: number; y: number; len: number; w: number }[] = [];
    const wolves: { x: number; y: number; phase: number }[] = [
      { x: -50, y: 0, phase: 0 },
      { x: -100, y: 0, phase: 1 },
      { x: -150, y: 0, phase: 2 },
    ];
    const obstacles: Obstacle[] = [];
    const piples: Piplet[] = [];
    const pods: Pod[] = [];
    const particles: Particle[] = [];
    const popups: Popup[] = [];
    let nextObstacleIn = 1.5;
    let nextPipletIn = 0.8;
    let nextPodIn = 18;
    let shake = 0;
    let bgScroll = 0;
    let mid1Scroll = 0;
    let mid2Scroll = 0;
    let groundScroll = 0;
    let jumpHeld = false;
    let jumpTime = 0;

    const tryJump = () => {
      if (player.char === "javan") {
        // start flying
        if (player.flyTime < player.flyMax) {
          player.vy = -260;
        }
        return;
      }
      if (player.onGround && !player.eating) {
        player.vy = -560;
        player.onGround = false;
        audio.blip(700, 0.08, "triangle", 0.25);
      }
    };
    const tryEat = () => {
      // Eating removed — piplets now refill energy instantly on pickup.
      return;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        jumpHeld = true;
        tryJump();
      } else if (e.code === "KeyE" || e.code === "ArrowDown") {
        e.preventDefault();
        tryEat();
      } else if (e.code === "KeyP" || e.code === "Escape") {
        e.preventDefault();
        setState((s) => (s === "playing" ? "paused" : s === "paused" ? "playing" : s));
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") jumpHeld = false;
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);

    // Touch: tap upper half = jump, lower half = eat
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0] || e.changedTouches[0];
      if (!t) return;
      const rect = canvas.getBoundingClientRect();
      const y = t.clientY - rect.top;
      if (y < rect.height * 0.65) { jumpHeld = true; tryJump(); }
      else tryEat();
    };
    const onTouchEnd = () => { jumpHeld = false; };
    canvas.addEventListener("touchstart", onTouch, { passive: true });
    canvas.addEventListener("touchend", onTouchEnd, { passive: true });
    const onMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const y = e.clientY - rect.top;
      if (y < rect.height * 0.65) { jumpHeld = true; tryJump(); }
      else tryEat();
    };
    const onMouseUp = () => { jumpHeld = false; };
    canvas.addEventListener("mousedown", onMouse);
    canvas.addEventListener("mouseup", onMouseUp);

    // --- Spawning ---
    const spawnObstacle = () => {
      const types: Obstacle["type"][] = ["log", "rock", "thorn", "cliff", "ruin", "crystal"];
      const type = types[Math.floor(Math.random() * types.length)];
      const sizes: Record<Obstacle["type"], { w: number; h: number }> = {
        log: { w: 70, h: 30 }, rock: { w: 50, h: 50 }, thorn: { w: 60, h: 35 },
        cliff: { w: 40, h: 70 }, ruin: { w: 80, h: 65 }, crystal: { w: 40, h: 55 },
      };
      const s = sizes[type];
      obstacles.push({ x: W + 40, y: groundY() - s.h, w: s.w, h: s.h, type });
    };
    const spawnPiplet = () => {
      const onGround = Math.random() < 0.5;
      const y = onGround ? groundY() - 30 : groundY() - 140 - Math.random() * 80;
      piples.push({ x: W + 30, y, r: 12, bob: Math.random() * Math.PI * 2, collected: false });
    };
    const spawnPod = () => {
      pods.push({ x: W + 30, y: groundY() - 120 - Math.random() * 100, r: 20, bob: 0, collected: false });
    };

    const addParticle = (x: number, y: number, color: string, count = 1, spread = 60) => {
      for (let i = 0; i < count; i++) {
        particles.push({
          x, y,
          vx: (Math.random() - 0.5) * spread,
          vy: (Math.random() - 0.5) * spread - 20,
          life: 0, max: 0.6 + Math.random() * 0.6,
          color, size: 2 + Math.random() * 3,
        });
      }
    };

    const transformPlayer = () => {
      player.char = player.char === "pookoo" ? "javan" : "pookoo";
      player.transformFlash = 0.8;
      player.flyTime = 0;
      shake = 12;
      audio.transform();
      transformed = true;
      popups.push({ text: player.char === "javan" ? "TRANSFORMED → JAVAN" : "TRANSFORMED → POOKOO", life: 0, max: 2.5 });
    };

    const gameOver = () => {
      if (stateRef.current === "gameover") return;
      audio.gameOver();
      audio.stopMusic();
      shake = 30;
      const t = (Date.now() - startTimeRef.current) / 1000;
      const finalScore = Math.floor(score);
      const finalDist = Math.floor(distance);
      const finalTime = Math.floor(t);
      setFinalStats({
        score: finalScore, distance: finalDist, time: finalTime,
        character: player.char, transformed,
      });
      if (!recordedRef.current) {
        recordedRef.current = true;
        const result = recordRun({
          score: finalScore, distance: finalDist, time: finalTime,
          character: player.char, transformed,
        });
        if (result.unlocked.length > 0) setUnlocked((prev) => [...prev, ...result.unlocked]);
      }
      setState("gameover");
    };

    let last = performance.now();
    let raf = 0;
    let hudTick = 0;

    // Ambient particles
    const ambient: Particle[] = [];
    for (let i = 0; i < 40; i++) {
      ambient.push({
        x: Math.random() * 2000, y: Math.random() * 600,
        vx: -10 - Math.random() * 20, vy: (Math.random() - 0.5) * 10,
        life: 0, max: 999, color: "rgba(180, 220, 255, 0.4)", size: 1 + Math.random() * 2,
      });
    }

    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      if (stateRef.current === "playing") update(dt);
      draw();
      hudTick += dt;
      if (hudTick > 0.1) {
        hudTick = 0;
        setHud({
          energy: Math.max(0, Math.min(100, energy)),
          piplets, distance: Math.floor(distance),
          score: Math.floor(score), char: player.char,
          speed: +(speed / BASE_SPEED).toFixed(2),
        });
      }
      raf = requestAnimationFrame(loop);
    };

    function update(dt: number) {
      // Difficulty scaling — faster ramp
      speed += dt * 9;
      if (speed > BASE_SPEED * 3) speed = BASE_SPEED * 3;
      const drainRate = 5 + Math.min(10, distance / 500);
      energy -= drainRate * dt;
      if (player.eating) {
        player.eatProgress += dt;
        if (player.eatProgress >= player.eatDuration) {
          energy = Math.min(100, energy + 45);
          piplets -= 1;
          player.eating = false;
          addParticle(player.x + 20, player.y + 20, "rgba(120,255,180,0.9)", 20, 120);
          popups.push({ text: "+45 ENERGY", life: 0, max: 1.5 });
        }
      }

      // Movement
      const effectiveSpeed = player.eating ? 0 : speed;
      const speedMul = speed / BASE_SPEED;
      distance += effectiveSpeed * dt * 0.05;
      // Score scales with speed → faster = more rewarding
      score += dt * (12 + speed * 0.05) * speedMul;

      // Parallax
      bgScroll = (bgScroll + effectiveSpeed * dt * 0.05) % W;
      mid1Scroll = (mid1Scroll + effectiveSpeed * dt * 0.2) % W;
      mid2Scroll = (mid2Scroll + effectiveSpeed * dt * 0.4) % W;
      groundScroll = (groundScroll + effectiveSpeed * dt) % 80;

      // Player physics
      if (player.char === "javan") {
        if (jumpHeld && player.flyTime < player.flyMax) {
          player.vy -= 800 * dt;
          player.flyTime += dt;
          if (Math.random() < 0.5) addParticle(player.x + 10, player.y + player.h, "rgba(180,220,255,0.7)", 1, 30);
        }
        player.vy += 900 * dt;
        if (player.vy > 600) player.vy = 600;
        // Limit altitude
        const maxY = groundY() - player.h - 220;
        if (player.y < maxY) { player.y = maxY; if (player.vy < 0) player.vy = 0; }
      } else {
        player.vy += 1600 * dt;
      }
      player.y += player.vy * dt;
      const floor = groundY() - player.h;
      if (player.y >= floor) {
        player.y = floor; player.vy = 0;
        if (!player.onGround) addParticle(player.x + player.w / 2, player.y + player.h, "rgba(200,200,200,0.7)", 8, 80);
        player.onGround = true;
        if (player.char === "javan") player.flyTime = Math.max(0, player.flyTime - dt * 1.5);
      } else {
        player.onGround = false;
      }

      if (player.transformFlash > 0) player.transformFlash -= dt;
      if (player.hurtFlash > 0) player.hurtFlash -= dt;

      // Spawn
      nextObstacleIn -= dt;
      if (nextObstacleIn <= 0) {
        spawnObstacle();
        // Faster + denser as speed ramps. Floor so it stays fair.
        const base = 0.8 + Math.random() * 1.2;
        nextObstacleIn = Math.max(0.45, base / speedMul);
      }
      nextPipletIn -= dt;
      if (nextPipletIn <= 0) {
        spawnPiplet();
        nextPipletIn = Math.max(0.4, (0.55 + Math.random() * 0.9) / speedMul);
      }
      nextPodIn -= dt;
      if (nextPodIn <= 0) { spawnPod(); nextPodIn = 18 + Math.random() * 14; }

      // Speed-line streaks (only kick in past 1.15x base)
      if (speedMul > 1.15 && Math.random() < dt * (12 * speedMul)) {
        streaks.push({
          x: W + 20,
          y: 40 + Math.random() * (H - 200),
          len: 40 + Math.random() * 80 * speedMul,
          w: 1 + Math.random() * 1.8,
        });
      }
      for (let i = streaks.length - 1; i >= 0; i--) {
        streaks[i].x -= effectiveSpeed * dt * 2.2;
        if (streaks[i].x + streaks[i].len < -20) streaks.splice(i, 1);
      }

      // Move world entities
      for (const o of obstacles) o.x -= effectiveSpeed * dt;
      for (const p of piples) { p.x -= effectiveSpeed * dt; p.bob += dt * 4; }
      for (const p of pods) { p.x -= effectiveSpeed * dt; p.bob += dt * 3; }

      // Collisions
      const pb = { x: player.x + 6, y: player.y + 6, w: player.w - 12, h: player.h - 12 };
      for (const o of obstacles) {
        if (o.x + o.w < pb.x || o.x > pb.x + pb.w) continue;
        if (o.y + o.h < pb.y || o.y > pb.y + pb.h) continue;
        // Javan can fly over thorns/logs/crystal if airborne
        if (player.char === "javan" && !player.onGround && (o.type === "thorn" || o.type === "log" || o.type === "crystal")) continue;
        energy -= 25;
        player.hurtFlash = 0.4;
        player.vy = -300;
        shake = 14;
        audio.hurt();
        addParticle(player.x + 20, player.y + 20, "rgba(255,80,80,0.9)", 14, 140);
        o.x = -9999;
      }
      for (const p of piples) {
        if (p.collected) continue;
        const dx = p.x - (player.x + player.w / 2);
        const dy = p.y - (player.y + player.h / 2);
        if (dx * dx + dy * dy < (p.r + 28) ** 2) {
          p.collected = true;
          piplets++;
          score += 25;
          energy = Math.min(100, energy + 25);
          audio.pip();
          audio.eat();
          popups.push({ text: "+25 ENERGY", life: 0, max: 1.2 });
          addParticle(p.x, p.y, "rgba(120,255,200,0.95)", 10, 100);
        }
      }
      for (const p of pods) {
        if (p.collected) continue;
        const dx = p.x - (player.x + player.w / 2);
        const dy = p.y - (player.y + player.h / 2);
        if (dx * dx + dy * dy < (p.r + 32) ** 2) {
          p.collected = true;
          score += 200;
          audio.pod();
          transformPlayer();
          addParticle(p.x, p.y, "rgba(255,220,120,1)", 40, 220);
        }
      }

      // Cleanup
      for (let i = obstacles.length - 1; i >= 0; i--) if (obstacles[i].x + obstacles[i].w < -50) obstacles.splice(i, 1);
      for (let i = piples.length - 1; i >= 0; i--) if (piples[i].x < -50 || piples[i].collected) piples.splice(i, 1);
      for (let i = pods.length - 1; i >= 0; i--) if (pods[i].x < -50 || pods[i].collected) pods.splice(i, 1);

      // Wolves — more threatening at higher speed
      const speedPressure = Math.min(80, (speedMul - 1) * 90);
      const baseTarget = energy < 25 ? 70 : energy < 50 ? 130 : 220 - Math.min(80, distance / 100);
      const targetDist = Math.max(55, baseTarget - speedPressure);
      const targetEat = player.eating ? targetDist - 90 : targetDist;
      wolfDist += (targetEat - wolfDist) * Math.min(1, dt * 0.6);
      if (wolfDist < 45) wolfDist = 45;
      for (let i = 0; i < wolves.length; i++) {
        const w = wolves[i];
        w.x = player.x - wolfDist - i * 35;
        w.y = groundY() - 50 + Math.sin(performance.now() / 200 + w.phase) * 3;
      }
      if (Math.random() < dt * (0.35 + (1 - energy / 100) * 1.6 + (speedMul - 1) * 0.6)) audio.wolf();

      // Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 200 * dt;
        if (p.life >= p.max) particles.splice(i, 1);
      }
      for (const a of ambient) {
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        if (a.x < -10) { a.x = W + 10; a.y = Math.random() * H * 0.7; }
      }
      for (let i = popups.length - 1; i >= 0; i--) {
        popups[i].life += dt;
        if (popups[i].life >= popups[i].max) popups.splice(i, 1);
      }

      if (shake > 0) shake = Math.max(0, shake - dt * 40);

      // Game over: energy 0 OR wolves catch up
      if (energy <= 0 || wolves[0].x + 50 >= player.x) {
        gameOver();
      }
    }

    function draw() {
      const sx = (Math.random() - 0.5) * shake;
      const sy = (Math.random() - 0.5) * shake;
      ctx.save();
      ctx.translate(sx, sy);

      // Sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#1a0d3a");
      sky.addColorStop(0.4, "#2d1b5e");
      sky.addColorStop(0.7, "#5b3a7a");
      sky.addColorStop(1, "#7a4a6d");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Moon
      const moonX = W * 0.78, moonY = H * 0.22;
      const moonGlow = ctx.createRadialGradient(moonX, moonY, 10, moonX, moonY, 180);
      moonGlow.addColorStop(0, "rgba(255, 240, 200, 0.6)");
      moonGlow.addColorStop(1, "rgba(255, 240, 200, 0)");
      ctx.fillStyle = moonGlow;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#fff5d6";
      ctx.beginPath(); ctx.arc(moonX, moonY, 42, 0, Math.PI * 2); ctx.fill();

      // Stars
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      for (let i = 0; i < 60; i++) {
        const x = (i * 137 + bgScroll * 0.3) % W;
        const y = (i * 53) % (H * 0.5);
        ctx.fillRect(x, y, 1.5, 1.5);
      }

      // Far mountains (parallax 1)
      drawMountains(-bgScroll * 0.3, H - 200, "#2a1b4a", 120);
      drawMountains(-mid1Scroll, H - 160, "#3a2560", 90);
      drawMountains(-mid2Scroll * 0.7, H - 130, "#4d3175", 70);

      // Ambient particles
      for (const a of ambient) {
        ctx.fillStyle = a.color;
        ctx.fillRect(a.x, a.y, a.size, a.size);
      }

      // Ground
      const groundGrad = ctx.createLinearGradient(0, groundY(), 0, H);
      groundGrad.addColorStop(0, "#3d2545");
      groundGrad.addColorStop(1, "#1a0e2a");
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, groundY(), W, H - groundY());
      // Ground line
      ctx.strokeStyle = "rgba(255, 200, 120, 0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY());
      ctx.lineTo(W, groundY());
      ctx.stroke();
      // Ground tiles
      ctx.fillStyle = "rgba(255,200,120,0.15)";
      for (let x = -groundScroll; x < W; x += 80) {
        ctx.fillRect(x, groundY() + 10, 60, 2);
      }

      // Wolves
      for (let i = 0; i < wolves.length; i++) {
        drawWolf(wolves[i].x, wolves[i].y, i);
      }

      // Obstacles
      for (const o of obstacles) drawObstacle(o);

      // Piplets
      for (const p of piples) drawPiplet(p);
      // Pods
      for (const p of pods) drawPod(p);

      // Particles
      for (const p of particles) {
        const a = 1 - p.life / p.max;
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Player
      drawPlayer();

      // Speed lines — sit above world, below UI
      const sm = speed / BASE_SPEED;
      if (sm > 1.05) {
        const lineAlpha = Math.min(0.6, (sm - 1) * 0.7);
        ctx.strokeStyle = `rgba(255, 240, 200, ${lineAlpha})`;
        ctx.lineCap = "round";
        for (const s of streaks) {
          ctx.lineWidth = s.w;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x + s.len, s.y);
          ctx.stroke();
        }
        // Edge motion-blur tint
        const blur = ctx.createLinearGradient(0, 0, W * 0.25, 0);
        blur.addColorStop(0, `rgba(255, 220, 180, ${0.18 * (sm - 1)})`);
        blur.addColorStop(1, "rgba(255, 220, 180, 0)");
        ctx.fillStyle = blur;
        ctx.fillRect(0, 0, W * 0.25, H);
        const blur2 = ctx.createLinearGradient(W * 0.75, 0, W, 0);
        blur2.addColorStop(0, "rgba(40, 20, 50, 0)");
        blur2.addColorStop(1, `rgba(40, 20, 50, ${0.25 * (sm - 1)})`);
        ctx.fillStyle = blur2;
        ctx.fillRect(W * 0.75, 0, W * 0.25, H);
      }

      // Eat progress bar
      if (player.eating) {
        const bw = 80, bh = 8;
        const bx = player.x - 12, by = player.y - 22;
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = "#7fffb5";
        ctx.fillRect(bx, by, bw * (player.eatProgress / player.eatDuration), bh);
        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.strokeRect(bx, by, bw, bh);
      }

      // Vignette
      const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.8);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.55)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);

      // Popups
      ctx.textAlign = "center";
      ctx.font = "bold 20px ui-sans-serif, system-ui";
      for (let i = 0; i < popups.length; i++) {
        const p = popups[i];
        const a = 1 - p.life / p.max;
        const y = H * 0.3 - p.life * 30 - i * 30;
        ctx.globalAlpha = a;
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillText(p.text, W / 2 + 2, y + 2);
        ctx.fillStyle = "#ffe0a3";
        ctx.fillText(p.text, W / 2, y);
      }
      ctx.globalAlpha = 1;

      ctx.restore();
    }

    function drawMountains(offset: number, baseY: number, color: string, h: number) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, baseY);
      const step = 120;
      for (let x = -step + (offset % step); x <= W + step; x += step) {
        const peak = baseY - h - Math.sin(x * 0.01) * 30;
        ctx.lineTo(x + step / 2, peak);
        ctx.lineTo(x + step, baseY);
      }
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
      ctx.fill();
    }

    function drawWolf(x: number, y: number, i: number) {
      ctx.save();
      const t = performance.now() / 1000;
      // Smoke trail
      for (let k = 0; k < 3; k++) {
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = "#1a0e2a";
        ctx.beginPath();
        ctx.arc(x - 10 - k * 12, y + 10 + Math.sin(t * 4 + k) * 3, 12 + k * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // Body
      const bob = Math.sin(t * 12 + i) * 3;
      ctx.fillStyle = "#2a1418";
      ctx.beginPath();
      ctx.ellipse(x + 25, y + 25 + bob, 28, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      // Head
      ctx.beginPath();
      ctx.ellipse(x + 50, y + 18 + bob, 16, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      // Ears
      ctx.beginPath();
      ctx.moveTo(x + 45, y + 6 + bob); ctx.lineTo(x + 50, y - 4 + bob); ctx.lineTo(x + 54, y + 8 + bob);
      ctx.fill();
      // Legs
      const legY = y + 38 + bob;
      for (let l = 0; l < 4; l++) {
        const lx = x + 8 + l * 12;
        const swing = Math.sin(t * 14 + l + i) * 4;
        ctx.fillRect(lx, legY, 4, 14 + swing);
      }
      // Glowing eyes
      const eyeGlow = ctx.createRadialGradient(x + 55, y + 16 + bob, 0, x + 55, y + 16 + bob, 8);
      eyeGlow.addColorStop(0, "rgba(255, 100, 40, 1)");
      eyeGlow.addColorStop(1, "rgba(255, 100, 40, 0)");
      ctx.fillStyle = eyeGlow;
      ctx.fillRect(x + 45, y + 8 + bob, 20, 16);
      ctx.fillStyle = "#ffdd66";
      ctx.fillRect(x + 54, y + 15 + bob, 3, 3);
      ctx.fillRect(x + 58, y + 15 + bob, 3, 3);
      // Fire particles
      for (let f = 0; f < 4; f++) {
        const fx = x + 20 + Math.sin(t * 8 + f) * 15;
        const fy = y + 10 + bob - f * 3 - (t * 30 + f * 10) % 20;
        ctx.fillStyle = `rgba(255, ${120 - f * 20}, 40, ${0.6 - f * 0.12})`;
        ctx.beginPath(); ctx.arc(fx, fy, 4 - f * 0.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    function drawObstacle(o: Obstacle) {
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 4;
      switch (o.type) {
        case "log": {
          ctx.fillStyle = "#5a3a1f";
          ctx.fillRect(o.x, o.y, o.w, o.h);
          ctx.fillStyle = "#8a5a2f";
          ctx.beginPath(); ctx.ellipse(o.x, o.y + o.h / 2, 8, o.h / 2, 0, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(o.x + o.w, o.y + o.h / 2, 8, o.h / 2, 0, 0, Math.PI * 2); ctx.fill();
          break;
        }
        case "rock": {
          ctx.fillStyle = "#4a4458";
          ctx.beginPath();
          ctx.moveTo(o.x, o.y + o.h);
          ctx.lineTo(o.x + 10, o.y + 10);
          ctx.lineTo(o.x + o.w / 2, o.y);
          ctx.lineTo(o.x + o.w - 10, o.y + 8);
          ctx.lineTo(o.x + o.w, o.y + o.h);
          ctx.closePath(); ctx.fill();
          break;
        }
        case "thorn": {
          ctx.fillStyle = "#3a1f2a";
          for (let i = 0; i < 6; i++) {
            const tx = o.x + i * (o.w / 6);
            ctx.beginPath();
            ctx.moveTo(tx, o.y + o.h);
            ctx.lineTo(tx + 6, o.y);
            ctx.lineTo(tx + 12, o.y + o.h);
            ctx.closePath(); ctx.fill();
          }
          break;
        }
        case "cliff": {
          ctx.fillStyle = "#2a1a3a";
          ctx.fillRect(o.x, o.y, o.w, o.h);
          ctx.fillStyle = "#4d3175";
          ctx.fillRect(o.x, o.y, o.w, 6);
          break;
        }
        case "ruin": {
          ctx.fillStyle = "#5a4a6a";
          ctx.fillRect(o.x, o.y + 20, 20, o.h - 20);
          ctx.fillRect(o.x + o.w - 20, o.y + 30, 20, o.h - 30);
          ctx.fillRect(o.x, o.y + 20, o.w, 10);
          break;
        }
        case "crystal": {
          const grad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
          grad.addColorStop(0, "#a0e8ff");
          grad.addColorStop(1, "#4070a0");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(o.x + o.w / 2, o.y);
          ctx.lineTo(o.x + o.w, o.y + o.h / 3);
          ctx.lineTo(o.x + o.w - 5, o.y + o.h);
          ctx.lineTo(o.x + 5, o.y + o.h);
          ctx.lineTo(o.x, o.y + o.h / 3);
          ctx.closePath(); ctx.fill();
          ctx.shadowBlur = 20;
          ctx.shadowColor = "rgba(160, 232, 255, 0.7)";
          ctx.strokeStyle = "rgba(200, 240, 255, 0.6)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
          break;
        }
      }
      ctx.restore();
    }

    function drawPiplet(p: Piplet) {
      const y = p.y + Math.sin(p.bob) * 4;
      const glow = ctx.createRadialGradient(p.x, y, 0, p.x, y, 24);
      glow.addColorStop(0, "rgba(120,255,200,0.7)");
      glow.addColorStop(1, "rgba(120,255,200,0)");
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(p.x, y, 24, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#7fffb5";
      ctx.beginPath(); ctx.arc(p.x, y, p.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.beginPath(); ctx.arc(p.x - 3, y - 3, 3, 0, Math.PI * 2); ctx.fill();
    }
    function drawPod(p: Pod) {
      const y = p.y + Math.sin(p.bob) * 6;
      const t = performance.now() / 1000;
      const pulse = 1 + Math.sin(t * 4) * 0.15;
      // Aura
      const glow = ctx.createRadialGradient(p.x, y, 0, p.x, y, 60 * pulse);
      glow.addColorStop(0, "rgba(255, 220, 120, 0.9)");
      glow.addColorStop(0.5, "rgba(255, 150, 200, 0.4)");
      glow.addColorStop(1, "rgba(255, 150, 200, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(p.x, y, 60 * pulse, 0, Math.PI * 2); ctx.fill();
      // Particles around
      for (let i = 0; i < 6; i++) {
        const a = t * 2 + i * 1.04;
        const r = 30 + Math.sin(t * 3 + i) * 6;
        ctx.fillStyle = "rgba(255, 240, 180, 0.8)";
        ctx.beginPath(); ctx.arc(p.x + Math.cos(a) * r, y + Math.sin(a) * r, 2.5, 0, Math.PI * 2); ctx.fill();
      }
      // Core
      const core = ctx.createRadialGradient(p.x, y, 0, p.x, y, p.r);
      core.addColorStop(0, "#fffbe0");
      core.addColorStop(0.6, "#ffcf6e");
      core.addColorStop(1, "#ff7ab0");
      ctx.fillStyle = core;
      ctx.beginPath(); ctx.arc(p.x, y, p.r * pulse, 0, Math.PI * 2); ctx.fill();
    }

    function drawPlayer() {
      const t = performance.now() / 1000;
      const x = player.x, y = player.y;
      ctx.save();
      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.beginPath();
      ctx.ellipse(x + player.w / 2, groundY() + 4, 24, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Transform flash
      if (player.transformFlash > 0) {
        const a = player.transformFlash / 0.8;
        ctx.fillStyle = `rgba(255, 240, 180, ${a * 0.7})`;
        ctx.beginPath(); ctx.arc(x + player.w / 2, y + player.h / 2, 80 * (1 + (1 - a)), 0, Math.PI * 2); ctx.fill();
      }

      // Hurt tint
      const tint = player.hurtFlash > 0;

      if (player.char === "pookoo") {
        // Pookoo: small lavender creature with big eyes
        const bob = player.onGround && !player.eating ? Math.sin(t * 14) * 2 : 0;
        // Body
        const bodyGrad = ctx.createRadialGradient(x + 28, y + 30 + bob, 5, x + 28, y + 30 + bob, 36);
        bodyGrad.addColorStop(0, tint ? "#ffb0b0" : "#dcb3ff");
        bodyGrad.addColorStop(1, tint ? "#8a3a3a" : "#6a3a9a");
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(x + 28, y + 36 + bob, 26, 28, 0, 0, Math.PI * 2);
        ctx.fill();
        // Ears
        ctx.fillStyle = tint ? "#8a3a3a" : "#7a4aaa";
        ctx.beginPath();
        ctx.ellipse(x + 14, y + 12 + bob, 6, 12, -0.3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 42, y + 12 + bob, 6, 12, 0.3, 0, Math.PI * 2); ctx.fill();
        // Eyes
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(x + 20, y + 28 + bob, 6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 36, y + 28 + bob, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#1a0e2a";
        ctx.beginPath(); ctx.arc(x + 21, y + 29 + bob, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 37, y + 29 + bob, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(x + 22, y + 28 + bob, 1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 38, y + 28 + bob, 1, 0, Math.PI * 2); ctx.fill();
        // Mouth (eating animation)
        if (player.eating) {
          const open = (Math.sin(t * 10) + 1) * 3;
          ctx.fillStyle = "#3a1a4a";
          ctx.beginPath();
          ctx.ellipse(x + 28, y + 42 + bob, 5, open, 0, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.strokeStyle = "#3a1a4a";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(x + 28, y + 40 + bob, 3, 0, Math.PI);
          ctx.stroke();
        }
        // Feet (running)
        ctx.fillStyle = tint ? "#8a3a3a" : "#7a4aaa";
        if (player.onGround && !player.eating) {
          const a = Math.sin(t * 18) * 4;
          ctx.beginPath(); ctx.ellipse(x + 16, y + 62, 6, 4 + Math.abs(a), 0, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(x + 40, y + 62, 6, 4 + Math.abs(-a), 0, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.beginPath(); ctx.ellipse(x + 18, y + 60, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(x + 38, y + 60, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
        }
      } else {
        // Javan: winged, sleeker, golden
        const flap = Math.sin(t * 18) * 0.5;
        // Wings
        ctx.fillStyle = "rgba(255, 220, 140, 0.9)";
        ctx.beginPath();
        ctx.ellipse(x + 14, y + 26, 18, 8, -0.5 + flap, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 42, y + 26, 18, 8, 0.5 - flap, 0, Math.PI * 2); ctx.fill();
        // Body
        const bg = ctx.createRadialGradient(x + 28, y + 32, 5, x + 28, y + 32, 30);
        bg.addColorStop(0, "#fff0c4");
        bg.addColorStop(1, "#d68a3a");
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.ellipse(x + 28, y + 36, 22, 26, 0, 0, Math.PI * 2);
        ctx.fill();
        // Eyes
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(x + 22, y + 28, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 34, y + 28, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#1a0e2a";
        ctx.beginPath(); ctx.arc(x + 23, y + 29, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 35, y + 29, 2.5, 0, Math.PI * 2); ctx.fill();
        // Beak
        ctx.fillStyle = "#c87830";
        ctx.beginPath();
        ctx.moveTo(x + 28, y + 36); ctx.lineTo(x + 24, y + 42); ctx.lineTo(x + 32, y + 42); ctx.closePath(); ctx.fill();
        // Trail when flying
        if (!player.onGround) {
          for (let i = 0; i < 5; i++) {
            ctx.fillStyle = `rgba(255, 220, 140, ${0.4 - i * 0.07})`;
            ctx.beginPath(); ctx.arc(x - i * 6, y + 30 + Math.sin(t * 6 + i) * 3, 6 - i, 0, Math.PI * 2); ctx.fill();
          }
        }
      }
      ctx.restore();
    }

    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("touchstart", onTouch);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("mousedown", onMouse);
      canvas.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const restart = () => {
    audio.startMusic();
    startTimeRef.current = Date.now();
    setState("playing");
    // Force a remount by changing key from parent — simpler: reload component
    window.location.reload();
  };

  const energyPct = hud.energy;
  const lowEnergy = energyPct < 25;
  const speedMul = hud.speed;

  const handleSubmit = async () => {
    const v = validateUsername(usernameInput);
    if (!v.ok) { setSubmitError(v.error); return; }
    if (!canSubmit()) { setSubmitError("Please wait a moment before submitting again."); return; }
    setSubmitState("submitting");
    setSubmitError("");
    persistUsername(v.value);
    markSubmitted();
    try {
      await submitScore({
        data: {
          username: v.value,
          score: finalStats.score,
          distance: finalStats.distance,
          survival_time: finalStats.time,
          character: finalStats.character as "pookoo" | "javan",
        },
      });
      setSubmitState("submitted");
    } catch (err) {
      setSubmitState("error");
      setSubmitError(err instanceof Error ? err.message : "Could not submit score.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block touch-none"
        style={{ imageRendering: "auto" }}
      />

      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 p-3 sm:p-5 flex flex-col gap-3 pointer-events-none">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 max-w-xs">
            <div className="flex items-center justify-between mb-1.5 text-xs font-semibold tracking-wider uppercase text-foreground/80">
              <span>Energy</span>
              <span className={lowEnergy ? "text-destructive" : ""}>{Math.floor(energyPct)}%</span>
            </div>
            <div className="h-3 rounded-full bg-card/70 backdrop-blur border border-border overflow-hidden shadow-card">
              <div
                className={`h-full transition-all duration-200 ${lowEnergy ? "animate-pulse" : ""}`}
                style={{
                  width: `${energyPct}%`,
                  background: lowEnergy
                    ? "linear-gradient(90deg, oklch(0.65 0.25 25), oklch(0.78 0.22 40))"
                    : "linear-gradient(90deg, oklch(0.72 0.22 175), oklch(0.78 0.18 65))",
                  boxShadow: lowEnergy
                    ? "0 0 20px oklch(0.65 0.25 25 / 0.7)"
                    : "0 0 12px oklch(0.72 0.22 175 / 0.5)",
                }}
              />
            </div>
            <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-full glass border border-border text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_currentColor]" />
              {hud.char === "pookoo" ? "POOKOO" : "JAVAN"}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="glass rounded-xl border border-border px-4 py-2 shadow-card text-right">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Score</div>
              <div className="text-2xl font-bold text-aurora leading-tight">{hud.score.toLocaleString()}</div>
            </div>
            <div className="flex gap-2 text-xs">
              <div className="glass rounded-lg border border-border px-2.5 py-1">
                <span className="text-muted-foreground">Distance </span>
                <span className="font-semibold">{hud.distance}m</span>
              </div>
              <div className="glass rounded-lg border border-border px-2.5 py-1">
                <span className="text-muted-foreground">Piplets </span>
                <span className="font-semibold text-accent">{hud.piplets}</span>
              </div>
              <div className={`glass rounded-lg border px-2.5 py-1 transition ${speedMul > 1.5 ? "border-primary/70 text-primary" : "border-border"}`}>
                <span className="text-muted-foreground">Speed </span>
                <span className="font-semibold">{speedMul.toFixed(2)}×</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievement toast */}
      {achievementToast && (
        <div className={`absolute top-24 sm:top-28 left-1/2 -translate-x-1/2 z-30 pointer-events-none ${toastExiting ? "animate-fade-out" : "animate-fade-in"}`}>
          <div className="rounded-2xl border border-accent/80 bg-background/95 backdrop-blur-md px-5 py-3 shadow-card flex items-center gap-3 glow-accent">
            <div className="text-3xl text-aurora">{achievementToast.icon}</div>
            <div className="text-left">
              <div className="text-[10px] uppercase tracking-widest text-accent">Achievement unlocked</div>
              <div className="font-bold leading-tight text-foreground">{achievementToast.name}</div>
              <div className="text-xs text-foreground/80">{achievementToast.description}</div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-3 right-3 sm:bottom-5 sm:right-5 flex gap-2 z-20">
        <button
          onClick={() => setShowVol((v) => !v)}
          className="glass rounded-lg border border-border px-3 py-2 text-sm hover:bg-card transition pointer-events-auto"
          aria-label="Audio"
        >
          🔊
        </button>
        <button
          onClick={() => setState((s) => (s === "playing" ? "paused" : s === "paused" ? "playing" : s))}
          className="glass rounded-lg border border-border px-3 py-2 text-sm hover:bg-card transition pointer-events-auto"
          aria-label="Pause"
        >
          {state === "paused" ? "▶" : "II"}
        </button>
      </div>

      {showVol && (
        <div className="absolute bottom-16 right-3 sm:bottom-20 sm:right-5 glass rounded-xl border border-border p-4 w-56 shadow-card z-20">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Music</div>
          <input type="range" min={0} max={1} step={0.05} value={musicVol}
            onChange={(e) => setMusicVol(parseFloat(e.target.value))}
            className="w-full accent-primary" />
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 mt-3">Effects</div>
          <input type="range" min={0} max={1} step={0.05} value={sfxVol}
            onChange={(e) => setSfxVol(parseFloat(e.target.value))}
            className="w-full accent-primary" />
        </div>
      )}

      {/* Mobile hint */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 glass rounded-full border border-border px-4 py-1.5 text-xs text-muted-foreground pointer-events-none">
        <span className="hidden sm:inline">Space / ↑ Jump · P Pause</span>
        <span className="sm:hidden">Tap to Jump</span>
      </div>

      {/* Pause overlay */}
      {state === "paused" && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="glass rounded-2xl border border-border p-8 text-center shadow-card max-w-sm">
            <h2 className="text-3xl font-bold text-aurora mb-2">Paused</h2>
            <p className="text-muted-foreground mb-6">Catch your breath. The wolves are too.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setState("playing")}
                className="px-5 py-2.5 rounded-lg bg-ember text-primary-foreground font-semibold hover:opacity-90 transition glow-primary"
              >Resume</button>
              <button
                onClick={onExit}
                className="px-5 py-2.5 rounded-lg border border-border hover:bg-card transition"
              >Quit</button>
            </div>
          </div>
        </div>
      )}

      {/* Game over */}
      {state === "gameover" && (
        <div className="absolute inset-0 bg-background/90 backdrop-blur-md flex items-center justify-center z-20 animate-fade-in">
          <div className="glass rounded-2xl border border-border p-6 sm:p-8 text-center shadow-card max-w-md w-[94%] max-h-[92vh] overflow-y-auto">
            <div className="text-xs uppercase tracking-[0.3em] text-destructive mb-2">The wolves caught you</div>
            <h2 className="text-5xl font-bold text-aurora mb-5">Game Over</h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="p-3 rounded-xl bg-card/60 border border-border">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Score</div>
                <div className="text-xl font-bold text-aurora">{finalStats.score.toLocaleString()}</div>
              </div>
              <div className="p-3 rounded-xl bg-card/60 border border-border">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Distance</div>
                <div className="text-xl font-bold">{finalStats.distance}m</div>
              </div>
              <div className="p-3 rounded-xl bg-card/60 border border-border">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Time</div>
                <div className="text-xl font-bold">{finalStats.time}s</div>
              </div>
              <div className="p-3 rounded-xl bg-card/60 border border-border">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Character</div>
                <div className="text-xl font-bold capitalize">{finalStats.character}</div>
              </div>
            </div>

            {/* Submission */}
            {submitState !== "submitted" && submitState !== "skipped" && (
              <div className="text-left mb-5 p-4 rounded-xl border border-border bg-card/40">
                <div className="text-xs uppercase tracking-widest text-accent mb-2 text-center">Submit to Leaderboard</div>
                <label className="text-xs text-muted-foreground" htmlFor="username-input">Username (3–20 chars)</label>
                <input
                  id="username-input"
                  type="text"
                  value={usernameInput}
                  onChange={(e) => { setUsernameInput(e.target.value); setSubmitError(""); }}
                  maxLength={20}
                  placeholder="Your name"
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary outline-none text-sm"
                />
                {submitError && <div className="mt-2 text-xs text-destructive">{submitError}</div>}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleSubmit}
                    disabled={submitState === "submitting"}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-ember text-primary-foreground font-semibold text-sm hover:opacity-90 transition disabled:opacity-60 glow-primary"
                  >
                    {submitState === "submitting" ? "Saving…" : "Save Score"}
                  </button>
                  <button
                    onClick={() => setSubmitState("skipped")}
                    className="px-4 py-2.5 rounded-lg border border-border text-sm hover:bg-card transition"
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}
            {submitState === "submitted" && (
              <div className="mb-5 p-3 rounded-xl border border-accent/60 bg-accent/10 text-sm text-accent">
                ✓ Score saved. <a href="/leaderboard" className="underline">View leaderboard</a>
              </div>
            )}

            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={restart}
                className="px-6 py-3 rounded-lg bg-ember text-primary-foreground font-semibold hover:opacity-90 transition glow-primary"
              >Play Again</button>
              <button
                onClick={onExit}
                className="px-6 py-3 rounded-lg border border-border hover:bg-card transition font-semibold"
              >Return Home</button>
              <a
                href="/leaderboard"
                className="px-6 py-3 rounded-lg border border-border hover:bg-card transition font-semibold"
              >Leaderboard</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}