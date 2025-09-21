import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTransactions } from '../../contexts/TransactionContext';
import { generateReceiptPDF, ReceiptData } from '../../utils/pdfReceipt';
import SuccessModal from './SuccessModal';
import { AlertCircle, CheckCircle, Download, Share2, X, CreditCard, Smartphone } from 'lucide-react';

type CountryType = 'mozambique' | 'rwanda';
type CurrencyType = 'MZN' | 'RWF';

export default function SendMoney() {
  const { user } = useAuth();
  const { calculateFee } = useTransactions();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showMobileForm, setShowMobileForm] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'mobile' | null>(null);
  const [mobileNumber, setMobileNumber] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | undefined>(undefined);
  const [receiptDataState, setReceiptDataState] = useState<ReceiptData | null>(null);

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
    setSelectedPaymentMethod(type);
    setShowPaymentModal(false);
    if (type === 'mobile') {
      setShowMobileForm(true);
      setShowCardForm(false);
    } else if (type === 'card') {
      setShowCardForm(true);
      setShowMobileForm(false);
    }
  };

  const resetForms = () => {
    setShowMobileForm(false);
    setShowCardForm(false);
    setSelectedPaymentMethod(null);
  };

  const handleMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
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
      setShowSuccessMessage(true);
      setShowMobileForm(false);
      
      // Generate PDF in the background
      generateReceiptPDF(receiptData)
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);
        })
        .catch((err) => {
          console.error('Error generating PDF:', err);
          setError('Error generating receipt. Please try again.');
        });

    } catch (err) {
      console.error('Payment error:', err);
      setError('An error occurred while processing your payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!receiptDataState) return;
    
    try {
      const blob = await generateReceiptPDF(receiptDataState);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${receiptDataState.transactionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setError('Error downloading receipt. Please try again.');
    }
  };

  const shareReceipt = (receiptData: ReceiptData) => {
    // Logic to share the receipt (e.g., via email or social media)
    console.log('Sharing receipt:', receiptData);
    // TODO: Implement actual sharing functionality
  };

  // Card payment form component
  const CardPaymentForm = () => (
    <div className="mt-6 space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Detalhes do Cartão</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Número do Cartão
          </label>
          <input
            type="text"
            id="cardNumber"
            placeholder="1234 5678 9012 3456"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="expiry" className="block text-sm font-medium text-gray-700 mb-1">
              Validade
            </label>
            <input
              type="text"
              id="expiry"
              placeholder="MM/AA"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">
              CVV
            </label>
            <input
              type="text"
              id="cvv"
              placeholder="123"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div>
          <label htmlFor="cardName" className="block text-sm font-medium text-gray-700 mb-1">
            Nome no Cartão
          </label>
          <input
            type="text"
            id="cardName"
            placeholder="Nome como aparece no cartão"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="pt-4">
          <button
            type="button"
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Pagar Agora
          </button>
        </div>
      </div>
    </div>
  );

  // Mobile payment form component
  const MobilePaymentForm = () => (
    <form onSubmit={handleMobileSubmit} className="mt-6 space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Pagamento por Dinheiro Móvel</h3>
      <div>
        <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700 mb-1">
          Número de Telefone
        </label>
        <input
          type="tel"
          id="mobileNumber"
          value={mobileNumber}
          onChange={(e) => setMobileNumber(e.target.value)}
          placeholder="8XX XXX XXX"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processando...' : 'Pagar com M-Pesa'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Enviar Dinheiro</h2>
            {selectedPaymentMethod && (
              <button
                onClick={resetForms}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                ← Voltar
              </button>
            )}
          </div>
          
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

          <div className="space-y-6">
            {!selectedPaymentMethod ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handlePaymentTypeSelect('card')}
                  className={`p-6 border-2 rounded-lg transition-colors text-left ${
                    selectedPaymentMethod === 'card'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`p-3 rounded-full ${selectedPaymentMethod === 'card' ? 'bg-blue-100' : 'bg-gray-100'} mr-4`}>
                      <CreditCard className={`w-6 h-6 ${selectedPaymentMethod === 'card' ? 'text-blue-600' : 'text-gray-600'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Cartão de Crédito/Débito</p>
                      <p className="text-sm text-gray-500">Pague com seu cartão</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handlePaymentTypeSelect('mobile')}
                  className={`p-6 border-2 rounded-lg transition-colors text-left ${
                    selectedPaymentMethod === 'mobile'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-400 hover:bg-green-50'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`p-3 rounded-full ${selectedPaymentMethod === 'mobile' ? 'bg-green-100' : 'bg-gray-100'} mr-4`}>
                      <Smartphone className={`w-6 h-6 ${selectedPaymentMethod === 'mobile' ? 'text-green-600' : 'text-gray-600'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Dinheiro Móvel</p>
                      <p className="text-sm text-gray-500">Pague com M-Pesa</p>
                    </div>
                  </div>
                </button>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedPaymentMethod === 'card' ? 'Pagamento com Cartão' : 'Pagamento por Móvel'}
                  </h3>
                  <button
                    onClick={resetForms}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Alterar método
                  </button>
                </div>
                {showCardForm && <CardPaymentForm />}
                {showMobileForm && <MobilePaymentForm />}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Method Selection Modal */}
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
              <div className="mb-4">
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

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-700">
                  Você receberá uma notificação no seu telefone para confirmar o pagamento.
                </p>
              </div>

              <div className="flex space-x-3">
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
  );
}
