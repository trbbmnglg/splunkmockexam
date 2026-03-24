/**
 * components/LoadingScreen.jsx
 *
 * Full-page loading state shown while exam questions are being
 * generated, validated, and retrieved. Receives the current
 * loading message string from useExamSession.
 */

import { memo } from 'react';

export default memo(function LoadingScreen({ loadingText }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin" />
      <h2 className="text-2xl font-semibold text-slate-700 animate-pulse">{loadingText}</h2>
      <p className="text-slate-500 text-center max-w-md">
        We are generating a unique set of questions for you. This ensures your practice exam is close to the real dynamically generated test format.
      </p>
    </div>
  );
});
