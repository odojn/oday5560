import React, { useState, useEffect } from 'react';
import { Camera, Barcode, X, Check, Search } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export default function BarcodeScannerModal({ isOpen, onClose, onScan }: BarcodeScannerModalProps) {
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedFeedback, setScannedFeedback] = useState<string | null>(null);

  // USB Barcode Scanner listener (key buffer)
  useEffect(() => {
    if (!isOpen) return;

    let buffer = '';
    let timeout: any;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user typing into standard text input/textarea
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea') return;

      if (e.key === 'Enter') {
        if (buffer.trim()) {
          const code = buffer.trim();
          handleScannedCode(code);
          buffer = '';
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          buffer = '';
        }, 100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleScannedCode = (code: string) => {
    setScannedFeedback(code);
    onScan(code);
    setTimeout(() => {
      setScannedFeedback(null);
    }, 1500);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleScannedCode(manualCode.trim());
      setManualCode('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-indigo-600">
            <Barcode className="w-6 h-6" />
            <h3 className="font-bold text-slate-800">قارئ الباركود والأجهزة</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-6 space-y-6">
          {/* Status box */}
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 text-white rounded-full mb-2 shadow-lg shadow-indigo-200">
              <Barcode className="w-6 h-6 animate-pulse" />
            </div>
            <h4 className="font-bold text-indigo-900 text-sm">جاهز للاستجابة لقارئ الباركود اليدوي (Scanner Gun)</h4>
            <p className="text-xs text-indigo-600 mt-1">وجه ماسح الباركود نحو المنتج وسيقوم النظام بإضافته للسلة مباشرة.</p>
          </div>

          {scannedFeedback && (
            <div className="bg-emerald-500 text-white p-3 rounded-xl flex items-center justify-between font-mono animate-bounce">
              <span className="flex items-center gap-2 font-bold text-sm">
                <Check className="w-5 h-5" /> تم قراءة الباركود: {scannedFeedback}
              </span>
            </div>
          )}

          {/* Manual input */}
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <label className="text-xs font-bold text-slate-700 block">أو أدخل الباركود يدويًا:</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="أدخل رمز الباركود..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              <Button type="submit">إضافة</Button>
            </div>
          </form>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <Button variant="ghost" onClick={onClose}>إغلاق</Button>
        </div>
      </div>
    </div>
  );
}
