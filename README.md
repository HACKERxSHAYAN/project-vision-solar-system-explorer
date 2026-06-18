# 🛰️ Solar System Explorer v2.0
### Heliocentric Visualization Platform & Aerospace Telemetry Interface

An immersive, real-time 3D simulation engine built using React, Three.js (React Three Fiber), and GSAP. This platform provides a cinematic, high-fidelity visualization of heliocentric orbits, planetary telemetry, and celestial dynamics with a pixel-perfect premium aerospace HUD.

---

## 🌌 Key Architectural Features

### 1. Continuous Dynamic Tracking Matrix (`Scene.tsx` & `Planet.tsx`)
* **Frame-Locked Tethering:** Eliminates orbital drift using a high-frequency rendering loop. The tracking camera captures the planetary mesh world coordinates (`getWorldPosition`) every individual frame inside a unified `useFrame` hook.
* **Dynamic Orbit Anchor:** Overrides traditional static target points by binding `controls.target` to moving vectors in real-time, correcting camera mouse orbit mechanics natively while bodies are in high-velocity transit.

### 2. Synchronized Kinematic Flight Vectors
* **Dual-Animation Synchronization:** Powered by concurrent GSAP timelines running identical easing arrays over 2.4-second intervals.
* **Dynamic Matrix Interpolation:** Smooths the sudden velocity changes during camera handoffs by combining strict frame copying with linear interpolation (`lerp(targetCamPos, 0.12)`), preventing viewport alignment failures.

### 3. Premium Glassmorphism Aerospace HUD (`PlanetPanel.tsx` & `HUD.tsx`)
* **Structural Content Isolation:** Built on a unified CSS Flexbox column matrix (`flex flex-col h-full`) capped at `80vh` max-height to ensure strict layout boundaries on high-resolution viewports.
* **Zero-Collision Text Layering:** Separates scrollable textual descriptions from layout-locked UI widgets. Telemetry modules utilize absolute anchor structural conversion (`mt-auto shrink-0`), enabling clean textual scrolling underneath with zero graphical overlap.

---

## 📂 Codebase Directory Mapping

```text
src/
├── components/
│   ├── AsteroidBelt.tsx      # Instanced mesh rendering engine for debris fields
│   ├── HUD.tsx               # Main atmospheric overlay UI & global control telemetry
│   ├── IntroScreen.tsx       # Cinematic boot sequences & pre-loader layout
│   ├── Planet.tsx            # Mesh initialization, materials, and global coordinate caching
│   ├── PlanetPanel.tsx       # Glassmorphism detail engine & telemetry layout matrices
│   ├── PostProcessing.tsx    # Bloom shaders, glare effects, and cosmic color-grading
│   ├── Scene.tsx             # Canvas wrapper, directional lighting systems, and render loop
│   ├── StarField.tsx         # High-density custom particle starfield universe
│   ├── Sun.tsx               # Primary emissive core light source with specialized shaders
│   ├── TelemetryWidget.tsx   # Real-time data graph overlay tracking mechanics
│   └── WelcomeHint.tsx       # Ephemeral onboarding interaction prompts
├── data/                     # Planetary data grids, Keplerian orbital coefficients
├── styles/                   # Core styling parameters
├── utils/                    # Vector math, coordinate translations, and lerp constants
├── App.tsx                   # Core layout container hooking global state to canvas
├── index.css                 # Core Tailwind CSS directives and custom scrollbar structures
└── main.tsx                  # Application bootstrap entry point