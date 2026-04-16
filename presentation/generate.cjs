const pptxgen = require("pptxgenjs");
const pptx = new pptxgen();

// ── Theme ──
const BG = "0E0E10";
const BG_CARD = "1C1B1D";
const EMERALD = "4EDEA3";
const CYAN = "5DE6FF";
const AMBER = "FFB95F";
const RED = "FF6B6B";
const WHITE = "E5E1E4";
const MUTED = "BBCABF";
const DIM = "7A7872";

pptx.author = "CRACKWATCH Team";
pptx.company = "NIRMAN Hackathon 2026";
pptx.subject = "AI Infrastructure Damage Detection";
pptx.title = "CRACKWATCH — Smart Infrastructure Command Center";

pptx.defineSlideMaster({
  title: "DARK_MASTER",
  background: { color: BG },
  objects: [
    { rect: { x: 0, y: 0, w: "100%", h: 0.05, fill: { color: EMERALD } } },
  ],
});

// ════════════════════════════════════════════════
// SLIDE 1: Title
// ════════════════════════════════════════════════
let slide = pptx.addSlide({ masterName: "DARK_MASTER" });
slide.addText(
  [
    { text: "CRACK", options: { color: WHITE, fontSize: 54, bold: true, fontFace: "Calibri" } },
    { text: "WATCH", options: { color: EMERALD, fontSize: 54, bold: true, fontFace: "Calibri" } },
  ],
  { x: 0.8, y: 1.5, w: 8.4, h: 1.2 }
);
slide.addText("AI-Powered Smart Infrastructure Command Center", {
  x: 0.8, y: 2.7, w: 8.4, h: 0.6, color: MUTED, fontSize: 20, fontFace: "Calibri",
});
slide.addText("NIRMAN Hackathon 2026  •  Amity University Mumbai  •  April 15-17", {
  x: 0.8, y: 3.5, w: 8.4, h: 0.4, color: DIM, fontSize: 12, fontFace: "Calibri",
});
slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 0.8, y: 4.3, w: 2.5, h: 0.5, fill: { color: EMERALD }, rectRadius: 0.15,
});
slide.addText("Problem Statement #4", {
  x: 0.8, y: 4.3, w: 2.5, h: 0.5, color: "002113", fontSize: 11, bold: true, fontFace: "Calibri", align: "center",
});

// ════════════════════════════════════════════════
// SLIDE 2: The Problem
// ════════════════════════════════════════════════
slide = pptx.addSlide({ masterName: "DARK_MASTER" });
slide.addText("The Problem", {
  x: 0.8, y: 0.4, w: 8.4, h: 0.7, color: EMERALD, fontSize: 36, bold: true, fontFace: "Calibri",
});
slide.addText(
  "Every year, thousands of accidents happen due to undetected road damage.\nIndia has 6.4 million km of roads — manual inspection is slow, expensive, and dangerous.",
  { x: 0.8, y: 1.3, w: 8.4, h: 1.0, color: MUTED, fontSize: 16, fontFace: "Calibri", lineSpacingMultiple: 1.5 }
);

// Stats row
const problemStats = [
  { num: "₹33,000 Cr", label: "Annual road\nrepair budget", color: AMBER },
  { num: "73%", label: "Potholes\nnever fixed", color: RED },
  { num: "11,000+", label: "Deaths from\nroad damage/yr", color: RED },
  { num: "30+ days", label: "Avg complaint\nresolution time", color: AMBER },
];
problemStats.forEach((s, i) => {
  const x = 0.8 + i * 2.2;
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x, y: 2.7, w: 2.0, h: 1.8, fill: { color: BG_CARD }, rectRadius: 0.15,
  });
  slide.addText(s.num, { x, y: 2.85, w: 2.0, h: 0.8, color: s.color, fontSize: 24, bold: true, fontFace: "Calibri", align: "center" });
  slide.addText(s.label, { x, y: 3.65, w: 2.0, h: 0.7, color: DIM, fontSize: 10, fontFace: "Calibri", align: "center" });
});

slide.addText("\"What if we could detect and prioritize these issues before they become disasters?\"", {
  x: 0.8, y: 4.8, w: 8.4, h: 0.5, color: WHITE, fontSize: 14, italic: true, fontFace: "Calibri",
});

