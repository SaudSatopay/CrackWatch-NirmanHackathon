import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Camera,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  AlertTriangle,
  X,
  Maximize2,
  ZoomIn,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function ScanLine({ isScanning }) {
  if (!isScanning) return null;
  return (
    <motion.div
      className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent z-20 pointer-events-none"
      initial={{ top: "0%" }}
      animate={{ top: ["0%", "100%", "0%"] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
    >
      <div className="absolute inset-x-0 -top-8 h-16 bg-gradient-to-b from-transparent via-emerald-400/10 to-transparent" />
    </motion.div>
  );
}

function DetectionOverlay({ results }) {
  const boxes = [
    { x: "10%", y: "8%", w: "35%", h: "30%", severity: "critical" },
    { x: "35%", y: "40%", w: "30%", h: "20%", severity: "moderate" },
    { x: "60%", y: "65%", w: "25%", h: "15%", severity: "minor" },
  ];

  return (
    <>
      {results.map((result, i) => (
        <motion.div
          key={result.id}
          className={`absolute border-2 rounded-sm z-10 ${
            result.severity === "critical"
              ? "border-red-500/80"
              : result.severity === "moderate"
              ? "border-amber-500/80"
              : "border-yellow-500/80"
          }`}
          style={{
            left: boxes[i]?.x,
            top: boxes[i]?.y,
            width: boxes[i]?.w,
            height: boxes[i]?.h,
          }}
          initial={{ opacity: 0, scale: 1.2 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.3, duration: 0.4 }}
        >
          {/* Corner markers */}
          <div
            className={`absolute -top-0.5 -left-0.5 w-3 h-3 border-t-2 border-l-2 ${
              result.severity === "critical"
                ? "border-red-400"
                : result.severity === "moderate"
                ? "border-amber-400"
                : "border-yellow-400"
            }`}
          />
          <div
            className={`absolute -top-0.5 -right-0.5 w-3 h-3 border-t-2 border-r-2 ${
              result.severity === "critical"
                ? "border-red-400"
                : result.severity === "moderate"
                ? "border-amber-400"
                : "border-yellow-400"
            }`}
          />
          <div
            className={`absolute -bottom-0.5 -left-0.5 w-3 h-3 border-b-2 border-l-2 ${
              result.severity === "critical"
                ? "border-red-400"
                : result.severity === "moderate"
                ? "border-amber-400"
                : "border-yellow-400"
            }`}
          />
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-b-2 border-r-2 ${
              result.severity === "critical"
                ? "border-red-400"
                : result.severity === "moderate"
                ? "border-amber-400"
                : "border-yellow-400"
            }`}
          />

          {/* Label */}
          <motion.div
            className={`absolute -top-6 left-0 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
              result.severity === "critical"
                ? "bg-red-500 text-white"
                : result.severity === "moderate"
                ? "bg-amber-500 text-black"
                : "bg-yellow-500 text-black"
            }`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.3 + 0.2 }}
          >
            {result.severity} — {result.confidence}%
          </motion.div>

          {/* Pulse effect */}
          <motion.div
            className={`absolute inset-0 ${
              result.severity === "critical"
                ? "bg-red-500/5"
                : result.severity === "moderate"
                ? "bg-amber-500/5"
                : "bg-yellow-500/5"
            }`}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      ))}
    </>
  );
}

export default function ScanZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [annotatedImage, setAnnotatedImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [scanPhase, setScanPhase] = useState("");
  const [inferenceTime, setInferenceTime] = useState(null);
  const [apiStats, setApiStats] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files[0] || e.target?.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setUploadedImage(url);
      setUploadedFile(file);
      setResults(null);
      setAnnotatedImage(null);
    }
  }, []);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setUploadedImage(url);
      setUploadedFile(file);
      setResults(null);
      setAnnotatedImage(null);
    }
  }, []);

  const startScan = async () => {
    if (!uploadedFile && !uploadedImage) return;

    setIsScanning(true);
    setScanProgress(0);
    setResults(null);
    setAnnotatedImage(null);

    const phases = [
      "Initializing YOLOv8 neural network...",
      "Preprocessing image...",
      "Running inference pipeline...",
      "Analyzing crack patterns...",
      "Computing severity scores...",
      "Generating report...",
    ];

    // Animate progress while API runs
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress = Math.min(progress + 2, 90);
      setScanProgress(progress);
      const phaseIndex = Math.floor((progress / 100) * phases.length);
      setScanPhase(phases[Math.min(phaseIndex, phases.length - 1)]);
    }, 100);

    try {
      const formData = new FormData();

      if (uploadedFile) {
        formData.append('file', uploadedFile);
      } else {
        // Demo image — convert SVG data URL to a blob
        const resp = await fetch(uploadedImage);
        const blob = await resp.blob();
        formData.append('file', blob, 'demo.png');
      }
      formData.append('confidence', '0.15');

      const res = await fetch(`${API_URL}/detect`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json();
      setScanProgress(100);
      setScanPhase("Analysis complete!");
      setInferenceTime(data.inference_time_ms);
      setApiStats(data.stats);

      // Map API detections to the UI format
      const mappedResults = data.detections.map((det, i) => ({
        id: i + 1,
        severity: det.severity_label === 'critical' ? 'critical' : det.severity_label === 'warning' ? 'moderate' : 'minor',
        type: det.display_name,
        confidence: +(det.confidence * 100).toFixed(1),
        location: `Region ${i + 1}`,
        width: `${det.area_ratio}%`,
        length: `${det.severity}%`,
        bbox: det.bbox,
        severityScore: det.severity,
      }));

      // Set annotated image from API
      if (data.annotated_image) {
        setAnnotatedImage(`data:image/jpeg;base64,${data.annotated_image}`);
      }

      setTimeout(() => {
        setIsScanning(false);
        setResults(mappedResults.length > 0 ? mappedResults : null);
        if (mappedResults.length === 0) {
          setScanPhase("No damage detected — structure appears healthy");
        }
      }, 500);

    } catch (err) {
      clearInterval(progressInterval);
      console.error('Detection error:', err);
      setScanProgress(100);
      setScanPhase(`Error: ${err.message}. Is the backend running?`);
      setTimeout(() => setIsScanning(false), 2000);
    }
  };

  const resetScan = () => {
    setUploadedImage(null);
    setUploadedFile(null);
    setAnnotatedImage(null);
    setResults(null);
    setIsScanning(false);
    setScanProgress(0);
    setInferenceTime(null);
    setApiStats(null);
  };

  // Load a demo image on mount
  const loadDemo = () => {
    setUploadedImage(
      "data:image/svg+xml," +
        encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
        <rect fill="#1a1a2e" width="800" height="600"/>
        <rect fill="#16213e" x="20" y="20" width="760" height="560" rx="4"/>
        <!-- Concrete texture -->
        <filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4"/><feColorMatrix type="saturate" values="0"/></filter>
        <rect width="800" height="600" filter="url(#noise)" opacity="0.08"/>
        <!-- Cracks -->
        <path d="M80 50 L150 120 L180 180 L200 260 L190 300" stroke="#ef4444" stroke-width="3" fill="none" opacity="0.8"/>
        <path d="M150 120 L220 140 L280 130" stroke="#ef4444" stroke-width="2" fill="none" opacity="0.6"/>
        <path d="M320 250 L380 280 L420 310 L440 350" stroke="#f59e0b" stroke-width="2" fill="none" opacity="0.7"/>
        <path d="M380 280 L400 260 L450 270" stroke="#f59e0b" stroke-width="1.5" fill="none" opacity="0.5"/>
        <path d="M520 420 L560 440 L600 445 L640 460" stroke="#eab308" stroke-width="1.5" fill="none" opacity="0.6"/>
        <!-- Grid overlay -->
        <line x1="0" y1="200" x2="800" y2="200" stroke="#334155" stroke-width="0.5" stroke-dasharray="4"/>
        <line x1="0" y1="400" x2="800" y2="400" stroke="#334155" stroke-width="0.5" stroke-dasharray="4"/>
        <line x1="266" y1="0" x2="266" y2="600" stroke="#334155" stroke-width="0.5" stroke-dasharray="4"/>
        <line x1="533" y1="0" x2="533" y2="600" stroke="#334155" stroke-width="0.5" stroke-dasharray="4"/>
      </svg>
    `)
    );
    setResults(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Main scan area */}
      <div className="lg:col-span-3">
        <motion.div
          className={`relative rounded-xl overflow-hidden border-2 border-dashed transition-colors ${
            isDragging
              ? "border-emerald-500 bg-emerald-500/5"
              : uploadedImage
              ? "border-zinc-700 bg-zinc-900"
              : "border-zinc-700/50 bg-zinc-900/50"
          }`}
          style={{ minHeight: 400 }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          {!uploadedImage ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8">
              <motion.div
                className="w-20 h-20 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center mb-6"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Upload className="w-8 h-8 text-zinc-500" />
              </motion.div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Drop image to analyze
              </h3>
              <p className="text-sm text-zinc-500 mb-6 text-center max-w-sm">
                Upload a photo of a surface to detect cracks, fractures, and
                structural damage using AI
              </p>
              <div className="flex gap-3">
                <motion.button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-lg bg-emerald-500 text-black text-sm font-semibold hover:bg-emerald-400 transition-colors flex items-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ImageIcon className="w-4 h-4" />
                  Browse Files
                </motion.button>
                <motion.button
                  onClick={loadDemo}
                  className="px-4 py-2.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors flex items-center gap-2 border border-zinc-700"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Camera className="w-4 h-4" />
                  Load Demo
                </motion.button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          ) : (
            <div className="relative min-h-[400px]">
              <img
                src={annotatedImage || uploadedImage}
                alt="Scan target"
                className="w-full h-full object-cover min-h-[400px]"
              />

              {/* Scan line animation */}
              <ScanLine isScanning={isScanning} />

              {/* Detection boxes */}
              {results && <DetectionOverlay results={results} />}

              {/* Grid overlay during scan */}
              {isScanning && (
                <motion.div
                  className="absolute inset-0 pointer-events-none z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                >
                  <svg className="w-full h-full">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <line
                        key={`h${i}`}
                        x1="0"
                        y1={`${(i + 1) * 11.1}%`}
                        x2="100%"
                        y2={`${(i + 1) * 11.1}%`}
                        stroke="#10b981"
                        strokeWidth="0.5"
                        strokeDasharray="4"
                        opacity="0.3"
                      />
                    ))}
                    {Array.from({ length: 8 }).map((_, i) => (
                      <line
                        key={`v${i}`}
                        x1={`${(i + 1) * 11.1}%`}
                        y1="0"
                        x2={`${(i + 1) * 11.1}%`}
                        y2="100%"
                        stroke="#10b981"
                        strokeWidth="0.5"
                        strokeDasharray="4"
                        opacity="0.3"
                      />
                    ))}
                  </svg>
                </motion.div>
              )}

              {/* Controls overlay */}
              <div className="absolute top-3 right-3 flex gap-2 z-30">
                <motion.button
                  onClick={resetScan}
                  className="p-2 rounded-lg bg-black/60 backdrop-blur-sm text-zinc-300 hover:text-white hover:bg-black/80 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Scan progress bar */}
              {isScanning && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-30"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                    <span className="text-xs text-emerald-400 font-mono">
                      {scanPhase}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-zinc-500">
                      Processing
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {scanProgress}%
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Scan button */}
              {!isScanning && !results && (
                <motion.div
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <motion.button
                    onClick={startScan}
                    className="px-6 py-3 rounded-xl bg-emerald-500 text-black font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/25"
                    whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(16,185,129,0.3)" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ScanLine className="w-5 h-5" />
                    Start AI Scan
                  </motion.button>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Results panel */}
      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-xl bg-zinc-900/50 border border-zinc-800/50 p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Detection Results
          </h3>

          <AnimatePresence mode="wait">
            {!uploadedImage ? (
              <motion.div
                key="empty"
                className="text-center py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="w-12 h-12 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-3">
                  <ZoomIn className="w-5 h-5 text-zinc-600" />
                </div>
                <p className="text-xs text-zinc-600">
                  Upload an image to begin analysis
                </p>
              </motion.div>
            ) : isScanning ? (
              <motion.div
                key="scanning"
                className="space-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-24 bg-zinc-800 rounded animate-pulse" />
                      <div className="h-2 w-16 bg-zinc-800 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : results ? (
              <motion.div
                key="results"
                className="space-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {results.map((result, i) => (
                  <motion.div
                    key={result.id}
                    className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/30 hover:border-zinc-600/50 transition-colors cursor-pointer group"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.15 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            result.severity === "critical"
                              ? "bg-red-500"
                              : result.severity === "moderate"
                              ? "bg-amber-500"
                              : "bg-yellow-500"
                          }`}
                        />
                        <span className="text-xs font-semibold text-white">
                          {result.type}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          result.severity === "critical"
                            ? "bg-red-500/10 text-red-400"
                            : result.severity === "moderate"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-yellow-500/10 text-yellow-400"
                        }`}
                      >
                        {result.severity}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-zinc-500">Confidence</span>
                        <p className="text-zinc-300 font-mono">
                          {result.confidence}%
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-500">Location</span>
                        <p className="text-zinc-300">{result.location}</p>
                      </div>
                      <div>
                        <span className="text-zinc-500">Width</span>
                        <p className="text-zinc-300 font-mono">
                          {result.width}
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-500">Length</span>
                        <p className="text-zinc-300 font-mono">
                          {result.length}
                        </p>
                      </div>
                    </div>

                    {/* Confidence bar */}
                    <div className="mt-2 w-full h-1 rounded-full bg-zinc-700 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          result.severity === "critical"
                            ? "bg-red-500"
                            : result.severity === "moderate"
                            ? "bg-amber-500"
                            : "bg-yellow-500"
                        }`}
                        initial={{ width: "0%" }}
                        animate={{ width: `${result.confidence}%` }}
                        transition={{ delay: i * 0.15 + 0.3, duration: 0.8 }}
                      />
                    </div>
                  </motion.div>
                ))}

                {/* Summary */}
                <motion.div
                  className={`mt-4 p-3 rounded-lg border ${
                    apiStats?.critical_count > 0
                      ? 'bg-red-500/5 border-red-500/10'
                      : apiStats?.warning_count > 0
                      ? 'bg-amber-500/5 border-amber-500/10'
                      : 'bg-emerald-500/5 border-emerald-500/10'
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {apiStats?.critical_count > 0 ? (
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    )}
                    <span className={`text-xs font-semibold ${
                      apiStats?.critical_count > 0 ? 'text-red-400' : apiStats?.warning_count > 0 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {apiStats?.critical_count > 0 ? 'Action Required' : apiStats?.warning_count > 0 ? 'Monitor Recommended' : 'Structure Healthy'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {results.length} defect{results.length !== 1 ? 's' : ''} detected.
                    {apiStats ? ` Structural integrity: ${apiStats.structural_integrity}%.` : ''}
                    {inferenceTime ? ` Analyzed in ${inferenceTime}ms.` : ''}
                    {apiStats?.critical_count > 0 ? ' Immediate inspection recommended.' : ''}
                  </p>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="ready"
                className="text-center py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <CheckCircle className="w-8 h-8 text-emerald-400/30 mx-auto mb-2" />
                <p className="text-xs text-zinc-500">
                  Image loaded. Click "Start AI Scan" to analyze.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Activity(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
    </svg>
  );
}

function ScanLine2(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <path d="M7 12h10" />
    </svg>
  );
}
