import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { AlertTriangle, CheckCircle, Clock, ThumbsUp, Navigation } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const STATUS_CONFIG = {
  submitted: { color: '#ffb4ab', label: 'Not Fixed', icon: '🔴' },
  acknowledged: { color: '#ffb95f', label: 'Acknowledged', icon: '🟡' },
  in_progress: { color: '#5de6ff', label: 'In Progress', icon: '🔵' },
  fixed: { color: '#4edea3', label: 'Fixed', icon: '🟢' },
};

// Demo data for hackathon presentation (Mumbai/Panvel area)
const DEMO_REPORTS = [
  { id: 'RPT-001', latitude: 19.0330, longitude: 73.0297, location_name: 'Ghodbunder Road, Thane', damage_type: 'Pothole', severity: 82, status: 'submitted', upvotes: 23, defect_count: 3, reporter: 'Rahul M.', timestamp: '2026-04-13T09:42:00Z' },
  { id: 'RPT-002', latitude: 19.0176, longitude: 73.0596, location_name: 'Panvel Station Road', damage_type: 'Alligator Crack', severity: 65, status: 'in_progress', upvotes: 12, defect_count: 2, reporter: 'Priya S.', timestamp: '2026-04-12T14:07:00Z' },
  { id: 'RPT-003', latitude: 19.0450, longitude: 73.0200, location_name: 'Mumbai-Pune Expressway KM 42', damage_type: 'Pothole', severity: 91, status: 'submitted', upvotes: 47, defect_count: 5, reporter: 'Amit K.', timestamp: '2026-04-11T08:23:00Z' },
  { id: 'RPT-004', latitude: 19.0280, longitude: 73.0450, location_name: 'Amity University Road', damage_type: 'Transverse Crack', severity: 28, status: 'fixed', upvotes: 5, defect_count: 1, reporter: 'Saud V.', timestamp: '2026-04-10T17:50:00Z' },
  { id: 'RPT-005', latitude: 19.0550, longitude: 73.0100, location_name: 'Kalamboli Flyover', damage_type: 'Pothole', severity: 73, status: 'acknowledged', upvotes: 18, defect_count: 2, reporter: 'Neha D.', timestamp: '2026-04-09T11:30:00Z' },
  { id: 'RPT-006', latitude: 19.0100, longitude: 73.0700, location_name: 'Old Panvel Bridge', damage_type: 'Alligator Crack', severity: 87, status: 'submitted', upvotes: 34, defect_count: 4, reporter: 'Vikram T.', timestamp: '2026-04-08T06:15:00Z' },
  { id: 'RPT-007', latitude: 19.0380, longitude: 73.0350, location_name: 'Kharghar Sector 12', damage_type: 'Surface Spalling', severity: 45, status: 'in_progress', upvotes: 8, defect_count: 1, reporter: 'Anjali R.', timestamp: '2026-04-13T20:00:00Z' },
  { id: 'RPT-008', latitude: 19.0600, longitude: 73.0050, location_name: 'Belapur CBD', damage_type: 'Longitudinal Crack', severity: 38, status: 'fixed', upvotes: 3, defect_count: 1, reporter: 'Kiran P.', timestamp: '2026-04-07T15:45:00Z' },
];

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.submitted;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{ background: `${cfg.color}15`, color: cfg.color }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

export default function MapPage() {
  const [reports, setReports] = useState(DEMO_REPORTS);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');

  // Try to load real data from API
  useEffect(() => {
    fetch(`${API_URL}/public/reports/map`)
      .then(r => r.json())
      .then(data => {
        if (data.reports && data.reports.length > 0) {
          setReports([...DEMO_REPORTS, ...data.reports]);
        }
      })
      .catch(() => {}); // Keep demo data on error
  }, []);

  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter);
  const unfixed = reports.filter(r => r.status === 'submitted').length;

  return (
    <div className="h-full flex flex-col">
      {/* Quick stats bar */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto shrink-0">
        {[
          { label: 'All', value: reports.length, filter: 'all' },
          { label: 'Unfixed', value: unfixed, filter: 'submitted', color: '#ffb4ab' },
          { label: 'In Progress', value: reports.filter(r => r.status === 'in_progress').length, filter: 'in_progress', color: '#5de6ff' },
          { label: 'Fixed', value: reports.filter(r => r.status === 'fixed').length, filter: 'fixed', color: '#4edea3' },
        ].map(f => (
          <button
            key={f.filter}
            onClick={() => setFilter(f.filter)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
              filter === f.filter
                ? 'bg-[#1c1b1d] text-white'
                : 'bg-transparent text-[#bbcabf]/60'
            }`}
          >
            <span style={{ color: f.color }}>{f.value}</span> {f.label}
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={[19.035, 73.035]}
          zoom={13}
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

          {filtered.map(report => {
            const cfg = STATUS_CONFIG[report.status] || STATUS_CONFIG.submitted;
            return (
              <CircleMarker
                key={report.id}
                center={[report.latitude, report.longitude]}
                radius={report.status === 'submitted' ? 10 : 7}
                pathOptions={{
                  color: cfg.color,
                  fillColor: cfg.color,
                  fillOpacity: report.status === 'submitted' ? 0.4 : 0.2,
                  weight: 2,
                }}
                eventHandlers={{ click: () => setSelected(report) }}
              >
                <Popup>
                  <div style={{ minWidth: 200, fontFamily: 'Inter', fontSize: 12 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{report.damage_type}</div>
                    <div style={{ fontSize: 10, color: '#bbcabf', marginBottom: 8 }}>{report.location_name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 4 }}>
                      <span>Severity: <b style={{ color: report.severity > 70 ? '#ffb4ab' : report.severity > 40 ? '#ffb95f' : '#4edea3' }}>{report.severity}%</b></span>
                      <span>👍 {report.upvotes}</span>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Floating unfixed counter */}
        <div className="absolute top-3 left-3 z-[1000] bg-[#131315]/90 backdrop-blur-md rounded-xl px-3 py-2 border border-[rgba(60,74,66,0.15)]">
          <span className="text-[10px] text-[#bbcabf]">Unfixed in your area</span>
          <div className="text-xl font-bold text-[#ffb4ab]">{unfixed}</div>
        </div>
      </div>

      {/* Selected report detail card */}
      {selected && (
        <div className="absolute bottom-16 left-3 right-3 z-[1000] bg-[#1c1b1d]/95 backdrop-blur-md rounded-2xl p-4 border border-[rgba(60,74,66,0.15)]">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-sm font-bold text-white">{selected.damage_type}</h3>
              <p className="text-[11px] text-[#bbcabf]">{selected.location_name}</p>
            </div>
            <StatusBadge status={selected.status} />
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className="text-center">
              <div className="text-lg font-bold" style={{ color: selected.severity > 70 ? '#ffb4ab' : '#ffb95f' }}>{selected.severity}%</div>
              <div className="text-[9px] text-[#bbcabf]">Severity</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-[#5de6ff]">{selected.defect_count}</div>
              <div className="text-[9px] text-[#bbcabf]">Defects</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-[#4edea3]">{selected.upvotes}</div>
              <div className="text-[9px] text-[#bbcabf]">Upvotes</div>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button className="flex-1 py-2 rounded-lg bg-[#4edea3] text-[#002113] text-xs font-bold flex items-center justify-center gap-1">
              <ThumbsUp className="w-3 h-3" /> Upvote
            </button>
            <button onClick={() => setSelected(null)} className="px-4 py-2 rounded-lg bg-[#353437] text-[#bbcabf] text-xs font-medium">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
