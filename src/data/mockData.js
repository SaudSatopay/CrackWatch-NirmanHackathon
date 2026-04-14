// Simulated crack detection data
export const SENSOR_GRID = Array.from({ length: 64 }, (_, i) => ({
  id: `SN-${String(i + 1).padStart(3, '0')}`,
  row: Math.floor(i / 8),
  col: i % 8,
  status: Math.random() > 0.85 ? 'alert' : Math.random() > 0.7 ? 'warning' : 'nominal',
  strain: +(Math.random() * 450).toFixed(1),
  temp: +(18 + Math.random() * 12).toFixed(1),
  lastPing: Date.now() - Math.floor(Math.random() * 60000),
}));

export const CRACKS = [
  { id: 'CRK-001', x: 35, y: 28, length: 142, width: 2.3, severity: 'critical', angle: -15, propagationRate: 0.8, zone: 'A3', detected: '2026-04-11T08:23:00Z' },
  { id: 'CRK-002', x: 62, y: 55, length: 89, width: 1.1, severity: 'warning', angle: 42, propagationRate: 0.3, zone: 'B5', detected: '2026-04-12T14:07:00Z' },
  { id: 'CRK-003', x: 18, y: 72, length: 210, width: 3.7, severity: 'critical', angle: -68, propagationRate: 1.2, zone: 'C2', detected: '2026-04-10T03:45:00Z' },
  { id: 'CRK-004', x: 78, y: 15, length: 45, width: 0.5, severity: 'minor', angle: 12, propagationRate: 0.05, zone: 'A7', detected: '2026-04-13T01:12:00Z' },
  { id: 'CRK-005', x: 50, y: 42, length: 67, width: 0.9, severity: 'warning', angle: -30, propagationRate: 0.15, zone: 'B4', detected: '2026-04-12T22:30:00Z' },
  { id: 'CRK-006', x: 88, y: 68, length: 178, width: 2.8, severity: 'critical', angle: 75, propagationRate: 0.95, zone: 'C7', detected: '2026-04-09T17:50:00Z' },
];

export const ALERTS = [
  { id: 1, time: '2026-04-13T09:42:00Z', type: 'PROPAGATION', severity: 'critical', message: 'CRK-003 propagation rate exceeded 1.0 mm/hr threshold', crackId: 'CRK-003' },
  { id: 2, time: '2026-04-13T09:38:00Z', type: 'NEW_CRACK', severity: 'warning', message: 'New fracture detected in zone B4 — pattern: branching dendritic', crackId: 'CRK-005' },
  { id: 3, time: '2026-04-13T09:15:00Z', type: 'SENSOR_FAULT', severity: 'warning', message: 'SN-047 strain gauge drift detected — recalibration required', crackId: null },
  { id: 4, time: '2026-04-13T08:52:00Z', type: 'THRESHOLD', severity: 'critical', message: 'Zone C7 cumulative strain exceeds structural limit (87% capacity)', crackId: 'CRK-006' },
  { id: 5, time: '2026-04-13T08:30:00Z', type: 'PROPAGATION', severity: 'warning', message: 'CRK-001 showing accelerated growth pattern — monitor closely', crackId: 'CRK-001' },
  { id: 6, time: '2026-04-13T07:45:00Z', type: 'ENVIRONMENT', severity: 'minor', message: 'Ambient temperature drop 4.2°C in 30min — thermal stress watch', crackId: null },
  { id: 7, time: '2026-04-13T07:12:00Z', type: 'NEW_CRACK', severity: 'minor', message: 'Hairline fracture detected zone A7 — width 0.5mm, monitoring', crackId: 'CRK-004' },
  { id: 8, time: '2026-04-13T06:00:00Z', type: 'SYSTEM', severity: 'nominal', message: 'Daily structural integrity scan complete — 94.2% nominal', crackId: null },
];

export const STATS = {
  totalCracks: 6,
  criticalCount: 3,
  avgPropagation: 0.58,
  structuralIntegrity: 94.2,
  activeSensors: 61,
  totalSensors: 64,
  maxStrain: 423.7,
  ambientTemp: 22.4,
};

// Generate seismic waveform data
export function generateWaveform(points = 200, intensity = 1) {
  const data = [];
  for (let i = 0; i < points; i++) {
    const t = i / points;
    const base = Math.sin(t * Math.PI * 8) * 0.3;
    const spike = Math.random() > 0.92 ? (Math.random() - 0.5) * 2 * intensity : 0;
    const noise = (Math.random() - 0.5) * 0.15 * intensity;
    data.push(base + spike + noise);
  }
  return data;
}

// Generate heatmap data (8x8 grid matching sensors)
export function generateHeatmap() {
  const data = [];
  for (let r = 0; r < 8; r++) {
    const row = [];
    for (let c = 0; c < 8; c++) {
      // Create hotspots near crack locations
      let val = Math.random() * 0.3;
      if ((r === 2 && c === 2) || (r === 5 && c === 1)) val += 0.6;
      if ((r === 4 && c === 4) || (r === 1 && c === 6)) val += 0.35;
      if (r === 5 && c === 7) val += 0.55;
      row.push(Math.min(1, val));
    }
    data.push(row);
  }
  return data;
}

export function generateTimeSeriesData(hours = 24) {
  const data = [];
  const now = Date.now();
  for (let i = hours; i >= 0; i--) {
    data.push({
      time: now - i * 3600000,
      strain: 200 + Math.sin(i * 0.3) * 80 + Math.random() * 40,
      temp: 20 + Math.sin(i * 0.15) * 4 + Math.random() * 2,
      propagation: Math.max(0, 0.3 + Math.sin(i * 0.2) * 0.4 + Math.random() * 0.2),
    });
  }
  return data;
}
