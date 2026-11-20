# 🔬 Phase 5.3 Research: Bundle Size & Performance Optimization

## 1. Domain & Context
Phase 5.3 targets frontend asset delivery efficiency and backend database throughput across the application. 

Currently:
1. **Frontend Bundle Weight:**
   - Client bundle includes two distinct charting libraries: `recharts` (390.6 kB minified / 113.9 kB gzip) and `chart.js` + `react-chartjs-2` (177.5 kB minified / 62 kB gzip).
   - The primary application chunk `index-*.js` weighed 463.44 kB minified (triggering Vite's 400 kB chunk size warning) because Firebase, GSAP, and common utility runtimes were not segregated into dedicated vendor chunks.
2. **Backend Database I/O:**
   - In `dashboardController.js` and `calorieController.js`, multi-week historical queries pull raw Mongoose documents into Node.js heap memory, running manual JS `.forEach()` and `.reduce()` loops to group by date and count completions.
   - This creates unnecessary serialization overhead, excessive memory footprint, and network latency between MongoDB Atlas and Render.

---

## 2. Technical Decisions & Trade-Offs

### 2.1 Charting Runtime Consolidation: Standardize on Recharts
| Dimension | Keep Dual Charting | Standardize on Recharts (Selected) |
| :--- | :--- | :--- |
| **Vendor Payload** | ~568 kB total charting payload | ~390 kB total charting payload (**~178 kB reduction**) |
| **Usage Across App** | Recharts used in 4 pages/tabs; Chart.js used in 2 | Recharts used uniformly across all 6 pages/tabs |
| **SSR / Canvas** | Chart.js used on server for PDF (`chartjs-node-canvas`) | Client drops `chart.js` entirely; Server retains `chartjs-node-canvas` strictly in `server/package.json` |
| **API Complexity** | Developers must learn two separate chart DSLs | Single component library with declarative SVG elements |
| **Verdict** | Redundant and bloats user data transfer | **Standardize client exclusively on Recharts** |

### 2.2 Vite Manual Chunking Topology
We will partition `manualChunks(id)` into distinct semantic vendor buckets:
- `react-vendor`: React 19, React DOM, React Router 7, Scheduler.
- `recharts`: Recharts, d3, victory-vendor.
- `firebase-vendor`: Firebase Auth, Firebase App, Firebase Firestore.
- `animation-vendor`: GSAP and animation plugins.
- `icons`: Lucide React and React Icons.
- `socket`: Socket.io-client and Engine.io-client.

With this configuration:
- Main `index-*.js` shrinks from 463 kB down to < 180 kB.
- No chunk exceeds 400 kB.
- High-cache-hit vendor chunks are cached permanently by browsers across releases.

### 2.3 Server-Side Aggregation Pipelines
1. **Dashboard 30-Day Activity Heatmap (`dashboardController.js`):**
   - Replace in-memory looping over `HabitLog.find()` with a MongoDB aggregation pipeline:
     - `$match`: `habitId: { $in: userHabitIds }`, `date: { $gte: thirtyDaysAgo }`, `status: { $in: ["done", "completed"] }`.
     - `$group`: `_id: { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "+05:30" } }`, `count: { $sum: 1 }`.
     - `$project`: `date: "$_id"`, `count: 1`, `_id: 0`.
     - `$sort`: `date: 1`.
2. **Calorie 30-Day Daily History (`calorieController.js`):**
   - Replace in-memory grouping over `FoodLog.find()` with a MongoDB aggregation pipeline:
     - `$match`: `userId`, `createdAt: { $gte: thirtyDaysAgo }`.
     - `$group`: `_id: "$date"`, `calories: { $sum: "$calories" }`, `protein: { $sum: "$protein" }`, `itemCount: { $sum: 1 }`, `items: { $push: { foodName: "$foodName", calories: "$calories", protein: "$protein" } }`.
     - `$sort`: `_id: 1`.

---

## 3. Potential Pitfalls & Mitigations

1. **Server-Side PDF Export Dependency:**
   - *Pitfall:* Accidentally uninstalling `chart.js` from the backend `server/package.json`, which breaks PDF generation (`chartjs-node-canvas`).
   - *Mitigation:* Remove `chart.js` and `react-chartjs-2` **only** from `client/package.json`. Keep `server/package.json` untouched.
2. **Chart Styling Discrepancies:**
   - *Pitfall:* Converting `TimetableCharts.jsx` and `AnalyticsCharts.jsx` to Recharts might break the brutalist aesthetic or tooltips.
   - *Mitigation:* Ensure Recharts tooltips use dark/monochrome borders matching `--color-border: #000000` with 2px borders, keeping UI identical.
3. **Empty Aggregation Results:**
   - *Pitfall:* MongoDB aggregation pipeline returning empty arrays when users have no logged data, causing UI errors.
   - *Mitigation:* Guard aggregation returns with default empty array fallbacks (`(aggResults || []).map(...)`), preserving exact existing response contracts.

