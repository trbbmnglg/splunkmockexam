import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Shown when an incoming QR profile transfer would overwrite existing study
 * data on the device. Forces the user to explicitly pick which data to keep.
 * Extracted from App.jsx so the inline JSX no longer lives in the page root.
 */
export default function TransferCollisionModal({ onKeep, onUseIncoming }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-accenture-purple shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h3 className="font-bold text-lg text-accenture-black">Existing Study Data Found</h3>
            <p className="text-sm text-accenture-gray-dark mt-1">
              This device already has study progress. A new profile was shared via QR code. What would you like to do?
            </p>
          </div>
        </div>
        <div className="bg-accenture-purple-lightest border border-accenture-purple-light rounded-lg p-3 text-xs text-accenture-purple-darkest">
          Choosing "Use incoming profile" will replace your current data on this device.
          Your current progress cannot be recovered afterward.
        </div>
        <div className="flex gap-3">
          <button
            onClick={onKeep}
            className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg border border-accenture-gray-light text-accenture-gray-dark hover:bg-accenture-gray-off-white transition-colors"
          >
            Keep current
          </button>
          <button
            onClick={onUseIncoming}
            className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg bg-accenture-purple text-white hover:bg-accenture-purple-dark transition-colors"
          >
            Use incoming profile
          </button>
        </div>
      </div>
    </div>
  );
}
