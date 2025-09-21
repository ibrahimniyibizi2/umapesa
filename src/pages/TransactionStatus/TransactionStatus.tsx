import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { XCircle, Loader2, Download, Share2 } from 'lucide-react';
import { useTransactions } from '../../contexts/TransactionContext';
import { jsPDF } from 'jspdf';
// Define types locally to avoid unused imports
type Currency = 'MZN' | 'RWF';
type TransactionStatusType = 'pending' | 'processing' | 'completed' | 'failed';

interface TransactionData {
  reference?: string;
  paymentId?: string;
  status?: TransactionStatusType;
  amount?: number;
  currency?: Currency;
  recipientName?: string;
  completedAt?: string;
  paymentMethod?: string;
  description?: string;
}

// This component displays the status of a transaction
// and provides options to download or share the receipt

const TransactionStatus: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { updateTransactionStatus } = useTransactions();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing your transaction...');
  const [transactionData, setTransactionData] = useState<TransactionData | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const generatePDF = () => {
    if (!receiptRef.current || !transactionData) return;
    
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Transaction Receipt', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Transaction ID: ${transactionData.reference || 'N/A'}`, 20, 40);
    doc.text(`Date: ${new Date().toLocaleString()}`, 20, 50);
    doc.text(`Status: ${transactionData.status?.toUpperCase() || 'UNKNOWN'}`, 20, 60);
    doc.text(`Amount: ${transactionData.amount || '0'} ${transactionData.currency || 'RWF'}`, 20, 70);
    doc.text(`Recipient: ${transactionData.recipientName || 'N/A'}`, 20, 80);
    
    // Add payment method if available
    if (transactionData.paymentMethod) {
      doc.text(`Payment Method: ${transactionData.paymentMethod}`, 20, 90);
    }
    
    // Add description if available
    if (transactionData.description) {
      doc.text(`Description: ${transactionData.description}`, 20, 100);
    }
    
    doc.save(`receipt-${transactionData.reference || 'receipt'}.pdf`);
  };

  const shareReceipt = async () => {
    if (navigator.share && transactionData) {
      try {
        await navigator.share({
          title: 'Transaction Receipt',
          text: `Transaction of ${transactionData.amount} ${transactionData.currency} to ${transactionData.recipientName}` ,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      alert('Web Share API not supported in your browser');
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const status = searchParams.get('status');
    const txRef = searchParams.get('tx_ref');
    const transactionId = searchParams.get('transaction_id');
    const amount = searchParams.get('amount');
    const currency = (searchParams.get('currency') || 'RWF') as Currency;
    const recipientName = searchParams.get('recipient_name') || 'Unknown Recipient';
    const recipientPhone = searchParams.get('recipient_phone') || '';

    const processTransaction = async () => {
      try {
        if (status === 'successful' && transactionId && txRef) {
          const paymentData = {
            paymentId: transactionId,
            paymentMethod: 'card',
            amount: amount ? parseFloat(amount) : 0,
            currency,
            recipientName: recipientName || 'Unknown Recipient',
            recipientPhone: recipientPhone || ''
          };
          
          await updateTransactionStatus(txRef, 'completed', paymentData);
          
          setTransactionData({
            reference: txRef,
            paymentId: transactionId,
            status: 'completed',
            amount: amount ? parseFloat(amount) : 0,
            currency,
            recipientName: recipientName || 'Unknown Recipient',
            completedAt: new Date().toISOString()
          });
          
          setStatus('success');
          setMessage('Payment successful! Your transaction has been processed.');
        } else {
          setStatus('error');
          setMessage('Payment was not successful. Please try again.');
          
          // Set some default data for error case
          setTransactionData({
            reference: txRef || 'N/A',
            status: 'failed',
            amount: amount ? parseFloat(amount) : 0,
            currency: currency || 'RWF',
            recipientName: recipientName || 'Unknown Recipient'
          });
        }
      } catch (error) {
        console.error('Error processing transaction:', error);
        setStatus('error');
        setMessage('An error occurred while processing your transaction.');
        
        // Set some default data for error case
        setTransactionData({
          reference: txRef || 'N/A',
          status: 'failed',
          amount: amount ? parseFloat(amount) : 0,
          currency: currency,
          recipientName: recipientName
        });
      }
    };

    processTransaction();
  }, [location.search, updateTransactionStatus]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8" ref={receiptRef}>
        <div className="text-center mb-8">
          {status === 'success' ? (
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          )}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {status === 'success' ? 'Payment Successful!' : 'Payment Failed'}
          </h2>
          <p className="text-gray-600 mb-6">{message}</p>
        </div>

        {transactionData && (
          <div className="space-y-4 mb-8">
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-600">Transaction ID:</span>
              <span className="font-medium">{transactionData.reference || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium">{new Date().toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-600">Amount:</span>
              <span className="font-medium">
                {transactionData.amount} {transactionData.currency}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-600">Recipient:</span>
              <span className="font-medium">{transactionData.recipientName || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-600">Status:</span>
              <span className={`font-medium ${
                transactionData.status === 'completed' ? 'text-green-600' : 'text-red-600'
              }`}>
                {transactionData.status?.toUpperCase()}
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col space-y-4">
          <button
            onClick={() => navigate('/transactions')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View All Transactions
          </button>
          
          {status === 'success' && (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={generatePDF}
                className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50"
              >
                <Download className="w-4 h-4" />
                Save PDF
              </button>
              <button
                onClick={shareReceipt}
                className="flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionStatus;
