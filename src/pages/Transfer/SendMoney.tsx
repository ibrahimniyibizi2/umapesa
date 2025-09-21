import React, { useState, useCallback } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlutterwave } from 'flutterwave-react-v3';
import { 
  Send, 
  User, 
  Phone, 
  MapPin, 
  DollarSign, 
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Calculator
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { PaymentService } from '../../lib/nhonga';
import { isPaymentEnabled } from '../../lib/config';

type Country = 'mozambique' | 'rwanda';
type Currency = 'MZN' | 'RWF';

interface FormData {
  recipientName: string;
  recipientPhone: string;
  recipientCountry: Country;
  amount: string;
  currency: Currency;
  paymentMethod?: string;
  paymentProvider?: string;
  country?: string;
  email?: string;
  reason?: string;
}

// Define Flutterwave config type
interface FlutterwaveConfig {
  public_key: string;
  tx_ref: string;
  amount: number;
  currency: string;
  payment_options: string;
  customer: {
    email: string;
    phone_number: string;
    name: string;
  };
  customizations: {
    title: string;
    description: string;
    logo: string;
  };
}

// Main SendMoney component
const SendMoney: FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  // Initialize Flutterwave payment
  const flutterwavePayment = useFlutterwave({
    public_key: process.env.REACT_APP_FLUTTERWAVE_PUBLIC_KEY || '',
    tx_ref: `tx-${Date.now()}`,
    amount: 0,
    currency: 'MZN',
    payment_options: 'card',
    customer: {
      email: user?.email || '',
      phone_number: '',
      name: '',
    },
    customizations: {
      title: 'Umapesa Payment',
      description: 'Payment for money transfer',
      logo: '/logo.png',
    },
  });
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    recipientName: '',
    recipientPhone: '',
    recipientCountry: 'rwanda',
    amount: '',
    currency: 'MZN'
  });
  
  // Handle form input changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);
  
  // Get Flutterwave config
  const getFlutterwaveConfig = useCallback((): FlutterwaveConfig => ({
    public_key: process.env.REACT_APP_FLUTTERWAVE_PUBLIC_KEY || '',
    tx_ref: `tx-${Date.now()}`,
    amount: Number(formData.amount) || 0,
    currency: formData.currency,
    payment_options: 'card',
    customer: {
      email: user?.email || '',
      phone_number: formData.recipientPhone,
      name: formData.recipientName || 'Customer',
    },
    customizations: {
      title: 'Umapesa Payment',
      description: 'Payment for money transfer',
      logo: '/logo.png',
    },
  }), [formData.amount, formData.currency, formData.recipientName, formData.recipientPhone, user?.email]);

  const handlePayment = useCallback(() => {
    try {
      const config = getFlutterwaveConfig();
      
      // Use type assertion to handle the Flutterwave response type
      flutterwavePayment({
        ...config,
        callback: (response: { status: string; tx_ref: string }) => {
          console.log('Payment response:', response);
          if (response.status === 'successful') {
            navigate(`/transaction-status?status=success&tx_ref=${response.tx_ref}`);
          } else {
            setError('Payment was not successful. Please try again.');
          }
        },
        onClose: () => {
          console.log('Payment modal closed');
        },
      });
    } catch (error) {
      console.error('Payment initialization error:', error);
      setError('Failed to initialize payment. Please try again.');
    }
  }, [flutterwavePayment, getFlutterwaveConfig, navigate]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showMobileForm, setShowMobileForm] = useState(false);
  const [showPaymentTypeModal, setShowPaymentTypeModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [selectedPaymentMethod] = useState<string | null>(null);
  
  const paymentEnabled = isPaymentEnabled();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const amount = parseFloat(formData.amount);
      if (amount < 100) {
        setError('Minimum transfer amount is 100 MZN');
        return;
      }

      if (!acceptedTerms) {
        setError('Please accept the Terms of Service, Privacy Policy, and Security Policy');
        return;
      }

      if (!paymentEnabled) {
        setError('Payment service is currently unavailable. Please try again later or contact support.');
        return;
      }

      setShowPaymentModal(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred. Please try again.';
      setError(errorMessage);
    }
  };

  // Initialize payment
  const initializePayment = () => {
    handlePayment();
  };

  const handlePaymentTypeSelect = (type: 'card' | 'mobile') => {
    setShowPaymentModal(false);
    if (type === 'card') {
      // Directly initialize card payment
      initializePayment();
    } else {
      setShowMobileForm(true);
    }
  };

  const handleMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(''); // Clear previous errors
    
    if (!paymentEnabled) {
      setError('Payment service is currently unavailable. Please contact support.');
      setLoading(false);
      return;
    }

    try {
      // Validate mobile number format
      if (!mobileNumber || mobileNumber.length < 9) {
        throw new Error('Please enter a valid phone number');
      }

      // Call Nhonga API for mobile money processing
      await PaymentService.sendMoney({
        phoneNumber: mobileNumber,
        amount: parseFloat(formData.amount),
        method: 'mpesa' // or 'emola' based on selection
      });
      try {
        // Process the payment here
        // For now, we'll just simulate a successful payment
        setLoading(false);
        setShowSuccessMessage(true);
        
        // Reset form after successful submission
        setFormData({
          recipientName: '',
          recipientPhone: '',
          recipientCountry: 'rwanda',
          amount: '',
          currency: 'MZN',
          paymentMethod: 'mobile_money',
          paymentProvider: 'mpesa',
          country: 'mozambique',
          email: '',
          reason: ''
        });
        
        // Hide success message after 5 seconds
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 5000);
      } catch (error) {
        setLoading(false);
        setError(error instanceof Error ? error.message : 'Payment processing failed. Please try again.');
      }
    } catch (error) {
      setLoading(false);
      setShowMobileForm(false);
      console.error('Payment error:', error);
      setError(error instanceof Error ? error.message : 'Payment processing failed. Please try again.');
    }
  };

  // handleChange is already defined above with useCallback

  const amount = parseFloat(formData.amount) || 0;
  const targetCurrency = formData.recipientCountry === 'mozambique' ? 'MZN' : 'RWF';
  
  // Calculate exchange rate and convert to FRW
  const exchangeRate = formData.currency === 'RWF' ? 1 : 
    (formData.currency === 'MZN' ? 4.5 : 1);
  
  // Calculate transaction fee
  const calculateTransactionFee = useCallback((amount: number): number => {
    // Simple fee calculation - 2% fee with minimum of 10 units
    const fee = amount * 0.02;
    return Math.max(fee, 10);
  }, []);
  
  // Calculate payment method fee
  const calculatePaymentMethodFee = useCallback((amount: number): number => {
    // 1% fee for payment method
    return amount * 0.01;
  }, []);

  // Calculate amounts
  const transactionFee = calculateTransactionFee(amount);
  const paymentMethodFeeAmount = calculatePaymentMethodFee(amount);
  const amountInFrw = amount * exchangeRate;
  const feeInFrw = transactionFee * exchangeRate;
  const processingFeeRate = 0.05; // 5% processing fee
  const processingFee = amountInFrw * processingFeeRate;
  const totalInFrw = amountInFrw + feeInFrw + processingFee;
  
  // For display
  const displayExchangeRate = exchangeRate.toFixed(2);
  const displayProcessingFee = processingFee.toFixed(2);
  const displayProcessingPercentage = (processingFeeRate * 100).toFixed(0);
  const displayTotalInFrw = totalInFrw.toFixed(2);
  
  // Add default export at the end of the file

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Send Money</h1>
          <p className="text-gray-600">
            Send money quickly and securely to friends and family across borders.
          </p>
        </div>

        {/* Transfer Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Calculator className="w-5 h-5 mr-2" />
            Transfer Summary
          </h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">You send</span>
              <span className="font-semibold text-gray-900">
                {amount.toLocaleString()} {formData.currency}
              </span>
            </div>
            
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Transfer fee</span>
              <span>{transactionFee.toLocaleString()} {formData.currency}</span>
            </div>
            
            {formData.currency !== 'RWF' && (
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Exchange rate (1 {formData.currency} = FRW)</span>
                  <span>{displayExchangeRate}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>{displayProcessingPercentage}% Processing fee</span>
                  <span>-{displayProcessingFee} FRW</span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium text-gray-900 mt-1">
                  <span>Total in FRW</span>
                  <span>{displayTotalInFrw} FRW</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Transfer Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Recipient Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Confirmar Pagamento com Cartão
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="recipientName"
                        required
                        value={formData.recipientName}
                        onChange={handleChange}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter recipient's full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                        <input
                          type="tel"
                          name="recipientPhone"
                          required
                          value={formData.recipientPhone}
                          onChange={handleChange}
                          className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="+250 78 123 4567"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transfer Amount */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2" />
                    Transfer Amount
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount
                      </label>
                      <input
                        type="number"
                        name="amount"
                        required
                        min="100"
                        step="0.01"
                        value={formData.amount}
                        onChange={handleChange}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                      </label>
                      <select
                        name="currency"
                        required
                        value={formData.currency}
                        onChange={handleChange}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="MZN">MZN - Mozambican Metical</option>
                        <option value="RWF">RWF - Rwandan Franc</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                        <select
                          name="recipientCountry"
                          required
                          value={formData.recipientCountry}
                          onChange={handleChange}
                          className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                          <option value="rwanda">Rwanda</option>
                          <option value="mozambique">Mozambique</option>
                        </select>
                      </div>
                    </div>

                  </div>
                </div>


                {/* Terms and Conditions */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Terms and Conditions
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p>• Transfer fees apply based on amount and payment method</p>
                    <p>• Exchange rates are updated daily</p>
                    <p>• Transfers typically complete within 2-5 minutes</p>
                    <p>• SMS and email notifications will be sent to both parties</p>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="acceptTerms"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="acceptTerms" className="text-sm text-gray-700">
                      I accept the{' '}
                      <a href="#" className="text-blue-600 hover:text-blue-700">Terms of Service</a>,{' '}
                      <a href="#" className="text-blue-600 hover:text-blue-700">Privacy Policy</a>, and{' '}
                      <a href="#" className="text-blue-600 hover:text-blue-700">Security Policy</a>
                    </label>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading || amount < 100 || !acceptedTerms || !formData.recipientName || !formData.recipientPhone}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors duration-200"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Review Transfer
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Transfer Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calculator className="w-5 h-5 mr-2" />
                Transfer Summary
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">You send</span>
                  <span className="font-semibold text-gray-900">
                    {amount.toLocaleString()} {formData.currency}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Transfer fee</span>
                  <span className="font-semibold text-gray-900">
                    {transactionFee.toLocaleString()} {formData.currency}
                  </span>
                </div>
                
                {selectedPaymentMethod && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Payment method fee</span>
                    <span className="font-semibold text-gray-900">
                      {paymentMethodFeeAmount.toLocaleString()} {formData.currency}
                    </span>
                  </div>
                )}
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total amount</span>
                    <span className="font-bold text-lg text-gray-900">
                      {amount.toLocaleString()} {formData.currency}
                    </span>
                  </div>
                </div>

                {amount > 0 && formData.currency !== targetCurrency && (
                  <>
                    <div className="flex justify-center py-2">
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-green-700 font-medium">Recipient gets</span>
                        <span className="font-bold text-lg text-green-800">
                          {displayTotalInFrw} FRW
                        </span>
                      </div>
                      <div className="text-xs text-green-600">
                        Exchange rate: 1 {formData.currency} = {displayExchangeRate} FRW
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>


        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Qual tipo de pagamento deseja utilizar?
              </h3>
              
              <div className="space-y-4 mb-6">
                <button
                  onClick={() => handlePaymentTypeSelect('card')}
                  className="w-full p-4 border border-gray-200 rounded-lg text-left hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">💳</span>
                    <div>
                      <p className="font-medium text-gray-900">Cartão</p>
                      <p className="text-sm text-gray-600">Visa, Mastercard</p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => handlePaymentTypeSelect('mobile')}
                  className="w-full p-4 border border-gray-200 rounded-lg text-left hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📱</span>
                    <div>
                      <p className="font-medium text-gray-900">Mobile Money</p>
                      <p className="text-sm text-gray-600">M-Pesa, eMola</p>
                    </div>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Payment Type Selection Modal */}
        {showPaymentTypeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Qual tipo de pagamento deseja utilizar?
              </h3>
              
              <div className="space-y-4 mb-6">
                <button
                  onClick={() => handlePaymentTypeSelect('card')}
                  className="w-full p-4 border border-gray-200 rounded-lg text-left hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">💳</span>
                    <div>
                      <p className="font-medium text-gray-900">Cartão</p>
                      <p className="text-sm text-gray-600">Visa, Mastercard</p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => handlePaymentTypeSelect('mobile')}
                  className="w-full p-4 border border-gray-200 rounded-lg text-left hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📱</span>
                    <div>
                      <p className="font-medium text-gray-900">Mobile Money</p>
                      <p className="text-sm text-gray-600">M-Pesa, eMola</p>
                    </div>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setShowPaymentTypeModal(false)}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Mobile Money Form Modal */}
        {showMobileForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Mobile Money
              </h3>

              <form onSubmit={handleMobileSubmit} className="space-y-4">
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
                    {loading ? 'Processando...' : 'Recarregar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Success Message Modal */}
        {showSuccessMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Transferência Realizada!
              </h3>
              <p className="text-gray-600 mb-4">
                Sua transferência foi realizada com sucesso!
              </p>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Add default export
export default SendMoney;