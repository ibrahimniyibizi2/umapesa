import { useState } from 'react';
import {
  CreditCard,
  Smartphone,
  Building,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Shield
} from 'lucide-react';

export default function PaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: 1,
      type: 'bank',
      name: 'Banco Unico - Checking',
      lastFour: '**** 1234',
      isDefault: true,
      status: 'active'
    },
    {
      id: 2,
      type: 'mobile',
      name: 'M-Pesa',
      lastFour: '**** 5678',
      isDefault: false,
      status: 'active'
    },
    {
      id: 3,
      type: 'card',
      name: 'Visa **** 9012',
      lastFour: '**** 9012',
      isDefault: false,
      status: 'pending'
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newMethod, setNewMethod] = useState({
    type: 'bank',
    accountName: '',
    accountNumber: '',
    bankName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });

  const paymentTypes = [
    {
      id: 'bank',
      name: 'Bank Account',
      icon: <Building className="w-5 h-5" />,
      description: 'Connect your bank account for transfers'
    },
    {
      id: 'mobile',
      name: 'Mobile Money',
      icon: <Smartphone className="w-5 h-5" />,
      description: 'M-Pesa, Airtel Money, and other mobile wallets'
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: <CreditCard className="w-5 h-5" />,
      description: 'Visa, Mastercard, and other cards'
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bank':
        return <Building className="w-5 h-5" />;
      case 'mobile':
        return <Smartphone className="w-5 h-5" />;
      case 'card':
        return <CreditCard className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'inactive':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const handleAddMethod = () => {
    // In a real app, this would validate and save to backend
    const newPaymentMethod = {
      id: paymentMethods.length + 1,
      type: newMethod.type,
      name: newMethod.type === 'bank' ? `${newMethod.bankName} - ${newMethod.accountName}` :
            newMethod.type === 'mobile' ? 'M-Pesa' :
            `Card **** ${newMethod.cardNumber.slice(-4)}`,
      lastFour: newMethod.type === 'bank' ? `**** ${newMethod.accountNumber.slice(-4)}` :
                newMethod.type === 'mobile' ? `**** ${newMethod.accountNumber.slice(-4)}` :
                `**** ${newMethod.cardNumber.slice(-4)}`,
      isDefault: paymentMethods.length === 0,
      status: 'pending'
    };

    setPaymentMethods([...paymentMethods, newPaymentMethod]);
    setNewMethod({
      type: 'bank',
      accountName: '',
      accountNumber: '',
      bankName: '',
      cardNumber: '',
      expiryDate: '',
      cvv: ''
    });
    setShowAddForm(false);
  };

  const handleSetDefault = (id: number) => {
    setPaymentMethods(methods =>
      methods.map(method => ({
        ...method,
        isDefault: method.id === id
      }))
    );
  };

  const handleDelete = (id: number) => {
    if (paymentMethods.find(m => m.id === id)?.isDefault) {
      alert('Cannot delete default payment method. Please set another method as default first.');
      return;
    }
    setPaymentMethods(methods => methods.filter(method => method.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Payment Methods</h1>
          <p className="text-gray-600 mt-1">Manage your saved payment options</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Existing Payment Methods */}
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <div key={method.id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                    {getTypeIcon(method.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">{method.name}</h3>
                      {method.isDefault && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{method.lastFour}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(method.status)}`}>
                        {method.status === 'active' && <CheckCircle className="w-3 h-3 inline mr-1" />}
                        {method.status === 'pending' && <AlertCircle className="w-3 h-3 inline mr-1" />}
                        {method.status.charAt(0).toUpperCase() + method.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {!method.isDefault && (
                    <button
                      onClick={() => handleSetDefault(method.id)}
                      className="text-blue-600 text-sm font-medium hover:text-blue-700"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(method.id)}
                    className="text-red-600 hover:text-red-700 p-1"
                    aria-label="Delete payment method"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Payment Method */}
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full bg-blue-600 text-white py-4 px-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Payment Method</span>
          </button>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Add Payment Method</h2>
            </div>

            <div className="p-4 space-y-4">
              {/* Payment Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
                <div className="grid grid-cols-1 gap-2">
                  {paymentTypes.map((type) => (
                    <label
                      key={type.id}
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        newMethod.type === type.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentType"
                        value={type.id}
                        checked={newMethod.type === type.id}
                        onChange={(e) => setNewMethod({...newMethod, type: e.target.value})}
                        className="text-blue-600 focus:ring-blue-500"
                        aria-label={`Select ${type.name}`}
                      />
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                        {type.icon}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{type.name}</div>
                        <div className="text-sm text-gray-600">{type.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Form Fields Based on Type */}
              {newMethod.type === 'bank' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={newMethod.bankName}
                      onChange={(e) => setNewMethod({...newMethod, bankName: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Banco Unico"
                      aria-label="Bank name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                    <input
                      type="text"
                      value={newMethod.accountName}
                      onChange={(e) => setNewMethod({...newMethod, accountName: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Account holder name"
                      aria-label="Account name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={newMethod.accountNumber}
                      onChange={(e) => setNewMethod({...newMethod, accountNumber: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Account number"
                      aria-label="Account number"
                    />
                  </div>
                </>
              )}

              {newMethod.type === 'mobile' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    value={newMethod.accountNumber}
                    onChange={(e) => setNewMethod({...newMethod, accountNumber: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+258 XX XXX XXXX"
                    aria-label="Mobile number"
                  />
                </div>
              )}

              {newMethod.type === 'card' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                    <input
                      type="text"
                      value={newMethod.cardNumber}
                      onChange={(e) => setNewMethod({...newMethod, cardNumber: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="1234 5678 9012 3456"
                      aria-label="Card number"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                      <input
                        type="text"
                        value={newMethod.expiryDate}
                        onChange={(e) => setNewMethod({...newMethod, expiryDate: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="MM/YY"
                        aria-label="Expiry date"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                      <input
                        type="text"
                        value={newMethod.cvv}
                        onChange={(e) => setNewMethod({...newMethod, cvv: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="123"
                        aria-label="CVV"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMethod}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Add Method
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <Shield className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900 mb-1">Secure & Protected</h3>
              <p className="text-sm text-green-700">
                Your payment information is encrypted and secure. We never store full card details
                or share your financial information with third parties.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}