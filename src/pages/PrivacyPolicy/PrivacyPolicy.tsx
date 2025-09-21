import { Shield, Eye, Lock, Users, Database, Mail } from 'lucide-react';

export default function PrivacyPolicy() {
  const sections = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Information We Collect",
      content: [
        "Personal information you provide (name, email, phone, address)",
        "Financial information for transactions (account details, payment methods)",
        "Device information and usage data",
        "Location data for fraud prevention",
        "Communication records with our support team"
      ]
    },
    {
      icon: <Eye className="w-6 h-6" />,
      title: "How We Use Your Information",
      content: [
        "Process and complete your money transfers",
        "Verify your identity and prevent fraud",
        "Provide customer support and respond to inquiries",
        "Send important service updates and notifications",
        "Improve our services and develop new features",
        "Comply with legal and regulatory requirements"
      ]
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "Data Security",
      content: [
        "256-bit SSL encryption for all data transmission",
        "Bank-level security standards and protocols",
        "Regular security audits and penetration testing",
        "Multi-factor authentication for account access",
        "Secure data centers with physical security measures",
        "Regular backups and disaster recovery procedures"
      ]
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Information Sharing",
      content: [
        "We do not sell your personal information to third parties",
        "Limited sharing with payment processors and financial institutions",
        "Legal requirements and regulatory compliance",
        "Service providers under strict confidentiality agreements",
        "Aggregated, anonymized data for analytics and improvements"
      ]
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: "Data Retention",
      content: [
        "Transaction records retained for 7 years for regulatory compliance",
        "Account information kept while account is active",
        "Inactive accounts deleted after 2 years of inactivity",
        "Marketing preferences honored for unsubscribe requests",
        "Legal holds may extend retention periods"
      ]
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Your Rights",
      content: [
        "Access to your personal information",
        "Correction of inaccurate data",
        "Deletion of your account and data",
        "Data portability to another service",
        "Opt-out of marketing communications",
        "Lodge complaints with supervisory authorities"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="text-gray-600 mt-1">Last updated: September 18, 2025</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Introduction */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-center mb-6">
            <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Your Privacy Matters</h2>
            <p className="text-gray-600">
              At UmaPesa, we are committed to protecting your privacy and ensuring the security
              of your personal and financial information.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              This privacy policy explains how we collect, use, and protect your information
              when you use our money transfer services.
            </p>
          </div>
        </div>

        {/* Policy Sections */}
        <div className="space-y-4">
          {sections.map((section, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                    {section.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                </div>
              </div>

              <div className="p-4">
                <ul className="space-y-2">
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Us About Privacy</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <div className="font-medium text-gray-900">Privacy Officer</div>
                <div className="text-sm text-gray-600">privacy@umapesa.com</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-gray-400" />
              <div>
                <div className="font-medium text-gray-900">Data Protection</div>
                <div className="text-sm text-gray-600">+258 21 123 456 (ext. 200)</div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              For privacy-related inquiries, please contact our Data Protection Officer.
              We aim to respond within 30 days of receiving your request.
            </p>
          </div>
        </div>

        {/* Updates */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <Shield className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-1">Policy Updates</h3>
              <p className="text-sm text-yellow-800">
                We may update this privacy policy periodically. Users will be notified of
                significant changes via email or app notifications.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}