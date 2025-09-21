import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTransactions } from '../../contexts/TransactionContext';
import { generateReceiptPDF, ReceiptData } from '../../utils/pdfReceipt';
import SuccessModal from './SuccessModal';
import { AlertCircle } from 'lucide-react';

type CountryType = 'mozambique' | 'rwanda';
type CurrencyType = 'MZN' | 'RWF';

export default function SendMoney() {
  const { user } = useAuth();
  const { calculateFee } = useTransactions();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showMobileForm, setShowMobileForm] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | undefined>(undefined);
  const [receiptDataState, setReceiptDataState] = useState<ReceiptData | null>(null);

  const paymentEnabled = isPaymentEnabled();

  // Form state
  const formData = {
    recipientName: '',
    recipientEmail: '',
    recipientPhone: '',
    recipientCountry: 'mozambique' as CountryType,
    amount: '0',
    currency: 'MZN' as CurrencyType,
    description: ''
  };

  const handlePaymentTypeSelect = (type: 'card' | 'mobile') => {
    setShowPaymentModal(false);
    if (type === 'mobile') {
      setShowMobileForm(true);
    } else if (type === 'card') {
      // Handle card payment
      setShowPaymentModal(false);
    }
  };

  const handleMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!paymentEnabled) {
      setError('Payment service is currently unavailable. Please contact support.');
      setLoading(false);
      return;
    }

    try {
      if (!mobileNumber || mobileNumber.length < 9) {
        throw new Error('Please enter a valid phone number');
      }

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create receipt data
      const receiptData: ReceiptData = {
        transactionId: `TXN-${Date.now()}`,
        reference: `REF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        date: new Date().toISOString(),
        recipientName: formData.recipientName,
        recipientPhone: mobileNumber,
        recipientEmail: user?.email || '',
        recipientCountry: formData.recipientCountry,
        amount: parseFloat(formData.amount),
        fee: calculateFee(parseFloat(formData.amount)),
        total: parseFloat(formData.amount) + calculateFee(parseFloat(formData.amount)),
        currency: formData.currency,
        paymentMethod: 'Mobile Money',
        status: 'completed',
      };

      setReceiptDataState(receiptData);
      setShowMobileForm(false);
      setShowSuccessMessage(true);

      // Generate and save PDF
      try {
        const pdfBlob = await generateReceiptPDF(receiptData);
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(pdfUrl);

        // Save to local storage
        const receipts = JSON.parse(localStorage.getItem('receipts') || '[]');
        receipts.push({
          ...receiptData,
          pdfUrl,
          date: receiptData.date
        });
        localStorage.setItem('receipts', JSON.stringify(receipts));
      } catch (err) {
        console.error('Error generating receipt:', err);
        setError('Error generating receipt. Please contact support.');
      }
    } catch (error) {
      setLoading(false);
      setShowMobileForm(false);
      console.error('Payment error:', error);
      setError(error instanceof Error ? error.message : 'Payment processing failed. Please try again.');
    }
  };

  const shareReceipt = (receiptData: ReceiptData) => {
    // Logic to share the receipt (e.g., via email or social media)
    console.log('Sharing receipt:', receiptData);
    // TODO: Implement actual sharing functionality
  };

  const downloadPDF = async (receiptData: ReceiptData) => {
    try {
      const pdfBlob = await generateReceiptPDF(receiptData);
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${receiptData.transactionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setError('Error downloading receipt. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Enviar Dinheiro</h2>
          
          {showPaymentModal && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                  aria-label="Close payment modal"
                >
                  &times;
                </button>
                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  Selecione o Método de Pagamento
                </h3>
                <div className="space-y-4">
                  <button
                    onClick={() => handlePaymentTypeSelect('card')}
                    className="w-full p-4 border border-blue-200 rounded-lg text-left hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center"
                  >
                    <span className="text-2xl mr-3">💳</span>
                    <div>
                      <p className="font-medium text-gray-900">Cartão de Crédito/Débito</p>
                      <p className="text-sm text-gray-600">Visa, Mastercard, etc.</p>
                    </div>
                  </button>
                  <button
                    onClick={() => handlePaymentTypeSelect('mobile')}
                    className="w-full p-4 border border-green-200 rounded-lg text-left hover:border-green-400 hover:bg-green-50 transition-colors flex items-center"
                  >
                    <span className="text-2xl mr-3">📱</span>
                    <div>
                      <p className="font-medium text-gray-900">Dinheiro Móvel</p>
                      <p className="text-sm text-gray-600">M-Pesa, eMola, etc.</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Money Form Modal */}
          {showMobileForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Dinheiro Móvel
                </h3>

                <form onSubmit={handleMobileSubmit}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de telefone
                    </label>
                    <input
                      type="tel"
                      required
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+258 84 123 4567"
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-700">
                      Você receberá uma notificação no seu telefone para confirmar o pagamento.
                    </p>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowMobileForm(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Processando...' : 'Pagar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Error Message */}
          <div className="px-6 py-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                aria-label="Close payment modal"
              >
                &times;
              </button>
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Selecione o Método de Pagamento
              </h3>
              <div className="space-y-4">
                <button
                  onClick={() => handlePaymentTypeSelect('card')}
                  className="w-full p-4 border border-blue-200 rounded-lg text-left hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center"
                >
                  <span className="text-2xl mr-3">💳</span>
                  <div>
                    <p className="font-medium text-gray-900">Cartão de Crédito/Débito</p>
                    <p className="text-sm text-gray-600">Visa, Mastercard, etc.</p>
                  </div>
                </button>
                <button
                  onClick={() => handlePaymentTypeSelect('mobile')}
                  className="w-full p-4 border border-green-200 rounded-lg text-left hover:border-green-400 hover:bg-green-50 transition-colors flex items-center"
                >
                  <span className="text-2xl mr-3">📱</span>
                  <div>
                    <p className="font-medium text-gray-900">Dinheiro Móvel</p>
                    <p className="text-sm text-gray-600">M-Pesa, eMola, etc.</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {showMobileForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Dinheiro Móvel
              </h3>

              <form onSubmit={handleMobileSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de telefone
                  </label>
                  <input
                    type="tel"
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+258 84 123 4567"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    Você receberá uma notificação no seu telefone para confirmar o pagamento.
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowMobileForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Processando...' : 'Pagar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}


        {/* Success Message Modal */}
        {showSuccessMessage && receiptDataState && (
          <SuccessModal
            show={showSuccessMessage}
            onClose={() => setShowSuccessMessage(false)}
            pdfUrl={pdfUrl}
            receiptData={receiptDataState}
            shareReceipt={() => shareReceipt(receiptDataState)}
            downloadPDF={downloadPDF}
          />
        )}
      </div>
    </div>
  );
}