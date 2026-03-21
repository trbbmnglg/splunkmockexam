/**
 * components/ErrorModal.jsx
 *
 * Full-screen overlay shown when an API or generation error occurs.
 * Renders whatever string or object is passed as apiError.
 * Dismissed by calling onDismiss which clears the error in useExamSession.
 */

import { AlertTriangle } from 'lucide-react';

export default function ErrorModal({ apiError, onDismiss }) {
  if (!apiError) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white p-6 md:p-8 max-w-lg w-full shadow-2xl rounded-xl animate-fade-in border-t-4 border-red-500">
        <div className="flex items-center mb-4 text-red-600">
          <AlertTriangle className="w-8 h-8 mr-3 flex-shrink-0" />
          <h3 className="text-xl font-bold">API Connection Issue</h3>
        </div>
        <p className="text-slate-600 mb-8 whitespace-pre-wrap leading-relaxed">
          {typeof apiError === 'string' ? apiError : JSON.stringify(apiError)}
        </p>
        <button
          onClick={onDismiss}
          className="w-full px-6 py-3 bg-slate-800 hover:bg-slate-900 rounded-lg text-white font-bold transition-colors shadow-md"
        >
          Acknowledge
        </button>
      </div>
    </div>
  );
}
