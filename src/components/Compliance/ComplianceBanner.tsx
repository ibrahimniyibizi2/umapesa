import React from 'react';

export default function ComplianceBanner({ onLearnMore }: { onLearnMore?: () => void }) {
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-b-md">
      <div className="max-w-md mx-auto flex items-start space-x-3">
        <div className="flex-1">
          <div className="text-sm text-yellow-900 font-semibold">Important: Partner & Pilot Notice</div>
          <p className="text-xs text-yellow-800 mt-1">
            UmaPesa operates through authorised third‑party partners in some jurisdictions. Where
            UmaPesa is not directly authorised to provide payment services, services are provided
            by those local partners. Some functionality may be available in a limited pilot/testing
            capacity.
          </p>
        </div>
        <div className="flex-shrink-0">
          <button
            onClick={onLearnMore}
            className="text-sm text-yellow-900 underline"
            aria-label="Learn more about compliance"
          >
            Learn more
          </button>
        </div>
      </div>
    </div>
  );
}
