import { useClock } from '../hooks/useAnimatedValue';

export default function TopBar({ activeView, setActiveView }) {
  const time = useClock();
  const views = ['MONITOR', 'ANALYSIS', 'TIMELINE'];

  return (
    <header className="h-12 bg-concrete border-b border-crack flex items-center px-4 relative overflow-hidden">
      {/* Scanning line */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-sensor/20 to-transparent"
          style={{ animation: 'sweep 4s linear infinite' }}
        />
      </div>

      {/* Logo */}
      <div className="flex items-center gap-3 mr-8">
        <div className="w-2 h-2 bg-fault rounded-none" style={{ animation: 'dot-pulse 2s ease-in-out infinite' }} />
        <span className="text-[13px] font-bold tracking-[0.15em] text-limestone">
          CRACKWATCH
        </span>
        <span className="text-[10px] text-fossil tracking-[0.1em]">v4.2.1</span>
      </div>

      {/* Nav tabs */}
      <nav className="flex gap-[2px] h-full">
        {views.map(v => (
          <button
            key={v}
            onClick={() => setActiveView(v)}
            className={`px-5 h-full text-[10px] font-semibold tracking-[0.12em] uppercase border-none cursor-pointer transition-all duration-200
              ${activeView === v
                ? 'bg-slab text-fault border-t-2 border-t-fault'
                : 'bg-transparent text-stone hover:text-limestone hover:bg-slab/50'
              }`}
          >
            {v}
          </button>
        ))}
      </nav>

      {/* Right side status */}
      <div className="ml-auto flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-stable" style={{ animation: 'dot-pulse 3s ease-in-out infinite' }} />
          <span className="text-[10px] text-stone tracking-[0.08em]">SYSTEM NOMINAL</span>
        </div>
        <div className="text-[11px] text-fossil font-medium tabular-nums">
          {time.toLocaleTimeString('en-US', { hour12: false })}
          <span className="text-crack ml-1">UTC+5:30</span>
        </div>
      </div>
    </header>
  );
}
