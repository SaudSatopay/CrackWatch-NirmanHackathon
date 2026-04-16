import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, CircleMarker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { motion } from 'framer-motion';
import { Navigation, MapPin, AlertTriangle, Route, X, Search, Shield } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Demo pothole data
const DEMO_POTHOLES = [
  { id: 'P1', lat: 19.0330, lng: 73.0297, severity: 82, type: 'Pothole', status: 'submitted' },
  { id: 'P2', lat: 19.0176, lng: 73.0596, severity: 65, type: 'Alligator Crack', status: 'in_progress' },
  { id: 'P3', lat: 19.0450, lng: 73.0200, severity: 91, type: 'Pothole', status: 'submitted' },
  { id: 'P4', lat: 19.0280, lng: 73.0450, severity: 28, type: 'Transverse Crack', status: 'fixed' },
  { id: 'P5', lat: 19.0550, lng: 73.0100, severity: 73, type: 'Pothole', status: 'submitted' },
  { id: 'P6', lat: 19.0100, lng: 73.0700, severity: 87, type: 'Alligator Crack', status: 'submitted' },
  { id: 'P7', lat: 19.0380, lng: 73.0350, severity: 45, type: 'Spalling', status: 'in_progress' },
  { id: 'P8', lat: 19.0600, lng: 73.0050, severity: 38, type: 'Crack', status: 'fixed' },
];

function RoutingControl({ from, to, potholes, avoidPotholes }) {
  const map = useMap();
  const routeRef = useRef(null);

  useEffect(() => {
    if (!from || !to) return;

    // Remove old route
    if (routeRef.current) {
      map.removeControl(routeRef.current);
    }

    const waypoints = [
      L.latLng(from.lat, from.lng),
      L.latLng(to.lat, to.lng),
    ];

    const control = L.Routing.control({
      waypoints,
      routeWhileDragging: false,
      addWaypoints: false,
      showAlternatives: true,
      lineOptions: {
        styles: [
          { color: '#4edea3', weight: 5, opacity: 0.8 },
        ],
        extendToWaypoints: true,
        missingRouteTolerance: 10,
      },
      altLineOptions: {
        styles: [
          { color: '#5de6ff', weight: 4, opacity: 0.5, dashArray: '10 10' },
        ],
      },
      createMarker: () => null, // We draw our own markers
      show: false, // Hide the directions panel
      fitSelectedRoutes: true,
    });

    control.on('routesfound', (e) => {
      const routes = e.routes;
      // Check each route for nearby potholes
      routes.forEach((route, idx) => {
        let potholeCount = 0;
        const routeCoords = route.coordinates;

        if (avoidPotholes) {
          const unfixed = potholes.filter(p => p.status !== 'fixed');
          unfixed.forEach(pothole => {
            // Check if any route coordinate is within 50m of a pothole
            for (const coord of routeCoords) {
              const dist = map.distance(
                L.latLng(coord.lat, coord.lng),
                L.latLng(pothole.lat, pothole.lng)
              );
              if (dist < 80) {
                potholeCount++;
                break;
              }
            }
          });
        }

        route._potholeCount = potholeCount;
        route._potholeWarning = potholeCount > 0;
      });
    });

    control.addTo(map);
    routeRef.current = control;

    return () => {
      if (routeRef.current) {
        try { map.removeControl(routeRef.current); } catch {}
      }
    };
  }, [from, to, avoidPotholes]);

  return null;
}

