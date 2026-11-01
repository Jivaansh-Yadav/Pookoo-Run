<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:03130a,55:0c3b1f,100:22c55e&height=235&section=header&text=Pookoo%20Run&fontSize=46&fontColor=ecfdf3&fontAlignY=40&desc=Run%20from%20the%20wolves%20until%20your%20energy%20says%20otherwise&descSize=17&descAlignY=62&animation=twinkling" alt="Pookoo Run" width="100%">

<img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=500&size=19&duration=3200&pause=900&color=4ade80&center=true&vCenter=true&width=680&lines=One%20canvas%2C%20no%20sprites%2C%20no%20audio%20files;Pods%20flip%20you%20between%20POOKOO%20and%20JAVAN;The%20wolves%20close%20in%20as%20your%20energy%20drops" alt="Typing animation" />

<br />

<img src="https://img.shields.io/badge/Engine-Canvas%202D-4ade80?style=flat-square&labelColor=03130a" alt="Canvas 2D" />
<img src="https://img.shields.io/badge/Audio-WebAudio%2C%20procedural-22c55e?style=flat-square&labelColor=03130a" alt="Procedural WebAudio" />
<img src="https://img.shields.io/badge/Assets-0%20files-16a34a?style=flat-square&labelColor=03130a" alt="Zero asset files" />
<img src="https://img.shields.io/badge/Achievements-8-4ade80?style=flat-square&labelColor=03130a" alt="8 achievements" />
<img src="https://img.shields.io/badge/Leaderboard-server%20function-86efac?style=flat-square&labelColor=03130a" alt="Server function leaderboard" />

</div>

<br />

<div align="center">

<sub>A one-file endless runner: <b>1,297 lines</b> of a single React component, a canvas, and a hand-written audio engine. No sprite sheets, no sound files, no game framework.</sub>

</div>

---

<div align="center">

## What it is

</div>

You are running through a procedural forest with a pack of wolves behind you. There is one button — hold to jump, release to fall — and one resource: **energy**, which drains every second, drains faster the further you get, and is the only thing standing between you and the wolves. Collect **piplets** to refill it. Grab a **pod** to transform.

The transformation is the hook. **POOKOO** runs low and fast; **JAVAN** takes the pods' gift and changes how you move, how you read the ground, and what the HUD tells you. Same run, different feel — and you cannot choose it, you have to catch it mid-run.

<div align="center">

<sub>Tap or hold to jump, on touch or mouse. On a phone held upright the game asks you to rotate rather than rendering a squeezed canvas.</sub>

</div>

---

<div align="center">

## The loop

</div>

<ol>
<li><b>Run.</b> The world scrolls, speed ramps, and six obstacle types — log, rock, thorn, cliff, ruin, crystal — arrive in combinations that punish a fixed rhythm.</li>
<li><b>Manage energy.</b> It drains at <code>5 + min(10, distance / 500)</code> per second, so a cautious slow run dies and a fast one dies faster. Piplets refill it; there is no other source.</li>
<li><b>Get chased.</b> The wolves sit a distance behind you that is a function of your energy: full energy and they are 220 px back, near zero and they are 70. Eating a piplet pulls them back hard.</li>
<li><b>Transform.</b> Catch a pod to switch forms. Each transformation is counted, announced, and one of them has an achievement waiting on it.</li>
<li><b>Die, then read the numbers.</b> Score, distance, piplets, top speed — then a personal-best comparison and any achievements that just unlocked.</li>
<li><b>Submit.</b> The run goes to a server-backed leaderboard, throttled so a bad connection cannot spam it.</li>
</ol>

<div align="center">

## What is inside

</div>

<ul>
<li><b>One canvas, device-pixel-ratio aware</b> — the buffer is <code>clientWidth × dpr</code>, so the art is sharp on a phone without shipping two sets of assets.</li>
<li><b>Difficulty as a curve, not a step</b> — speed grows <code>+9/s</code> up to <b>3× base</b>, and the wolf distance tightens with both distance and speed multiplier.</li>
<li><b>Procedural music</b> — a seven-note scale, a random note every 480 ms, a bass note every other step, all through <code>OscillatorNode</code> + gain envelopes.</li>
<li><b>Procedural SFX</b> — jump, pip, transform, wolf, death: short oscillator blips and bandpassed noise bursts. Separate music and SFX gain nodes.</li>
<li><b>Eight achievements</b> — first run, first transformation, 1,000 / 5,000 / 10,000 score, 60-second survival, and two that reward distance.</li>
<li><b>Persistent stats</b> — personal best, total runs, highest distance, runs per form, total transformations, all in <code>localStorage</code> under a <code>pookoo:</code> prefix.</li>
<li><b>Username, kept local</b> — set once, used for the leaderboard, editable, validated.</li>
<li><b>Rotate prompt</b> — recognises a portrait phone and asks for landscape instead of letterboxing the play area into uselessness.</li>
<li><b>Error capture</b> — client errors report to a server route; nothing else phones home.</li>
</ul>

---

<div align="center">

## Stack

</div>

