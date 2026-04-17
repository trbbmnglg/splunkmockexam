import { useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

const ICONS = {
  success: { Icon: CheckCircle2,  color: 'text-accenture-purple-dark', bg: 'bg-accenture-purple-lightest', border: 'border-accenture-purple-light' },
  error:   { Icon: XCircle,       color: 'text-accenture-pink',        bg: 'bg-white',                     border: 'border-accenture-pink'         },
  warning: { Icon: AlertTriangle, color: 'text-accenture-purple-dark', bg: 'bg-accenture-purple-lightest', border: 'border-accenture-purple-light' },
  info:    { Icon: Info,          color: 'text-accenture-gray-dark',   bg: 'bg-white',                     border: 'border-accenture-gray-light'   },
};

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((t) => {
    const id = Date.now() + Math.random();
    setToasts((arr) => [...arr, { id, type: 'info', ...t }]);
    setTimeout(() => setToasts((arr) => arr.filter((x) => x.id !== id)), 3500);
  }, []);

  const ToastContainer = useCallback(() => (
    <div className="pointer-events-none fixed top-16 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2">
      {toasts.map((t) => {
        const { Icon, color, bg, border } = ICONS[t.type] || ICONS.info;
        return (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            className={`pointer-events-auto animate-fade-in flex items-center gap-2.5 border px-4 py-2.5 shadow-md ${bg} ${border}`}
          >
            <Icon size={18} className={color} aria-hidden="true" />
            <span className="text-sm text-black">{t.message}</span>
          </div>
        );
      })}
    </div>
  ), [toasts]);

  return { push, ToastContainer };
}

export default useToast;
