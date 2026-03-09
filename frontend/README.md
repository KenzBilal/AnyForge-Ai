# AnyForge Admin Dashboard

A highly performant, responsive, and gorgeous internal Dashboard to visualize project extractions, generate client API keys, and monitor rate limitations.

### Tech Stack
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS (Premium Glassmorphism + Dynamic Colors)
- **Component Primitives**: Lucide React (Icons), Sonner (Toast notifications)
- **Animations**: Framer Motion (Declarative spring animations, presence layouts)
- **Graphs**: Recharts.js (Dynamic line scaling, bar charts)
- **State & Backend**: `@supabase/supabase-js` (Trigger-based key distribution with auth layers)

### Features
- Beautiful layout relying strictly on native CSS Flexbox, absolute positioning and `backdrop-filter` aesthetics rather than flat UI structures.
- View real-time tracking graphs.
- Masked API Key copying.
- Instant optimistic UI reactions to API Key Generation. 

### Local Run
1. Head back to the project root and reference `docs/DEPLOYMENT.md` for explicit environment variable mapping parameters if missing.
2. Initialize module setup:
```bash
npm install
npm run dev
```
