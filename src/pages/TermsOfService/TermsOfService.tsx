import { FileText, Scale, AlertTriangle, CheckCircle, Clock, Users, Handshake } from 'lucide-react';

export default function TermsOfService() {
  const sections = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "Acceptance of Terms",
      content: "By accessing and using UmaPesa services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service."
    },
    {
      icon: <Scale className="w-6 h-6" />,
      title: "Service Description",
      content: "UmaPesa provides cross-border money transfer services between Mozambique and Rwanda. We facilitate secure electronic transfers through various payment methods including bank transfers, mobile money, and cards."
    },
    {
      icon: <Handshake className="w-6 h-6" />,
      title: "Partnership Services",
      content: "UmaPesa operates as a facilitator and does not provide direct payment processing services. Our platform integrates with partner financial institutions and payment service providers in partner countries that supply API-based payment solutions for both sending and receiving funds. In the event of transaction errors, processing delays, or other issues related to fund transfers, UmaPesa will coordinate with the relevant third-party service providers to facilitate resolution. However, UmaPesa bears no direct responsibility for funds held by or transferred through third-party systems. Users are solely responsible for pursuing recovery of funds directly with the applicable third-party payment service providers."
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: "User Eligibility",
      content: "You must be at least 18 years old and a legal resident of Mozambique or Rwanda to use our services. You must provide accurate and complete information during registration and maintain its accuracy."
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Transfer Limits and Fees",
      content: "Minimum transfer amount is 100 MZN. Maximum daily limit is 50,000 MZN. Transfer fees vary by amount and destination. All fees are clearly displayed before transaction confirmation. Large transfers above 10,000 MZN require manual verification by our compliance team before processing. Automatic processing is available for smaller amounts, but higher value transfers are reviewed by human operators to ensure security and compliance."
    },
    {
      icon: <AlertTriangle className="w-6 h-6" />,
      title: "Prohibited Activities",
      content: "Users are expressly prohibited from utilizing the service for any illegal activities, including but not limited to money laundering, terrorist financing, fraud, or any other transactions prohibited by applicable laws and regulations. UmaPesa reserves the absolute right to suspend, terminate, or restrict accounts engaged in suspicious or potentially illicit activities. In the event of suspected illegal activities, UmaPesa shall immediately notify the relevant national investigative authorities. Any funds associated with suspicious transactions shall be frozen and held in escrow until such time as the competent investigation bureau provides formal approval confirming that the activities are not illegal and authorizing the release of said funds."
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Account Security",
      content: "You are responsible for maintaining the confidentiality of your account credentials. Notify us immediately of any unauthorized use. We implement industry-standard security measures to protect your data."
    }
  ];

  const responsibilities = [
    "Provide accurate recipient information",
    "Ensure sufficient funds for transfers",
    "Comply with all applicable laws and regulations",
    "Report any technical issues promptly",
    "Keep contact information updated",
    "Use the service only for lawful purposes"
  ];

  const liabilities = [
    "UmaPesa is not liable for delays caused by banking systems or intermediaries",
    "We are not responsible for recipient bank policies or charges",
    "Service interruptions due to maintenance or technical issues",
    "Losses due to incorrect recipient information provided by user",
    "Currency fluctuations affecting transfer amounts",
    "Third-party service provider failures"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Terms of Service</h1>
          <p className="text-gray-600 mt-1">Effective: September 18, 2025</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Introduction */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-center mb-6">
            <Scale className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Terms & Conditions</h2>
            <p className="text-gray-600">
              These terms govern your use of UmaPesa money transfer services.
              Please read them carefully before using our platform.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              By using UmaPesa, you agree to these terms. If you disagree,
              please discontinue use of our services.
            </p>
          </div>
        </div>

        {/* Main Terms */}
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
                <p className="text-gray-700 text-sm leading-relaxed">{section.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* User Responsibilities */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Your Responsibilities</h2>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-1 gap-3">
              {responsibilities.map((item, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Limitations of Liability */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Limitations of Liability</h2>
          </div>

          <div className="p-4">
            <p className="text-gray-700 text-sm mb-4">
              UmaPesa's liability is limited as follows:
            </p>
            <div className="space-y-2">
              {liabilities.map((item, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Termination */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Account Termination</h2>
          </div>

          <div className="p-4">
            <p className="text-gray-700 text-sm mb-3">
              Either party may terminate this agreement at any time. Upon termination:
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Your account will be deactivated</li>
              <li>• Pending transfers will be processed or refunded</li>
              <li>• Your data will be retained as required by law</li>
              <li>• You remain liable for any outstanding obligations</li>
            </ul>
          </div>
        </div>

        {/* Governing Law */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Governing Law and Jurisdiction</h2>
          </div>

          <div className="p-4">
            <p className="text-gray-700 text-sm mb-3">
              These Terms of Service shall be governed by and construed in accordance with:
            </p>
            <ul className="space-y-2 text-sm text-gray-700 mb-4">
              <li>• The laws of the Republic of Mozambique</li>
              <li>• The laws of the Republic of Rwanda</li>
              <li>• Applicable international law principles governing cross-border financial transactions</li>
              <li>• Relevant international conventions and treaties to which both countries are signatories</li>
            </ul>
            <p className="text-gray-700 text-sm">
              Any disputes arising from or relating to these terms shall be resolved through the competent courts of Mozambique, with preference given to amicable resolution through mediation or arbitration before initiating formal legal proceedings. Parties expressly consent to the jurisdiction of Mozambican courts for any litigation arising from these terms.
            </p>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="text-center">
            <FileText className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-blue-900 mb-2">Questions About Terms?</h3>
            <p className="text-sm text-blue-700 mb-3">
              If you have questions about these terms, please contact our legal team.
            </p>
            <div className="text-sm text-blue-800">
              <div>📧 legal@umapesa.com</div>
            </div>
          </div>
        </div>

        {/* Updates Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-1">Terms Updates</h3>
              <p className="text-sm text-yellow-800">
                We may update these terms periodically. Continued use of our services
                constitutes acceptance of updated terms.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}