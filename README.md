# Personal Dashboard

A modular personal dashboard built for long-term growth. Every feature is a self-contained widget that can be added, removed, moved, and resized independently.

## Stack

| Layer | Technology |
|-------|------------|
| UI | React 19, TypeScript, Vite |
| Styling | Tailwind CSS v4, shadcn/ui |
| Layout | react-grid-layout (drag, resize, responsive breakpoints) |
| State | Zustand (layout persistence via localStorage) |
| Backend | Supabase (client configured, not yet wired) |
| Mobile | Capacitor (iOS / Android shell) |

## Architecture

```
src/
├── components/
│   ├── dashboard/     # Widget grid shell (WidgetGrid, WidgetWrapper)
│   ├── layout/        # App shell (Sidebar, TopNav, AppShell)
│   └── ui/            # shadcn/ui primitives
├── lib/               # Utilities (cn, Supabase client)
├── pages/             # Route-level pages
├── stores/            # Zustand stores (dashboard layout state)
└── widgets/           # Self-contained widget modules
    ├── registry.ts    # Central widget registry
    ├── types.ts       # Widget interfaces
    ├── weather/
    ├── calendar/
    └── notes/
```

### Widget system

Each widget is a folder exporting a `WidgetDefinition`:

- **type** — unique identifier
- **title / description / icon** — metadata for UI
- **defaultLayout** — grid position and size defaults
- **component** — React component receiving `{ instanceId }`

To add a new widget:

1. Create `src/widgets/my-widget/` with component + index
2. Register it in `src/widgets/registry.ts`
3. Done — it appears in "Add widget" and can be placed on the grid

### Dashboard state

`useDashboardStore` (Zustand + persist) holds:

- **instances** — which widget types are on the dashboard
- **layouts** — per-breakpoint grid positions (lg/md/sm/xs/xxs)

Layout changes from drag/resize are saved to localStorage automatically. Supabase sync can be layered on later.

## Getting started

```bash
# Install dependencies
npm install

# Copy env template and add Supabase credentials (optional for now)
cp .env.example .env.local

# Start dev server
npm run dev
```

## Capacitor (mobile)

```bash
# Build web assets and sync to native projects
npm run cap:sync

# Open native IDE (after adding platforms)
npx cap add ios
npx cap add android
npm run cap:open:ios
npm run cap:open:android
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run cap:sync` | Build + sync to Capacitor |
| `npm run lint` | Run oxlint |

## Current widgets (placeholders)

- **Weather** — static conditions display
- **Calendar** — sample event list
- **Notes** — sample note list

These are intentionally minimal. Real data will come from Supabase and external APIs in future iterations.