// ════════════════════════════════════════════════
// SLIDE 3: Our Solution
// ════════════════════════════════════════════════
slide = pptx.addSlide({ masterName: "DARK_MASTER" });
slide.addText("Our Solution", {
  x: 0.8, y: 0.4, w: 8.4, h: 0.7, color: EMERALD, fontSize: 36, bold: true, fontFace: "Calibri",
});
slide.addText(
  "CRACKWATCH doesn't just detect damage — it tells authorities exactly what to fix, when, and at what cost. And it holds them accountable.",
  { x: 0.8, y: 1.2, w: 8.4, h: 0.8, color: MUTED, fontSize: 16, fontFace: "Calibri", lineSpacingMultiple: 1.4 }
);

const solutions = [
  { icon: "🔍", title: "AI Detection", desc: "3 models detect 10+ damage types:\ncracks, potholes, spalling, pipe damage" },
  { icon: "💰", title: "Cost Estimation", desc: "Instant repair cost in ₹ INR\nwith before vs after comparison" },
  { icon: "📋", title: "Repair Plan", desc: "Priority-ranked action plan:\nwhat to fix first, method, crew, time" },
  { icon: "🗺️", title: "Transparency Map", desc: "Citizens track every pothole.\nGovernment can't ignore reports." },
];
solutions.forEach((s, i) => {
  const x = 0.8 + (i % 2) * 4.3;
  const y = 2.3 + Math.floor(i / 2) * 1.5;
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x, y, w: 4.0, h: 1.3, fill: { color: BG_CARD }, rectRadius: 0.15,
  });
  slide.addText(s.icon, { x: x + 0.2, y: y + 0.15, w: 0.6, h: 0.6, fontSize: 22, align: "center" });
  slide.addText(s.title, { x: x + 0.8, y: y + 0.15, w: 3.0, h: 0.35, color: WHITE, fontSize: 14, bold: true, fontFace: "Calibri" });
  slide.addText(s.desc, { x: x + 0.8, y: y + 0.55, w: 3.0, h: 0.6, color: DIM, fontSize: 10, fontFace: "Calibri", lineSpacingMultiple: 1.3 });
});

// ════════════════════════════════════════════════
// SLIDE 4: Dual Platform Architecture
// ════════════════════════════════════════════════
slide = pptx.addSlide({ masterName: "DARK_MASTER" });
slide.addText("Dual Platform Architecture", {
  x: 0.8, y: 0.4, w: 8.4, h: 0.7, color: EMERALD, fontSize: 36, bold: true, fontFace: "Calibri",
});
slide.addText("Two apps. One backend. Complete accountability loop.", {
  x: 0.8, y: 1.1, w: 8.4, h: 0.4, color: MUTED, fontSize: 14, fontFace: "Calibri",
});

// Govt side
slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 0.8, y: 1.8, w: 4.0, h: 2.8, fill: { color: BG_CARD }, rectRadius: 0.15,
});
slide.addText("🏛️ Government App", { x: 0.8, y: 1.9, w: 4.0, h: 0.45, color: EMERALD, fontSize: 16, bold: true, fontFace: "Calibri", align: "center" });
slide.addText("Web Dashboard", { x: 0.8, y: 2.35, w: 4.0, h: 0.3, color: DIM, fontSize: 10, fontFace: "Calibri", align: "center" });
slide.addText(
  "• AI damage detection\n• Cost estimation (₹ INR)\n• Repair plan generator\n• Reports map + admin controls\n• Mark as fixed / in progress",
  { x: 1.1, y: 2.8, w: 3.5, h: 1.6, color: MUTED, fontSize: 11, fontFace: "Calibri", lineSpacingMultiple: 1.5 }
);

// Public side
slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 5.2, y: 1.8, w: 4.0, h: 2.8, fill: { color: BG_CARD }, rectRadius: 0.15,
});
slide.addText("📱 Citizen App", { x: 5.2, y: 1.9, w: 4.0, h: 0.45, color: CYAN, fontSize: 16, bold: true, fontFace: "Calibri", align: "center" });
slide.addText("Mobile PWA", { x: 5.2, y: 2.35, w: 4.0, h: 0.3, color: DIM, fontSize: 10, fontFace: "Calibri", align: "center" });
slide.addText(
  "• Report damage (photo + GPS)\n• Live pothole map\n• Upvote system\n• Transparency dashboard\n• Track fix status",
  { x: 5.5, y: 2.8, w: 3.5, h: 1.6, color: MUTED, fontSize: 11, fontFace: "Calibri", lineSpacingMultiple: 1.5 }
);

