# Greenfield Radar – Technical and Data Reference

## 1. Project Purpose
Greenfield Radar is an interactive geospatial analysis tool used to identify and compare micro-market opportunities for brick-and-mortar businesses (e.g., coffee shops). It combines map-based visualization with configurable scoring so users can evaluate potential storefront locations.

## 2. Application Architecture Overview
- **Client (React + Vite)**
  - `client/src` contains a single-page application built with React 18 and Vite for bundling.
  - UI components utilize Tailwind CSS utility classes alongside a small set of custom components.
  - State is organized with React Context providers (`AppContext`, `MapContext`).
  - Data fetching uses `@tanstack/react-query` for caching, refetching, and loading states.
  - Map visualization is provided by **MapLibre GL JS** (open-source fork of Mapbox GL JS).
- **Server (Express + Vite SSR adapter)**
  - Located under `server/`, an Express server pre-renders routes and proxies API requests.
  - Endpoints encapsulate geospatial logic and call external APIs (notably Overpass).
  - `server/vite.ts` wires the Vite dev server and Express so APIs work in dev/prod.
- **Shared packages**
  - `shared/schema.ts` declares Zod schemas reused between server and client.

## 3. Front-End Technology Stack
| Layer | Technology | Role |
| --- | --- | --- |
| Framework | **React 18** | SPA composition, component lifecycle, hooks |
| Bundler/Dev Server | **Vite** | Fast HMR, build pipeline, SSR hydration |
| Styling | **Tailwind CSS** + custom CSS (`index.css`) | Utility-first layout and styling |
| Component Patterns | Custom UI elements under `client/src/components/ui` using Lucide icons and Radix-inspired patterns | Buttons, toggles, cards, dialog wrappers |
| State Management | React Context (`AppContext`, `MapContext`), React Query | Global app state, async data caching |
| Map Rendering | **MapLibre GL JS** + Mapbox vector tiles (OpenFreemap) | Base map, layers, interactions |
| Data Fetching | `fetch` API, `@tanstack/react-query` | Communicate with internal Express APIs |
| Routing | `react-router-dom` | Handles `/` and `/heatmap-dashboard` routes |
| Charts / Visualization | MapLibre layers (heatmap, circles, labels), custom popups | Visual encode densities, POIs |
| Notifications | `sonner` toast component | User feedback |

## 4. Back-End Technology Stack
| Component | Technology | Purpose |
| --- | --- | --- |
| Web Server | **Express 4** | Serves API endpoints and SSR |
| HTTP Client | **Axios** | Calls external Overpass API |
| Validation | **Zod** | Runtime validation for request payloads |
| Geospatial Toolkit | **@turf/turf** | Hex-grid density calculations, buffers, distance |
| Env/Config | `dotenv` (via `.env`) | Secrets and configuration |
| Build | TypeScript + Vite | Consistent tooling between client/server |

## 5. External Data Sources and Usage
### 5.1 OpenStreetMap via Overpass API
- **Endpoint**: `https://overpass-api.de/api/interpreter` (some fallbacks use `https://overpass.kumi.systems/api/interpreter`).
- **Access Method**: Server-side POST requests with dynamic Overpass QL queries.
- **Why Overpass**: Offers fine-grained OSM queries for POIs around a geographic point without needing a commercial tile/key.
- **Used By**:
  - `POST /api/places-nearby`
    - Inputs: latitude, longitude, categories (array of `key=value`).
    - Output: POIs with id, name, category, lat/lon, raw tags.
    - Client Usage: Coffee shop layer (`CoffeeShopsLayer`), competitor layer (`CompetitorLayer`), `useNearbyPlaces` hook, `useScoreLocation` hook.
  - `POST /api/competitor-density`
    - Inputs: coordinate, categories, radius, cell size.
    - Process: Pulls POIs then generates hexagonal grid metrics (via Turf) for heatmap density overlays.
    - Client Usage: Heatmap tiles (passed into `TileHeatmapLayer`), competitor analytics (score computation).

### 5.2 Custom Reverse Geocoding Endpoint (optional)
- **Endpoint**: `POST /api/address` (implementation may be pending or replaced by environment-specific service).
- **Purpose**: Convert map center coordinates into a human-readable address (was displayed in sidebar).
- **Status**: UI hook exists (`LocationName`), but the block was recently removed from UI to simplify layout.

