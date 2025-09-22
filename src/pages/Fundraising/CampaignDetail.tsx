import React, { useState, useEffect } from 'react';
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
import ApiService from '../../lib/api';
import { Campaign } from '../../types/transaction';

// Define API response types locally since we're not importing them anymore
interface ApiCampaign {
  id: string;
  title: string;
  description: string;
  goalAmount: number;
  targetAmount?: number;
  currency: string;
  creatorId: string;
  creatorName: string;
  raisedAmount: number;
  startDate?: string;
  endDate?: string;
  status?: 'active' | 'completed' | 'cancelled';
  isActive?: boolean;
  contributions?: ApiContribution[];
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiContribution {
  id?: string;
  campaignId?: string;
  contributorId?: string;
  contributorName?: string;
  amount?: number;
  message?: string;
  paymentStatus?: string;
  paymentId?: string;
  paymentMethod?: string;
  createdAt?: string;
  anonymous?: boolean;
}

// Helper function to get a properly formatted image URL
const getImageUrl = (url: string): string => {
  if (!url) return '';
  
  // If it's already a full URL, data URL, or blob URL, return as is
  if (url.startsWith('http') || url.startsWith('data:image') || url.startsWith('blob:')) {
    return url;
  }
  
  // If it's a local path starting with /images, assume it's from the backend
  if (url.startsWith('/images/')) {
    return `http://localhost:3000${url}`;
  }
  
  // For any other local path, ensure it has a leading slash
  return `/${url.replace(/^[\\/]/, '')}`;
};

// Helper function to get a placeholder image URL with the campaign title
const getPlaceholderImage = (title: string): string => {
  const text = title ? encodeURIComponent(title.substring(0, 50)) : 'Campaign+Image';
  return `https://via.placeholder.com/800x450?text=${text}`;
};

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { getCampaignById, contributeToCampaign, loading: isTransactionsLoading } = useTransactions();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [showContributeForm, setShowContributeForm] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [contributionData, setContributionData] = useState({
    contributorName: user ? `${user.firstName} ${user.lastName}` : '',
    contributorEmail: user?.email || '',
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

  // Load campaign data
  useEffect(() => {
    const loadCampaign = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError('');
        
        // Try to get the campaign from the context first
        const campaignData = getCampaignById(id);
        
        if (campaignData) {
          setCampaign(campaignData);
        } else {
          // If not found in context, fetch from API
          const response = await ApiService.getCampaignById(id);
          if (response && typeof response === 'object' && 'success' in response && response.success && response.campaign) {
            setCampaign(mapApiCampaign(response.campaign));
          } else {
            throw new Error(response?.error || 'Failed to load campaign');
          }
        }
      } catch (err) {
        console.error('Error loading campaign:', err);
        setError('Failed to load campaign. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    loadCampaign();
  }, [id, getCampaignById]);

  // Show loading state
  if (loading || isTransactionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaign details...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
            <p>{error}</p>
          </div>
          <Link
            to="/fundraising"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
          >
            Back to Campaigns
          </Link>
        </div>
      </div>
    );
  }

  // Show not found state
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
            Back to Campaigns
          </Link>
        </div>
      </div>
    );
  }

  // Calculate progress percentage and days left
  const progressPercentage = campaign && campaign.targetAmount > 0 
    ? Math.min(Math.round(((campaign.raisedAmount || 0) / campaign.targetAmount) * 100), 100)
    : 0;