function LocationSearch({ placeholder, onSelect, value }) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5`
      );
      const data = await res.json();
      setResults(data.map(r => ({
        name: r.display_name.split(',').slice(0, 3).join(', '),
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
      })));
    } catch {}
    setSearching(false);
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.05] text-white text-sm outline-none placeholder-white/20 border border-white/[0.06] focus:border-[#4edea3]/30"
          />
        </div>
        <button onClick={search} className="px-4 rounded-xl bg-white/[0.05] text-white/40 text-sm font-medium">
          {searching ? '...' : 'Go'}
        </button>
      </div>
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1c1b1d] rounded-xl border border-white/[0.06] overflow-hidden z-50 shadow-xl">
          {results.map((r, i) => (
            <button key={i} onClick={() => { onSelect(r); setQuery(r.name); setResults([]); }}
              className="w-full px-4 py-2.5 text-left text-xs text-white/70 hover:bg-white/[0.05] transition-colors border-b border-white/[0.03] last:border-0">
              <MapPin className="w-3 h-3 inline mr-2 text-[#4edea3]" />{r.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NavigatePage() {
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [avoidPotholes, setAvoidPotholes] = useState(true);
  const [potholes, setPotholes] = useState(DEMO_POTHOLES);
  const [showRoute, setShowRoute] = useState(false);
  const [myLocation, setMyLocation] = useState(null);

  // Load real potholes from API
  useEffect(() => {
    fetch(`${API_URL}/public/reports/map`).then(r => r.json()).then(d => {
      if (d.reports?.length) {
        const real = d.reports.map(r => ({
          id: r.id, lat: r.latitude, lng: r.longitude,
          severity: r.severity, type: r.damage_type, status: r.status,
        }));
        setPotholes(prev => [...prev, ...real]);
      }
    }).catch(() => {});
  }, []);

  // Get user location
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, name: 'My Location' };
        setMyLocation(loc);
        setFrom(loc);
      },
      () => {
        const fallback = { lat: 19.033, lng: 73.030, name: 'Navi Mumbai' };
        setMyLocation(fallback);
        setFrom(fallback);
      }
    );
  }, []);

  const startNavigation = () => {
    if (from && to) setShowRoute(true);
  };

  const unfixedPotholes = potholes.filter(p => p.status !== 'fixed');

  return (
    <div className="h-full flex flex-col relative">
      {/* Search panel */}
      <div className="absolute top-0 left-0 right-0 z-[1000] px-4 pt-3 pb-3 bg-gradient-to-b from-[#131315] via-[#131315]/95 to-transparent">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-base font-bold text-white" style={{ fontFamily: 'Space Grotesk' }}>
            <Route className="w-4 h-4 inline mr-1.5 text-[#4edea3]" />Navigate
          </h1>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#4edea3]/10 border border-[#4edea3]/20">
            <AlertTriangle className="w-3 h-3 text-[#ffa94d]" />
            <span className="text-[10px] text-[#ffa94d] font-bold">{unfixedPotholes.length} hazards</span>
          </div>
        </div>

        <div className="space-y-2">
          <LocationSearch
            placeholder="From (your location)"
            value={from?.name}
            onSelect={(loc) => setFrom(loc)}
          />
          <LocationSearch
            placeholder="Where to?"
            onSelect={(loc) => setTo(loc)}
          />
        </div>

        {/* Avoid potholes toggle */}
        <div className="flex items-center justify-between mt-3">
          <button onClick={() => setAvoidPotholes(!avoidPotholes)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              avoidPotholes
                ? 'bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/20'
                : 'bg-white/[0.03] text-white/30 border border-transparent'
            }`}>
            <Shield className="w-3.5 h-3.5" />
            {avoidPotholes ? 'Avoiding potholes ✓' : 'Avoid potholes'}
          </button>

          <motion.button onClick={startNavigation}
            disabled={!from || !to}
            className={`px-5 py-2 rounded-xl font-bold text-sm flex items-center gap-1.5 ${
              from && to ? 'bg-gradient-to-r from-[#4edea3] to-[#10b981] text-[#002113]' : 'bg-white/[0.04] text-white/20'
            }`}
            whileTap={from && to ? { scale: 0.97 } : {}}>
            <Navigation className="w-4 h-4" /> Route
          </motion.button>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1">
        <MapContainer
          center={[19.035, 73.035]}
          zoom={13}
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

          {/* Pothole danger zones */}
          {unfixedPotholes.map(p => (
            <CircleMarker
              key={p.id}
              center={[p.lat, p.lng]}
              radius={p.severity > 70 ? 12 : 8}
              pathOptions={{
                color: p.severity > 70 ? '#ff6b6b' : '#ffa94d',
                fillColor: p.severity > 70 ? '#ff6b6b' : '#ffa94d',
                fillOpacity: 0.25,
                weight: 2,
              }}
            >
              <Popup>
                <div style={{ fontFamily: 'Inter', fontSize: 11, color: '#e5e1e4', background: '#1c1b1d', padding: 8, margin: '-14px -20px', minWidth: 150 }}>
                  <b style={{ color: p.severity > 70 ? '#ff6b6b' : '#ffa94d' }}>⚠ {p.type}</b>
                  <div style={{ fontSize: 10, color: '#bbcabf', marginTop: 4 }}>Severity: {p.severity}%</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Danger radius for high-severity potholes */}
          {unfixedPotholes.filter(p => p.severity > 70).map(p => (
            <CircleMarker
              key={`zone-${p.id}`}
              center={[p.lat, p.lng]}
              radius={20}
              pathOptions={{
                color: '#ff6b6b',
                fillColor: '#ff6b6b',
                fillOpacity: 0.06,
                weight: 0.5,
                dashArray: '4 4',
              }}
            />
          ))}

          {/* From marker */}
          {from && (
            <Marker
              position={[from.lat, from.lng]}
              icon={L.divIcon({
                html: '<div style="width:16px;height:16px;background:#4edea3;border-radius:50%;border:3px solid #131315;box-shadow:0 0 10px #4edea366"></div>',
                className: '', iconSize: [16, 16], iconAnchor: [8, 8],
              })}
            />
          )}

          {/* To marker */}
          {to && (
            <Marker
              position={[to.lat, to.lng]}
              icon={L.divIcon({
                html: '<div style="width:16px;height:16px;background:#5de6ff;border-radius:50%;border:3px solid #131315;box-shadow:0 0 10px #5de6ff66"></div>',
                className: '', iconSize: [16, 16], iconAnchor: [8, 8],
              })}
            />
          )}

          {/* Routing */}
          {showRoute && from && to && (
            <RoutingControl from={from} to={to} potholes={potholes} avoidPotholes={avoidPotholes} />
          )}
        </MapContainer>
      </div>

      {/* Bottom legend */}
      <div className="absolute bottom-14 left-3 right-3 z-[1000]">
        <div className="bg-[#131315]/90 backdrop-blur-md rounded-xl px-4 py-2.5 border border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff6b6b]" />
              <span className="text-[9px] text-white/40">High risk</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ffa94d]" />
              <span className="text-[9px] text-white/40">Moderate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#4edea3]" />
              <span className="text-[9px] text-white/40">Route</span>
            </div>
          </div>
          <span className="text-[9px] text-white/20">Powered by CRACKWATCH AI</span>
        </div>
      </div>
    </div>
  );
}
