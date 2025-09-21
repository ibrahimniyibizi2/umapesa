import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Heart, 
  Share2, 
  ArrowLeft, 
  Calendar, 
  Users, 
  AlertCircle,
  Wallet,
  Phone
} from 'lucide-react';
import { useTransactions } from '../../hooks/useTransactions';
import { PaymentService } from '../../lib/nhonga';
import { useAuth } from '../../hooks/useAuth';

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { getCampaignById, contributeToCampaign } = useTransactions();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showContributeForm, setShowContributeForm] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [contributionData, setContributionData] = useState({
    contributorName: '',
    contributorEmail: '',
    contributorPhone: '',
    contributorCountryCode: '+258',
    amount: '',
    isAnonymous: false,
    message: ''
  });
  const [withdrawalData, setWithdrawalData] = useState({
    phoneNumber: '',
    amount: '',
    method: 'mpesa' as 'mpesa' | 'emola' | 'baton'
  });
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);

  const paymentMethods = [
    { id: 'card', name: 'Credit/Debit Card', icon: '💳', description: 'Visa, Mastercard' },
    { id: 'mpesa', name: 'M-Pesa', icon: '📱', description: 'Vodacom Mobile Money' },
    { id: 'emola', name: 'eMola', icon: '📱', description: 'mCel Mobile Money' }
  ];

  const campaign = id ? getCampaignById(id) : null;

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Campaign Not Found</h2>
          <p className="text-gray-600 mb-6">The campaign you're looking for doesn't exist or has been removed.</p>
          <Link
            to="/fundraising"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Campaigns
          </Link>
        </div>
      </div>
    );
  }

  const progressPercentage = Math.min((campaign.raisedAmount / campaign.targetAmount) * 100, 100);
  const daysLeft = campaign.endDate ? 
    Math.max(0, Math.ceil((new Date(campaign.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 
    null;

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const amount = parseFloat(contributionData.amount);
      if (amount <= 0) {
        setError('Contribution amount must be greater than 0');
        return;
      }

      if (!contributionData.contributorName.trim()) {
        setError('Please enter your name');
        return;
      }

      if (!contributionData.contributorPhone.trim()) {
        setError('Please enter your phone number');
        return;
      }

      await contributeToCampaign(campaign.id, {
        amount,
        currency: campaign.currency,
        message: contributionData.message,
        anonymous: contributionData.isAnonymous,
        contributorId: 'current-user-id', // TODO: Replace with actual user ID
        contributorName: contributionData.isAnonymous ? 'Anonymous' : contributionData.contributorName,
        paymentMethod: 'mobile_money' // Default payment method
      });
    } catch {
      setError('An error occurred. Please try again.');
    }
  };

  const handlePaymentMethodSelect = async (methodId: string) => {
    setShowPaymentMethodModal(false);
    setLoading(true);

    try {
      const amount = parseFloat(contributionData.amount);

      // Save contribution to database first with pending status
      const contributionId = await contributeToCampaign(campaign.id, {
        amount,
        currency: campaign.currency,
        message: contributionData.message,
        anonymous: contributionData.isAnonymous,
        contributorId: 'current-user-id', // TODO: Replace with actual user ID
        contributorName: contributionData.isAnonymous ? 'Anonymous' : contributionData.contributorName,
        paymentMethod: methodId
      });

      if (contributionId) {
        // Create payment with Nhonga API based on selected method
        const paymentResult = await PaymentService.createPayment({
          amount: amount,
          context: `Contribution to ${campaign.title}`,
          userEmail: contributionData.contributorEmail || 'anonymous@umapesa.com',
          currency: campaign.currency === 'RWF' ? 'USD' : campaign.currency,
          returnUrl: `${window.location.origin}/payment-success?contribution_id=${contributionId}&campaign_id=${campaign.id}`,
          environment: 'prod'
        });

        if (paymentResult.success && paymentResult.redirectUrl) {
          // Redirect to payment page
          window.location.href = paymentResult.redirectUrl;
        } else {
          setError(paymentResult.error || 'Payment processing failed');
        }
      } else {
        setError('Failed to create contribution');
      }
    } catch {
      setError('An error occurred during payment processing');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setContributionData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleWithdrawChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setWithdrawalData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const amount = parseFloat(withdrawalData.amount);
      if (amount <= 0) {
        setError('Withdrawal amount must be greater than 0');
        return;
      }

      if (amount > campaign.raisedAmount) {
        setError('Withdrawal amount cannot exceed available funds');
        return;
      }

      if (amount > 5000) {
        setError('Maximum withdrawal amount is 5,000 MZN');
        return;
      }

      // Implement withdrawal logic here
      setError('Withdrawal functionality not yet implemented');
      
    } catch {
      setError('An error occurred during withdrawal');
    }
  };

  const shareUrl = window.location.href;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            to="/fundraising"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Campaigns
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Campaign Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Campaign Image */}
            {campaign.imageUrl && (
              <div className="aspect-video bg-gray-200 rounded-xl overflow-hidden">
                <img
                  src={campaign.imageUrl}
                  alt={campaign.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Campaign Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">
                      {campaign.creatorName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{campaign.creatorName}</p>
                    <p className="text-sm text-gray-600">Campaign Creator</p>
                  </div>
                </div>
                
                <button
                  onClick={() => navigator.share ? navigator.share({ url: shareUrl, title: campaign.title }) : navigator.clipboard.writeText(shareUrl)}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  <span className="text-sm font-medium">Share</span>
                </button>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">{campaign.title}</h1>
              
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {campaign.description}
                </p>
              </div>
            </div>

            {/* Recent Contributions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Recent Contributions ({campaign.contributions.length})
              </h3>
              
              {campaign.contributions.length > 0 ? (
                <div className="space-y-4">
                  {campaign.contributions.slice(0, 10).map((contribution) => (
                    <div key={contribution.id} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Heart className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-gray-900">
                            {contribution.anonymous ? 'Anonymous' : contribution.contributorName}
                          </p>
                          <span className="font-semibold text-green-600">
                            {contribution.amount.toLocaleString()} {contribution.currency || campaign.currency}
                          </span>
                        </div>
                        {!contribution.anonymous && contribution.contributorName && (
                          <p className="text-xs text-gray-500 mb-1">
                            +250788****84
                          </p>
                        )}
                        {contribution.message && (
                          <p className="text-sm text-gray-600 mb-1">"{contribution.message}"</p>
                        )}
                        <p className="text-xs text-gray-500">
                          {new Date(contribution.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No contributions yet. Be the first to support this cause!</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Campaign Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {campaign.raisedAmount.toLocaleString()} {campaign.currency}
                    </span>
                    <span className="text-sm text-gray-600">
                      {progressPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">
                    raised of {(campaign.goalAmount || campaign.targetAmount).toLocaleString()} {campaign.currency} goal
                  </p>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Users className="w-5 h-5 text-gray-600 mr-1" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{campaign.contributions.length}</p>
                    <p className="text-sm text-gray-600">contributors</p>
                  </div>
                  
                  {daysLeft !== null && (
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Calendar className="w-5 h-5 text-gray-600 mr-1" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{daysLeft}</p>
                      <p className="text-sm text-gray-600">days left</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contribute Button */}
            {campaign.status === 'active' && (
              <div className="space-y-3">
                <button
                  onClick={() => setShowContributeForm(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center"
                >
                  <Heart className="w-5 h-5 mr-2" />
                  Contribute to this Cause
                </button>
                
                {/* Withdrawal Button - Only for campaign owners */}
                {user && user.id === campaign.creatorId && campaign.raisedAmount > 0 && (
                  <button
                    onClick={() => setShowWithdrawForm(true)}
                    className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center"
                  >
                    <Wallet className="w-5 h-5 mr-2" />
                    Withdraw Funds
                  </button>
                )}
              </div>
            )}

            {campaign.status !== 'active' && (
              <button
                disabled
                className="w-full bg-gray-400 text-white py-4 px-6 rounded-lg font-semibold cursor-not-allowed flex items-center justify-center"
              >
                <AlertCircle className="w-5 h-5 mr-2" />
                Campaign {campaign.status}
              </button>
            )}

            {/* Contribute Form Modal */}
            {showContributeForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Contribute to Campaign
                  </h3>

                  {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleContribute} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        name="contributorName"
                        required
                        value={contributionData.contributorName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="contributorPhone"
                        required
                        value={contributionData.contributorPhone}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+250781234567 or +258841234567"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email (Optional)
                      </label>
                      <input
                        type="email"
                        name="contributorEmail"
                        value={contributionData.contributorEmail}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="your@email.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contribution Amount * ({campaign.currency})
                      </label>
                      <input
                        type="number"
                        name="amount"
                        required
                        min="1"
                        step="0.01"
                        value={contributionData.amount}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Message (Optional)
                      </label>
                      <textarea
                        name="message"
                        rows={3}
                        value={contributionData.message}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Leave a message of support..."
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isAnonymous"
                        name="isAnonymous"
                        checked={contributionData.isAnonymous}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isAnonymous" className="ml-2 text-sm text-gray-700">
                        Contribute anonymously
                      </label>
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowContributeForm(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Processing...' : 'Contribute'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Payment Method Selection Modal */}
            {showPaymentMethodModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Choose Payment Method
                  </h3>
                  
                  <div className="space-y-3 mb-6">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => handlePaymentMethodSelect(method.id)}
                        className="w-full p-4 border border-gray-200 rounded-lg text-left hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{method.icon}</span>
                          <div>
                            <p className="font-medium text-gray-900">{method.name}</p>
                            <p className="text-sm text-gray-600">{method.description}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowPaymentMethodModal(false)}
                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Withdraw Form Modal */}
            {showWithdrawForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Withdraw Campaign Funds
                  </h3>

                  {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Available to withdraw:</strong> {campaign.raisedAmount.toLocaleString()} {campaign.currency}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Withdrawal limits: 1 - 5,000 MZN per transaction
                    </p>
                  </div>

                  <form onSubmit={handleWithdraw} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                          type="tel"
                          name="phoneNumber"
                          required
                          value={withdrawalData.phoneNumber}
                          onChange={handleWithdrawChange}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="841234567 or 871234567"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Enter phone number without country code
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Withdrawal Method *
                      </label>
                      <select
                        name="method"
                        required
                        value={withdrawalData.method}
                        onChange={handleWithdrawChange}
                        aria-label="Withdrawal method"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                      >
                        <option value="mpesa">M-Pesa (Vodacom)</option>
                        <option value="emola">eMola (mCel)</option>
                        <option value="baton">Baton</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount ({campaign.currency}) *
                      </label>
                      <input
                        type="number"
                        name="amount"
                        required
                        min="1"
                        max="5000"
                        step="0.01"
                        value={withdrawalData.amount}
                        onChange={handleWithdrawChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="0.00"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Maximum: {Math.min(campaign.raisedAmount, 5000).toLocaleString()} {campaign.currency}
                      </p>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-xs text-yellow-700">
                        <strong>Important:</strong> Withdrawals are processed immediately and cannot be reversed. 
                        Please verify the phone number and amount before confirming.
                      </p>
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowWithdrawForm(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Processing...' : 'Withdraw'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Campaign Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h4 className="font-semibold text-gray-900 mb-3">Campaign Status</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${
                    campaign.status === 'active' ? 'text-green-600' : 
                    campaign.status === 'completed' ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="text-gray-900">
                    {new Date(campaign.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {campaign.endDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ends:</span>
                    <span className="text-gray-900">
                      {new Date(campaign.endDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}