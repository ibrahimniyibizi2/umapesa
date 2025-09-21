import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Globe2, TrendingUp, Users, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Homepage() {
  const { user } = useAuth();

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Lightning Fast',
      description: 'Send money across borders in minutes, not days'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Secure & Safe',
      description: 'Bank-level security with SSL encryption and fraud protection'
    },
    {
      icon: <Globe2 className="w-6 h-6" />,
      title: 'Cross-Border',
      description: 'Seamless transfers between Mozambique and Rwanda'
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Best Rates',
      description: 'Competitive exchange rates updated daily'
    }
  ];

  const stats = [
    { number: '10,000+', label: 'Happy Customers' },
    { number: '$2M+', label: 'Transferred' },
    { number: '99.9%', label: 'Uptime' },
    { number: '24/7', label: 'Support' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Send Money 
                <span className="text-blue-200"> Across Africa</span>
              </h1>
              <p className="text-xl text-blue-100 leading-relaxed">
                Fast, secure, and affordable money transfers between Mozambique and Rwanda. 
                Support your loved ones with just a few clicks.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {user ? (
                  <Link
                    to="/send-money"
                    className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors flex items-center justify-center group"
                  >
                    Send Money Now
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors flex items-center justify-center group"
                    >
                      Get Started
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      to="/login"
                      className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors flex items-center justify-center"
                    >
                      Sign In
                    </Link>
                  </>
                )}
              </div>

              <div className="flex items-center space-x-4 text-sm text-blue-200">
                <CheckCircle className="w-5 h-5" />
                <span>No hidden fees</span>
                <CheckCircle className="w-5 h-5" />
                <span>Real-time tracking</span>
                <CheckCircle className="w-5 h-5" />
                <span>24/7 support</span>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="bg-white rounded-xl p-6 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-600 text-sm">You send</span>
                    <span className="text-gray-900 font-semibold">MZN</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">500.00</div>
                  <div className="text-sm text-gray-500">Fee: 150.00 MZN</div>
                </div>

                <div className="flex justify-center mb-6">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <ArrowRight className="w-6 h-6 text-white rotate-90" />
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-600 text-sm">Recipient gets</span>
                    <span className="text-gray-900 font-semibold">RWF</span>
                  </div>
                  <div className="text-3xl font-bold text-green-600 mb-2">9,250.00</div>
                  <div className="text-sm text-gray-500">Rate: 1 MZN = 18.50 RWF</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 text-sm md:text-base">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose UmaPesa?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're revolutionizing money transfers across Africa with cutting-edge technology 
              and unmatched security.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-shadow duration-300">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fundraising Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Community Fundraising
              </h2>
              <p className="text-xl text-gray-600">
                Create fundraising campaigns to support causes that matter. 
                Whether it's medical expenses, education, or community projects, 
                UmaPesa makes it easy to raise funds from supporters worldwide.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Users className="w-6 h-6 text-blue-600" />
                  <span className="text-gray-700">Build communities around your cause</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Globe2 className="w-6 h-6 text-blue-600" />
                  <span className="text-gray-700">Accept contributions from anywhere</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="w-6 h-6 text-blue-600" />
                  <span className="text-gray-700">Secure and transparent transactions</span>
                </div>
              </div>

              <Link
                to="/fundraising"
                className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors inline-flex items-center group"
              >
                Explore Campaigns
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="relative">
              <img
                src="https://images.pexels.com/photos/6646917/pexels-photo-6646917.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Community fundraising"
                className="rounded-2xl shadow-xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl p-6 shadow-xl border">
                <div className="text-2xl font-bold text-green-600 mb-1">2,500,000 MZN</div>
                <div className="text-sm text-gray-600">Raised this month</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Send Money?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of customers who trust UmaPesa for their cross-border 
            money transfer needs. Fast, secure, and reliable. Minimum transfer: 100 MZN.
          </p>
          
          {!user && (
            <Link
              to="/register"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors inline-flex items-center group"
            >
              Create Free Account
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}