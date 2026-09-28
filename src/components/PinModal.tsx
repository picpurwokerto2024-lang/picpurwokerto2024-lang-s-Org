import React, { useState, useEffect, useRef } from 'react';
import { Lock, KeyRound, X, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  correctPin: string;
  title?: string;
  description?: string;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  correctPin = '1234',
  title = 'Masukkan PIN Pengurus',
  description = 'Akses khusus Admin & Bendahara untuk menambah, mengubah, atau menghapus data.',
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerify = (inputToTest: string) => {
    if (inputToTest === correctPin) {
      setError('');
      onSuccess();
      onClose();
    } else {
      setError('PIN salah. Silakan periksa kembali!');
      setPin('');
      inputRef.current?.focus();
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      setError('Masukkan minimal 4 digit PIN.');
      return;
    }
    handleVerify(pin);
  };

  const handleNumberClick = (num: string) => {
    if (pin.length < 8) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError('');
      if (nextPin.length === correctPin.length) {
        handleVerify(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 text-center animate-in zoom-in-95">
        {/* Header Icon */}
        <div className="flex justify-end -mt-1 -mr-1">
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shadow-xs mb-3">
          <Lock className="w-7 h-7" />
        </div>

        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 mt-1 mb-5 px-2">{description}</p>

        {/* Form and Digits Display */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="relative flex justify-center items-center gap-2.5 my-2">
            {[0, 1, 2, 3].map((idx) => {
              const char = pin[idx];
              const isFilled = char !== undefined;
              return (
                <div
                  key={idx}
                  className={`w-11 h-12 rounded-xl border-2 flex items-center justify-center text-lg font-bold transition-all ${
                    isFilled
                      ? 'border-teal-700 bg-teal-50 text-teal-900 scale-105'
                      : 'border-slate-200 bg-slate-50 text-slate-400'
                  }`}
                >
                  {isFilled ? (showPin ? char : '●') : ''}
                </div>
              );
            })}

            {/* Hidden native input for keyboard users */}
            <input
              ref={inputRef}
              type={showPin ? 'text' : 'password'}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              value={pin}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setPin(val);
                setError('');
                if (val.length === correctPin.length) {
                  handleVerify(val);
                }
              }}
              className="absolute inset-0 opacity-0 cursor-default"
              autoFocus
            />
          </div>

          {/* Error message */}
          {error ? (
            <div className="flex items-center justify-center gap-1.5 text-xs text-rose-600 font-semibold animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              <span>PIN bawaan awal adalah <strong>1234</strong></span>
            </div>
          )}

          {/* Numeric Keypad for Mobile Touch Ease */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleNumberClick(digit)}
                className="py-3 rounded-2xl bg-slate-50 hover:bg-teal-50 active:bg-teal-100 border border-slate-200 hover:border-teal-300 font-bold text-base text-slate-800 transition active:scale-95 shadow-2xs"
              >
                {digit}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center transition active:scale-95"
              title={showPin ? 'Sembunyikan PIN' : 'Lihat PIN'}
            >
              {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => handleNumberClick('0')}
              className="py-3 rounded-2xl bg-slate-50 hover:bg-teal-50 active:bg-teal-100 border border-slate-200 hover:border-teal-300 font-bold text-base text-slate-800 transition active:scale-95 shadow-2xs"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="py-3 rounded-2xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-rose-600 font-bold text-xs transition active:scale-95"
            >
              Hapus
            </button>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition active:scale-95"
            >
              Buka Akses
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
