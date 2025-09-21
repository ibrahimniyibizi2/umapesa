import {
  Heart,
  Globe,
  Shield,
  Zap,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';

export default function About() {
  const stats = [
    { number: '10,000+', label: 'Happy Customers' },
    { number: '2 Years', label: 'In Business' },
    { number: '$5M+', label: 'Transferred' },
    { number: '99.9%', label: 'Uptime' }
  ];

  const values = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Security First',
      description: 'Your money and data are protected with bank-level security and encryption.'
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Lightning Fast',
      description: 'Send money across borders in minutes, not days. Real-time processing.'
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: 'Borderless',
      description: 'Connect families and businesses across Mozambique and Rwanda seamlessly.'
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: 'Community Focused',
      description: 'Supporting local communities through fundraising and social impact initiatives.'
    }
  ];

  const team = [
    {
      name: 'Youssouf Hakizimana',
      role: 'Founder & CEO',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      bio: 'Passionate about connecting communities across Africa through innovative financial technology.'
    },
    {
      name: 'Maria Santos',
      role: 'Head of Operations',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      bio: 'Expert in cross-border payments with 8+ years experience in financial services.'
    },
    {
      name: 'Jean Baptiste',
      role: 'Lead Developer',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      bio: 'Full-stack developer specializing in secure, scalable financial applications.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">About UmaPesa</h1>
          <p className="text-gray-600 mt-1">Revolutionizing money transfers in Africa</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-xl p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Connecting Africa</h2>
            <p className="text-blue-100">
              UmaPesa is revolutionizing cross-border money transfers between Mozambique and Rwanda,
              making it easier for families and businesses to send money securely and affordably.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-blue-600 mb-1">{stat.number}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Our Story */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Our Story</h2>
          </div>
          <div className="p-4">
            <p className="text-gray-700 mb-4">
              UmaPesa traces its origins to 2016, when cross-border money transfers between Mozambique and Rwanda relied on manual methods. Early users sent funds via Ecobank, then called their families to relay transaction details—a process that, while functional, was far from optimal for security, speed, or convenience.
            </p>
            <p className="text-gray-700 mb-4">
              Recognizing these limitations, Ibrahim Niyibizi undertook extensive research in both countries, studying the intricacies of remittance systems and the socio-economic impact of financial inclusion. This academic foundation inspired the formation of a diverse, international team—bringing together expertise from Rwanda, Mozambique, India, and China—to architect a robust, secure, and scalable web application for modern money transfers.
            </p>
            <p className="text-gray-700">
              Today, UmaPesa stands as a testament to the power of collaborative innovation. Our platform leverages advanced security protocols, real-time processing, and a deep commitment to user experience. We continue to evolve, guided by a vision to empower communities and facilitate seamless financial connections across borders.
            </p>
          </div>
        </div>

        {/* Our Values */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Our Values</h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 gap-4">
              {values.map((value, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
                    {value.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{value.title}</h3>
                    <p className="text-sm text-gray-600">{value.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Our Team */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Our Team</h2>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {team.map((member, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{member.name}</h3>
                    <p className="text-sm text-blue-600 mb-1">{member.role}</p>
                    <p className="text-sm text-gray-600">{member.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Contact Us</h2>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <div className="font-medium text-gray-900">Headquarters</div>
                <div className="text-sm text-gray-600">Maputo, Mozambique</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <div className="font-medium text-gray-900">Phone</div>
                <div className="text-sm text-gray-600">+258 21 123 456</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <div className="font-medium text-gray-900">Email</div>
                <div className="text-sm text-gray-600">hello@umapesa.com</div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Follow Us</h3>
          <div className="flex space-x-3">
            <a
              href="https://twitter.com/umapesa"
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg text-center text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              Twitter
            </a>
            <a
              href="https://facebook.com/umapesa"
              className="flex-1 bg-blue-700 text-white py-2 px-4 rounded-lg text-center text-sm font-medium hover:bg-blue-800 transition-colors"
            >
              Facebook
            </a>
            <a
              href="https://linkedin.com/company/umapesa"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-center text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              LinkedIn
            </a>
          </div>
        </div>

        {/* App Version */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-center">
            <div className="text-sm text-gray-500">UmaPesa v1.0.0</div>
            <div className="text-xs text-gray-400 mt-1">© 2025 UmaPesa. All rights reserved.</div>
          </div>
        </div>
      </div>
    </div>
  );
}