// Backend arrow
slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 2.5, y: 4.8, w: 5.0, h: 0.6, fill: { color: "1A1A1C" }, rectRadius: 0.1,
});
slide.addText("⚙️  Shared FastAPI Backend  +  YOLOv8 AI Pipeline  +  JWT Auth", {
  x: 2.5, y: 4.8, w: 5.0, h: 0.6, color: EMERALD, fontSize: 10, bold: true, fontFace: "Calibri", align: "center",
});

// ════════════════════════════════════════════════
// SLIDE 5: AI Pipeline
// ════════════════════════════════════════════════
slide = pptx.addSlide({ masterName: "DARK_MASTER" });
slide.addText("Multi-Model AI Pipeline", {
  x: 0.8, y: 0.4, w: 8.4, h: 0.7, color: EMERALD, fontSize: 36, bold: true, fontFace: "Calibri",
});
slide.addText("3 models running in parallel. Zero API dependency. Fully offline.", {
  x: 0.8, y: 1.1, w: 8.4, h: 0.4, color: MUTED, fontSize: 14, fontFace: "Calibri",
});

const models = [
  { name: "YOLOv8s-RDD", desc: "Road Damage Detection", classes: "Longitudinal Crack, Transverse Crack,\nAlligator Crack, Pothole", color: EMERALD, conf: "72.6%" },
  { name: "YOLOv8s-CrackSeg", desc: "Building Crack Segmentation", classes: "Wall cracks, apartment cracks,\nconcrete surface fractures", color: CYAN, conf: "85%+" },
  { name: "OpenCV Pipeline", desc: "Supplementary Detection", classes: "Spalling, water leaks, corrosion,\npipeline breaks", color: AMBER, conf: "CV-based" },
];
models.forEach((m, i) => {
  const y = 1.8 + i * 1.1;
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.8, y, w: 8.4, h: 0.95, fill: { color: BG_CARD }, rectRadius: 0.12,
  });
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0.8, y, w: 0.08, h: 0.95, fill: { color: m.color } });
  slide.addText(m.name, { x: 1.2, y: y + 0.05, w: 2.5, h: 0.35, color: m.color, fontSize: 14, bold: true, fontFace: "Consolas" });
  slide.addText(m.desc, { x: 1.2, y: y + 0.4, w: 2.5, h: 0.35, color: DIM, fontSize: 10, fontFace: "Calibri" });
  slide.addText(m.classes, { x: 4.0, y: y + 0.1, w: 3.5, h: 0.7, color: MUTED, fontSize: 10, fontFace: "Calibri", lineSpacingMultiple: 1.3 });
  slide.addText(m.conf, { x: 7.8, y: y + 0.2, w: 1.2, h: 0.4, color: m.color, fontSize: 14, bold: true, fontFace: "Calibri", align: "center" });
});

slide.addText("757ms inference  •  10+ damage types  •  Fully local — no internet needed", {
  x: 0.8, y: 4.8, w: 8.4, h: 0.4, color: EMERALD, fontSize: 12, bold: true, fontFace: "Calibri", align: "center",
});

// ════════════════════════════════════════════════
// SLIDE 6: Decision Engine
// ════════════════════════════════════════════════
slide = pptx.addSlide({ masterName: "DARK_MASTER" });
slide.addText("Not Just Detection — A Decision Engine", {
  x: 0.8, y: 0.4, w: 8.4, h: 0.7, color: EMERALD, fontSize: 32, bold: true, fontFace: "Calibri",
});

const pipeline = ["Detect\nDamage", "Score\nSeverity", "Rank\nPriority", "Estimate\nCost", "Show on\nMap", "Generate\nReport"];
pipeline.forEach((step, i) => {
  const x = 0.5 + i * 1.55;
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x, y: 1.5, w: 1.35, h: 1.0, fill: { color: i < 3 ? EMERALD : CYAN }, rectRadius: 0.12,
  });
  slide.addText(step, { x, y: 1.5, w: 1.35, h: 1.0, color: "002113", fontSize: 11, bold: true, fontFace: "Calibri", align: "center", valign: "middle" });
  if (i < 5) {
    slide.addText("→", { x: x + 1.35, y: 1.7, w: 0.2, h: 0.5, color: DIM, fontSize: 16 });
  }
});

