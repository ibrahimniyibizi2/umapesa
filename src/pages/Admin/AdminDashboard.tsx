import { useState } from 'react';
import { Users, CreditCard, TrendingUp, AlertTriangle, Search, Eye, Edit, Ban, CheckCircle, XCircle, Clock, DollarSign, Activity, Download, RefreshCw, Trash2, Save, Bell } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAdmin } from '../../contexts/AdminContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { 
    users, 
    fees, 
    exchangeRates, 
    paymentTransactions, 
    profitReports,
    apiStatus,
    updateUserStatus,
    updateKycStatus,
    toggleFeeStatus,
    updateExchangeRate,
    toggleRateStatus,
    getFailedPayments,
    retryPayment,
    toggleApiStatus,
    generateProfitReport
  } = useAdmin();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState('');
  const [editingRate, setEditingRate] = useState<string | null>(null);
  const [newRateValue, setNewRateValue] = useState('');

  const failedPayments = getFailedPayments();
  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 5000);
  };

  const stats = [
    {
      title: 'Total Users',
      value: users.length.toString(),
      change: '+12%',
      icon: <Users className="w-6 h-6" />,
      color: 'bg-blue-500'
    },
    {
      title: 'Total Payments',
      value: paymentTransactions.length.toString(),
      change: '+8%',
      icon: <CreditCard className="w-6 h-6" />,
      color: 'bg-green-500'
    },
    {
      title: 'Failed Payments',
      value: failedPayments.length.toString(),
      change: '+15%',
      icon: <AlertTriangle className="w-6 h-6" />,
      color: 'bg-red-500'
    },
    {
      title: 'Pending KYC',
      value: users.filter(u => u.kycStatus === 'pending').length.toString(),
      change: '-5%',
      icon: <Clock className="w-6 h-6" />,
      color: 'bg-yellow-500'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getKycStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const filteredUsers = users.filter(user =>
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPayments = paymentTransactions.filter(payment =>
    payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserStatusUpdate = async (userId: string, status: 'active' | 'suspended') => {
    setLoading(true);
    const success = await updateUserStatus(userId, status);
    if (success) {
      showNotification(`User status updated to ${status}`);
    }
    setLoading(false);
  };

  const handleKycUpdate = async (userId: string, status: 'approved' | 'pending' | 'rejected') => {
    setLoading(true);
    const success = await updateKycStatus(userId, status);
    if (success) {
      showNotification(`KYC status updated to ${status}`);
    }
    setLoading(false);
  };

  const handleRateUpdate = async (rateId: string) => {
    if (!newRateValue) return;
    setLoading(true);
    const success = await updateExchangeRate(rateId, parseFloat(newRateValue));
    if (success) {
      showNotification('Exchange rate updated successfully');
      setEditingRate(null);
      setNewRateValue('');
    }
    setLoading(false);
  };

  const handleRetryPayment = async (transactionId: string) => {
    setLoading(true);
    const success = await retryPayment(transactionId);
    if (success) {
      showNotification('Payment retry successful');
    }
    setLoading(false);
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    await generateProfitReport('monthly');
    showNotification('Profit report generated successfully');
    setLoading(false);
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">
            Manage users, transactions, and monitor system performance.
          </p>
          
          {notification && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
              <Bell className="w-5 h-5 text-green-500 flex-shrink-0" />
              <p className="text-sm text-green-700">{notification}</p>
            </div>
          )}
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
                  <p className={`text-sm ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change} from last month
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'users', label: 'Users' },
                { id: 'fees', label: 'Fee Management' },
                { id: 'rates', label: 'Exchange Rates' },
                { id: 'payments', label: 'Payment Management' },
                { id: 'profits', label: 'Profit Reports' },
                { id: 'apis', label: 'API Management' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Search Bar */}
            {activeTab !== 'overview' && (
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Failed Payments Alert */}
                {failedPayments.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                        <div>
                          <h3 className="font-semibold text-red-900">Failed Payments Alert</h3>
                          <p className="text-sm text-red-700">
                            {failedPayments.length} payment(s) failed and require attention
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('payments')}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Payments */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Payments</h3>
                    <div className="space-y-3">
                      {paymentTransactions.slice(0, 5).map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{payment.id}</p>
                            <p className="text-sm text-gray-600">{payment.paymentMethod}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {payment.amount.toLocaleString()} {payment.currency}
                            </p>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              payment.status === 'completed' 
                                ? 'bg-green-100 text-green-800'
                                : payment.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {payment.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* KYC Pending */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending KYC Reviews</h3>
                    <div className="space-y-3">
                      {users.filter(u => u.kycStatus === 'pending').map((pendingUser) => (
                        <div key={pendingUser.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{pendingUser.firstName} {pendingUser.lastName}</p>
                            <p className="text-sm text-gray-600">{pendingUser.email}</p>
                          </div>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleKycUpdate(pendingUser.id, 'approved')}
                              disabled={loading}
                              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleKycUpdate(pendingUser.id, 'rejected')}
                              disabled={loading}
                              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Account Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Country
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        KYC
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Volume
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.accountNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.country === 'mozambique' ? 'Mozambique' : 'Rwanda'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.isEmailVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isEmailVerified ? 'Verified' : 'Not Verified'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getKycStatusIcon(user.kycStatus)}
                            <span className="text-sm text-gray-900 capitalize">{user.kycStatus}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.totalTransactions} ({user.totalVolume.toLocaleString()} MZN)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button title="View user details" className="text-blue-600 hover:text-blue-900">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button title="Edit user" className="text-gray-600 hover:text-gray-900">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              title={user.status === 'active' ? 'Suspend user' : 'Activate user'}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Ban 
                                className="w-4 h-4" 
                                onClick={() => handleUserStatusUpdate(
                                  user.id, 
                                  user.status === 'active' ? 'suspended' : 'active'
                                )}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'fees' && (
              <div className="overflow-x-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Fee Management</h3>
                </div>

                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fee Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount Range
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fee Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fee Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {fees.map((fee) => (
                      <tr key={fee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {fee.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {fee.minAmount} - {fee.maxAmount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                          {fee.feeType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {fee.feeValue}{fee.feeType === 'percentage' ? '%' : ' MZN'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleFeeStatus(fee.id)}
                            title={fee.isActive ? 'Deactivate fee' : 'Activate fee'}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              fee.isActive 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {fee.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button title="Edit fee" className="text-blue-600 hover:text-blue-900">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button title="Delete fee" className="text-red-600 hover:text-red-900">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'rates' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Exchange Rate Management</h3>
                  <button
                    onClick={handleGenerateReport}
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Update Rates
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {exchangeRates.map((rate) => (
                    <div key={rate.id} className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {rate.fromCurrency} → {rate.toCurrency}
                        </h4>
                        <button
                          onClick={() => toggleRateStatus(rate.id)}
                          title={rate.isActive ? 'Deactivate exchange rate' : 'Activate exchange rate'}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            rate.isActive 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {rate.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Rate
                          </label>
                          {editingRate === rate.id ? (
                            <div className="flex space-x-2">
                              <input
                                type="number"
                                step="0.001"
                                value={newRateValue}
                                onChange={(e) => setNewRateValue(e.target.value)}
                                aria-label="New exchange rate value"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <button
                                onClick={() => handleRateUpdate(rate.id)}
                                disabled={loading}
                                title="Save exchange rate"
                                className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingRate(null);
                                  setNewRateValue('');
                                }}
                                title="Cancel editing"
                                className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span className="text-2xl font-bold text-gray-900">
                                {rate.rate}
                              </span>
                              <button
                                onClick={() => {
                                  setEditingRate(rate.id);
                                  setNewRateValue(rate.rate.toString());
                                }}
                                title="Edit exchange rate"
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          Last updated: {new Date(rate.updatedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-6">
                {failedPayments.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-semibold text-red-900 mb-2">Failed Payments ({failedPayments.length})</h3>
                    <div className="space-y-2">
                      {failedPayments.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between bg-white p-3 rounded">
                          <div>
                            <p className="font-medium text-gray-900">{payment.id}</p>
                            <p className="text-sm text-red-600">{payment.failureReason}</p>
                          </div>
                          <button
                            onClick={() => handleRetryPayment(payment.id)}
                            disabled={loading}
                            title="Retry failed payment"
                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                          >
                            Retry
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Method
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {payment.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                            {payment.type.replace('_', ' ')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.amount.toLocaleString()} {payment.currency}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.paymentMethod}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              payment.status === 'completed' 
                                ? 'bg-green-100 text-green-800'
                                : payment.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button title="View payment details" className="text-blue-600 hover:text-blue-900">
                                <Eye className="w-4 h-4" />
                              </button>
                              {payment.status === 'failed' && (
                                <button 
                                  onClick={() => handleRetryPayment(payment.id)}
                                  title="Retry payment"
                                  className="text-green-600 hover:text-green-900"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'profits' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Profit Reports</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleGenerateReport}
                      disabled={loading}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Generate Report
                    </button>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center">
                      <Download className="w-4 h-4 mr-2" />
                      Export PDF
                    </button>
                    <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center">
                      <Download className="w-4 h-4 mr-2" />
                      Export Excel
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Send Money Profit</p>
                        <p className="text-2xl font-bold text-green-600">
                          {paymentTransactions
                            .filter(t => t.type === 'send_money' && t.status === 'completed')
                            .reduce((sum, t) => sum + (t.amount * 0.1), 0)
                            .toLocaleString()} MZN
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-green-600" />
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Fundraising Profit (10%)</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {paymentTransactions
                            .filter(t => t.type === 'fundraising' && t.status === 'completed')
                            .reduce((sum, t) => sum + (t.amount * 0.1), 0)
                            .toLocaleString()} MZN
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Profit</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {paymentTransactions
                            .filter(t => t.status === 'completed')
                            .reduce((sum, t) => sum + (t.amount * 0.1), 0)
                            .toLocaleString()} MZN
                        </p>
                      </div>
                      <Activity className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>
                </div>
                {profitReports.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h4>
                    <div className="space-y-3">
                      {profitReports.map((report, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">
                              {report.period} Report
                            </p>
                            <p className="text-sm text-gray-600">
                              {report.transactions} transactions
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">
                              {report.totalProfit.toLocaleString()} MZN
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'apis' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">API Management</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(apiStatus).map(([apiName, isActive]) => (
                    <div key={apiName} className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 capitalize">
                            {apiName.replace('_', ' ')}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {isActive ? 'API is active and responding' : 'API is currently disabled'}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleApiStatus(apiName)}
                          title={isActive ? `Disable ${apiName} API` : `Enable ${apiName} API`}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            isActive ? 'bg-green-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              isActive ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      
                      <div className="mt-4 flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm text-gray-600">
                          {isActive ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}