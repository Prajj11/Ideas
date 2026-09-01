# 🌴 Safr (Goa Guide Buddy) — AI Travel Safety Companion

## 📖 Overview

**Safr** is an intelligent, full-stack travel safety companion web application engineered to solve real-world tourism and security challenges across India, currently piloted in Goa. 

Traditional tourism apps only recommend places to visit; **Safr** actively protects travelers by combining **real-time geospatial safety scoring**, **turn-by-turn navigation with 1-tap Google Maps GPS**, **marine beach swell flags**, **crowd density intelligence**, **smart transport mode recommendations**, **automated AI itinerary synthesis**, **Zero-Knowledge family QR safety wristbands**, **live family GPS radar**, and **multi-lingual accessibility** in 12+ Indian languages.

---

## 🌟 Core Application Modules & Features

### 1. 🧭 Safe-Scored Wayfinding & Turn-by-Turn Navigation (`/map`)
* **Safer vs. Fastest OSRM Engine**: Compares routes based on distance, road illumination, ghat hairpin bends, speed hazards, and accident history.
* **Night-Travel Guidance Mode**: Automatically activates between 19:00 and 06:00 to prioritize well-lit coastal roads over unlit highway ghats.
* **Turn-by-Turn Maneuver Drawer**: Step-by-step directions with maneuver icons and interactive Leaflet map pin focus.
* **1-Tap GPS Launch**: Deep-links directly into native Google Maps / Apple Maps turn-by-turn GPS navigation.

### 2. 🌊 Live Goa Weather & Marine Swell Station (`/dashboard`)
* **7-Day Weather Forecast**: Hourly precipitation radar, humidity, wind speeds, and UV index.
* **Drishti Marine Lifeguard Swimming Flags**:
  * 🟢 **Green (Safe)**: Calm sea, recreational swimming allowed in patrol zones.
  * 🟡 **Yellow (Caution)**: Moderate swell, keep children near shore.
  * 🔴 **Red (Danger)**: High tide swell, dangerous rip currents — strictly no swimming.

### 3. 🌴 Place Explorer, Transit Advisor & Bucket List (`/explore`)
* **Visual POI Cards**: Categorized by Vibe (*Beaches*, *Monuments*, *Nightlife*, *Cafes*, *Nature*).
* **AI Crowd Density Gauge**: Real-time crowd meter (*quiet*, *moderate*, *busy*, *packed*) with recommended visiting times and quieter nearby alternatives.
* **Best Mode of Transport Advisor**: Tailored recommendations for Scooters (narrow alleys), 4x4 Jeeps (Dudhsagar safari), Ro-Ro Ferries, or Walking.
* **Saved Places Wishlist (❤️)**: 1-Tap bookmarking persisted to Supabase database.

### 4. ✨ AI Itinerary Planner (`/itinerary`)
* **Dynamic Time-Budgeting**: Generates hour-by-hour schedules based on free hours (1–24h), start times, and travel pace (*Relaxed*, *Balanced*, *Packed*).
* **Sequential Visual Timeline**: Timeline stops with duration badges, meal pairings, and direct "Navigate" buttons.
* **Print & Export Support**: Dedicated print layout for PDF export and offline viewing.

### 5. 🏷️ Zero-Knowledge Family SafeTag Wristbands (`/safety-tags`)
* **Printable Water-Resistant QR Tags**: Printable wristband labels with unique 6-character OTP tokens for kids and elderly family members.
* **Zero-Knowledge Privacy Architecture**: Good Samaritans / finders can scan or visit `/find` to send instant location alerts to guardians without ever viewing guardian phone numbers or hotel locations.

### 6. 📡 Live Family GPS Location Radar (`/live-tracking`)
* **Simulated & Real GPS Satellite Grid**: Real-time coordinates displayed on a high-precision Leaflet map with animated radar sweep.
* **Family Device Telemetry**: Live battery percentage, GPS accuracy badge, last ping time, and 1-tap direct call buttons.

### 7. 🚨 Integrated Goa Emergency 112 Hub (`/emergency`)
* **Single-Touch Dialing**: Direct phone links to Goa Police (100/112), Ambulance (108), Drishti Marine Lifeguards, Tourist Police, and Women's Helpline.

### 8. 🌐 12+ Indian Language Universal Translator
* **Accessibility**: Instant whole-page translation into Hindi, Konkani, Marathi, Bengali, Tamil, Telugu, Kannada, Gujarati, Spanish, French, Russian, and German.

---

## 🎨 UI/UX Design System: "Coastal Cyber-Luxury"

* **Warm Pearl Theme (Light)**: Alabaster pearl backgrounds (`oklch(0.978 0.012 85)`), frosted alabaster cards (`oklch(0.995 0.005 85 / 0.88)`), warm sand borders.
* **Deep Obsidian Theme (Dark)**: Midnight obsidian abyss (`oklch(0.12 0.022 245)`), frosted glass panels (`oklch(0.165 0.026 245 / 0.75)`).
* **Accent Colors**: Electric Cyan (`#00F2FE`), Sunset Coral (`#FF6B4A`), Warm Amber (`#FFA03A`), Neon Emerald (`#10B981`).
* **Editorial Typography**: `Fraunces`, `Plus Jakarta Sans`, and `JetBrains Mono`.
* **Glassmorphism & Micro-animations**: Dual-layer frosted glass, shimmer skeletons, and smooth hover elevation.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, TanStack Router, TanStack Start, Vite |
| **State & Cache** | TanStack Query v5 (`@tanstack/react-query`) |
| **Styling** | TailwindCSS v4 with OKLCH tokens, Lucide React Icons |
| **Mapping & Geospatial** | Leaflet 1.9.4, OpenStreetMap, OSRM Routing Engine, Nominatim |
| **Database & Auth** | Supabase PostgreSQL, Row Level Security (RLS), PL/pgSQL Stored Procedures |
| **AI Intelligence** | Google Gemini 2.5 / Flash AI API (`@google/genai`) |
| **Weather & Marine** | Open-Meteo Weather & Marine Swell API |

---

## 💻 Local Development & Setup

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 2. Clone Repository
```bash
git clone https://github.com/Prajj11/Ideas.git
cd goa-guide-buddy-main
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
GEMINI_API_KEY=your-google-gemini-api-key
```

### 5. Run Type Check & Dev Server
```bash
# Verify TypeScript types
npx tsc --noEmit

# Start Vite development server
npm run dev
```
The application will be live at `http://localhost:5173`.

### 6. Build for Production
```bash
npm run build
npm run preview
```

---

## 📚 Complete Technical Documentation

For the comprehensive 500+ line technical blueprint covering all database schemas, RLS policies, mathematical route scoring algorithms, API contracts, and architecture diagrams, refer to:
👉 **[`information.md`](./information.md)**

---

## 👥 Authors & Credits

* **Development Team**: Team KoS
* **Lead Engineer**: Prajwal ([@Prajj11](https://github.com/Prajj11))
* **Initiative**: Safr (Smart Travel Safety Companion for India)

---

## 📜 License

This project is proprietary and developed for the Safr Smart Tourism Initiative.