slide.addText("Most teams say: \"We detect potholes\"", {
  x: 0.8, y: 3.0, w: 8.4, h: 0.4, color: DIM, fontSize: 14, fontFace: "Calibri",
});
slide.addText("We say: \"We tell governments EXACTLY what to fix tomorrow morning.\"", {
  x: 0.8, y: 3.5, w: 8.4, h: 0.5, color: WHITE, fontSize: 18, bold: true, fontFace: "Calibri",
});

// Cost comparison
slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.8, y: 4.2, w: 2.8, h: 1.0, fill: { color: BG_CARD }, rectRadius: 0.1 });
slide.addText("Fix Now", { x: 0.8, y: 4.2, w: 2.8, h: 0.35, color: EMERALD, fontSize: 10, bold: true, fontFace: "Calibri", align: "center" });
slide.addText("₹47,270", { x: 0.8, y: 4.5, w: 2.8, h: 0.5, color: EMERALD, fontSize: 22, bold: true, fontFace: "Calibri", align: "center" });

slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 3.8, y: 4.2, w: 2.8, h: 1.0, fill: { color: BG_CARD }, rectRadius: 0.1 });
slide.addText("If Ignored (6 months)", { x: 3.8, y: 4.2, w: 2.8, h: 0.35, color: RED, fontSize: 10, bold: true, fontFace: "Calibri", align: "center" });
slide.addText("₹1,89,080", { x: 3.8, y: 4.5, w: 2.8, h: 0.5, color: RED, fontSize: 22, bold: true, fontFace: "Calibri", align: "center" });

slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 6.8, y: 4.2, w: 2.4, h: 1.0, fill: { color: BG_CARD }, rectRadius: 0.1 });
slide.addText("You Save", { x: 6.8, y: 4.2, w: 2.4, h: 0.35, color: CYAN, fontSize: 10, bold: true, fontFace: "Calibri", align: "center" });
slide.addText("₹1,41,810", { x: 6.8, y: 4.5, w: 2.4, h: 0.5, color: CYAN, fontSize: 22, bold: true, fontFace: "Calibri", align: "center" });

// ════════════════════════════════════════════════
// SLIDE 7: Transparency & Accountability
// ════════════════════════════════════════════════
slide = pptx.addSlide({ masterName: "DARK_MASTER" });
slide.addText("Transparency Drives Accountability", {
  x: 0.8, y: 0.4, w: 8.4, h: 0.7, color: EMERALD, fontSize: 36, bold: true, fontFace: "Calibri",
});

slide.addText(
  "The citizen app creates PUBLIC pressure on the government.\nEvery unfixed pothole is visible to everyone. Every delay is tracked.",
  { x: 0.8, y: 1.3, w: 8.4, h: 0.7, color: MUTED, fontSize: 14, fontFace: "Calibri", lineSpacingMultiple: 1.5 }
);

const flow = [
  { step: "1", text: "Citizen takes photo\nof pothole", color: CYAN },
  { step: "2", text: "AI auto-detects\ndamage type + severity", color: EMERALD },
  { step: "3", text: "Report appears on\npublic map + govt dashboard", color: AMBER },
  { step: "4", text: "Government marks\nas fixed", color: EMERALD },
  { step: "5", text: "Citizen sees green pin\n→ accountability complete", color: EMERALD },
];
flow.forEach((f, i) => {
  const x = 0.3 + i * 1.9;
  slide.addShape(pptx.shapes.OVAL, { x: x + 0.55, y: 2.4, w: 0.5, h: 0.5, fill: { color: f.color } });
  slide.addText(f.step, { x: x + 0.55, y: 2.4, w: 0.5, h: 0.5, color: "002113", fontSize: 14, bold: true, fontFace: "Calibri", align: "center", valign: "middle" });
  slide.addText(f.text, { x, y: 3.1, w: 1.7, h: 0.7, color: MUTED, fontSize: 9, fontFace: "Calibri", align: "center", lineSpacingMultiple: 1.3 });
});

slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 1.5, y: 4.2, w: 7.0, h: 1.0, fill: { color: BG_CARD }, rectRadius: 0.15 });
slide.addText(
  "\"One app tells the government what to fix.\nThe other tells the public what they haven't fixed.\"",
  { x: 1.5, y: 4.2, w: 7.0, h: 1.0, color: WHITE, fontSize: 16, italic: true, fontFace: "Calibri", align: "center", valign: "middle" }
);

