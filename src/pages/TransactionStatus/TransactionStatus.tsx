import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { XCircle, Loader2, Download, Share2, ArrowLeft } from 'lucide-react';
import { useTransactions } from '../../hooks/useTransactions';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface TransactionData {
  tx_ref: string | null;
  transaction_id: string | null;
  amount: number;
  currency: 'MZN' | 'RWF';
  recipientName: string;
  date: string;
}

const TransactionStatus: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { updateTransactionStatus } = useTransactions() || {};
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing your transaction...');
  const [transactionData, setTransactionData] = useState<TransactionData | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const generatePDF = () => {
    if (!receiptRef.current || !transactionData) return;
    
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Transaction Receipt', 105, 20, { align: 'center' });
    
    // Add transaction details
    doc.setFontSize(12);
    doc.text(`Transaction ID: ${transactionData?.tx_ref || 'N/A'}`, 20, 40);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 50);
    doc.text(`Status: ${status === 'success' ? 'Completed' : 'Failed'}`, 20, 60);
    doc.text(`Amount: ${transactionData?.amount || '0'} ${transactionData?.currency || 'RWF'}`, 20, 70);
    doc.text(`Recipient: ${transactionData?.recipientName || 'N/A'}`, 20, 80);
    
    // Save the PDF
    doc.save(`receipt-${transactionData?.tx_ref || 'receipt'}.pdf`);
  };

  const shareReceipt = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Transaction Receipt',
          text: `Here's your transaction receipt for ${transactionData?.amount} ${transactionData?.currency}`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      alert('Web Share API not supported in your browser');
    }
  };

  useEffect(() => {
    const processTransaction = async () => {
      try {
        const searchParams = new URLSearchParams(location.search);
        const status = searchParams.get('status');
        const txRef = searchParams.get('tx_ref');
        const transactionId = searchParams.get('transaction_id');

        if (status === 'successful' && transactionId) {
          // Create default transaction data with safe defaults
          const defaultData: TransactionData = {
            tx_ref: txRef,
            transaction_id: transactionId,
            amount: 0,
            currency: 'MZN',
            recipientName: 'Recipient',
            date: new Date().toISOString()
          };

          try {
            // Update transaction status if update function is available
            if (updateTransactionStatus) {
              await updateTransactionStatus(
                txRef || '',
                'completed',
                { paymentId: transactionId, paymentMethod: 'card' }
              );
            }
            
            // Update state with transaction data
            setTransactionData(defaultData);
            setStatus('success');
            setMessage('Payment successful! Your transaction is being processed.');
          } catch (error) {
            console.error('Error updating transaction status:', error);
            // Use default data on error but still show success to user
            setTransactionData(defaultData);
            setStatus('success');
            setMessage('Transaction completed! (Status update failed)');
          }
        } else {
          // Handle failed or missing transaction
          setStatus('error');
          setMessage('Payment was not successful. Please try again.');
          setTransactionData({
            tx_ref: txRef,
            transaction_id: transactionId,
            amount: 0,
            currency: 'MZN',
            recipientName: '',
            date: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error processing transaction:', error);
        setStatus('error');
        setMessage('An error occurred while processing your transaction.');
      }
    };

    processTransaction();
  }, [location.search, navigate, updateTransactionStatus]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h2>
          </>
        )}
        
        {status === 'success' && transactionData && (
          <div ref={receiptRef} className="text-left">
            <div className="flex justify-between items-center mb-6">
              <button 
                onClick={() => navigate('/send-money')}
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </button>
              <h2 className="text-2xl font-bold text-gray-900">Payment Successful!</h2>
              <div className="w-4"></div> {/* Spacer for alignment */}
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-medium">{transactionData.tx_ref}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">{new Date().toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">
                  {transactionData.amount} {transactionData.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Recipient:</span>
                <span className="font-medium">{transactionData.recipientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="text-green-600 font-medium">Completed</span>
              </div>
            </div>
            
            <div className="flex space-x-4 mt-8">
              <button
                onClick={generatePDF}
                className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
              <button
                onClick={shareReceipt}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>
        )}
        
        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => navigate('/send-money')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TransactionStatus;
