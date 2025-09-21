import { Link } from 'react-router-dom';
import {
  Settings,
  HelpCircle,
  Info,
  MessageSquare,
  Shield,
  CreditCard,
  Bell,
  LogOut,
  User,
  ChevronRight,
  Phone,
  Mail,
  Globe,
  Send,
  Heart,
  History,
  DollarSign,
  FileText,
  Scale,
  Lock
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function Menu() {
  const { user, logout } = useAuth();

  const menuItems = [
    {
      title: 'Account',
      items: [
        {
          icon: <User className="w-5 h-5" />,
          label: 'Profile',
          path: '/profile',
          description: 'Manage your account information'
        },
        {
          icon: <CreditCard className="w-5 h-5" />,
          label: 'Payment Methods',
          path: '/profile/payment-methods',
          description: 'Manage your saved payment methods'
        },
        {
          icon: <Bell className="w-5 h-5" />,
          label: 'Notifications',
          path: '/profile/notifications',
          description: 'Configure notification preferences'
        },
        {
          icon: <History className="w-5 h-5" />,
          label: 'Transaction History',
          path: '/transaction-history',
          description: 'View your transaction history'
        }
      ]
    },
    {
      title: 'Services',
      items: [
        {
          icon: <Send className="w-5 h-5" />,
          label: 'Send Money',
          path: '/send-money',
          description: 'Send money to friends and family'
        },
        {
          icon: <Heart className="w-5 h-5" />,
          label: 'Fundraising',
          path: '/fundraising',
          description: 'Create and manage fundraising campaigns'
        },
        {
          icon: <DollarSign className="w-5 h-5" />,
          label: 'Exchange Rates',
          path: '/exchange-rates',
          description: 'Check current currency exchange rates'
        }
      ]
    },
    {
      title: 'Support',
      items: [
        {
          icon: <HelpCircle className="w-5 h-5" />,
          label: 'Help Center',
          path: '/help',
          description: 'Find answers to common questions'
        },
        {
          icon: <MessageSquare className="w-5 h-5" />,
          label: 'Contact Support',
          path: '/support',
          description: 'Get help from our support team'
        },
        {
          icon: <Shield className="w-5 h-5" />,
          label: 'Security Center',
          path: '/security',
          description: 'Security tips and account protection'
        }
      ]
    },
    {
      title: 'Legal',
      items: [
        {
          icon: <FileText className="w-5 h-5" />,
          label: 'Privacy Policy',
          path: '/privacy-policy',
          description: 'Read our privacy policy'
        },
        {
          icon: <Scale className="w-5 h-5" />,
          label: 'Terms of Service',
          path: '/terms-of-service',
          description: 'Review our terms and conditions'
        },
        {
          icon: <Lock className="w-5 h-5" />,
          label: 'Compliance',
          path: '/compliance',
          description: 'Regulatory compliance information'
        }
      ]
    },
    {
      title: 'About',
      items: [
        {
          icon: <Info className="w-5 h-5" />,
          label: 'About UmaPesa',
          path: '/about',
          description: 'Learn more about our mission'
        },
        {
          icon: <Globe className="w-5 h-5" />,
          label: 'Our Services',
          path: '/services',
          description: 'Explore all our services'
        },
        {
          icon: <Settings className="w-5 h-5" />,
          label: 'Settings',
          path: '/settings',
          description: 'App preferences and settings'
        }
      ]
    }
  ];

  const contactInfo = [
    {
      icon: <Phone className="w-5 h-5" />,
      label: 'Phone Support',
      value: '+258 21 123 456 (join WhatsApp group for support)',
      action: 'tel:+25821123456'
    },
    {
      icon: <Mail className="w-5 h-5" />,
      label: 'Email Support',
      value: 'support@umapesa.com',
      action: 'mailto:support@umapesa.com'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Menu</h1>
          {user && (
            <p className="text-gray-600 mt-1">Welcome back, {user.firstName}!</p>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {menuItems.map((section, sectionIndex) => (
          <div key={sectionIndex} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
            </div>

            <div className="divide-y divide-gray-100">
              {section.items.map((item, itemIndex) => (
                <Link
                  key={itemIndex}
                  to={item.path}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                      {item.icon}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{item.label}</div>
                      <div className="text-sm text-gray-500">{item.description}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Contact Information */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Contact Us</h2>
          </div>

          <div className="divide-y divide-gray-100">
            {contactInfo.map((contact, index) => (
              <a
                key={index}
                href={contact.action}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                    {contact.icon}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{contact.label}</div>
                    <div className="text-sm text-gray-500">{contact.value}</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </a>
            ))}
          </div>
        </div>

        {/* App Version */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-center">
            <div className="text-sm text-gray-500">UmaPesa v1.0.0</div>
            <div className="text-xs text-gray-400 mt-1">© 2025 UmaPesa. All rights reserved.</div>
          </div>
        </div>

        {/* Logout Button */}
        {user && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <button
              onClick={logout}
              className="w-full flex items-center justify-center space-x-2 bg-red-50 text-red-600 py-3 px-4 rounded-lg hover:bg-red-100 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}