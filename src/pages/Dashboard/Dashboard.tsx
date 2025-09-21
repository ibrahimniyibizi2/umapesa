import {
  Send,
  History,
  Heart,
  Plus,
  TrendingUp,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTransactions } from '../../contexts/TransactionContext';

export default function Dashboard() {
  const { user } = useAuth();
  const { transactions, campaigns } = useTransactions();

  const userTransactions = transactions.filter(t => t.senderId === user?.id);
  const recentTransactions = userTransactions.slice(0, 3);
  const userCampaigns = campaigns.filter(c => c.creatorId === user?.id);

  const totalSent = userTransactions
    .filter(t => t.type === 'send' && t.status === 'completed')
    .reduce((sum, t) => sum + t.totalAmount, 0);

  const totalReceived = transactions
    .filter(t => t.recipientEmail === user?.email && t.status === 'completed')
    .reduce((sum, t) => sum + t.convertedAmount, 0);

  const totalRaised = userCampaigns.reduce((sum, c) => sum + c.raisedAmount, 0);

  const quickActions = [
    {
      title: 'Send Money',
      description: 'Transfer money to friends and family',
      icon: <Send className="w-6 h-6" />,
      href: '/send-money',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'View Transactions',
      description: 'Check your transaction history',
      icon: <History className="w-6 h-6" />,
      href: '/transactions',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Create Campaign',
      description: 'Start a fundraising campaign',
      icon: <Plus className="w-6 h-6" />,
      href: '/create-campaign',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Browse Campaigns',
      description: 'Support community causes',
      icon: <Heart className="w-6 h-6" />,
      href: '/fundraising',
      color: 'bg-pink-500 hover:bg-pink-600'
    }
  ];

  const stats = [
    {
      title: 'Total Sent',
      value: `${totalSent.toLocaleString()} MZN`,
      icon: <ArrowUpRight className="w-5 h-5" />,
      color: 'text-red-600 bg-red-100'
    },
    {
      title: 'Total Received',
      value: `${totalReceived.toLocaleString()} RWF`,
      icon: <ArrowDownRight className="w-5 h-5" />,
      color: 'text-green-600 bg-green-100'
    },
    {
      title: 'Funds Raised',
      value: `${totalRaised.toLocaleString()} MZN`,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      title: 'Active Campaigns',
      value: userCampaigns.filter(c => c.isActive).length.toString(),
      icon: <Users className="w-5 h-5" />,
      color: 'text-purple-600 bg-purple-100'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your account today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.href}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white ${action.color} transition-colors`}>
                      {action.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
                  <Link
                    to="/transactions"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View all
                  </Link>
                </div>
              </div>
              
              <div className="p-6">
                {recentTransactions.length > 0 ? (
                  <div className="space-y-4">
                    {recentTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Send className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              To {transaction.recipientName}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            -{transaction.totalAmount.toLocaleString()} {transaction.currency}
                          </p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.status === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : transaction.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No transactions yet</p>
                    <Link
                      to="/send-money"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Send your first transfer
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Account Status & Campaigns */}
          <div className="space-y-6">
            {/* Account Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Email Verified</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user?.isVerified 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user?.isVerified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">KYC Status</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user?.kycStatus === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : user?.kycStatus === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user?.kycStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Account Type</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>

            {/* My Campaigns */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">My Campaigns</h3>
                <Link
                  to="/create-campaign"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Create new
                </Link>
              </div>
              
              {userCampaigns.length > 0 ? (
                <div className="space-y-3">
                  {userCampaigns.slice(0, 2).map((campaign) => (
                    <div key={campaign.id} className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 text-sm mb-1">
                        {campaign.title}
                      </h4>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>
                          {campaign.raisedAmount.toLocaleString()} / {campaign.goalAmount.toLocaleString()} {campaign.currency}
                        </span>
                        <span className={`px-2 py-1 rounded-full ${
                          campaign.isActive 
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {campaign.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full progress-bar" 
                          style={{ width: `${Math.min((campaign.raisedAmount / campaign.goalAmount) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Heart className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-3">No campaigns yet</p>
                  <Link
                    to="/create-campaign"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Create your first campaign
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}