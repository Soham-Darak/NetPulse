# NetPulse — Network Latency and Speed Monitor

A real-time network diagnostics dashboard built with **React (Vite)** on the frontend and **Express + WebSocket** on the backend. It measures your internet **ping (latency)**, **download speed**, and **upload speed** — just like popular speed test websites.

---

## 📌 Objective

The goal of this project is to build a **full-stack web application** that can:

1. **Measure network latency (ping)** — How fast your device can talk to a server and get a reply back.
2. **Measure download speed** — How fast your internet can pull data from the internet.
3. **Measure upload speed** — How fast your internet can push data to the internet.
4. **Display results visually** — Show everything on a clean dashboard with live charts, quality indicators, and a history table.
5. **Work in real-time** — Background pings run every 2 seconds, and WebSocket broadcasts results to other connected tabs.

This project demonstrates key **Computer Networking concepts**: HTTP requests, WebSockets, latency measurement, bandwidth testing, data streaming, and client-server architecture.

---

## ⚙️ How Each Feature Works (Process)

### 1. 📡 Latency (Ping) Measurement

**What it does:** Measures the round-trip time (RTT) for a tiny HTTP request to travel from your browser → server → back to your browser.

**How it works:**
```js
const start = performance.now();          // Start timer
await fetch('/ping?t=' + Date.now());     // Send request to server
const latency = performance.now() - start; // Stop timer = round-trip time
```

- The server has a `/ping` endpoint that instantly replies `{ pong: true }`
- The client measures how long this round-trip takes in **milliseconds**
- **Background mode:** Runs automatically every **2 seconds** to keep the Ping Timeline chart updated
- **Full test mode:** Sends 2 warm-up pings (discarded), then 10 measured pings. Removes the highest and lowest values, averages the rest — this is called a **trimmed mean** and gives a more accurate reading
- **Displayed values:** Current ping, Minimum, Average, Maximum, **Jitter**, **Packet Loss %**
- **Jitter** = Standard deviation of ping samples — tells you how *consistent* your connection is (low jitter = stable, high jitter = unstable — important for gaming, VoIP, video calls)
- **Packet Loss** = Percentage of pings that completely failed — indicates network reliability

**Files involved:**
- `server/server.js` → `/ping` endpoint (lines 18-25)
- `client/src/hooks/useNetworkMonitor.js` → `singlePing()`, `measurePing()`, `measureAccuratePing()`, `stdDev()`

---

### 2. ⬇️ Download Speed Test

**What it does:** Downloads a 25 MB file and measures how long it takes to calculate your download speed in Mbps.

**How it works:**
```
Client requests /test-file
     ↓
Server proxies to Cloudflare CDN (speed.cloudflare.com/__down?bytes=25MB)
     ↓
Cloudflare sends 25 MB of data → through your internet → Server → Client
     ↓
Client streams the data in chunks and measures elapsed time
     ↓
Speed = (total bytes × 8) / time in seconds / 1,000,000 = Mbps
```

- The data flows: **Cloudflare CDN → Server → Client**
- Since the data passes through the **real internet** (not just localhost), the speed reflects your actual internet connection
- The client uses **streaming** (`ReadableStream`) to read data in chunks — this is more memory-efficient than downloading the entire file at once
- If Cloudflare is unreachable, the server falls back to generating data locally (in-memory)
- The test has a **15-second time cap** — if the download takes too long, it stops early and calculates speed from what was received

**Files involved:**
- `server/server.js` → `/test-file` endpoint (proxies from Cloudflare CDN, with local fallback)
- `client/src/hooks/useNetworkMonitor.js` → `measureDownload()`

---

### 3. ⬆️ Upload Speed Test

**What it does:** Uploads 5 MB of random data and measures how long it takes to calculate your upload speed in Mbps.

**How it works:**
```
Client generates 5 MB of random data
     ↓
Client POSTs it to /upload-test
     ↓
Server receives the data, then forwards it to Cloudflare CDN (speed.cloudflare.com/__up)
     ↓
Server responds when Cloudflare finishes receiving
     ↓
Client measures total time from start to response
     ↓
Speed = (5 MB × 8) / time in seconds / 1,000,000 = Mbps
```

- Random data is used (not zeros) to **prevent compression** from artificially inflating the speed
- The upload goes through **Cloudflare's servers** via the Express proxy, so it measures real internet upload speed
- If Cloudflare is unreachable, the server still responds with the byte count (fallback mode)

