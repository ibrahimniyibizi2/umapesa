import { useState } from 'react';
import {
  MessageSquare,
  Phone,
  Mail,
  Search,
  ChevronDown,
  ChevronUp,
  Send,
  Clock,
  CheckCircle
} from 'lucide-react';

export default function Support() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const faqs = [
    {
      question: 'How do I send money?',
      answer: 'To send money, log in to your account, click "Send Money", enter the recipient details, amount, and payment method. Review and confirm the transaction.'
    },
    {
      question: 'What are the transfer fees?',
      answer: 'Transfer fees vary by amount and destination. For Mozambique to Rwanda transfers, fees start from 150 MZN for amounts up to 500 MZN, and 2.5% for larger amounts.'
    },
    {
      question: 'How long do transfers take?',
      answer: 'Most transfers are completed within 5-15 minutes. International transfers may take up to 24 hours depending on the destination and payment method.'
    },
    {
      question: 'Is my money safe?',
      answer: 'Yes, we use bank-level 256-bit SSL encryption and comply with PCI DSS standards. All transactions are monitored for fraud protection.'
    },
    {
      question: 'How do I track my transfer?',
      answer: 'You can track your transfer status in the "Transaction History" section of your dashboard. You\'ll also receive email and SMS updates.'
    },
    {
      question: 'What payment methods are accepted?',
      answer: 'We accept bank transfers, mobile money (M-Pesa, Airtel Money), and credit/debit cards. Available methods depend on your location.'
    },
    {
      question: 'Can I cancel a transfer?',
      answer: 'Transfers can only be cancelled within the first 5 minutes after initiation. Contact support immediately if you need to cancel a transaction.'
    },
    {
      question: 'What currencies are supported?',
      answer: 'We support Mozambican Metical (MZN) and Rwandan Franc (RWF). Exchange rates are updated daily and clearly shown before confirmation.'
    }
  ];

  const contactMethods = [
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: 'Live Chat',
      description: 'Chat with our support team',
      availability: '24/7',
      action: 'Start Chat'
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: 'Phone Support',
      description: '+258 21 123 456',
      availability: 'Mon-Fri 8AM-6PM',
      action: 'Call Now'
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: 'Email Support',
      description: 'support@umapesa.com',
      availability: '24-48 hours response',
      action: 'Send Email'
    }
  ];

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    alert('Thank you for your message. We\'ll get back to you within 24 hours.');
    setContactForm({ name: '', email: '', subject: '', message: '' });
  };

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Support Center</h1>
          <p className="text-gray-600 mt-1">How can we help you today?</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Contact Methods */}
        <div className="grid grid-cols-1 gap-4">
          {contactMethods.map((method, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                    {method.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{method.title}</h3>
                    <p className="text-sm text-gray-600">{method.description}</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <Clock className="w-3 h-3 mr-1" />
                      {method.availability}
                    </p>
                  </div>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  {method.action}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQs */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Frequently Asked Questions
              {searchQuery && ` (${filteredFAQs.length} results)`}
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {filteredFAQs.map((faq, index) => (
              <div key={index} className="p-4">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <h3 className="font-medium text-gray-900 pr-4">{faq.question}</h3>
                  {expandedFAQ === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  )}
                </button>
                {expandedFAQ === index && (
                  <p className="text-gray-600 mt-3 text-sm leading-relaxed">{faq.answer}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Contact Us</h2>
          </div>
          <form onSubmit={handleContactSubmit} className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={contactForm.name}
                onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                aria-label="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                aria-label="Your email address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                value={contactForm.subject}
                onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                aria-label="Message subject"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={contactForm.message}
                onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                aria-label="Your message"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Send className="w-5 h-5" />
              <span>Send Message</span>
            </button>
          </form>
        </div>

        {/* Status Indicators */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">System Status</h3>
              <p className="text-sm text-blue-700">
                All systems are operational. Transfers are processing normally.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}