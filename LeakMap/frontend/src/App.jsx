import { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import Analytics from './pages/Analytics.jsx';
import { subscribeConnection } from './dataService.js';

export default function App() {
  const [page, setPage] = useState('home');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const unsub = subscribeConnection(setConnected);
    return unsub;
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-7">
      <Navbar page={page} setPage={setPage} connected={connected} />
      {page === 'home' ? <Home /> : <Analytics />}

      <div className="mt-8 pt-4 border-t border-line text-[11px] text-textDim leading-relaxed">
        Backend: Firebase Realtime Database (no local server needed). The ESP32 pushes readings
        straight to Firebase — see <code className="bg-panelAlt px-1.5 py-0.5 rounded">esp32/esp32_leakmap_scanner.ino</code>.
      </div>
    </div>
  );
}
