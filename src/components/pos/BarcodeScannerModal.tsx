import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, ScanLine, AlertCircle, Sparkles } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { posAudio } from '../../utils/audio';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanned: (barcode: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ isOpen, onClose, onScanned }) => {
  const { products } = useStore();
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }
    startCamera();
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('الكاميرا غير مدعومة في هذا المتصفح');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch {
      setCameraError('تعذر الوصول للكاميرا (يرجى منح الإذن أو استخدام الإدخال السريع أدناه)');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    onScanned(manualCode.trim());
    setManualCode('');
    onClose();
  };

  const handleSimulateScan = (code: string) => {
    posAudio.playScanBeep();
    onScanned(code);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col text-right">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <Camera className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-base">قارئ الباركود الذكي</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera Viewport or Viewport Simulation */}
        <div className="relative aspect-4/3 w-full bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800 mb-4">
          <video
            ref={videoRef}
            className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
            playsInline
            muted
          />

          {!cameraActive && (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <ScanLine className="w-12 h-12 text-emerald-400 animate-pulse mb-2" />
              <p className="text-xs text-slate-300 font-medium">ماسح الباركود نشط وجاهز</p>
              {cameraError && (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-300 mt-2 bg-amber-950/40 p-2 rounded-lg border border-amber-800/40 max-w-xs text-right">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}
            </div>
          )}

          {/* Red Laser Scanner Line */}
          <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500 shadow-[0_0_12px_#f43f5e] animate-pulse pointer-events-none" />

          {/* Scanner corner brackets */}
          <div className="absolute inset-8 border-2 border-emerald-400/40 rounded-xl pointer-events-none flex flex-col justify-between p-2">
            <div className="flex justify-between">
              <span className="w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
              <span className="w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
            </div>
            <div className="flex justify-between">
              <span className="w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
              <span className="w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
            </div>
          </div>
        </div>

        {/* Manual Barcode Input Form */}
        <form onSubmit={handleManualSubmit} className="flex gap-2 mb-4">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="أدخل الباركود يدوياً أو بماسح USB..."
            autoFocus
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shrink-0"
          >
            إضافة للسلة
          </button>
        </form>

        {/* Quick Sample Barcodes for immediate one-tap testing */}
        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>باركود تجريبي سريع للمنتجات في متجرك:</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
            {products.slice(0, 6).map((p) => (
              <button
                key={p.id}
                onClick={() => handleSimulateScan(p.barcode)}
                className="text-right p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 transition flex flex-col"
              >
                <span className="text-xs font-medium text-white truncate">{p.name}</span>
                <span className="text-[10px] text-emerald-400 font-mono">{p.barcode}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