// ════════════════════════════════════════════════
// SLIDE 8: Tech Stack
// ════════════════════════════════════════════════
slide = pptx.addSlide({ masterName: "DARK_MASTER" });
slide.addText("Tech Stack", {
  x: 0.8, y: 0.4, w: 8.4, h: 0.7, color: EMERALD, fontSize: 36, bold: true, fontFace: "Calibri",
});

const stacks = [
  { cat: "AI / ML", items: "YOLOv8s (2 models) • OpenCV • Ultralytics", color: EMERALD },
  { cat: "Backend", items: "Python • FastAPI • JWT Auth • Uvicorn", color: CYAN },
  { cat: "Frontend (Govt)", items: "React • Vite • Tailwind • shadcn/ui • Framer Motion", color: AMBER },
  { cat: "Frontend (Public)", items: "React • Leaflet Maps • Framer Motion • PWA", color: CYAN },
  { cat: "Design", items: "Google Stitch MCP • Space Grotesk + Geist fonts", color: EMERALD },
  { cat: "Data", items: "RDD2022 Dataset (4.8K images) • HuggingFace models", color: AMBER },
];
stacks.forEach((s, i) => {
  const y = 1.3 + i * 0.65;
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0.8, y, w: 0.08, h: 0.5, fill: { color: s.color } });
  slide.addText(s.cat, { x: 1.1, y, w: 2.0, h: 0.5, color: s.color, fontSize: 12, bold: true, fontFace: "Calibri", valign: "middle" });
  slide.addText(s.items, { x: 3.2, y, w: 6.0, h: 0.5, color: MUTED, fontSize: 11, fontFace: "Calibri", valign: "middle" });
});

// ════════════════════════════════════════════════
// SLIDE 9: Explainable AI
// ════════════════════════════════════════════════
slide = pptx.addSlide({ masterName: "DARK_MASTER" });
slide.addText("Explainable AI — Trustworthy Results", {
  x: 0.8, y: 0.4, w: 8.4, h: 0.7, color: EMERALD, fontSize: 32, bold: true, fontFace: "Calibri",
});
slide.addText("Every detection tells you WHY it was flagged — not just what was found.", {
  x: 0.8, y: 1.1, w: 8.4, h: 0.4, color: MUTED, fontSize: 14, fontFace: "Calibri",
});

slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.8, y: 1.8, w: 8.4, h: 3.0, fill: { color: BG_CARD }, rectRadius: 0.15 });
slide.addText("Severity: 62.6% = WARNING", { x: 1.2, y: 2.0, w: 7.5, h: 0.4, color: AMBER, fontSize: 16, bold: true, fontFace: "Consolas" });
slide.addText(
  "Because:\n" +
  "  ● Large damage area — covers 44.5% of inspected region           [HIGH IMPACT]\n" +
  "  ● Moderate confidence — AI is 73% certain                                    [MEDIUM]\n" +
  "  ● High-risk damage type — Alligator Crack (structural failure)  [HIGH IMPACT]\n\n" +
  "Recommendation: Schedule repair within 30 days. Delay increases cost by 4x.",
  { x: 1.2, y: 2.5, w: 7.5, h: 2.0, color: MUTED, fontSize: 11, fontFace: "Consolas", lineSpacingMultiple: 1.5 }
);

// ════════════════════════════════════════════════
// SLIDE 10: Impact
// ════════════════════════════════════════════════
slide = pptx.addSlide({ masterName: "DARK_MASTER" });
slide.addText("Impact & Scalability", {
  x: 0.8, y: 0.4, w: 8.4, h: 0.7, color: EMERALD, fontSize: 36, bold: true, fontFace: "Calibri",
});

const impacts = [
  { num: "70%", label: "Reduction in\ninspection costs", color: EMERALD },
  { num: "4x", label: "Faster damage\nidentification", color: CYAN },
  { num: "₹2L+", label: "Savings per road\nif fixed early", color: AMBER },
  { num: "100%", label: "Public transparency\non govt performance", color: EMERALD },
];
impacts.forEach((imp, i) => {
  const x = 0.5 + i * 2.3;
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y: 1.5, w: 2.1, h: 1.8, fill: { color: BG_CARD }, rectRadius: 0.15 });
  slide.addText(imp.num, { x, y: 1.7, w: 2.1, h: 0.7, color: imp.color, fontSize: 32, bold: true, fontFace: "Calibri", align: "center" });
  slide.addText(imp.label, { x, y: 2.5, w: 2.1, h: 0.6, color: DIM, fontSize: 11, fontFace: "Calibri", align: "center" });
});

