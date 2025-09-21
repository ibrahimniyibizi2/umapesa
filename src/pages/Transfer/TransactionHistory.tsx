import { useState } from 'react';
import { 
  Search, 
  Download, 
  Send, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useTransactions } from '../../contexts/TransactionContext';
import { useAuth } from '../../hooks/useAuth';

export default function TransactionHistory() {
  const { user } = useAuth();
  const { transactions } = useTransactions();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const userTransactions = transactions.filter(t => 
    t.senderId === user?.id || t.recipientEmail === user?.email
  );

  const filteredTransactions = userTransactions.filter(transaction => {
    const matchesSearch = 
      transaction.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.recipientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'processing':
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-gray-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionIcon = (transaction: any) => {
    if (transaction.senderId === user?.id) {
      return <ArrowUpRight className="w-5 h-5 text-red-500" />;
    } else {
      return <ArrowDownRight className="w-5 h-5 text-green-500" />;
    }
  };

  const getTransactionAmount = (transaction: any) => {
    if (transaction.senderId === user?.id) {
      return `-${transaction.totalAmount.toLocaleString()} ${transaction.currency}`;
    } else {
      return `+${transaction.convertedAmount.toLocaleString()} ${transaction.convertedCurrency}`;
    }
  };

  const getTransactionAmountColor = (transaction: any) => {
    return transaction.senderId === user?.id ? 'text-red-600' : 'text-green-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Transaction History</h1>
          <p className="text-gray-600">
            View and manage all your money transfers and transactions.
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              aria-label="Filter transactions by status"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              aria-label="Filter transactions by type"
            >
              <option value="all">All Types</option>
              <option value="send">Sent</option>
              <option value="receive">Received</option>
            </select>

            <button className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="w-5 h-5 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Transaction List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {filteredTransactions.length} Transaction{filteredTransactions.length !== 1 ? 's' : ''}
            </h2>
          </div>

          {filteredTransactions.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        {getTransactionIcon(transaction)}
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {transaction.senderId === user?.id 
                              ? `To ${transaction.recipientName}`
                              : `From ${transaction.recipientName}`
                            }
                          </h3>
                          {getStatusIcon(transaction.status)}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{transaction.reference}</span>
                          <span>•</span>
                          <span>{new Date(transaction.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{new Date(transaction.createdAt).toLocaleTimeString()}</span>
                        </div>
                        
                        {transaction.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {transaction.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-lg font-bold ${getTransactionAmountColor(transaction)}`}>
                        {getTransactionAmount(transaction)}
                      </div>
                      
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                      
                      {transaction.senderId === user?.id && transaction.fee > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          Fee: {transaction.fee.toLocaleString()} {transaction.currency}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional Details for Cross-Border Transfers */}
                  {transaction.currency !== transaction.convertedCurrency && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Sent Amount:</span>
                          <div className="font-medium">
                            {transaction.amount.toLocaleString()} {transaction.currency}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Received Amount:</span>
                          <div className="font-medium">
                            {transaction.convertedAmount.toLocaleString()} {transaction.convertedCurrency}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Exchange Rate:</span>
                          <div className="font-medium">
                            1 {transaction.currency} = {transaction.exchangeRate} {transaction.convertedCurrency}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Send className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'You haven\'t made any transactions yet.'}
              </p>
              {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                  Send Your First Transfer
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}