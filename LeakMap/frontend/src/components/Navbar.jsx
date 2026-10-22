import { useState, useEffect } from 'react';

export default function Navbar({ page, setPage, connected }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center justify-between border-b border-line pb-4 mb-5 flex-wrap gap-4">
      <div className="flex items-baseline gap-3">
        <span
          className="inline-block w-2.5 h-2.5 rounded-full"
          style={{ background: '#E8A33D', boxShadow: '0 0 0 3px rgba(232,163,61,0.15)' }}
        />
        <h1 className="font-mono text-xl font-semibold tracking-wide">LEAKMAP</h1>
        <span className="font-mono text-[11px] text-textDim uppercase tracking-widest hidden sm:inline">
          AI Leak Detection · Firebase Console
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="font-mono text-[11px] text-textDim hidden md:inline tabular-nums">
          {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>

        <div className="flex border border-line rounded-lg overflow-hidden font-mono text-xs">
          <button
            onClick={() => setPage('home')}
            className={`px-4 py-2 transition-colors ${page === 'home' ? 'bg-panelAlt text-text' : 'text-textDim hover:text-text'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setPage('analytics')}
            className={`px-4 py-2 border-l border-line transition-colors ${page === 'analytics' ? 'bg-panelAlt text-text' : 'text-textDim hover:text-text'}`}
          >
            Analytics
          </button>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-textDim">
          <span className="relative flex h-2 w-2">
            {connected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: '#2F8F72' }} />
            )}
            <span
              className="relative inline-flex w-2 h-2 rounded-full"
              style={{ background: connected ? '#2F8F72' : '#8B99A0' }}
            />
          </span>
          {connected ? 'Firebase connected' : 'Firebase offline'}
        </div>
      </div>
    </div>
  );
}
