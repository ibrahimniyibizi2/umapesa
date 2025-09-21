import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, DollarSign, Clock, AlertCircle } from 'lucide-react';

export default function ExchangeRates() {
  const [rates, setRates] = useState({
    MZN_TO_RWF: 18.45,
    RWF_TO_MZN: 0.0542,
    MZN_TO_USD: 0.016,
    RWF_TO_USD: 0.00087,
    USD_TO_MZN: 63.25,
    USD_TO_RWF: 1148.50
  });

  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Simulate real-time rate updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Small random fluctuations for demo
      setRates(prev => ({
        ...prev,
        MZN_TO_RWF: prev.MZN_TO_RWF + (Math.random() - 0.5) * 0.1,
        RWF_TO_MZN: 1 / (prev.MZN_TO_RWF + (Math.random() - 0.5) * 0.1)
      }));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const refreshRates = async () => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRates(prev => ({
        ...prev,
        MZN_TO_RWF: 18.45 + (Math.random() - 0.5) * 0.5,
        RWF_TO_MZN: 1 / (18.45 + (Math.random() - 0.5) * 0.5)
      }));
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }, 1000);
  };

  const ratePairs = [
    {
      from: 'MZN',
      to: 'RWF',
      rate: rates.MZN_TO_RWF.toFixed(2),
      inverse: rates.RWF_TO_MZN.toFixed(4),
      change: '+0.12',
      trend: 'up'
    },
    {
      from: 'RWF',
      to: 'MZN',
      rate: rates.RWF_TO_MZN.toFixed(4),
      inverse: rates.MZN_TO_RWF.toFixed(2),
      change: '-0.0003',
      trend: 'down'
    },
    {
      from: 'MZN',
      to: 'USD',
      rate: rates.MZN_TO_USD.toFixed(3),
      inverse: rates.USD_TO_MZN.toFixed(2),
      change: '0.00',
      trend: 'stable'
    },
    {
      from: 'RWF',
      to: 'USD',
      rate: rates.RWF_TO_USD.toFixed(5),
      inverse: rates.USD_TO_RWF.toFixed(2),
      change: '+0.00001',
      trend: 'up'
    }
  ];

  const transferCalculator = [
    { amount: 100, currency: 'MZN', equivalent: (100 * rates.MZN_TO_RWF).toFixed(0) + ' RWF' },
    { amount: 500, currency: 'MZN', equivalent: (500 * rates.MZN_TO_RWF).toFixed(0) + ' RWF' },
    { amount: 1000, currency: 'MZN', equivalent: (1000 * rates.MZN_TO_RWF).toFixed(0) + ' RWF' },
    { amount: 5000, currency: 'RWF', equivalent: (5000 * rates.RWF_TO_MZN).toFixed(0) + ' MZN' },
    { amount: 10000, currency: 'RWF', equivalent: (10000 * rates.RWF_TO_MZN).toFixed(0) + ' MZN' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Exchange Rates</h1>
              <p className="text-gray-600 mt-1">Live currency conversion rates</p>
            </div>
            <button
              onClick={refreshRates}
              disabled={isRefreshing}
              className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
              aria-label="Refresh exchange rates"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Last Updated */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">Last updated</span>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Current Rates */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Current Exchange Rates</h2>
          </div>

          <div className="divide-y divide-gray-100">
            {ratePairs.map((pair, index) => (
              <div key={index} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900">
                      1 {pair.from} = {pair.rate} {pair.to}
                    </span>
                    <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full ${
                      pair.trend === 'up' ? 'bg-green-100 text-green-700' :
                      pair.trend === 'down' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {pair.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                      {pair.trend === 'down' && <TrendingDown className="w-3 h-3" />}
                      <span>{pair.change}</span>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  1 {pair.to} = {pair.inverse} {pair.from}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transfer Calculator */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Transfer Calculator</h2>
          </div>

          <div className="p-4">
            <div className="space-y-3">
              {transferCalculator.map((calc, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <span className="text-gray-700">
                    {calc.amount.toLocaleString()} {calc.currency}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {calc.equivalent}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rate Alerts */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <DollarSign className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Rate Alerts</h3>
              <p className="text-sm text-blue-700 mb-2">
                Get notified when exchange rates reach your target levels.
              </p>
              <button className="text-sm bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors">
                Set Alert
              </button>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-1">Rate Fluctuations</h3>
              <p className="text-sm text-yellow-800">
                Exchange rates fluctuate constantly. The rates shown are for informational
                purposes and may change before your transfer is processed.
              </p>
            </div>
          </div>
        </div>

        {/* Rate History */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Rate History</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">7 days ago</span>
              <span className="text-gray-900">1 MZN = 18.32 RWF</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">30 days ago</span>
              <span className="text-gray-900">1 MZN = 18.28 RWF</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">90 days ago</span>
              <span className="text-gray-900">1 MZN = 18.15 RWF</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}