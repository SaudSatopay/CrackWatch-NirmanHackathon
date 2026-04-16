import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, MapPin, Send, CheckCircle, Loader2, ImagePlus, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ReportPage() {
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [description, setDescription] = useState('');
  const [sector, setSector] = useState(null);
  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  const getLocation = () => {
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); },
        () => { setLocation({ lat: 19.033, lng: 73.030 }); setLocating(false); }
      );
    } else {
      setLocation({ lat: 19.033, lng: 73.030 }); setLocating(false);
    }
  };

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (file) { setImage(URL.createObjectURL(file)); setImageFile(file); if (!location) getLocation(); }
  };

  const submit = async () => {
    if (!imageFile || !location) return;
    setSubmitting(true);
    const fd = new FormData();
    fd.append('file', imageFile);
    fd.append('latitude', location.lat);
    fd.append('longitude', location.lng);
    fd.append('sector', sector);
    fd.append('description', description);
    fd.append('reporter_name', 'Citizen');
    fd.append('location_name', 'Reported via App');
    try {
      const res = await fetch(`${API_URL}/public/report`, { method: 'POST', body: fd });
      const data = await res.json();
      // Fetch full report with annotated image for preview
      if (data.id) {
        try {
          const detail = await fetch(`${API_URL}/public/reports/${data.id}`);
          const fullReport = await detail.json();
          data.annotated_image = fullReport.annotated_image;
          data.detections = fullReport.detections;
          data.stats = fullReport.stats;
        } catch {}
      }
      setResult(data);
    } catch { setResult({ error: true, message: 'Server not reachable' }); }
    finally { setSubmitting(false); }
  };

  const reset = () => { setImage(null); setImageFile(null); setDescription(''); setLocation(null); setResult(null); };

  // Success screen with full report preview
  if (result && !result.error) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="px-5 pt-5 pb-8 space-y-4">
          {/* Success header */}
          <motion.div className="text-center" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-16 h-16 rounded-full bg-[#69db7c]/10 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8 text-[#69db7c]" />
            </div>
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Space Grotesk' }}>Report Submitted!</h2>
            <p className="text-xs text-white/40 mt-1">ID: <span className="text-[#74c0fc] font-mono">{result.id}</span></p>
          </motion.div>

          {/* Annotated image preview */}
          {result.annotated_image && (
            <motion.div className="rounded-xl overflow-hidden" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <img src={`data:image/jpeg;base64,${result.annotated_image}`} alt="AI Detection" className="w-full h-48 object-cover" />
            </motion.div>
          )}

          {/* Detection results */}
          <motion.div className="space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
            <p className="text-[10px] text-white/30 uppercase tracking-[0.15em] font-bold">AI Detection Results</p>
            {result.detections?.map((det, i) => (
              <div key={i} className="bg-white/[0.03] rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{det.display_name || det.class_name}</p>
                  <p className="text-[10px] text-white/30">Confidence: {(det.confidence * 100).toFixed(0)}%</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold ${det.severity_label === 'critical' ? 'text-[#ff6b6b]' : det.severity_label === 'warning' ? 'text-[#ffa94d]' : 'text-[#69db7c]'}`}>
                    {det.severity?.toFixed(0)}%
                  </span>
                  <p className="text-[9px] text-white/20">severity</p>
                </div>
              </div>
            )) || (
              <div className="flex justify-center gap-3">
                {result.severity_summary?.critical > 0 && <span className="px-2 py-1 rounded-full bg-[#ff6b6b]/10 text-[#ff6b6b] text-[11px] font-bold">{result.severity_summary.critical} Critical</span>}
                {result.severity_summary?.warning > 0 && <span className="px-2 py-1 rounded-full bg-[#ffa94d]/10 text-[#ffa94d] text-[11px] font-bold">{result.severity_summary.warning} Warning</span>}
                {result.severity_summary?.minor > 0 && <span className="px-2 py-1 rounded-full bg-white/5 text-white/50 text-[11px] font-bold">{result.severity_summary.minor} Minor</span>}
              </div>
            )}
          </motion.div>

          {/* Cost estimate if available */}
          {result.detections?.[0]?.cost && (
            <motion.div className="bg-[#ffa94d]/[0.05] rounded-xl p-3 border border-[#ffa94d]/10"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
              <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold mb-1">Estimated Repair Cost</p>
              <p className="text-xl font-bold text-[#ffa94d]" style={{ fontFamily: 'Space Grotesk' }}>
                ₹{result.detections.reduce((s, d) => s + (d.cost?.cost_estimated || 0), 0).toLocaleString('en-IN')}
              </p>
            </motion.div>
          )}

          {/* Status */}
          <motion.div className="bg-[#4edea3]/[0.05] rounded-xl p-3 border border-[#4edea3]/10 text-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <p className="text-xs text-[#4edea3] font-semibold">✓ Authorities have been notified</p>
            <p className="text-[10px] text-white/30 mt-0.5">Track status on the Map tab</p>
          </motion.div>

          {/* Report another */}
          <motion.button onClick={reset} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#4edea3] to-[#10b981] text-[#002113] font-bold text-sm"
            whileTap={{ scale: 0.97 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            Report Another
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 bg-gradient-to-b from-[#131315] to-transparent sticky top-0 z-10">
        <h1 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
          Report Damage
        </h1>
        <p className="text-[12px] text-white/40 mt-0.5">AI auto-detects damage type & severity</p>
      </div>

      <div className="px-5 pb-8 space-y-5">
        {/* Sector picker — must choose first */}
        {!sector ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <label className="text-[11px] text-white/40 uppercase tracking-[0.15em] font-bold mb-3 block">What are you reporting?</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'road', emoji: '🛣️', label: 'Road', desc: 'Potholes & cracks' },
                { id: 'building', emoji: '🏢', label: 'Building', desc: 'Wall cracks' },
                { id: 'pipeline', emoji: '🔧', label: 'Pipeline', desc: 'Leaks & breaks' },
                { id: 'bridge', emoji: '🌉', label: 'Bridge', desc: 'Structural damage' },
              ].map((s, i) => (
                <motion.button key={s.id} onClick={() => setSector(s.id)}
                  className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-[#4edea3]/30 hover:bg-[#4edea3]/5 transition-all text-left"
                  initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  whileTap={{ scale: 0.97 }}>
                  <span className="text-2xl block mb-2">{s.emoji}</span>
                  <h4 className="text-sm font-bold text-white">{s.label}</h4>
                  <p className="text-[10px] text-white/30 mt-0.5">{s.desc}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
        <>
        {/* Sector badge */}
        <div className="flex items-center justify-between">
          <span className="px-3 py-1.5 rounded-lg bg-[#4edea3]/10 text-[#4edea3] text-xs font-bold border border-[#4edea3]/20">
            {sector === 'road' ? '🛣️ Road' : sector === 'building' ? '🏢 Building' : sector === 'pipeline' ? '🔧 Pipeline' : '🌉 Bridge'}
          </span>
          <button onClick={() => setSector(null)} className="text-xs text-white/30 underline">Change</button>
        </div>

        {/* Photo upload */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <label className="text-[10px] text-white/30 uppercase tracking-[0.15em] font-bold mb-2 block">Photo</label>
          {image ? (
            <div className="relative rounded-2xl overflow-hidden h-48">
              <img src={image} alt="Upload" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <button onClick={() => { setImage(null); setImageFile(null); }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
                <X className="w-4 h-4 text-white" />
              </button>
              <div className="absolute bottom-3 left-3 px-2 py-1 rounded-full bg-[#4edea3]/20 text-[#4edea3] text-[10px] font-bold">
                ✓ Photo ready
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full h-40 rounded-2xl border-2 border-dashed border-white/[0.08] bg-white/[0.02] flex flex-col items-center justify-center gap-3 active:bg-white/[0.04] transition-colors"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center">
                <Camera className="w-7 h-7 text-[#4edea3]" />
              </div>
              <div className="text-center">
                <p className="text-[13px] font-semibold text-white">Tap to take photo</p>
                <p className="text-[11px] text-white/30 mt-0.5">or choose from gallery</p>
              </div>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImage} />
        </motion.div>

        {/* GPS */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <label className="text-[10px] text-white/30 uppercase tracking-[0.15em] font-bold mb-2 block">Location</label>
          {location ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03]">
              <div className="w-8 h-8 rounded-lg bg-[#4edea3]/10 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-[#4edea3]" />
              </div>
              <div className="flex-1">
                <p className="text-[12px] text-white font-mono">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
              </div>
              <span className="text-[10px] text-[#4edea3] font-bold">✓ GPS</span>
            </div>
          ) : (
            <button onClick={getLocation}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.03] text-white/40 text-[13px] font-medium active:bg-white/[0.06] transition-colors">
              {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
              {locating ? 'Getting location...' : 'Get GPS Location'}
            </button>
          )}
        </motion.div>

        {/* Description */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <label className="text-[10px] text-white/30 uppercase tracking-[0.15em] font-bold mb-2 block">Description <span className="text-white/15">(optional)</span></label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g., Large pothole near bus stop..."
            className="w-full px-4 py-3 rounded-xl bg-white/[0.03] text-[13px] text-white placeholder-white/15 outline-none resize-none h-24 focus:ring-1 focus:ring-[#4edea3]/30 transition-all"
          />
        </motion.div>

        {/* Submit */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <motion.button
            onClick={submit}
            disabled={!imageFile || !location || submitting}
            className={`w-full py-4 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 transition-all ${
              imageFile && location && !submitting
                ? 'bg-gradient-to-r from-[#4edea3] to-[#10b981] text-[#002113] shadow-lg shadow-[#4edea3]/20'
                : 'bg-white/[0.04] text-white/20'
            }`}
            whileTap={imageFile && location ? { scale: 0.98 } : {}}
          >
            {submitting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing with AI...</>
            ) : (
              <><Send className="w-5 h-5" /> Submit Report</>
            )}
          </motion.button>
        </motion.div>

        {result?.error && (
          <div className="p-4 rounded-xl bg-[#ff6b6b]/5 border border-[#ff6b6b]/10 text-[#ff6b6b] text-[12px] text-center">
            {result.message}
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}