**Files involved:**
- `server/server.js` → `/upload-test` endpoint (proxies to Cloudflare CDN)
- `client/src/hooks/useNetworkMonitor.js` → `measureUpload()`

---

### 4. 📊 Real-Time Charts

**What it does:** Shows live-updating charts for ping and throughput.

**Charts:**
| Chart | Type | What it shows |
|-------|------|---------------|
| **Ping Timeline** | Line chart | Latency over time (updates every 2 seconds) |
| **Throughput** | Bar chart | Download (blue) vs Upload (green) speed per test run |

**How it works:**
- Uses **Chart.js** library with **react-chartjs-2** wrapper
- Ping chart updates automatically from background pings
- Throughput chart adds a new bar pair after each "Start Test" run
- Charts resize automatically on different screen sizes

**Files involved:**
- `client/src/components/Charts.jsx` → Chart components
- `client/src/components/Charts.module.css` → Styling

---

### 5. 🧾 History Logging

**What it does:** Saves every test result and shows them in a table.

**How it works:**
- After each test, the result (timestamp, ping, download, upload) is saved to **LocalStorage**
- Up to **50 records** are kept (older ones are automatically removed)
- The table shows results in reverse chronological order (newest first)
- Each row displays a **quality badge** (Good / Moderate / Poor)
- History persists across page refreshes — it's stored in your browser, not the server

**Files involved:**
- `client/src/hooks/useNetworkMonitor.js` → `loadStoredHistory()`, `saveStoredHistory()`
- `client/src/components/HistoryTable.jsx` → Table component

---

### 6. 🚦 Network Quality Indicator

**What it does:** Shows a color-coded badge based on your test results.

**Logic:**
| Quality | Badge | Condition |
|---------|-------|-----------|
| 🟢 **Good** | Green | Ping < 50ms AND Download > 20 Mbps AND Upload > 5 Mbps |
| 🟡 **Moderate** | Yellow | Ping < 150ms AND Download > 5 Mbps AND Upload > 1 Mbps |
| 🔴 **Poor** | Red | Anything worse than Moderate |

**Files involved:**
- `client/src/hooks/useNetworkMonitor.js` → `getQuality()` function
- `client/src/utils/format.js` → `qualityLabel()` helper
- `client/src/components/Header.jsx` → Badge display

---

### 7. 🔌 WebSocket (Real-Time Broadcasting)

**What it does:** Broadcasts test results to all connected browser tabs in real-time.

**How it works:**
```
Tab 1 finishes a test
     ↓
Tab 1 sends result via WebSocket → Server
     ↓
Server broadcasts to all OTHER connected clients
     ↓
Tab 2 receives the result and adds it to its history table
```

- The WebSocket server runs on the same port as Express (`:3001`)
- Vite proxies `/ws` from `:5173` to `:3001` during development
- If WebSocket fails to connect, the app still works — WS is optional

**Files involved:**
- `server/server.js` → WebSocket server setup (lines 10-11, 115-134)
- `client/src/hooks/useNetworkMonitor.js` → WebSocket client (useEffect on mount)
- `client/vite.config.js` → WebSocket proxy config

---

### 8. 🌐 Connection Info Panel

**What it does:** Shows information about your internet connection — your public IP address, ISP name, location, connection type (WiFi/4G/Ethernet), and estimated bandwidth.

**How it works:**
- Uses the browser's `navigator.connection` API to detect connection type and estimated speed
- Fetches your public IP and ISP info from `ipapi.co/json/` (a free IP geolocation API)
- Displays everything in a grid panel at the bottom of the dashboard

**CN relevance:** Shows the **network interface layer** — what type of physical/wireless connection you're using and the ISP routing your traffic.

**Files involved:**
- `client/src/hooks/useNetworkMonitor.js` → `connectionInfo` state + IP fetch on mount
- `client/src/components/ConnectionInfo.jsx` → Panel component

---

### 9. 📥 Export History as CSV

**What it does:** Allows you to download all your test results as a `.csv` file that can be opened in Excel or Google Sheets.

**How it works:**
```js
// Generate CSV string from history array
const header = 'Timestamp,Ping (ms),Download (Mbps),Upload (Mbps),Quality\n';
const rows = history.map(r => `"${time}",${r.ping},${r.dl},${r.ul},${quality}`).join('\n');

// Create downloadable file using Blob
const blob = new Blob([header + rows], { type: 'text/csv' });
```
- Creates an in-browser download — no server needed
- Filename includes the current date: `netpulse_history_2025-01-15.csv`

