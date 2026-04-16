# CRACKWATCH Changelog

> All changes to this project are documented here.
> **Checkpoint: v1.5.3** — Revert to this tag if anything breaks: `git checkout v1.5.3`

---

## v2.0.0 — STABLE CHECKPOINT + Smart Navigation Engine
**ISOLATED BRANCH: v2-stable — `git checkout v2-stable` to revert**

Smart navigation with pothole avoidance:
- Pick start/end by typing OR tapping map (📍 buttons)
- Engine finds multiple routes and scores each for safety
- Safety score = 100 - (hazards * 15) - (totalSeverity / 10)
- Route comparison panel: distance, time, hazard count, safety %
- "SAFEST" badge on best route
- Hazard tags show exact potholes along each route
- "Avoid hazards" toggle
- Green line = primary route, cyan dashed = alternatives
- Red circles = unfixed potholes, orange = moderate

## v1.6.2 — Tap-to-report on government map too
- Same quick report feature now on govt Reports Map
- Click anywhere → sector → photo → submit
- Auto-refreshes report list after submission

## v1.6.1 — Tap-to-report from map (debug feature)
- Tap anywhere on the map to drop a pin and report damage at that location
- Quick report bottom sheet: sector picker → photo → description → submit
- Blue pulsing pin shows selected location with coordinates
- Report auto-submits to backend with tapped GPS coordinates
- New pin appears on map instantly after submission
- Works for any location — not limited to user's GPS position

## v1.6.0 — Pothole-aware navigation
- New "Navigate" tab in public app with Google Maps-style routing
- Search from/to locations using OpenStreetMap Nominatim
- Auto-detects user GPS location as start point
- "Avoid Potholes" toggle — shows danger zones on route
- Pothole danger zones visualized (red circles for high severity)
- Route drawn with emerald green line, alternatives in cyan
- Counts hazards along each route
- Bottom legend showing risk levels
- Uses Leaflet Routing Machine (OSRM) for free routing

## v1.5.6 — Fix upvote double-counting on refresh
- Store exact upvote VALUE in localStorage (not increment)
- Prevents 49→51 bug where increment was applied on top of already-incremented data
- Values re-applied when reports array length changes (API load)

## v1.5.5 — Fix upvote count not incrementing
- Upvote counts now stored in localStorage (not just IDs)
- Demo reports (hardcoded) upvotes persist across refresh
- Real API reports upvote via backend + localStorage fallback
- Counts applied on mount so upvotes survive page reload

## v1.5.4 — Skip empty frames in video detection
- Video /detect/video only returns frames where damage was found
- Frames with zero detections are excluded from results
- Reduces response size and clutter in frame viewer

---

## v1.5.3 — CHECKPOINT (Apr 16, 2026)
**STABLE RELEASE — Revert point**
- Fix: Road sector no longer detects corrosion/spalling false positives
- CV disabled for road, spalling-only for building/bridge
- All features tested and working

## v1.5.2 — Sector on video + live feed
- Sector selection added to govt VideoScan and public LiveScanPage
- /detect/video and /detect/frame accept sector param
- Consistent flow: Pick sector → Choose mode → Scan

## v1.5.1 — Sector-first UI flow
- User must pick sector BEFORE upload zone appears (both apps)
- Govt: 5 sector cards with model info
- Public: 2x2 emoji grid
- "Change" button to go back

## v1.5.0 — Sector-based targeted detection
- 5 sectors: Road, Building, Pipeline, Bridge, All
- Each sector runs only relevant AI models
- GET /sectors endpoint lists available options
- Reduces false positives + faster inference

## v1.4.0 — Fake report prevention system
- 5-layer fraud detection on every citizen report
- Image authenticity (moiré, resolution, brightness, edge, color, aspect ratio)
- GPS validation (range, India bounds, spoofing, null island)
- Duplicate detection (50m Haversine radius)
- Rate limiting (10/hour per user)
- Content relevance (AI must find actual damage)
- Combined trust score → auto_approve / flag_for_review / block

## v1.3.1 — Live camera + video on public PWA
- LiveScanPage for citizen app
- Live camera with rear-facing default
- Video upload with frame-by-frame results

## v1.3.0 — Video upload + Live camera feed
- POST /detect/video — frame extraction + per-frame AI
- POST /detect/frame — single base64 frame detection
- Govt VideoScan component with frame viewer + timeline scrubber
- Live camera mode with detection overlay

## v1.2.1 — Upvote fix, report preview, logout
- Upvotes persist in localStorage
- Report submission shows AI-annotated preview + detections + cost
- Logout button on public app

## v1.2.0 — Marker clustering + authenticity check
- react-leaflet-cluster on both maps
- Custom colored dot markers with glow
- Image authenticity check (FFT moiré, resolution, brightness, edges)
- HTTPS SSL certs for camera access

## v1.1.1 — Settings page
- Profile card, system info, AI model name
- Sign Out button with JWT clear

## v1.1.0 — JWT authentication
- POST /auth/login (govt: username+password)
- POST /auth/register (citizen: name only)
- 3 demo govt accounts (admin, inspector, engineer)
- Login pages on both apps
- Session persistence in localStorage

## v1.0.1 — Mobile stats fix
- Tighter padding for phone screens
- Smaller performance ring, compact stat cards

## v1.0.0 — PRODUCTION RELEASE
**Full-stack AI infrastructure damage detection system**
- Dual platform: Govt dashboard + Citizen PWA
- 3-model AI pipeline (YOLOv8s-RDD + CrackSeg + OpenCV)
- 10+ damage types, 757ms inference, fully offline
- Cost estimation in INR with repair plans
- Explainable AI, priority ranking
- Live pothole map with admin controls
- Government transparency dashboard
- Stitch "Sovereign Intelligence" design system

## v0.x — Pre-release development
- dff2a72: Initial CRACKWATCH UI (brutalist design)
- 9839d9a: Full-stack AI detection + Roboflow integration
- 87e3ef7: 7 damage types + CV pipeline
- 8ccb546: Command Center (repair plan, cost, explainable AI)
- b380c7f: Zero hardcoded data — all live API
- ae33ad8: Bold premium redesign
- 69d87a6: Stitch design system applied
- 4c4f8e7: Public citizen app + shared backend
- 03ffc0e: Local YOLOv8s model — zero API dependency
- 8fab9c9: Multi-model pipeline (road + building + pipeline)

---

## How to revert
```bash
# Revert to any checkpoint
git checkout v1.5.3

# Create a new branch from checkpoint
git checkout -b fix-branch v1.5.3

# See all tags
git tag -l
```