slide.addText("Scalable to any municipality  •  Works offline  •  No cloud costs  •  Open source", {
  x: 0.8, y: 3.8, w: 8.4, h: 0.4, color: MUTED, fontSize: 12, fontFace: "Calibri", align: "center",
});

slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 1.5, y: 4.4, w: 7.0, h: 0.8, fill: { color: BG_CARD }, rectRadius: 0.12 });
slide.addText("\"Reduces inspection cost by 70%. Enables proactive maintenance. Prevents accidents before they happen.\"", {
  x: 1.5, y: 4.4, w: 7.0, h: 0.8, color: EMERALD, fontSize: 12, italic: true, fontFace: "Calibri", align: "center", valign: "middle",
});

// ════════════════════════════════════════════════
// SLIDE 11: Demo Flow
// ════════════════════════════════════════════════
slide = pptx.addSlide({ masterName: "DARK_MASTER" });
slide.addText("Live Demo", {
  x: 0.8, y: 0.4, w: 8.4, h: 0.7, color: EMERALD, fontSize: 36, bold: true, fontFace: "Calibri",
});

const demoSteps = [
  "Login as Government Inspector → Command Center loads",
  "Upload road damage photo → AI detects 3 crack types instantly",
  "View severity scoring + cost estimation (₹ INR)",
  "Open Repair Plan → priority-ranked action items",
  "Switch to citizen phone app → report pothole with GPS",
  "Report appears on govt Reports Map → click 'Mark Fixed'",
  "Citizen sees green pin → accountability loop complete",
  "Export printable report for municipal records",
];
demoSteps.forEach((step, i) => {
  const y = 1.3 + i * 0.47;
  slide.addShape(pptx.shapes.OVAL, { x: 0.9, y: y + 0.05, w: 0.35, h: 0.35, fill: { color: i < 4 ? EMERALD : CYAN } });
  slide.addText(`${i + 1}`, { x: 0.9, y: y + 0.05, w: 0.35, h: 0.35, color: "002113", fontSize: 10, bold: true, fontFace: "Calibri", align: "center", valign: "middle" });
  slide.addText(step, { x: 1.5, y, w: 7.5, h: 0.4, color: MUTED, fontSize: 12, fontFace: "Calibri", valign: "middle" });
});

// ════════════════════════════════════════════════
// SLIDE 12: Thank You
// ════════════════════════════════════════════════
slide = pptx.addSlide({ masterName: "DARK_MASTER" });
slide.addText(
  [
    { text: "CRACK", options: { color: WHITE, fontSize: 48, bold: true, fontFace: "Calibri" } },
    { text: "WATCH", options: { color: EMERALD, fontSize: 48, bold: true, fontFace: "Calibri" } },
  ],
  { x: 0.8, y: 1.2, w: 8.4, h: 1.0, align: "center" }
);
slide.addText("Smart Infrastructure for All", {
  x: 0.8, y: 2.2, w: 8.4, h: 0.5, color: MUTED, fontSize: 18, fontFace: "Calibri", align: "center",
});

slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 3.0, y: 3.2, w: 4.0, h: 0.5, fill: { color: EMERALD }, rectRadius: 0.15 });
slide.addText("github.com/SaudSatopay/CrackWatch-NirmanHackathon", {
  x: 3.0, y: 3.2, w: 4.0, h: 0.5, color: "002113", fontSize: 9, bold: true, fontFace: "Consolas", align: "center",
});

slide.addText("Thank you! Questions?", {
  x: 0.8, y: 4.2, w: 8.4, h: 0.6, color: WHITE, fontSize: 24, bold: true, fontFace: "Calibri", align: "center",
});
slide.addText("NIRMAN Hackathon 2026  •  Amity University Mumbai", {
  x: 0.8, y: 4.8, w: 8.4, h: 0.4, color: DIM, fontSize: 11, fontFace: "Calibri", align: "center",
});

// ── Save ──
const outputPath = process.argv[2] || "CRACKWATCH_Presentation.pptx";
pptx.writeFile({ fileName: outputPath }).then(() => {
  console.log(`Presentation saved to: ${outputPath}`);
});