<ul>
<li><b>TanStack Start + React 19</b> — the game is one client component; the shell, routing and the leaderboard's server function come from the framework.</li>
<li><b>Canvas 2D</b> — <code>requestAnimationFrame</code> with a delta-time loop; no engine, no physics library.</li>
<li><b>WebAudio API</b> — the entire soundtrack, generated at runtime.</li>
<li><b>Neon Postgres</b> — leaderboard rows, reached only through a server function.</li>
<li><b>Tailwind CSS</b> — the surrounding UI; the game itself draws everything.</li>
</ul>

<div align="center">

<img src="https://skillicons.dev/icons?i=react,ts,tailwind,postgres,vercel,git" alt="React, TypeScript, Tailwind, Postgres, Vercel, Git" />

</div>

---

<div align="center">

## Under the hood

</div>

<details>
<summary><b>The chase is a formula, not an AI</b></summary>

<br />

<p>The wolves are never simulated — they are placed, every frame, at a distance derived from how badly you are doing:</p>

<pre><code>const speedPressure = Math.min(80, (speedMul - 1) * 90);
const baseTarget = energy &lt; 25 ? 70 : energy &lt; 50 ? 130 : 220 - Math.min(80, distance / 100);
const targetDist = Math.max(55, baseTarget - speedPressure);
const targetEat  = player.eating ? targetDist - 90 : targetDist;
wolfDist += (targetEat - wolfDist) * Math.min(1, dt * 0.6);   // eased, not snapped
if (wolfDist &lt; 45) wolfDist = 45;                             // they never actually reach you</code></pre>

<p>Three things fall out of this. Tension rises exactly when energy is low, with no separate "danger" state to maintain. The eased lerp means the pack glides rather than teleporting when you eat. And the hard floor at 45 px is why death is always <i>energy</i>, never a bite — the wolves are a warning that reads instantly, not a hazard to collide with.</p>

</details>

<details>
<summary><b>Energy is the whole design</b></summary>

<br />

<p>There is no health bar and no lives. Energy is simultaneously the timer, the difficulty and the reward loop:</p>

<ul>
<li><b>Drain</b> — <code>5 + min(10, distance / 500)</code> per second: a run cannot be survived by standing still, and cannot be extended by going slowly.</li>
<li><b>Refill</b> — a piplet now restores energy <b>instantly</b> on pickup rather than being chewed over time. That change is visible in a comment in the source and it is the reason the game got better: eating was a moment of vulnerability, and vulnerability in a runner is only fun if it is a choice.</li>
<li><b>Death</b> — reaching zero ends the run. That is the only fail state.</li>
</ul>

<p>Because score tracks distance and distance tracks speed, every decision — jump now or later, chase that piplet or skip it — is a bet on energy against time.</p>

</details>

<details>
<summary><b>Procedural music in thirty lines</b></summary>

<br />

<p>No audio files ship with this repository. The music is a generator:</p>

<pre><code>const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33];
const note = scale[Math.floor(Math.random() * scale.length)] / 2;
// triangle osc, gain 0 -&gt; 0.12 over 50 ms, -&gt; 0.001 over 0.9 s
// plus a sine an octave down on every other step
setInterval(play, 480);</code></pre>

<p>Random notes from one scale cannot clash, an octave-down bass every other step supplies a pulse, and short exponential decays prevent overlap from turning into mud. <code>musicGain</code> (0.35) and <code>sfxGain</code> (0.6) are separate nodes, so the soundtrack can sit under the sound effects without a mixer.</p>

<p>SFX are the same technique with intent: a triangle blip for a pip, a two-note rise for a transformation, and a sawtooth at 110 Hz plus bandpassed noise for the wolf.</p>

</details>

<details>
<summary><b>Why it is one file</b></summary>

<br />

<p><code>PookooGame.tsx</code> holds the audio engine, the spawner, the update loop, the renderer, the HUD and the end screen. That is normally a smell; here it was the correct call, because the game state is a set of <code>let</code>s inside one animation loop and splitting them across modules would mean either a state library or a ref-passing ceremony for every array.</p>

<p>The boundary that <i>was</i> kept is the one that matters: <code>playerStats.ts</code> owns persistence and achievements, so nothing about saving a run lives inside the render loop.</p>

</details>

---

<div align="center">

## Project structure

</div>

<pre><code>Pookoo-Run/
├── src/components/
│   ├── PookooGame.tsx        # audio engine · spawner · loop · renderer · HUD (1,297 lines)
│   └── RotateDevicePrompt.tsx
├── src/lib/
│   ├── playerStats.ts        # pookoo:username / stats / achievements / daily / lastSubmit
│   ├── leaderboard.functions.ts
│   └── error-capture.ts
└── src/routes/               # index · leaderboard · root</code></pre>

---

<div align="center">

## Run it

</div>

<pre><code>git clone https://github.com/Jivaansh-Yadav/Pookoo-Run.git
cd Pookoo-Run
bun install
bun run dev</code></pre>

<p>Playable with no configuration — the run, the stats and the achievements are all local. The leaderboard needs <code>DATABASE_URL</code>; without it the game still plays and the leaderboard page reports that it is unavailable.</p>

<div align="center">

<sub>Sound starts on the first input, because browsers require a gesture. If the forest is silent, that is why.</sub>

</div>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:03130a,55:0c3b1f,100:22c55e&height=110&section=footer&reversal=true" alt="" width="100%">
