import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Clock, AlertTriangle, Eye, ThumbsUp, MapPin, Hammer } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const STATUS = {
  submitted:    { color: '#ff6b6b', label: 'Not Fixed',    bg: '#ff6b6b15' },
  acknowledged: { color: '#ffa94d', label: 'Acknowledged', bg: '#ffa94d15' },
  in_progress:  { color: '#74c0fc', label: 'In Progress',  bg: '#74c0fc15' },
  fixed:        { color: '#69db7c', label: 'Fixed',        bg: '#69db7c15' },
};

function FlyTo({ center }) {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, 15, { duration: 0.8 }); }, [center]);
  return null;
}

export default function GovtMap() {
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const [flyTo, setFlyTo] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchReports = () => {
    fetch(`${API_URL}/admin/reports/map`).then(r => r.json()).then(d => {
      if (d.reports) setReports(d.reports);
    }).catch(() => {});
  };

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 10000);
    return () => clearInterval(interval);
  }, []);

  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter);
  const counts = {
    all: reports.length,
    submitted: reports.filter(r => r.status === 'submitted').length,
    in_progress: reports.filter(r => r.status === 'in_progress' || r.status === 'acknowledged').length,
    fixed: reports.filter(r => r.status === 'fixed').length,
  };

  const updateStatus = async (reportId, newStatus) => {
    setUpdating(true);
    try {
      const fd = new FormData();
      fd.append('status', newStatus);
      fd.append('note', `Status updated to ${newStatus} by inspector`);
      await fetch(`${API_URL}/admin/reports/${reportId}/status`, { method: 'PATCH', body: fd });
      // Update local state
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
      setSelected(prev => prev?.id === reportId ? { ...prev, status: newStatus } : prev);
    } catch (e) {
      console.error('Failed to update status', e);
    }
    setUpdating(false);
  };

  const daysAgo = (ts) => {
    const d = Math.floor((Date.now() - new Date(ts).getTime()) / 86400000);
    return d === 0 ? 'Today' : d === 1 ? '1 day ago' : `${d} days ago`;
  };

  return (
    <motion.div className="h-full flex" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Map */}
      <div className="flex-1 relative">
        {/* Header overlay */}
        <div className="absolute top-0 left-0 right-0 z-[1000] px-4 pt-3 pb-2 bg-gradient-to-b from-zinc-950 via-zinc-950/90 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-extrabold text-white tracking-tight">Citizen Reports Map</h3>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-bold">LIVE · {reports.length} reports</span>
            </div>
          </div>
          <div className="flex gap-1.5">
            {[
              { key: 'all', label: 'All', count: counts.all },
              { key: 'submitted', label: 'Unfixed', count: counts.submitted, color: '#ff6b6b' },
              { key: 'in_progress', label: 'In Progress', count: counts.in_progress, color: '#74c0fc' },
              { key: 'fixed', label: 'Fixed', count: counts.fixed, color: '#69db7c' },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                  filter === f.key ? 'bg-zinc-800 text-white' : 'bg-zinc-900/50 text-zinc-500'
                }`}>
                {f.color && <span className="w-1.5 h-1.5 rounded-full" style={{ background: f.color }} />}
                {f.count}
              </button>
            ))}
          </div>
        </div>

        <MapContainer center={[19.035, 73.035]} zoom={13} className="h-full w-full" zoomControl={false}>
          <FlyTo center={flyTo} />
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          {filtered.map(r => {
            const cfg = STATUS[r.status] || STATUS.submitted;
            const isSelected = selected?.id === r.id;
            return (
              <CircleMarker key={r.id} center={[r.latitude, r.longitude]}
                radius={isSelected ? 14 : r.severity > 70 ? 11 : 9}
                pathOptions={{ color: cfg.color, fillColor: cfg.color, fillOpacity: isSelected ? 0.5 : 0.25, weight: isSelected ? 3 : 2 }}
                eventHandlers={{ click: () => { setSelected(r); setFlyTo([r.latitude, r.longitude]); } }}
              />
            );
          })}
        </MapContainer>

        {reports.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-[999] pointer-events-none">
            <div className="text-center">
              <MapPin className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500 font-medium">No citizen reports yet</p>
              <p className="text-xs text-zinc-600">Reports from the public app will appear here</p>
            </div>
          </div>
        )}
      </div>

      {/* Right panel — selected report detail */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ x: 350, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 350, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            className="w-[360px] bg-zinc-900/95 backdrop-blur-xl border-l border-zinc-800/30 overflow-y-auto"
          >
            {/* Close */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-zinc-800/20">
              <span className="text-xs text-zinc-500 font-mono">{selected.id}</span>
              <button onClick={() => setSelected(null)} className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Photo */}
            {selected.annotated_image && (
              <div className="h-44 bg-zinc-950">
                <img src={`data:image/jpeg;base64,${selected.annotated_image}`} alt="Damage" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="p-4 space-y-4">
              {/* Type + Status */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-extrabold text-white">{selected.damage_type}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: STATUS[selected.status]?.bg, color: STATUS[selected.status]?.color }}>
                    {STATUS[selected.status]?.label}
                  </span>
                </div>
                <p className="text-xs text-zinc-500">{selected.location_name} · {daysAgo(selected.timestamp)}</p>
              </div>

              {/* Reporter + Description */}
              <div className="bg-zinc-800/30 rounded-xl p-3">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Citizen Report</p>
                <p className="text-xs text-zinc-400">{selected.description || 'No description provided'}</p>
                <p className="text-[10px] text-zinc-600 mt-1.5">By {selected.reporter} · 👍 {selected.upvotes} upvotes</p>
              </div>

              {/* Severity + Cost */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-800/30 rounded-xl p-3">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Severity</p>
                  <p className="text-2xl font-bold" style={{ color: selected.severity > 70 ? '#ff6b6b' : selected.severity > 40 ? '#ffa94d' : '#69db7c' }}>
                    {selected.severity?.toFixed(0)}%
                  </p>
                </div>
                <div className="bg-zinc-800/30 rounded-xl p-3">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Est. Cost</p>
                  <p className="text-xl font-bold text-amber-400">₹{selected.cost_estimated?.toLocaleString('en-IN') || '—'}</p>
                </div>
              </div>

              {/* Repair method */}
              {selected.repair_method && (
                <div className="bg-zinc-800/30 rounded-xl p-3">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Recommended Repair</p>
                  <p className="text-xs text-zinc-300 font-medium">{selected.repair_method}</p>
                </div>
              )}

              {/* ADMIN: Status update controls */}
              <div className="border-t border-zinc-800/30 pt-4">
                <p className="text-[10px] text-emerald-400/60 uppercase tracking-wider font-bold mb-3">🏛️ Admin Actions</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { status: 'acknowledged', label: 'Acknowledge', icon: Eye, color: '#ffa94d' },
                    { status: 'in_progress', label: 'In Progress', icon: Clock, color: '#74c0fc' },
                    { status: 'fixed', label: 'Mark Fixed', icon: CheckCircle, color: '#69db7c' },
                    { status: 'submitted', label: 'Reopen', icon: AlertTriangle, color: '#ff6b6b' },
                  ].map(action => (
                    <motion.button
                      key={action.status}
                      onClick={() => updateStatus(selected.id, action.status)}
                      disabled={updating || selected.status === action.status}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        selected.status === action.status
                          ? 'bg-zinc-700/30 text-zinc-600 cursor-default'
                          : 'bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300'
                      }`}
                      style={selected.status === action.status ? { borderColor: action.color, borderWidth: 1 } : {}}
                      whileTap={selected.status !== action.status ? { scale: 0.97 } : {}}
                    >
                      <action.icon className="w-3.5 h-3.5" style={{ color: action.color }} />
                      {action.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Status history */}
              {selected.status_history?.length > 0 && (
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-2">Status History</p>
                  <div className="space-y-1.5">
                    {selected.status_history.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-[10px]">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS[h.status]?.color || '#666' }} />
                        <span className="text-zinc-400 font-medium">{h.status}</span>
                        <span className="text-zinc-600 ml-auto">{new Date(h.time).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
