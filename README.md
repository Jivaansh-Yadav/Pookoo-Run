# 🌲✨ Pookoo Run: Run. Survive. Transform. ✨🦊

> _"In a forest where magic hums and danger lurks, only the swift and clever survive."_

---

## 🎮 Play the Magic

Experience the adventure now:
[https://pookoo-run.vercel.app](https://pookoo-run.vercel.app)

*(Or follow the guide below to run it yourself!)*

---

## 📖 The Legend

Deep within the enchanted woods of **Verdantia**, two forms wander:
- **POOKOO**, the quick-footed guardian of the forest floor.
- **JAVAN**, the elusive spirit who rides the wind.

A curse has awakened the **Firewolves**, blazing predators that chase any who dare to run. To survive, you must:
- **Run** endlessly through shifting terrain.
- **Collect** glowing **Piplets** to replenish your spirit.
- **Find** the rare **Glowing Pods** that let you swap between POOKOO and JAVAN.
- **Outrun** the wolves—your energy wanes, and they grow fiercer.

Will you become a legend whispered among the trees, or will the forest claim another soul?

---

## 🌟 Key Features

| Feature | Description |
|---------|-------------|
| **Dual Forms** | Switch between POOKOO (ground) and JAVAN (flight) with magical pods. |
| **Procedural Magic** | Ever-changing forest, auroras, floating embers, and dynamic lighting. |
| **Chase Mechanic** | Firewolves pursue relentlessly—lower energy makes them faster! |
| **Collectibles** | Piplets (instant energy) & Glowing Pods (transformation). |
| **Leaderboard** | Compete for the highest scores across realms. |
| **Achievement System** | Unlock titles like “Forest Dweller” and “Balance Master”. |
| **Mobile‑Friendly** | Tap to jump/flap; responsive UI for all devices. |
| **Pixel‑Perfect Audio** | Procedural sound effects & adaptive music—no external assets needed. |
| **Open Source** | MIT licensed; dive into the code and remix the magic. |

---

## 🛠️ Tech Stack

- **[TanStack Start](https://tanstack.com/start)** – Full‑stack React framework (powered by Vite & Nitro).
- **[React 19](https://react.dev/)** + **[TanStack Router](https://tanstack.com/router)** – Type‑safe routing.
- **[Tailwind CSS](https://tailwindcss.com)** – Utility‑first styling with custom animations.
- **[Radix UI](https://www.radix-ui.com/)** – Accessible UI primitives.
- **[TanStack Query](https://tanstack.com/query)** – Server state & caching.
- **[Neon](https://neon.tech)** – Serverless PostgreSQL for leaderboards (optional; can use local fallback).
- **[Vite](https://vitejs.dev)** – Lightning‑fast dev server & HMR.
- **TypeScript** – End‑to‑end type safety.
- **Procedural Audio** – Built‑in synth engine (no audio files required).

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (≥18)
- **pnpm** (recommended) or npm/yarn
- A **Neon** account (for the live leaderboard) – *optional for local play*

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Jivaansh-Yadav/pookoo-run.git
cd pookoo-run
```

### 2️⃣ Install Dependencies
```bash
npm install   # or pnpm install
```

### 3️⃣ Set Up Environment Variables
Create a `.env` file in the project root:
```env
# Neon Database Connection (leave blank for local-only mode)
DATABASE_URL="postgresql://user:password@host.dbname.neon.tech/dbname?sslmode=require"

# Optional: App name shown in tabs
VITE_APP_NAME="Pookoo Run"
```

### 4️⃣ Run the Development Server
```bash
npm run dev   # or pnpm dev
```
Open <http://localhost:5173> and start your run!

### 5️⃣ Build for Production
```bash
npm run build   # or pnpm nuild
```

---

## 🎮 How to Play

### Controls
- **Desktop**: Press **Space** or **Up Arrow** to jump (POOKOO) / flap (JAVAN).
- **Mobile**: Tap anywhere on the screen to jump/flap.
- **Pause**: Press **P** or click the pause button (appears after starting).

### Gameplay Flow
1. Your character runs forward automatically.
2. Avoid obstacles (logs, rocks, thorns, ruins, crystals, cliffs).
3. Collect **green Piplets** to instantly restore energy.
4. Grab the rare **purple Glowing Pods** to transform:
   - **POOKOO** → **JAVAN** (fly above obstacles, but flight drains energy faster).
   - **JAVAN** → **POOKOO** (ground runner, efficient on flat terrain).
5. Watch the **Firewolves** in the distance—low energy makes them sprint faster!
6. Survive as long as possible to earn a high score.

### Scoring
- **Distance** (meters traveled)
- **Survival Time** (seconds)
- **Bonuses** for each transformation and Piplet collected

_Higher score = higher rank on the leaderboard!_

---

## 🏆 Leaderboard & Achievements

The leaderboard stores the top 100 runners worldwide.
Your personal stats, achievements, and favorite character are saved **locally** (in `localStorage`) so you can track progress even offline.

### Achievement List
| Achievement | Requirement | Title |
|-------------|-------------|-------|
| **First Steps** | Finish your first run | “Novice Runner” |
| **Piplet Collector** | Gather 50 Piplets | “Fruit Gatherer” |
| **Transformer** | Transform 20 times | “Shape Shifter” |
| **Sky Runner** | Fly 1,000 m total | “Winged Wanderer” |
| **Wolf Evader** | Survive 5 min without dying | “Forest Dweller” |
| **Century Runner** | Reach 10,000 m distance | “Legendary Strider” |
| **Eternal Flame** | Survive 10 minutes | “Immortal Runner” |
| **Master of Forms** | Equal time as POOKOO & JAVAN | “Balance Master” |

---

## 🧩 Game Mechanics (For the Curious)

- **Energy System** – Starts at 100, drains over time; refilled by Piplets.
- **Wolf Speed** – Base speed increases with time; inversely proportional to your remaining energy.
- **Transformation Cooldown** – None! Collect a pod to instantly swap forms.
- **Obstacle Types**
  - **Log / Rock / Thorn** – Jump over (POOKOO) or fly under (JAVAN).
  - **Cliff** – Must jump (POOKOO) or fly off the edge (JAVAN).
  - **Ruin / Crystal** – Static hazards; touch = game over.
- **Procedural Generation** – Tiles are spawned ahead with balanced difficulty; the world loops seamlessly.
- **Audio** – All sound effects and music are generated in‑real‑time using the Web Audio API (see `src/components/PookooGame.tsx`).

---

## 🤝 Contributing

We welcome contributions to make the forest even more magical!

### How to Contribute
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/YourIdea`).
3. Make your changes (keep the code tidy).
4. Test locally (`npm run dev`).
5. Push and open a Pull Request.

### Guidelines
- Keep game logic modular and well‑commented.
- Ensure new features work on both desktop and mobile.
- Respect the existing style (run `pnpm lint` before committing).
- Update the README if you add major features or change the workflow.

### Reporting Issues
Please use the GitHub issue template (or just open a new issue) with:
- A clear description.
- Steps to reproduce (if applicable).
- Screenshots or screen recordings (helpful!).

---

## 📜 License

This project is licensed under the **GNU GPL v3.0 License** – see the [LICENSE](LICENSE) file for details.

---

## 💖 Made with Love for the Love

Created by **Jivaansh Yadav** as a tribute to the endless runner genre and the wonder of enchanted forests.
Special thanks to the open‑source libraries that power this adventure.

> _“May your runs be long, your transformations timely, and your leaderboard rank ever‑rising.”_

---
<div align="center">
  <sup>Built with ❤️ using TanStack Start, React, Tailwind, and a sprinkle of forest magic.</sup>
</div>
