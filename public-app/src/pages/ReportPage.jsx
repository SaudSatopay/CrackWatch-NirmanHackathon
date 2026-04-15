import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, MapPin, Send, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ReportPage() {
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  const getLocation = () => {
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocating(false);
        },
        () => {
          // Fallback to Mumbai/Panvel area
          setLocation({ lat: 19.033, lng: 73.030 });
          setLocating(false);
        }
      );
    } else {
      setLocation({ lat: 19.033, lng: 73.030 });
      setLocating(false);
    }
  };

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      setImageFile(file);
      if (!location) getLocation();
    }
  };

  const submit = async () => {
    if (!imageFile || !location) return;
    setSubmitting(true);

    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('latitude', location.lat);
    formData.append('longitude', location.lng);
    formData.append('description', description);
    formData.append('reporter_name', 'Citizen');
    formData.append('location_name', 'Reported Location');

    try {
      const res = await fetch(`${API_URL}/public/report`, { method: 'POST', body: formData });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: true, message: 'Failed to submit. Is the server running?' });
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setImage(null);
    setImageFile(null);
    setDescription('');
    setLocation(null);
    setResult(null);
  };

  if (result && !result.error) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mb-6">
          <div className="w-20 h-20 rounded-full bg-[#4edea3]/10 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-[#4edea3]" />
          </div>
        </motion.div>
        <h2 className="text-xl font-bold text-white mb-2">Report Submitted!</h2>
        <p className="text-sm text-[#bbcabf] mb-1">ID: <span className="text-[#5de6ff] font-mono">{result.id}</span></p>
        <p className="text-sm text-[#bbcabf] mb-4">
          {result.detections_count} damage{result.detections_count !== 1 ? 's' : ''} detected by AI
        </p>
        {result.severity_summary && (
          <div className="flex gap-4 mb-6">
            {result.severity_summary.critical > 0 && (
              <span className="text-[11px] font-bold text-[#ffb4ab]">⚠ {result.severity_summary.critical} Critical</span>
            )}
            {result.severity_summary.warning > 0 && (
              <span className="text-[11px] font-bold text-[#ffb95f]">{result.severity_summary.warning} Warning</span>
            )}
            {result.severity_summary.minor > 0 && (
              <span className="text-[11px] font-bold text-[#bbcabf]">{result.severity_summary.minor} Minor</span>
            )}
          </div>
        )}
        <p className="text-xs text-[#4edea3] mb-6">Authorities have been notified. Track status on the Map tab.</p>
        <button onClick={reset} className="px-6 py-3 rounded-xl bg-[#4edea3] text-[#002113] font-bold text-sm">
          Report Another
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col px-4 py-3 overflow-y-auto">
      <h2 className="text-lg font-bold text-white mb-1">Report Damage</h2>
      <p className="text-xs text-[#bbcabf] mb-4">Take a photo of road damage. AI will auto-detect the type and severity.</p>

      {/* Image upload */}
      <div
        className={`relative rounded-2xl overflow-hidden mb-4 transition-all ${
          image ? 'h-52' : 'h-44 border-2 border-dashed border-[rgba(60,74,66,0.3)]'
        } bg-[#1c1b1d]`}
        onClick={() => !image && fileRef.current?.click()}
      >
        {image ? (
          <>
            <img src={image} alt="Upload" className="w-full h-full object-cover" />
            <button onClick={(e) => { e.stopPropagation(); setImage(null); setImageFile(null); }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white text-xs flex items-center justify-center">
              ✕
            </button>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-[#201f22] flex items-center justify-center mb-3">
              <Camera className="w-6 h-6 text-[#4edea3]" />
            </div>
            <p className="text-sm font-semibold text-white">Tap to take photo</p>
            <p className="text-[11px] text-[#bbcabf]">or upload from gallery</p>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImage} />
      </div>

      {/* GPS Location */}
      <div className="mb-4">
        <label className="text-[11px] text-[#bbcabf] uppercase tracking-wider font-bold mb-1.5 block">Location</label>
        {location ? (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#1c1b1d]">
            <MapPin className="w-4 h-4 text-[#4edea3]" />
            <span className="text-xs text-white font-mono">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
            <span className="ml-auto text-[10px] text-[#4edea3]">✓ Captured</span>
          </div>
        ) : (
          <button onClick={getLocation}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#1c1b1d] text-[#bbcabf] text-xs font-medium">
            {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
            {locating ? 'Getting location...' : 'Get GPS Location'}
          </button>
        )}
      </div>

      {/* Description */}
      <div className="mb-4">
        <label className="text-[11px] text-[#bbcabf] uppercase tracking-wider font-bold mb-1.5 block">Description (optional)</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="e.g., Large pothole near bus stop, dangerous for bikes..."
          className="w-full px-3 py-2.5 rounded-xl bg-[#1c1b1d] text-sm text-white placeholder-[#bbcabf]/30 outline-none resize-none h-20 border-none focus:ring-1 focus:ring-[#4edea3]"
        />
      </div>

      {/* Submit */}
      <motion.button
        onClick={submit}
        disabled={!imageFile || !location || submitting}
        className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
          imageFile && location && !submitting
            ? 'bg-gradient-to-r from-[#4edea3] to-[#10b981] text-[#002113]'
            : 'bg-[#353437] text-[#bbcabf]/40 cursor-not-allowed'
        }`}
        whileTap={imageFile && location ? { scale: 0.98 } : {}}
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing with AI...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Submit Report
          </>
        )}
      </motion.button>

      {result?.error && (
        <div className="mt-3 p-3 rounded-xl bg-[#ffb4ab]/10 text-[#ffb4ab] text-xs text-center">
          {result.message}
        </div>
      )}
    </div>
  );
}
