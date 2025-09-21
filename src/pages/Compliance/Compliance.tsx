import { Shield, Award, CheckCircle, FileText, Globe, Phone } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import ComplianceBanner from '../../components/Compliance/ComplianceBanner';
import PilotConsentModal from '../../components/Compliance/PilotConsentModal';

export default function Compliance() {
  const [modalOpen, setModalOpen] = useState(false);
  const [consentGiven, setConsentGiven] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem('pilotConsent'));
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (consentGiven) localStorage.setItem('pilotConsent', '1');
    } catch {}
  }, [consentGiven]);
  const certifications = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "PCI DSS Compliant",
      description: "Payment Card Industry Data Security Standard Level 1 certification",
      status: "Application submitted",
      validUntil: "Pending"
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "ISO 27001",
      description: "Information Security Management Systems certification",
      status: "Application submitted",
      validUntil: "Pending"
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "GDPR Compliant",
      description: "General Data Protection Regulation compliance for EU users",
      status: "Compliant",
      validUntil: "Ongoing"
    },
    {
      icon: <CheckCircle className="w-8 h-8" />,
      title: "AML Certified",
      description: "Anti-Money Laundering compliance and monitoring systems",
      status: "Application submitted",
      validUntil: "Pending"
    }
  ];

  const regulatoryBodies = [
    {
      name: "Bank of Mozambique",
      role: "Financial Services Regulation",
      compliance: "Future direct engagement anticipated. UmaPesa is committed to working closely with the Bank of Mozambique to achieve full regulatory compliance and direct licensing as a Money Transfer Operator.",
      lastAudit: "N/A (future engagement planned)"
    },
    {
      name: "National Bank of Rwanda",
      role: "Cross-border Transfer Oversight",
      compliance: "Registered Payment Service Provider. UmaPesa maintains ongoing dialogue with the National Bank of Rwanda to ensure continued compliance and to expand direct regulatory relationships as our operations grow.",
      lastAudit: "January 2025"
    },
    {
      name: "FATF",
      role: "Anti-Money Laundering Standards",
      compliance: "Compliant Member. UmaPesa is committed to upholding FATF standards and will pursue direct engagement and certification as our international footprint expands.",
      lastAudit: "December 2024"
    }
  ];

  const complianceMeasures = [
    "Real-time transaction monitoring and fraud detection",
    "Customer due diligence and identity verification",
    "Suspicious activity reporting to regulatory authorities",
    "Regular compliance training for all staff",
    "Independent third-party security audits",
    "Data encryption and secure storage protocols",
    "Transaction limits and velocity controls",
    "Enhanced due diligence for high-risk transactions"
  ];

  const riskCategories = [
    { level: "Low", description: "Standard customers with verified identities", measures: "Basic KYC verification" },
    { level: "Medium", description: "Customers with international transfers", measures: "Enhanced identity checks" },
    { level: "High", description: "Large transactions or unusual patterns", measures: "Full due diligence review" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Compliance & Regulation</h1>
          <p className="text-gray-600 mt-1">Our commitment to regulatory compliance</p>
        </div>
      </div>

      <ComplianceBanner onLearnMore={() => setModalOpen(true)} />

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Introduction */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-center mb-6">
            <Shield className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Regulatory Compliance</h2>
            <p className="text-gray-600">
              UmaPesa maintains the highest standards of regulatory compliance
              to ensure safe and secure financial services.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              UmaPesa operates through authorised third‑party partners in certain
              jurisdictions. Where UmaPesa is not directly authorised to provide
              payment services, those services are provided by local partner
              organisations and are subject to the partner's permissions and
              oversight. Some functionality may be available in a limited
              pilot/testing capacity.
            </p>
            {!consentGiven && (
              <p className="text-xs text-gray-600 mt-2">
                Some features may be available in a limited pilot/testing capacity.
                <button
                  onClick={() => setModalOpen(true)}
                  className="ml-2 text-xs underline text-blue-600"
                >
                  Learn more / Consent
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Certifications */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Certifications & Standards</h2>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-1 gap-4">
              {certifications.map((cert, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600 flex-shrink-0">
                    {cert.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm">{cert.title}</h3>
                    <p className="text-gray-600 text-xs mb-2">{cert.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-green-600 text-xs font-medium">{cert.status}</span>
                      <span className="text-gray-500 text-xs">Valid until: {cert.validUntil}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Regulatory Oversight */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Regulatory Oversight</h2>
          </div>

          <div className="p-4">
            <div className="space-y-4">
              {regulatoryBodies.map((body, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{body.name}</h3>
                  <p className="text-gray-600 text-xs mb-2">{body.role}</p>
                  <div className="flex items-center text-xs">
                    <span className="text-green-600 font-medium">{body.compliance}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Compliance Measures */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Compliance Measures</h2>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-1 gap-2">
              {complianceMeasures.map((measure, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm">{measure}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Risk-Based Approach */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Risk-Based Approach</h2>
          </div>

          <div className="p-4">
            <p className="text-gray-700 text-sm mb-4">
              We apply different levels of due diligence based on risk assessment:
            </p>
            <div className="space-y-3">
              {riskCategories.map((risk, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900 text-sm">{risk.level} Risk</span>
                    <span className="text-xs text-gray-500">{risk.measures}</span>
                  </div>
                  <p className="text-gray-600 text-xs">{risk.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reporting */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <FileText className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Regulatory Reporting</h3>
              <p className="text-sm text-blue-700 mb-2">
                We maintain comprehensive records and report suspicious activities
                to relevant regulatory authorities as required by law.
              </p>
              <p className="text-xs text-blue-600">
                All reports are submitted within mandated timeframes and handled confidentially.
              </p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Compliance Questions?</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">compliance@umapesa.com</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Phone Support: +258 21 123 456 (join WhatsApp group for support)</span>
            </div>
          </div>
        </div>
      </div>
      <PilotConsentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAccept={() => {
          setConsentGiven(true);
          setModalOpen(false);
        }}
      />
    </div>
  );
}