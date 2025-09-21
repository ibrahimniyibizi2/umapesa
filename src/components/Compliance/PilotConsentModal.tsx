import { useState, useEffect } from 'react';

export default function PilotConsentModal({
  isOpen,
  onClose,
  onAccept
}: {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}) {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isOpen) setChecked(false);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold mb-2">Pilot Feature Consent</h3>
        <p className="text-sm text-gray-700 mb-4">
          Some features available on UmaPesa may be running in a pilot or testing mode in
          jurisdictions where UmaPesa does not hold a direct licence. Pilot features may be subject
          to limitations, additional verification, or third‑party processing. By consenting below you
          acknowledge these limitations and agree to the collection of limited diagnostic data to
          improve the service.
        </p>

        <label className="flex items-start space-x-3 mt-3">
          <input
            type="checkbox"
            checked={checked}
            onChange={e => setChecked(e.target.checked)}
            className="mt-1"
          />
          <span className="text-sm text-gray-700">
            I understand the pilot limitations and consent to proceed.
          </span>
        </label>

        <div className="mt-6 flex justify-end space-x-2">
          <button onClick={onClose} className="px-3 py-2 text-sm rounded-lg bg-gray-100">
            Cancel
          </button>
          <button
            onClick={() => checked && onAccept()}
            disabled={!checked}
            className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white disabled:opacity-50"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
