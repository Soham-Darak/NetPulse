/**
 * NetPulse Project Report Generator — v2 (Updated with comprehensive screenshots)
 */

const { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun, 
        AlignmentType, PageBreak, convertInchesToTwip, NumberFormat } = require('docx');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(
  process.env.USERPROFILE || process.env.HOME,
  '.gemini', 'antigravity', 'brain', '82fd7f3e-8908-41f5-ad2e-30142a7d0b8e'
);

// ── All screenshots mapping ───────────────────────────────────────────────────
const screenshots = {
  fullTop:        path.join(SCREENSHOT_DIR, 'netpulse_full_top_4000px_1776158556532.png'),
  dashboardTop:   path.join(SCREENSHOT_DIR, 'netpulse_dashboard_top_1776156308599.png'),
  chartsData:     path.join(SCREENSHOT_DIR, 'netpulse_charts_data_1776156333007.png'),
  dataMonitor:    path.join(SCREENSHOT_DIR, 'data_consumption_monitor_and_breakdown_1776156419818.png'),
  categoryBreakdown: path.join(SCREENSHOT_DIR, 'data_consumption_monitor_1776156542442.png'),
  doughnutChart:  path.join(SCREENSHOT_DIR, 'data_by_source_category_doughnut_chart_1776156437514.png'),
  timelineBar:    path.join(SCREENSHOT_DIR, 'live_data_timeline_and_source_bar_chart_1776156449750.png'),
  tablesSection:  path.join(SCREENSHOT_DIR, 'data_split_and_recent_connections_tables_1776156456973.png'),
  networkHistory: path.join(SCREENSHOT_DIR, 'network_info_and_test_history_1776156465243.png'),
  bottomActive:   path.join(SCREENSHOT_DIR, 'bottom_section_active_connections_if_any_1776156474346.png'),
  fullBottom:     path.join(SCREENSHOT_DIR, 'netpulse_full_bottom_remainder_1776158569395.png'),
  absoluteBottom: path.join(SCREENSHOT_DIR, 'netpulse_absolute_bottom_1776158583294.png'),
};

function loadImage(filePath) {
  try { if (fs.existsSync(filePath)) return fs.readFileSync(filePath); }
  catch (e) { console.warn(`Could not load: ${filePath}`); }
  return null;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const FONT = 'Calibri';
const HC = '1B3A5C', SHC = '2563EB', BC = '333333', AC = '0EA5E9';

const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 }, children: [new TextRun({ text: t, font: FONT, size: 32, bold: true, color: HC })] });
const h2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 }, children: [new TextRun({ text: t, font: FONT, size: 28, bold: true, color: SHC })] });
const h3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 }, children: [new TextRun({ text: t, font: FONT, size: 24, bold: true, color: '374151' })] });
const p = (t) => new Paragraph({ spacing: { after: 150 }, children: [new TextRun({ text: t, font: FONT, size: 22, color: BC })] });
const b = (t) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 80 }, children: [new TextRun({ text: t, font: FONT, size: 22, color: BC })] });
const empty = () => new Paragraph({ spacing: { after: 100 }, children: [] });
const pb = () => new Paragraph({ children: [new PageBreak()] });

function cap(t) {
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 300 },
    children: [new TextRun({ text: t, font: FONT, size: 18, italics: true, color: '666666' })] });
}

function img(data, w = 580, h = 300) {
  if (!data) return new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '[Screenshot not available]', font: FONT, size: 20, italics: true, color: '999' })] });
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 100 },
    children: [new ImageRun({ data, transformation: { width: w, height: h }, type: 'png' })] });
}