**Files involved:**
- `client/src/components/HistoryTable.jsx` → `exportCSV()` function + Export button

---

### 10. 🎯 Speed Gauge (Visual Speedometer)

**What it does:** Shows a semi-circular arc gauge on the Download card that visually represents the measured speed.

**How it works:**
- Built with pure **SVG** (no external library)
- The arc sweeps from 0 to `max` (default 100 Mbps)
- Color changes dynamically based on speed:
  - 🔴 Red (< 15 Mbps) → 🟡 Amber (< 30 Mbps) → 🔵 Cyan (< 60 Mbps) → 🟢 Green (> 60 Mbps)
- Includes tick marks at 0, 25, 50, 75, and 100

**Files involved:**
- `client/src/components/SpeedGauge.jsx` → SVG arc component
- `client/src/components/SpeedGauge.module.css` → Styling

---

### 11. ✨ Animated Numbers & Glassmorphism

**Animated counting numbers:**
- When a metric value changes (e.g., download speed goes from 0 → 76.5), the number **counts up smoothly** instead of jumping
- Uses `requestAnimationFrame` with a **cubic ease-out** curve for a natural feel

**Glassmorphism (frosted glass effect):**
- All metric cards and chart cards use `backdrop-filter: blur(16px)` with a semi-transparent background
- Creates a modern, premium look where background elements softly show through the glass

**Files involved:**
- `client/src/components/AnimatedNumber.jsx` → Counting animation component
- `client/src/components/MetricCard.module.css` → Glassmorphism styles
- `client/src/components/Charts.module.css` → Glassmorphism styles

---

## 📁 Project Structure

```
netpulse-react/
├── package.json                  ← Root: has scripts to run both server + client
│
├── server/
│   └── server.js                 ← Express API + WebSocket + Cloudflare CDN proxy
│
└── client/                       ← React (Vite) frontend
    ├── package.json
    ├── vite.config.js            ← Dev proxy: /ping, /test-file, /upload-test, /ws → :3001
    ├── index.html                ← HTML entry point with meta tags + favicon + fonts
    └── src/
        ├── main.jsx              ← React entry point (renders <App />)
        ├── App.jsx               ← Root component — assembles all sections
        ├── App.module.css        ← Layout grid with responsive breakpoints
        ├── index.css             ← CSS variables (colors, fonts, spacing)
        │
        ├── hooks/
        │   └── useNetworkMonitor.js  ← All measurement logic (ping, jitter, speed, connection)
        │
        ├── utils/
        │   └── format.js         ← Formatting helpers: fmt(), qualityLabel(), barPct()
        │
        └── components/
            ├── Background.jsx/css    ← Ambient grid + glowing orb effects
            ├── Header.jsx/css        ← Logo + quality badge + server info
            ├── MetricCard.jsx/css    ← Ping / Download / Upload cards (glassmorphism)
            ├── AnimatedNumber.jsx    ← Smooth counting animation for metric values
            ├── SpeedGauge.jsx/css    ← SVG arc speedometer on Download card
            ├── ActionBar.jsx/css     ← Start Test button + progress bar + Clear
            ├── Charts.jsx/css        ← Chart.js ping line + speed bar charts
            ├── ConnectionInfo.jsx/css ← IP, ISP, location, connection type panel
            └── HistoryTable.jsx/css  ← LocalStorage-backed results table + CSV export
```

---

## 🔌 API Endpoints (Server — port 3001)

| Method | Path | What It Does |
|--------|------|--------------|
| `GET` | `/ping` | Returns `{ pong: true }` instantly — used to measure round-trip latency |
| `GET` | `/test-file` | Proxies 25 MB from Cloudflare CDN — used to measure download speed |
| `POST` | `/upload-test` | Receives uploaded data and forwards to Cloudflare — used to measure upload speed |
| `WS` | `/ws` | WebSocket connection for broadcasting test results between tabs |

---

