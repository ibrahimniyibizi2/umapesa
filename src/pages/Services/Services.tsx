import { Link } from 'react-router-dom';
import { Send, Heart, DollarSign } from 'lucide-react';

const Services = () => {
  return (
    <div className="p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Our Services</h1>
        
        <div className="space-y-4">
          <Link 
            to="/send-money"
            className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50"
          >
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <Send className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Send Money</h3>
              <p className="text-sm text-gray-500">Transfer money to friends and family</p>
            </div>
          </Link>

          <Link 
            to="/fundraising"
            className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50"
          >
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <Heart className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Fundraising</h3>
              <p className="text-sm text-gray-500">Create or support fundraising campaigns</p>
            </div>
          </Link>

          <Link 
            to="/exchange-rates"
            className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50"
          >
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Exchange Rates</h3>
              <p className="text-sm text-gray-500">Check current currency exchange rates</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Services;
