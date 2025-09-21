import { Link } from 'react-router-dom';
import {
  Video,
  MessageSquare,
  Download,
  Search,
  ChevronRight,
  CreditCard,
  Users,
  Shield
} from 'lucide-react';

export default function Help() {
  const helpCategories = [
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: 'Getting Started',
      description: 'Create your account and make your first transfer',
      articles: [
        'How to create an account',
        'Verifying your identity',
        'Adding payment methods',
        'Making your first transfer'
      ]
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Sending Money',
      description: 'Learn how to send money to family and friends',
      articles: [
        'Sending to Mozambique',
        'Sending to Rwanda',
        'Transfer fees and limits',
        'Tracking your transfer'
      ]
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Account Security',
      description: 'Keep your account safe and secure',
      articles: [
        'Setting up two-factor authentication',
        'Changing your password',
        'Recognizing scams',
        'Reporting suspicious activity'
      ]
    }
  ];

  const quickActions = [
    {
      icon: <Video className="w-5 h-5" />,
      title: 'Video Tutorials',
      description: 'Watch step-by-step guides',
      action: 'Watch Videos'
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      title: 'Ask a Question',
      description: 'Get help from our support team',
      action: 'Contact Support'
    },
    {
      icon: <Download className="w-5 h-5" />,
      title: 'Download Guides',
      description: 'PDF guides and cheat sheets',
      action: 'Download'
    }
  ];

  const popularArticles = [
    'How do I send money internationally?',
    'What are the transfer fees?',
    'How long do transfers take?',
    'How to track my transfer status',
    'What payment methods are accepted?',
    'How to add a new recipient',
    'Understanding exchange rates',
    'How to cancel a transfer'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Help Center</h1>
          <p className="text-gray-600 mt-1">Find answers and get support</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search for help..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-3">
          {quickActions.map((action, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                    {action.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
                <button className="text-blue-600 font-medium text-sm">
                  {action.action}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Help Categories */}
        <div className="space-y-4">
          {helpCategories.map((category, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                    {category.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{category.title}</h3>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              <div className="px-4 pb-4">
                <div className="space-y-2">
                  {category.articles.map((article, articleIndex) => (
                    <Link
                      key={articleIndex}
                      to="#"
                      className="block py-2 text-sm text-gray-700 hover:text-blue-600 transition-colors"
                    >
                      {article}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Popular Articles */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Popular Articles</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {popularArticles.map((article, index) => (
              <Link
                key={index}
                to="#"
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <span className="text-gray-700">{article}</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-blue-900 mb-2">Still need help?</h3>
            <p className="text-sm text-blue-700 mb-4">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="space-y-2">
              <Link
                to="/support"
                className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Contact Support
              </Link>
              <p className="text-xs text-blue-600">
                Average response time: 2 hours
              </p>
            </div>
          </div>
        </div>

        {/* App Version */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-center">
            <div className="text-sm text-gray-500">Help Center v1.0.0</div>
            <div className="text-xs text-gray-400 mt-1">
              Last updated: September 2025
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}