import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Download, Share2, ArrowLeft } from 'lucide-react';
import { PaymentService } from '../../lib/nhonga';
import { useTransactions } from '../../hooks/useTransactions';
import { PaymentMessageService } from '../../lib/paymentMessages';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const { updateTransactionStatus, updateCampaignContribution } = useTransactions();
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const paymentId = searchParams.get('payment_id');
  const transactionId = searchParams.get('transaction_id');
  const campaignId = searchParams.get('campaign_id');
  const contributionId = searchParams.get('contribution_id');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!paymentId) {
        setLoading(false);
        return;
      }

      try {
        const result = await PaymentService.getPaymentStatus(paymentId);
        if (result.success) {
          setPaymentData(result.data);
          
          // Update transaction or campaign status
          if (transactionId && result.status === 'completed') {
            updateTransactionStatus(transactionId, 'completed', {
              completedAt: new Date().toISOString()
            });
          }
          
          if (contributionId && result.status === 'completed') {
            // Update campaign contribution status
            updateCampaignContribution(contributionId, {
              status: 'completed',
              completedAt: new Date().toISOString()
            });
            
            // Generate confirmation message
            const confirmationMessage = PaymentMessageService.generateContributionConfirmation({
              amount: result.data?.amount || 0,
              currency: result.data?.currency || 'MZN',
              transactionId: paymentId,
              paymentMethod: result.data?.method === 'M-Pesa' ? 'mpesa' : 
                           result.data?.method === 'eMola' ? 'emola' : 'card',
              campaignTitle: 'Campaign Contribution'
            });
            
            console.log('SMS Confirmation:', confirmationMessage);
          }
        }
      } catch (error) {
        console.error('Payment verification error:', error);
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [paymentId, transactionId, campaignId, contributionId]);

  const generateReceipt = () => {
    // Generate PDF receipt
    const receiptData = {
      paymentId,
      amount: paymentData?.amount || 0,
      currency: paymentData?.currency || 'MZN',
      method: paymentData?.method || 'Unknown',
      date: new Date().toLocaleDateString(),
      status: paymentData?.status || 'completed'
    };
    
    console.log('Generating PDF receipt:', receiptData);
    // In a real implementation, this would generate and download a PDF
  };

  const sharePayment = () => {
    if (navigator.share) {
      navigator.share({
        title: 'UmaPesa Payment Successful',
        text: `Payment of ${paymentData?.amount} ${paymentData?.currency} completed successfully`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>
          
          <p className="text-gray-600 mb-8">
            Your payment has been processed successfully. You will receive a confirmation email shortly.
          </p>

          {paymentData && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Amount:</span>
                  <div className="font-semibold text-gray-900">
                    {paymentData.amount} {paymentData.currency}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Method:</span>
                  <div className="font-semibold text-gray-900">{paymentData.method}</div>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <div className="font-semibold text-green-600 capitalize">{paymentData.status}</div>
                </div>
                <div>
                  <span className="text-gray-600">Payment ID:</span>
                  <div className="font-semibold text-gray-900 font-mono text-xs">{paymentId}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              onClick={generateReceipt}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Download className="w-5 h-5 mr-2" />
              Download Receipt
            </button>
            
            <button
              onClick={sharePayment}
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
            >
              <Share2 className="w-5 h-5 mr-2" />
              Share
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/dashboard"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Link>
            
            {transactionId && (
              <Link
                to="/transactions"
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                View Transactions
              </Link>
            )}
            
            {campaignId && (
              <Link
                to={`/campaign/${campaignId}`}
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Campaign
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}