### 5.3 Internal Derived Datasets
These are built on-the-fly from Overpass responses and stored in client/state:
- **Target Locations (Green pins)**: Derived from category selections (e.g., bakery, cafe). Feed into scoring and map layers.
- **Competitor Locations (Red pins)**: Single-category selection representing competing POIs.
- **Heatmap Tiles**: Computed density values for competitor distribution, allowing gradient overlays.
- **Isochrones & Radius Circles**: Placeholder layers for travel-time catchments. Isochrone data may be sourced from future integrations (currently placeholder or static).

## 6. Data Flow
1. **User input**: Address search (`AddressInput`) or map click sets `selectedLocation` in `AppContext`.
2. **State broadcast**: `MapContext` shares MapLibre map instance; `AppContext` provides location, categories, and toggle states.
3. **Fetch POIs**:
   - React Query calls `fetchNearby` with user-selected categories.
   - Server builds Overpass query, fetches data, sanitizes tags/coordinates, and returns JSON.
4. **Client normalization**: `client/src/lib/nearby.js` assigns canonical fields (name, address via `buildAddress`, coordinates).
5. **Visualization**: Components convert data into GeoJSON layers and MapLibre renders circles, symbols, heatmaps, and popups.
6. **Scoring**: `useScoreLocation` aggregates POI density and attributes (competition, footfall, amenities) for location scorecards.

## 7. Key Components and Responsibilities
| Component | Location | Responsibility |
| --- | --- | --- |
| `MapContainer` | `client/src/components/map/MapContainer.jsx` | Initializes MapLibre, manages click events, coordinates state updates |
| `CoffeeShopsLayer` | `client/src/components/map/CoffeeShopsLayer.jsx` | Renders targeted customer POIs with labels + popups |
| `CompetitorLayer` | `client/src/components/map/CompetitorLayer.jsx` | Renders competitor POIs and popups |
| `TileHeatmapLayer` | `client/src/components/map/TileHeatmapLayer.jsx` | Draws competitor density heatmap and polygon outlines |
| `HeatmapToggleControl` | `client/src/components/map/HeatmapToggleControl.jsx` | UI control to enable/disable heatmap layer |
| `CategorySelect` | `client/src/components/ui/CategorySelect.jsx` | Multi-select for targeted customer categories |
| `CategoryDropDown` | `client/src/components/ui/CategoryDropDown.jsx` | Dropdown for competitor categories |
| `useScoreLocation` | `client/src/hooks/useScoreLocation.js` | Orchestrates scoring data fetches (tiles, heatmap, etc.) |
| `AppContext` | `client/src/context/AppContext.jsx` | Central application state (mode, filters, categories, toggles) |
| `MapContext` | `client/src/context/MapContext.jsx` | Shares MapLibre instance and load status |
| `routes.ts` | `server/routes.ts` | Defines Express endpoints for data queries and analytics |
| `storage.ts` | `server/storage.ts` | Placeholder for future persistence (currently in-memory) |

## 8. Deployment & Environment
- **Development**: `npm run dev` launches Vite dev server with Express middleware.
- **Build**: `npm run build` builds client assets and prepares server bundle.
- **Env Variables**: `.env` can store API keys. Overpass uses public endpoints, but future premium data sources would require secrets here.
- **Static Assets**: `client/public` for icons/fonts; Vite handles copying to `dist`.

## 9. Future Integrations / Considerations
- Swap Overpass endpoints for a hosted cache or custom OSM mirror to avoid rate limits during competition demos.
- Add error-handling/alerts when Overpass throttles requests.
- Integrate third-party datasets (e.g., demographic layers) by adding new server endpoints and map layers.
- Expand scoring heuristics to incorporate footfall, rent index, demographics.
- Provide offline caching or snapshotting for reproducible competition demos.

## 10. Quick Reference Commands
```
npm install          # install dependencies
npm run dev          # start Vite + Express in development
npm run build        # create production build
npm run preview      # preview the production bundle
```

This document should equip reviewers and competitors with a deep understanding of the project’s stack, data sourcing, and architectural decisions.
