import { useEffect, useState } from "react";

type PopupType = {
  port: number;
  isTaken: boolean;
  expiresAt: number;
};

interface PopUpProps {
  data: PopupType[];
  onClose: () => void;
  onSubmit: (port: number) => void;
}

const PopUp = ({ data, onClose, onSubmit }: PopUpProps) => {
  const [selectedPort, setSelectedPort] = useState<PopupType>(
    data.find((item) => !item.isTaken) || data[0]
  );

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (expiresAt: number) => {
    const diff = expiresAt - now;
    if (diff <= 0) return "00:00:00";
    const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
    const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
    const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const formatRealTime = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(new Date(timestamp)).replace(/ /g, ' ').replace(',', '');
  };

  return (
    <div 
      onClick={onClose} 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 w-full max-w-lg shadow-2xl flex flex-col gap-6"
      >
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-white tracking-tight">Custom Port</h2>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${selectedPort.isTaken ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
            <p className={`text-sm font-mono font-medium tracking-wide ${selectedPort.isTaken ? "text-red-400" : "text-emerald-400"}`}>
              {selectedPort.isTaken 
                ? `Occupied • Resets in ${formatCountdown(selectedPort.expiresAt)}` 
                : `Available as of: ${formatRealTime(now)}`
              }
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] uppercase font-bold text-gray-500 tracking-[0.2em]">Select Port Instance</label>
          <div className="relative">
            <select 
              value={selectedPort.port}
              onChange={(e) => {
                const found = data.find(p => p.port === Number(e.target.value));
                if (found) setSelectedPort(found);
              }}
              className="w-full bg-[#111] border border-white/10 rounded-xl p-4 text-white appearance-none focus:ring-2 focus:ring-white/20 outline-none cursor-pointer transition-all hover:border-white/30"
            >
              {data.map((item) => (
                <option key={item.port} value={item.port} className="bg-[#111]">
                  Port {item.port} — {item.isTaken ? "Occupied" : "Free"}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 text-xs">
              ▼
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-2">
          <button 
            onClick={onClose}
            className="flex-1 py-3.5 px-6 rounded-xl border border-white/10 text-white font-semibold hover:bg-white/5 transition-all active:scale-95"
          >
            Cancel
          </button>
          <button 
            disabled={selectedPort.isTaken}
            onClick={() => onSubmit(selectedPort.port)}
            className="flex-1 py-3.5 px-6 rounded-xl bg-white text-black font-bold hover:bg-gray-200 disabled:opacity-20 disabled:grayscale transition-all active:scale-95"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default PopUp;