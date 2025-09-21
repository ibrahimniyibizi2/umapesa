import React from 'react';
import { CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SuccessModalProps {
  show: boolean;
  onClose: () => void;
  pdfUrl?: string;
  receiptData?: any;
  shareReceipt?: (data: any) => void;
  downloadPDF?: (data: any) => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  show,
  onClose,
  pdfUrl,
  receiptData,
  shareReceipt,
  downloadPDF,
}) => {
  const navigate = useNavigate();
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-center relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold"
          aria-label="Close receipt modal"
        >
          &times;
        </button>
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Transfer Completed!
        </h3>
        <p className="text-gray-600">
          Your transfer was successfully completed!
        </p>
        {/* PDF Preview Section */}
        {pdfUrl && (
          <div className="my-4">
            <iframe
              src={pdfUrl}
              title="Receipt Preview"
              width="100%"
              height="400px"
              style={{ border: '1px solid #e5e7eb', borderRadius: '8px' }}
            />
          </div>
        )}
        <div className="mt-6 space-y-4">
          <button
            onClick={() => navigate('/transfer')}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center transition-colors duration-200"
          >
            New Transfer
          </button>
          <button
            onClick={() => receiptData && shareReceipt && shareReceipt(receiptData)}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center justify-center transition-colors duration-200"
          >
            Share Receipt
          </button>
          <button
            onClick={() => receiptData && downloadPDF && downloadPDF(receiptData)}
            className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center justify-center transition-colors duration-200"
          >
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