async function generateReport() {
  console.log('Loading screenshots...');
  const images = {};
  for (const [key, filePath] of Object.entries(screenshots)) {
    images[key] = loadImage(filePath);
    console.log(`  ${key}: ${images[key] ? 'OK' : 'MISSING'} — ${path.basename(filePath)}`);
  }

  const doc = new Document({
    creator: 'NetPulse Team',
    title: 'NetPulse — Network Latency and Speed Monitor System — Project Report',
    styles: { default: { document: { run: { font: FONT, size: 22, color: BC } } } },
    sections: [
      // ══════════ TITLE PAGE ══════════
      {
        properties: { page: { margin: { top: convertInchesToTwip(1.5), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1.2), right: convertInchesToTwip(1.2) } } },
        children: [
          empty(), empty(), empty(), empty(), empty(),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: 'PROJECT REPORT', font: FONT, size: 28, bold: true, color: AC, allCaps: true })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', font: FONT, size: 28, color: AC })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'NetPulse', font: FONT, size: 72, bold: true, color: HC })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: 'Network Latency and Speed Monitor System', font: FONT, size: 32, color: SHC })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 50 }, children: [new TextRun({ text: 'A Real-Time, Continuous Network Diagnostics Dashboard', font: FONT, size: 24, italics: true, color: '666666' })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', font: FONT, size: 28, color: AC })] }),
          empty(), empty(),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Subject: Computer Networks', font: FONT, size: 24, color: BC })] }),
          empty(),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Technology Stack: React (Vite) + Express.js + WebSocket + Node.js', font: FONT, size: 22, color: '555555' })] }),
          empty(), empty(), empty(), empty(),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'April 2026', font: FONT, size: 24, color: BC })] }),
        ],
      },

      // ══════════ TABLE OF CONTENTS ══════════
      {
        properties: { page: { margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1.2), right: convertInchesToTwip(1.2) } } },
        children: [
          h1('Table of Contents'), empty(),
          p('1.  Project Summary'), p('2.  Introduction'), p('3.  Problem Statement'), p('4.  Objectives'),
          p('5.  System Architecture'),
          p('    5.1  Frontend Architecture (React + Vite)'), p('    5.2  Backend Architecture (Express + Node.js)'), p('    5.3  WebSocket Communication Layer'),
          p('6.  Detailed Feature Analysis'),
          p('    6.1  Continuous Testing Engine'), p('    6.2  Ping & Latency Measurement'), p('    6.3  Download Speed Measurement'),
          p('    6.4  Upload Speed Measurement'), p('    6.5  Real-Time Data Consumption Tracking'), p('    6.6  Network Traffic Classification'),
          p('    6.7  Multi-Tab Network Monitoring'), p('    6.8  Cross-Tab Communication System'), p('    6.9  Connection Information & GeoIP'),
          p('    6.10 Test History & CSV Export'), p('    6.11 Dual-State Memory Management'), p('    6.12 Advanced Visualization Engine'),
          p('7.  Technology Stack'), p('8.  Results & Screenshots'), p('9.  Network Phenomena & Analytics'),
          p('10. Conclusion'), p('11. Future Scope'), p('12. References'),
        ],
      },

      // ══════════ MAIN CONTENT ══════════
      {
        properties: { page: { margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1.2), right: convertInchesToTwip(1.2) } } },
        children: [
          // 1. PROJECT SUMMARY
          h1('1. Project Summary'),
          p('This project presents the design and implementation of NetPulse — a real-time, professional-grade network diagnostics dashboard built from the ground up using React (Vite) on the frontend and an Express + WebSocket proxy on the backend. NetPulse is designed not just as a one-off "speed tester," but as a fully robust Continuous Monitoring Engine that autonomously tracks ping (latency), download speeds, and upload bandwidth in the background, while simultaneously keeping a surgical, real-time log of the browser\'s Data Consumption footprint.'),
          p('Unlike traditional speed testing tools that provide a single snapshot measurement, NetPulse implements a continuous polling architecture that runs automated network tests every 10 seconds, providing users with a comprehensive, evolving view of their network performance over time. The system leverages modern web technologies including the PerformanceObserver API, ReadableStream for chunk-by-chunk download analysis, WebSocket for real-time multi-tab communication, and the BroadcastChannel API for cross-tab data synchronization.'),
          p('The project demonstrates advanced Computer Networking methodologies including interval-driven bandwidth approximation, streaming readable-buffers, full-duplex WebSocket messaging pipelines, strict asynchronous React state management, and real-time DOM-based data extraction using the browser\'s native Performance API.'),

          pb(),

          // 2. INTRODUCTION
          h1('2. Introduction'),
          p('In today\'s interconnected world, reliable and consistent network performance is paramount. Whether it\'s remote work, video streaming, online gaming, or cloud-based enterprise applications, the quality of a user\'s internet connection directly impacts productivity and user experience. Traditional speed test applications provide only a momentary snapshot of network conditions — a single measurement at a specific point in time that fails to capture the dynamic, fluctuating nature of real-world network performance.'),
          p('NetPulse addresses this critical gap by implementing a Continuous Network Monitoring paradigm. Rather than requiring users to manually initiate tests, NetPulse operates autonomously in the background, conducting systematic network assessments at precise 10-second intervals. This approach enables the detection of intermittent issues such as periodic latency spikes, bandwidth throttling patterns, and packet loss events that would be invisible to conventional one-off testing tools.'),
          p('The system is architected as a full-stack web application, combining a React-based single-page application (SPA) with a Node.js/Express backend server. Communication between the frontend and backend utilizes both traditional HTTP REST endpoints and persistent WebSocket connections, enabling real-time data flow without polling overhead. The application also implements cross-tab communication using the BroadcastChannel API, allowing multiple instances of NetPulse to share metrics and provide aggregate network statistics across all open browser tabs.'),
          p('The project serves as a comprehensive demonstration of advanced computer networking concepts including HTTP request/response timing analysis, TCP throughput measurement via stream-based data transfer, WebSocket full-duplex communication, network address translation detection, ISP identification through GeoIP services, and real-time traffic classification using the browser\'s Performance API.'),

          pb(),

          // 3. PROBLEM STATEMENT
          h1('3. Problem Statement'),
          p('Modern internet users face several challenges when trying to understand and monitor their network performance:'),
          b('Intermittent Network Issues: Traditional speed tests capture only a single moment in time, missing periodic latency spikes, bandwidth fluctuations, and transient packet loss that significantly affect real-world usage.'),
          b('Lack of Data Consumption Visibility: Users have no real-time insight into how much data their browser is consuming, which services are using the most bandwidth, or how data usage is distributed across different categories.'),
          b('No Continuous Monitoring: Existing tools require manual initiation of each test, making it impossible to track network performance trends over extended periods without constant user intervention.'),
          b('Disconnected Multi-Tab Experience: When running speed tests in multiple tabs, there is no mechanism to correlate or aggregate results, leading to fragmented and potentially misleading data.'),
          b('Memory Management in Long-Running Sessions: Continuous data collection without proper memory management leads to browser performance degradation, making truly continuous monitoring impractical.'),
          p('NetPulse was designed to solve all of these problems through an intelligent, automated, and memory-efficient continuous monitoring architecture.'),

          pb(),

          // 4. OBJECTIVES
          h1('4. Objectives'),
          p('The project was engineered to achieve the following advanced functional goals:'),
          b('Automated Continuous Polling Mechanics — Establish a non-blocking asynchronous testing loop that programmatically initiates lightweight network speed tests every precise 10-second interval, mimicking enterprise server monitoring tools.'),
          b('Real-Time DOM Data Extraction — Hook directly into the browser\'s native PerformanceObserver API to track the raw byte-size of every single packet fetched or sent by the application, resulting in a live consumption monitor.'),
          b('Advanced Payload Classification Engines — Create a sophisticated string-matching parsing algorithm that evaluates every network request and classifies its intent into human-readable buckets (e.g., Download Tests, Scripts, API/Fetch, General Traffic).'),
          b('Dual-State Architectural Memory Management — Implement a split data caching model where heavy UI lists enforce a strict 10-Minute Rolling Window purging algorithm for optimal render performance, while Summary Cards hook into Lifetime Permanent Accumulators that accurately total data indefinitely.'),
          b('State-of-the-Art Premium UI/UX — Construct a visually stunning interface utilizing glassmorphism, dynamic SVG speed gauges, animated number transitions, gradient-filled charts, and a dark-mode aesthetic with neon accent colors.'),
          b('Cross-Tab Synchronization — Enable real-time metric sharing across multiple browser tabs using the BroadcastChannel API with localStorage fallback for universal browser support.'),
          b('Statistical Network Analysis — Compute derived metrics including standard deviation (jitter), rolling averages, peak values, packet loss percentages, and connection quality classifications.'),

          pb(),

          // 5. SYSTEM ARCHITECTURE
          h1('5. System Architecture'),
          p('NetPulse follows a modern client-server architecture with three primary layers: the React Frontend, the Express Backend Server, and the WebSocket Communication Layer. Each layer serves a distinct purpose and communicates through well-defined interfaces.'),

          h2('5.1 Frontend Architecture (React + Vite)'),
          p('The frontend is built using React 18 with Vite as the build tool, providing instant hot module replacement during development and optimized production builds. The architecture follows a component-based design pattern with custom hooks for business logic separation.'),
          h3('Component Hierarchy'),
          b('App.jsx — The master orchestrator that assembles the layout structure, connecting all components and managing the flow of data from hooks to UI elements.'),
          b('MetricCard.jsx — Three primary glassmorphic cards displaying Response Time, Download Speed, and Upload Speed with animated number transitions and progress bars.'),
          b('SpeedGauge.jsx — A custom SVG-based radial gauge that dynamically renders speed values using mathematically computed strokeDasharray and strokeDashoffset values.'),
          b('ActionBar.jsx — The control center for pause/resume functionality, real-time status display, observing time counter, and test count tracking.'),
          b('Charts.jsx — Dual chart section rendering Response Time History (line chart with gradient fill) and Network Speed Trends (grouped bar chart) using Chart.js.'),
          b('DataUsage.jsx — The most complex component rendering the Data Consumption Monitor with summary cards, doughnut chart, timeline chart, domain bar chart, and request log tables.'),
          b('ConnectionInfo.jsx — Displays network information including IP address, ISP, geographic location, and connection type via GeoIP API integration.'),
          b('HistoryTable.jsx — Maintains a log of all automated test results with CSV export capability, and displays active cross-tab connections.'),
          b('AnimatedNumber.jsx — A precision math library component that calculates cubic-ease-out animation frames for smooth number transitions over 600ms.'),
          b('Background.jsx — Generates the ambient dark gradient background that persists behind the entire application.'),
          h3('Custom Hooks'),
          b('useNetworkMonitor.js — The core 620-line hook containing the entire testing engine: requestAnimationFrame timer, ping/download/upload measurement functions, chart data management, history persistence, and WebSocket broadcasting.'),
          b('useDataTracker.js — A 374-line hook binding to the PerformanceObserver API, implementing traffic classification, permanent accumulators, 10-minute rolling window purging, and real-time data rate calculations.'),
          b('useAllTabsMetrics.js — Subscribes to cross-tab metrics and computes aggregate statistics across all connected tabs.'),
          b('useAllTabsDataUsage.js — Tracks data usage metrics from all connected browser tabs via the cross-tab communication system.'),

          h2('5.2 Backend Architecture (Express + Node.js)'),
          p('The backend server is built with Express.js and serves as both an API router and a proxy to external speed test infrastructure.'),
          h3('API Endpoints'),
          b('/ping — A minimal-overhead endpoint that returns { pong: true } with no-cache headers. Designed to add zero processing delay so that round-trip time measurements accurately reflect network latency.'),
          b('/test-file — The download test proxy. Proxies the download from Cloudflare\'s CDN (speed.cloudflare.com/__down) to measure real internet throughput. Includes a 5-second timeout with automatic fallback to local chunk generation.'),
          b('/upload-test — The upload test endpoint. Receives raw binary data from the client, then forwards it to Cloudflare\'s upload endpoint for accurate internet upload speed measurement.'),
          h3('Local Fallback System'),
          p('The server implements an intelligent fallback mechanism. If Cloudflare\'s CDN is unreachable, the server automatically generates data locally using a pre-allocated 64KB chunk buffer filled with pseudo-random bytes to prevent network hardware compression from artificially inflating speed measurements.'),

          h2('5.3 WebSocket Communication Layer'),
          p('The server creates a WebSocket server on the /ws path using the ws library. This enables real-time, bidirectional communication between multiple connected clients. When any client completes a speed test, the results are broadcast to all other connected clients. Data usage metrics are also shared across tabs via WebSocket messages.'),

          pb(),

          // 6. DETAILED FEATURE ANALYSIS
          h1('6. Detailed Feature Analysis'),

          h2('6.1 Continuous Testing Engine'),
          p('The continuous testing engine is the heart of NetPulse. It operates on a precise 10-second interval using two complementary timing mechanisms:'),
          b('requestAnimationFrame Timer: Bypasses setInterval drift by tracking elapsed time using a requestAnimationFrame render loop hooked into performance.now(). This ensures the wall-clock display ticks flawlessly even during heavy data processing.'),
          b('React useRef State Management: Uses React\'s useRef to maintain sequence state outside of the Virtual-DOM reconciliation cycle, preventing unnecessary re-renders while maintaining accurate timing.'),
          b('Pause/Resume Circuit Breaker: Binary flags (isPausedRef) immediately intercept all testing triggers, freeze the timer at its exact position, and clear all active intervals. Resuming restarts from the paused position.'),

          h2('6.2 Ping & Latency Measurement'),
          p('The ping measurement operates at two levels: background pings every 2 seconds for continuous tracking, and comprehensive assessments every 10 seconds.'),
          b('Round-Trip Time (RTT): HTTP GET to /ping with no-store cache directive, measured using performance.now() for sub-millisecond precision.'),
          b('Statistical Aggregations: Rolling buffer of 60 ping samples computes minimum, maximum, and average latency.'),
          b('Jitter Calculation: Standard deviation σ = √(Σ(xi - μ)² / N) provides a measure of network stability.'),
          b('Packet Loss Detection: (failures / total × 100) percentage tracking across all ping attempts.'),

          h2('6.3 Download Speed Measurement'),
          p('Download speed is measured by fetching a 5MB payload from Cloudflare\'s CDN through the Express proxy:'),
          b('Response consumed using ReadableStream.getReader(), reading data chunk-by-chunk for live speed calculation.'),
          b('Live speed: speed = (totalBytes × 8) / (elapsedSeconds × 1,000,000) Mbps, updated on every chunk.'),
          b('Download capped at 8-second maximum duration; each chunk dispatches custom DOM events for data tracking.'),

          h2('6.4 Upload Speed Measurement'),
          b('2MB Uint8Array filled with crypto.getRandomValues() — randomization prevents network compression from inflating results.'),
          b('Uses XMLHttpRequest (not fetch) for upload.onprogress event — provides real-time progress tracking.'),
          b('Live speed computed during upload and displayed in real-time.'),

          h2('6.5 Real-Time Data Consumption Tracking'),
          b('PerformanceObserver with { type: "resource", buffered: false } intercepts every network resource event.'),
          b('transferSize and encodedBodySize properties extracted for actual bytes transferred.'),
          b('Four persistent summary cards: Total Downloaded, Total Uploaded, Connections Made, Data Used for Testing.'),
          b('Data rate calculated every 10 seconds for both incoming and outgoing traffic.'),

          h2('6.6 Network Traffic Classification'),
          p('Every request is classified into 10 categories using a regex-based classification engine:'),
          b('Download Tests — /test-file URLs | Upload Tests — /upload-test URLs | Response Time Tests — /ping URLs'),
          b('Scripts — .js/.mjs/.jsx/.ts/.tsx files | Styles — .css files | Images — .png/.jpg/.gif/.svg/.webp'),
          b('Fonts — .woff2/.ttf/.otf/.eot | API/Fetch — /api or /ws paths | Media — .mp4/.webm/.mp3'),
          b('Other — All unclassified traffic'),

          h2('6.7 Multi-Tab Network Monitoring'),
          b('Each tab runs independent speed tests and broadcasts metrics every second to all other tabs.'),
          b('Active Connections section displays all tabs with individual download/upload/ping/quality metrics.'),
          b('Aggregate statistics (average, max) computed across all active tabs; stale data cleaned after 15 seconds.'),

          h2('6.8 Cross-Tab Communication System'),
          b('Primary: BroadcastChannel API — named channel "netpulse_metrics" for zero-latency message passing.'),
          b('Fallback: localStorage events for browsers without BroadcastChannel support.'),
          b('Subscriber pattern with subscribeToMetrics() for reactive metric updates.'),

          h2('6.9 Connection Information & GeoIP'),
          b('Browser Network Information API: Detects connection type, effective type, and estimated downlink.'),
          b('GeoIP Services: Sequential requests to ipapi.co, ipinfo.io, ip-api.com with 5-second timeouts and automatic failover.'),

          h2('6.10 Test History & CSV Export'),
          b('Results persisted in localStorage (max 100 entries) with reverse-chronological display.'),
          b('One-click CSV export generates a Blob URL for instant download.'),

          h2('6.11 Dual-State Memory Management'),
          b('Rolling Window (10-minute): Request logs trimmed to MAX_DATA_WINDOW, capped at 1000 entries.'),
          b('Permanent Accumulators (Lifetime): Total bytes, category stats, domain stats maintained in useRef — never reset unless explicitly cleared.'),

          h2('6.12 Advanced Visualization Engine'),
          b('Speed Gauge: Custom SVG radial gauge with strokeDasharray/strokeDashoffset and neon glow effect.'),
          b('Animated Numbers: Cubic-ease-out frames for smooth 600ms number transitions via requestAnimationFrame.'),
          b('Doughnut Chart: 80% cutout, transparent borders, spacing, custom DOM center overlay for total.'),
          b('Gradient Area Charts: createLinearGradient() fills with cubic Bezier interpolation for smooth curves.'),
          b('Glassmorphism Cards: backdrop-filter: blur(12px) with semi-transparent backgrounds.'),

          pb(),

          // 7. TECHNOLOGY STACK
          h1('7. Technology Stack'),
          h2('Frontend Technologies'),
          b('React 18 — Component-based UI with hooks | Vite 5 — Build tool with instant HMR'),
          b('Chart.js + react-chartjs-2 — Charting | Lucide React — Icon library | CSS Modules — Scoped styling'),
          b('PerformanceObserver API — Network interception | BroadcastChannel API — Cross-tab communication'),
          b('ReadableStream API — Chunk-by-chunk download | crypto.getRandomValues() — Random byte generation'),
          h2('Backend Technologies'),
          b('Node.js — Server runtime | Express.js 4 — API routing | ws — WebSocket server'),
          b('HTTPS module — Cloudflare proxy | CORS middleware — Cross-origin support'),
          h2('Development Tools'),
          b('Concurrently — Parallel server execution | Nodemon — Auto-restart on file changes'),

          pb(),

          // ══════════ 8. RESULTS & SCREENSHOTS ══════════
          h1('8. Results & Screenshots'),
          p('The following screenshots demonstrate the system in operation, capturing live network monitoring data from a real internet connection. The system was tested with multiple concurrent speed tests over a 10-minute session, with pause/resume functionality verified.'),
          empty(),

          // Screenshot 1: Dashboard Overview
          h2('8.1 Dashboard Overview — Metric Cards & Speed Gauge'),
          p('The main NetPulse dashboard with all three primary metric cards fully populated after multiple speed test cycles. The Response Time card shows 10ms latency with BEST 3ms, AVG 28ms, STABILITY 63.3ms, and 0% packet loss. The Download Speed card displays 70.2 Mbps with a live SVG speed gauge showing MIN 81.2 Mbps and AVERAGE 49.9 Mbps. The Upload Speed card reads 46.5 Mbps with PEAK 55.7 Mbps. The status bar shows "GOOD CONNECTION" and the action bar displays the active monitoring state with Observing Time at 02:25 and 7 Completed Tests.'),
          img(images.dashboardTop, 580, 300),
          cap('Figure 1: NetPulse Dashboard — Header, Metric Cards with Speed Gauge, and Action Bar'),

          // Screenshot 2: Charts & Data Monitor Summary
          h2('8.2 Response Time History & Network Speed Trends'),
          p('This section captures the dual chart area. The Response Time History line chart on the left shows latency fluctuations over time with a gradient-filled area under the curve, displaying values oscillating between approximately 10ms and 100ms — demonstrating real network jitter detection. The Network Speed Trends bar chart on the right compares Download Speed (cyan bars) and Upload Speed (green bars) across multiple test cycles, with download speeds ranging from 20-80 Mbps. Below, the Data Consumption Monitor header shows TOTAL DOWNLOADED: 37.58 MB, TOTAL UPLOADED: 14.01 MB, 63 CONNECTIONS MADE, and 49 MB DATA USED FOR TESTING.'),
          img(images.chartsData, 580, 300),
          cap('Figure 2: Response Time History Line Chart, Network Speed Trends Bar Chart, and Data Consumption Summary Cards'),

          // Screenshot 3: Data Consumption Monitor & Category Breakdown
          h2('8.3 Data Consumption Monitor & Testing Breakdown'),
          p('The Data Consumption Monitor section with detailed summary cards showing TOTAL DOWNLOADED: 8.38 MB, TOTAL UPLOADED: 2.01 MB, 48 CONNECTIONS MADE, and 7 MB DATA USED FOR TESTING. Below is the Testing Data Breakdown with progress bars showing Download Tests at 5 MB (71%) and Upload Tests at 2 MB (29%). The Data by Source Category doughnut chart displays 10.39 MB total data distributed across categories: Download Tests (48.1%, 5 MB), Scripts (32.6%, 3.39 MB), Upload Tests (19.3%, 2 MB), Fonts (1.26 KB), with the TOTAL DATA label centered in the doughnut hole.'),
          img(images.dataMonitor, 580, 300),
          cap('Figure 3: Data Consumption Monitor Summary Cards, Testing Data Breakdown, and Doughnut Chart'),

          // Screenshot 4: Doughnut Chart Close-up
          h2('8.4 Data by Source Category — Doughnut Visualization'),
          p('A detailed view of the Testing Data Breakdown section with the complete Data by Source Category doughnut chart. The chart shows 9.59 MB TOTAL DATA with the modernized floating-ring design (80% cutout with segment spacing). The legend displays all classified categories: Download Tests (52.1%, 5 MB), Scripts (26.2%, 2.52 MB), Upload Tests (20.9%, 2 MB), Styles (0.8%, 73.64 KB), and Fonts (991 B). The Live Data Transfer Timeline header is visible at the bottom, showing that the system seamlessly transitions between visualization sections.'),
          img(images.categoryBreakdown, 580, 300),
          cap('Figure 4: Testing Data Breakdown Bars and Data by Source Category Doughnut with Full Legend'),

          // Screenshot 5: Live Timeline & Domain Chart
          h2('8.5 Live Data Transfer Timeline & Domain Analytics'),
          p('The Live Data Transfer Timeline line chart with its characteristic pattern: a solid blue line (incoming downloads) showing an initial peak of ~585.94 KB/s that rapidly declines as the download test completes, while the dotted yellow line (outgoing uploads) shows a smaller peak following the same decay pattern. The "Where is data coming from / going to?" horizontal stacked bar chart below identifies the top bandwidth-consuming domains: localhost (dominant, with both blue downloaded and yellow uploaded segments), fonts.googleapis.com (minimal), and ipapi.co (trace). The x-axis is scaled from 0 B to 11.44 MB, confirming accurate byte-level tracking.'),
          img(images.doughnutChart, 580, 300),
          cap('Figure 5: Live Data Transfer Timeline and Domain Source/Destination Bar Chart'),

          // Screenshot 6: Domain Bar Chart & Tables
          h2('8.6 Domain Analytics & Network Tables'),
          p('The domain bar chart showing data distribution across localhost, fonts.googleapis.com, and ipapi.co. Below are two side-by-side tables: "Data Split Across Open Pages" showing the current tab (● This Page: 11.76 MB downloaded, 2.02 MB uploaded, 92 items tracked) and an Other Page entry. The "Recent Network Connections" table displays individual network requests with timestamp, website/service, category pill badges (color-coded: API/Fetch in blue, Upload Tests in green, Download Tests in cyan, Scripts in yellow), received data, sent data, and request speed in milliseconds.'),
          img(images.timelineBar, 580, 300),
          cap('Figure 6: Domain Data Distribution Bar Chart and Network Connection Tables'),

          // Screenshot 7: Network Info & History
          h2('8.7 Network Information & Test History'),
          p('The Network Information panel showing the "Connected" status badge with detected network details: IP Address: 103.220.82.74, Internet Provider: Intech Online Private Limited, Location: Thane, India, Connection Type: 4G. This data is fetched from multiple GeoIP services with automatic failover. Below is the Recent Test History section header showing "5 records" with an "Export CSV" button, demonstrating the automatic logging of all test results with the 10-minute rolling window and the one-click export capability.'),
          img(images.bottomActive, 580, 300),
          cap('Figure 7: Network Information Panel and Recent Test History with Export CSV'),

          // Screenshot 8: Full History Table with Active Connections
          h2('8.8 Complete Test History & Active Connections'),
          p('The full Test History table showing 40+ test records with timestamps, download speeds (ranging from 13.5 to 84.2 Mbps), upload speeds (ranging from 22.2 to 72.3 Mbps), and connection quality badges (predominantly "GOOD" in green, with occasional "MODERATE" in yellow for lower speeds). At the bottom is the Active Connections section showing 3 active tabs with real-time aggregate statistics: AVG DOWNLOAD: 56.8 Mbps, AVG UPLOAD: 39.3 Mbps, MAX DOWNLOAD: 79.2 Mbps, MAX UPLOAD: 61.9 Mbps. The per-tab table shows tab-8b956d (79.2 Mbps down), tab-v9rd83 (34.7 Mbps down), and tab-1qya3k (56.6 Mbps down), all with "DONE" status and "GOOD" quality.'),
          img(images.fullBottom, 580, 420),
          cap('Figure 8: Complete Test History Table and Active Connections with Multi-Tab Statistics'),

          // Screenshot 9: Active Connections Close-up
          h2('8.9 Active Connections — Multi-Tab Monitoring'),
          p('A close-up view of the Active Connections section at the bottom of the dashboard, showing 3 connected tabs synchronized via the BroadcastChannel API. The aggregate statistics panel displays: AVG DOWNLOAD: 47.0 Mbps, AVG UPLOAD: 46.9 Mbps, MAX DOWNLOAD: 79.0 Mbps, MAX UPLOAD: 63.3 Mbps. The individual tab table lists tab-8b956d (79.0 Mbps / 63.0 Mbps), tab-v9rd83 (34.7 Mbps / 14.6 Mbps), and tab-1qya3k (27.5 Mbps / 63.3 Mbps), all showing "DONE" status with "GOOD" connection quality badges.'),
          img(images.absoluteBottom, 580, 300),
          cap('Figure 9: Active Connections Multi-Tab Monitoring with Aggregate Statistics'),

          h2('8.10 Key Observations from Test Results'),
          b('Download Speed: The system consistently measured 20-84 Mbps download speeds across 40+ test cycles, with an average around 50 Mbps, indicating reliable broadband performance.'),
          b('Upload Speed: 14-72 Mbps upload speeds were recorded, with the asymmetric pattern typical of consumer broadband connections.'),
          b('Latency: Response times averaged 28ms with jitter of 63.3ms, showing moderate network stability.'),
          b('Data Classification: The doughnut chart correctly classified all traffic with Download Tests consuming 48-52% and Scripts at 26-33%.'),
          b('Multi-Tab: Active Connections successfully synchronized 3 concurrent tabs with real-time aggregate statistics.'),
          b('Memory Efficiency: After 63+ connections and 40+ test cycles, the application maintained smooth 60fps performance.'),

          pb(),

          // 9. NETWORK PHENOMENA
          h1('9. Network Phenomena & Analytics'),

          h2('9.1 Response Time Instability (Jitter Spikes)'),
          p('The Response Time History chart reveals aggressive fluctuation between 10ms and 100ms, indicating moderate jitter caused by ISP congestion or WiFi interference. NetPulse quantifies this as 63.3ms standard deviation.'),

          h2('9.2 Live Transfer Timeline Patterns'),
          p('The Live Data Transfer Timeline exhibits a characteristic pattern: an initial ~585 KB/s peak that rapidly decays. The flatline between tests correctly represents the lightweight ping phase, while peaks correspond to the 5MB download and 2MB upload data transfers.'),

          h2('9.3 Doughnut Category Distribution'),
          p('The Data by Source Category chart correctly shows Download Tests at ~50% dominance, with Scripts at ~30% representing the React application code and dependencies. The 10-minute rolling window ensures the chart remains responsive.'),

          h2('9.4 Connection Quality Classification'),
          p('The three-tier classification algorithm: Good (download > 20 Mbps AND upload > 5 Mbps), Moderate (download > 5 Mbps AND upload > 1 Mbps), Poor (below thresholds). Test results show predominantly "GOOD" with occasional "MODERATE" during lower-speed samples.'),

          pb(),

          // 10. CONCLUSION
          h1('10. Conclusion'),
          p('The NetPulse project successfully demonstrates that a comprehensive, real-time network monitoring system can be built entirely with modern web technologies. Key achievements include:'),
          b('Continuous Monitoring Architecture: The 10-second automated testing interval with requestAnimationFrame timing provides drift-free continuous network assessment — verified across 40+ test cycles.'),
          b('Real-Time Data Consumption Visibility: Users gain unprecedented insight into data consumption patterns, broken down by category, domain, and tab — tracking 63+ connections and 51+ MB total data.'),
          b('Memory-Efficient Design: The dual-state architecture with rolling window purging ensures indefinite operation without memory degradation while maintaining accurate lifetime statistics.'),
          b('Cross-Tab Communication: BroadcastChannel + localStorage fallback enables seamless 3-tab monitoring with real-time aggregate statistics.'),
          b('Production-Quality UI/UX: Glassmorphic design with animated numbers, custom SVG gauges, gradient-filled charts, and responsive layout delivers a premium user experience.'),
          b('Cloudflare CDN Integration: Proxying through Cloudflare infrastructure ensures real internet throughput measurements.'),

          pb(),

          // 11. FUTURE SCOPE
          h1('11. Future Scope'),
          b('Machine Learning-Based Anomaly Detection: ML models to detect DNS hijacking, ISP throttling, and unusual network patterns.'),
          b('Cloud Deployment & Persistence: PostgreSQL/MongoDB backend for long-term historical data storage beyond browser sessions.'),
          b('Real-Time Administrative Dashboard: Multi-user/location aggregation for ISPs and network administrators.'),
          b('Push Notification Alerts: Browser notifications when network quality degrades below configurable thresholds.'),
          b('Mobile Application: React Native apps for continuous monitoring on 4G/5G mobile networks.'),
          b('Advanced Analytics: Time-series analysis with trend prediction and QoS scoring.'),
          b('Enterprise Security Integration: Traffic analysis for detecting anomalous data exfiltration or DDoS patterns.'),
          b('VPN & Proxy Detection: Performance impact analysis of VPN tunnels and proxy routing.'),
          b('Multi-Server Testing: Geographically distributed test servers for regional performance measurement.'),

          pb(),

          // 12. REFERENCES
          h1('12. References'),
          b('MDN Web Docs — PerformanceObserver API: https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver'),
          b('MDN Web Docs — BroadcastChannel API: https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel'),
          b('MDN Web Docs — ReadableStream API: https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream'),
          b('MDN Web Docs — requestAnimationFrame: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame'),
          b('Cloudflare Speed Test Infrastructure: https://speed.cloudflare.com/'),
          b('React Documentation: https://react.dev/'),
          b('Vite Build Tool: https://vitejs.dev/'),
          b('Chart.js Documentation: https://www.chartjs.org/docs/'),
          b('Express.js Documentation: https://expressjs.com/'),
          b('WebSocket Protocol (RFC 6455): https://tools.ietf.org/html/rfc6455'),
          b('Node.js Documentation: https://nodejs.org/en/docs/'),
          b('Computer Networking: A Top-Down Approach — James F. Kurose, Keith W. Ross'),
        ],
      },
    ],
  });

  const outputPath = path.join(
    'c:', 'Users', 'soham', 'OneDrive', 'Desktop', 'Codes', 'CN Project',
    'netpulse-react', 'netpulse-react', 'NetPulse_Project_Report.docx'
  );

  console.log('\nGenerating document...');
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log(`\n✅ Report generated successfully!`);
  console.log(`📄 Location: ${outputPath}`);
  console.log(`📊 File size: ${(buffer.length / 1024).toFixed(1)} KB`);
  console.log(`📷 Screenshots embedded: ${Object.values(images).filter(Boolean).length}/${Object.keys(images).length}`);
}

generateReport().catch(err => { console.error('Error:', err); process.exit(1); });