## 🎨 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + Vite | Fast UI with hot reload |
| Styling | CSS Modules | Scoped, component-level styles |
| Charts | Chart.js 4 + react-chartjs-2 | Interactive line and bar charts |
| Icons | Lucide React | Clean, modern icons |
| Backend | Node.js + Express 4 | API server and proxy |
| Real-time | WebSocket (ws library) | Live result broadcasting |
| Speed Test CDN | Cloudflare speed.cloudflare.com | Real internet speed measurement |
| Fonts | Syne (display) + JetBrains Mono (data) | Modern typography |
| Storage | LocalStorage | Client-side test history persistence |

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# From the project root — installs both server and client dependencies
npm run install:all
```

### 2. Run in Development Mode

```bash
npm run dev
```

This starts **both** servers concurrently:
- **API server** → http://localhost:3001
- **React dev server** → http://localhost:5173 ← **open this in your browser**

### 3. Production Build (Optional)

```bash
npm run build     # Builds React app into server/public/
npm start         # Serve everything from Node on port 3001
```

---

## 📱 Responsive Design

The app is fully responsive and works on all screen sizes:

| Screen Size | Layout |
|-------------|--------|
| **Desktop (> 900px)** | 3-column metric cards, 2-column charts |
| **Tablet (600–900px)** | 2-column metrics (download card spans full width), 2-column charts |
| **Mobile (< 600px)** | Single column everything, full-width buttons |

This is achieved using **CSS Grid** with `@media` breakpoints in each component's CSS Module file.

---

## 🔄 Data Flow Summary

Here is the complete flow when a user clicks "Start Test":

```
1. User clicks "Start Test"
     ↓
2. LATENCY PHASE
   → 2 warm-up pings (discarded)
   → 10 measured pings to /ping endpoint
   → Trimmed mean calculated (drop highest + lowest)
   → Ping chart updated
     ↓
3. DOWNLOAD PHASE
   → Client fetches /test-file
   → Server proxies 25 MB from Cloudflare CDN
   → Client stream-reads in chunks, measures time
   → Download speed calculated in Mbps
     ↓
4. UPLOAD PHASE
   → Client generates 5 MB random data
   → Client POSTs to /upload-test
   → Server forwards data to Cloudflare CDN
   → Upload speed calculated in Mbps
     ↓
5. RESULTS
   → Speed chart updated with download + upload bars
   → Quality badge updated (Good/Moderate/Poor)
   → Result saved to LocalStorage history
   → Result broadcast via WebSocket to other tabs
   → Status shows "Test complete"
```

---

## ✅ Conclusion

This project successfully demonstrates a **full-stack network monitoring application** that:

1. **Measures real internet performance** — Ping, download, and upload speeds are measured through Cloudflare's CDN infrastructure, giving accurate, real-world results (not inflated localhost values).

2. **Uses modern web technologies** — React for the UI, Express for the backend, WebSockets for real-time communication, Chart.js for data visualization, and SVG for custom gauge graphics.

3. **Applies core Computer Networking concepts:**
   - **HTTP Request/Response** — Used in ping measurement and file transfers
   - **Streaming** — Download test uses `ReadableStream` for efficient data transfer
   - **WebSockets** — Full-duplex communication for broadcasting results in real-time
   - **Client-Server Architecture** — Clean separation between frontend (React) and backend (Express)
   - **Proxy Pattern** — Server acts as a proxy to Cloudflare CDN, avoiding CORS issues while measuring real internet speed
   - **Latency Measurement** — Uses `performance.now()` for high-precision timing (microsecond resolution)
   - **Jitter Analysis** — Standard deviation of ping samples measures connection stability
   - **Packet Loss Detection** — Tracks failed pings as a percentage of total attempts
   - **Bandwidth Calculation** — Converts bytes/seconds to Megabits per second (Mbps), matching ISP conventions
   - **Network Interface Detection** — Uses `navigator.connection` API to identify connection type and estimated speed
   - **IP Geolocation** — Fetches public IP and ISP information via REST API

4. **Provides a premium user experience** — Glassmorphism cards, animated counting numbers, SVG speed gauge, dark theme, responsive layout, live charts, persistent history, CSV export, and color-coded quality indicators.

5. **Is production-ready** — Can be built and served from a single Node.js server, with the React app compiled into static assets.

---

## 📊 Quality Thresholds Reference

| Quality | Ping | Download | Upload |
|---------|------|----------|--------|
| 🟢 Good | < 50ms | > 20 Mbps | > 5 Mbps |
| 🟡 Moderate | < 150ms | > 5 Mbps | > 1 Mbps |
| 🔴 Poor | ≥ 150ms | ≤ 5 Mbps | ≤ 1 Mbps |