  // Calculate days left
  const daysLeft = campaign?.endDate 
    ? Math.ceil((new Date(campaign.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Format currency - used in the template
  const formatCurrency = (amount: number, currency?: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || campaign?.currency || 'MZN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  // Handle contribution button click
  const handleContributeClick = () => {
    setShowContributeForm(true);
  };

  const handleContributionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!campaign || !id) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Define the contribution data with proper types
      const contributionPayload = {
        campaignId: id,
        amount: Number(contributionData.amount),
        contributorName: contributionData.isAnonymous ? 'Anonymous' : contributionData.contributorName,
        message: contributionData.message || '',
        paymentMethod: 'card' as const,
        phoneNumber: contributionData.contributorPhone ? 
          `${contributionData.contributorCountryCode}${contributionData.contributorPhone}` : 
          undefined,
        email: contributionData.contributorEmail || undefined,
      };
      
      // Make the contribution
      const result = await contributeToCampaign(contributionPayload);
      
      if (result && typeof result === 'object' && 'success' in result && result.success === true) {
        // Refresh campaign data
        const response = await ApiService.getCampaignById(id);
        if (response && typeof response === 'object' && 'success' in response && response.success && response.campaign) {
          setCampaign(mapApiCampaign(response.campaign));
        }
        
        // Reset form
        setContributionData({
          contributorName: user ? `${user.firstName} ${user.lastName}` : '',
          contributorEmail: user?.email || '',
          contributorPhone: '',
          contributorCountryCode: '+258',
          amount: '',
          isAnonymous: false,
          message: ''
        });
        
        setShowContributeForm(false);
      } else {
        setError(result?.error || 'Failed to process contribution. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting contribution:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!campaign || !id) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Check if PaymentService has withdrawFunds method
      if (!('withdrawFunds' in PaymentService) || typeof (PaymentService as { withdrawFunds?: unknown }).withdrawFunds !== 'function') {
        throw new Error('Withdrawal functionality is not available');
      }
      
      const paymentService = PaymentService as unknown as {
        withdrawFunds: (data: {
          campaignId: string;
          amount: number;
          phoneNumber: string;
          method: string;
        }) => Promise<{ success: boolean; error?: string }>;
      };
      
      const result = await paymentService.withdrawFunds({
        campaignId: id,
        amount: Number(withdrawalData.amount),
        phoneNumber: withdrawalData.phoneNumber,
        method: withdrawalData.method,
      });
      
      if (result && result.success) {
        // Refresh campaign data
        const response = await ApiService.getCampaignById(id);
        if (response && typeof response === 'object' && 'success' in response && response.success && response.campaign) {
          setCampaign(mapApiCampaign(response.campaign));
        }
        
        // Reset form
        setWithdrawalData({
          phoneNumber: '',
          amount: '',
          method: 'mpesa'
        });
        
        setShowWithdrawForm(false);
      } else {
        setError(result?.error || 'Failed to process withdrawal. Please try again.');
      }
    } catch {
      setError('An error occurred during withdrawal');
    }
  };

  const handlePaymentMethodSelect = (method: string) => {
    // Update the payment method in the contribution data
    setContributionData(prev => ({
      ...prev,
      paymentMethod: method
    }));
    
    // Close the modal
    setShowPaymentMethodModal(false);
    
    // Submit the form
    const form = document.getElementById('contribution-form') as HTMLFormElement;
    if (form) {
      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
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

  const handleWithdrawClick = async (e: React.FormEvent) => {
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

  // Ensure contributions is always an array
  const campaignContributions = campaign?.contributions || [];

  // Format date safely
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Map API campaign to our Campaign type
  const mapApiCampaign = (apiCampaign: ApiCampaign): Campaign => ({
    id: apiCampaign.id || '',
    title: apiCampaign.title || '',
    description: apiCampaign.description || '',
    goalAmount: apiCampaign.goalAmount || 0,
    targetAmount: apiCampaign.targetAmount || apiCampaign.goalAmount || 0,
    currency: (apiCampaign.currency === 'MZN' || apiCampaign.currency === 'RWF') 
      ? apiCampaign.currency 
      : 'MZN',
    creatorId: apiCampaign.creatorId || '',
    creatorName: apiCampaign.creatorName || '',
    raisedAmount: apiCampaign.raisedAmount || 0,
    startDate: apiCampaign.startDate || new Date().toISOString(),
    endDate: apiCampaign.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: (apiCampaign.status === 'active' || apiCampaign.status === 'completed' || apiCampaign.status === 'cancelled')
      ? apiCampaign.status
      : (apiCampaign.isActive ? 'active' : 'completed'),
    contributions: Array.isArray(apiCampaign.contributions) 
      ? (apiCampaign.contributions || []).map((c: ApiContribution) => ({
          id: c.id || '',
          campaignId: c.campaignId || '',
          contributorId: c.contributorId || '',
          contributorName: c.contributorName || 'Anonymous',
          amount: c.amount || 0,
          message: c.message,
          paymentStatus: c.paymentStatus || 'pending',
          paymentId: c.paymentId,
          paymentMethod: c.paymentMethod,
          createdAt: c.createdAt || new Date().toISOString(),
          anonymous: c.anonymous || false
        }))
      : [],
    imageUrl: apiCampaign.imageUrl,
    createdAt: apiCampaign.createdAt || new Date().toISOString(),
    updatedAt: apiCampaign.updatedAt || new Date().toISOString()
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
            <Link
              to="/fundraising"
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Campaigns
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Campaign Details</h1>
            <div className="w-8"></div> {/* For alignment */}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Campaign Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Campaign Image */}
            <div className="aspect-video bg-gray-200 rounded-xl overflow-hidden">
              {campaign.imageUrl ? (
                <img
                  src={getImageUrl(campaign.imageUrl)}
                  alt={campaign.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // If image fails to load, show a placeholder
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = getPlaceholderImage(campaign.title);
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <div className="text-center p-4">
                    <div className="mx-auto w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mb-2">
                      <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
                        <path d="M12 12c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-2.8 0-5 2.2-5 5h2c0-1.7 1.3-3 3-3s3 1.3 3 3h2c0-2.8-2.2-5-5-5z"/>
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500">No image available</p>
                  </div>
                </div>
              )}
            </div>

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
                Recent Contributions ({campaignContributions.length})
              </h3>
              
              {campaignContributions.length > 0 ? (
                <div className="space-y-4">
                  {campaignContributions.slice(0, 10).map((contribution) => (
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
                            {formatCurrency(contribution.amount, contribution.currency || campaign.currency)}
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
                          {formatDate(contribution.createdAt)}
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
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(campaign.raisedAmount, campaign.currency)}
                    </p>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-5 w-5 mr-2" />
                      <span>{daysLeft} days left</span>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3">
                    raised of {formatCurrency(campaign.goalAmount || campaign.targetAmount, campaign.currency)} goal
                  </p>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mt-1">
                    <span>{progressPercentage}% funded</span>
                    <span>{campaignContributions.length} contributions</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Users className="w-5 h-5 text-gray-600 mr-1" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{campaignContributions.length}</p>
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
                  onClick={handleContributeClick}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Heart className="w-5 h-5 mr-2" />
                  Contribute Now
                </button>
                
                {/* Withdrawal Button - Only for campaign owners */}
                {user && user.id === campaign.creatorId && campaign.raisedAmount > 0 && (
                  <button
                    onClick={() => setShowWithdrawForm(true)}
                    className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
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

                  <form onSubmit={handleContributionSubmit} className="space-y-4">
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
                      <strong>Available to withdraw:</strong> {formatCurrency(campaign.raisedAmount, campaign.currency)}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Withdrawal limits: 1 - 5,000 MZN per transaction
                    </p>
                  </div>

                  <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
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
                  <div className="flex items-center text-gray-600">
                    <AlertCircle className="h-5 w-5 mr-2 text-yellow-500" />
                    <span className="capitalize">{campaign.status || 'active'}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <p className="text-sm text-gray-900">
                    {formatDate(campaign.createdAt)}
                  </p>
                </div>
                {campaign.endDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ends:</span>
                    <p className="text-sm text-gray-600">
                      {formatDate(campaign.endDate)}
                    </p>
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