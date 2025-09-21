import {
  Shield,
  Lock,
  Eye,
  Key,
  AlertTriangle,
  CheckCircle,
  Smartphone,
  CreditCard,
  Globe,
  Users
} from 'lucide-react';

export default function Security() {
  const securityFeatures = [
    {
      icon: <Lock className="w-6 h-6" />,
      title: 'Bank-Level Encryption',
      description: 'All transactions are protected with 256-bit SSL encryption, the same standard used by major banks.'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Fraud Protection',
      description: 'Advanced AI-powered fraud detection monitors all transactions in real-time.'
    },
    {
      icon: <Key className="w-6 h-6" />,
      title: 'Two-Factor Authentication',
      description: 'Add an extra layer of security with SMS or authenticator app verification.'
    },
    {
      icon: <Eye className="w-6 h-6" />,
      title: 'Transaction Monitoring',
      description: 'Every transaction is monitored and flagged for suspicious activity automatically.'
    }
  ];

  const securityTips = [
    {
      icon: <Smartphone className="w-5 h-5" />,
      title: 'Use Strong Passwords',
      description: 'Create complex passwords with uppercase, lowercase, numbers, and symbols.'
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: 'Enable 2FA',
      description: 'Always enable two-factor authentication for your account.'
    },
    {
      icon: <Eye className="w-5 h-5" />,
      title: 'Monitor Transactions',
      description: 'Regularly check your transaction history for unauthorized activity.'
    },
    {
      icon: <CreditCard className="w-5 h-5" />,
      title: 'Secure Your Device',
      description: 'Keep your device updated and use antivirus software.'
    },
    {
      icon: <Globe className="w-5 h-5" />,
      title: 'Public Wi-Fi Caution',
      description: 'Avoid making transactions on public Wi-Fi networks.'
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: 'Share Wisely',
      description: 'Never share your login credentials or verification codes.'
    }
  ];

  const compliance = [
    {
      title: 'PCI DSS Compliant',
      description: 'Payment Card Industry Data Security Standard certified'
    },
    {
      title: 'GDPR Compliant',
      description: 'General Data Protection Regulation compliant for EU users'
    },
    {
      title: 'AML Certified',
      description: 'Anti-Money Laundering compliance and monitoring'
    },
    {
      title: 'KYC Verified',
      description: 'Know Your Customer verification for all accounts'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Security Center</h1>
          <p className="text-gray-600 mt-1">Your security is our top priority</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Security Overview */}
        <div className="bg-gradient-to-br from-green-600 to-green-800 text-white rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-bold">Bank-Level Security</h2>
              <p className="text-green-100">Your money and data are fully protected</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">256-bit</div>
              <div className="text-sm text-green-100">SSL Encryption</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">24/7</div>
              <div className="text-sm text-green-100">Monitoring</div>
            </div>
          </div>
        </div>

        {/* Security Features */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Security Features</h2>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {securityFeatures.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600 flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Security Tips */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Security Best Practices</h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 gap-3">
              {securityTips.map((tip, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
                    {tip.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm mb-1">{tip.title}</h3>
                    <p className="text-xs text-gray-600">{tip.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Compliance & Certifications */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Compliance & Certifications</h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 gap-3">
              {compliance.map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">{item.title}</h3>
                    <p className="text-xs text-gray-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Report Security Issue */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Report Security Issue</h3>
              <p className="text-sm text-red-700 mb-3">
                If you suspect any security breach or unauthorized activity, contact us immediately.
              </p>
              <button className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                Report Issue
              </button>
            </div>
          </div>
        </div>

        {/* Security Promise */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="text-center">
            <Shield className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-blue-900 mb-2">Our Security Promise</h3>
            <p className="text-sm text-blue-700">
              We are committed to protecting your financial information and ensuring
              secure transactions. Your trust and security are our highest priorities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}